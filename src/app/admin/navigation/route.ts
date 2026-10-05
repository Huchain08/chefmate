import { NextRequest, NextResponse } from 'next/server'
import { z } from 'zod'
import { db } from '@/lib/db'
import { getCurrentUser, verifyCsrf, hasPermission } from '@/lib/auth'
import { audit } from '@/lib/audit'

const schema = z.object({
  label: z.string().trim().min(1).max(60),
  url: z.string().trim().min(1).max(200),
  section: z.string().trim().max(40).optional(),
})

export async function POST(req: NextRequest) {
  const user = await getCurrentUser()
  if (!user) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
  if (!hasPermission(user, 'navigation.edit')) return NextResponse.json({ error: 'Forbidden' }, { status: 403 })
  if (!(await verifyCsrf(req))) return NextResponse.json({ error: 'Invalid request.' }, { status: 403 })

  const url = new URL(req.url)
  const kind = url.searchParams.get('kind') === 'footer' ? 'footer' : 'header'

  const body = await req.json().catch(() => null)
  const parsed = schema.safeParse(body)
  if (!parsed.success) return NextResponse.json({ error: 'Invalid input.' }, { status: 400 })

  if (kind === 'header') {
    const sortOrder = await db.navigationItem.count({ where: { location: 'header' } })
    const item = await db.navigationItem.create({ data: { label: parsed.data.label, url: parsed.data.url, location: 'header', sortOrder } })
    await audit('navigation.added', user.id, { kind, id: item.id })
    return NextResponse.json(item)
  } else {
    const sortOrder = await db.footerLink.count({})
    const section = parsed.data.section || 'default'
    const item = await db.footerLink.create({ data: { label: parsed.data.label, url: parsed.data.url, section, sortOrder } })
    await audit('navigation.added', user.id, { kind, id: item.id })
    return NextResponse.json(item)
  }
}

export async function DELETE(req: NextRequest) {
  const user = await getCurrentUser()
  if (!user) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
  if (!hasPermission(user, 'navigation.edit')) return NextResponse.json({ error: 'Forbidden' }, { status: 403 })
  if (!(await verifyCsrf(req))) return NextResponse.json({ error: 'Invalid request.' }, { status: 403 })
  const url = new URL(req.url)
  const id = url.searchParams.get('id')
  if (!id) return NextResponse.json({ error: 'Missing id.' }, { status: 400 })
  const kind = url.searchParams.get('kind') === 'footer' ? 'footer' : 'header'
  if (kind === 'header') {
    await db.navigationItem.delete({ where: { id } })
  } else {
    await db.footerLink.delete({ where: { id } })
  }
  await audit('navigation.removed', user.id, { kind, id })
  return NextResponse.json({ ok: true })
}
