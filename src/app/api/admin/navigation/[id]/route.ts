import { NextRequest, NextResponse } from 'next/server'
import { db } from '@/lib/db'
import { getCurrentUser, verifyCsrf, hasPermission } from '@/lib/auth'

export async function DELETE(req: NextRequest, { params }: { params: Promise<{ id: string }> }) {
  const user = await getCurrentUser()
  if (!user) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
  if (!hasPermission(user, 'navigation.edit')) return NextResponse.json({ error: 'Forbidden' }, { status: 403 })
  if (!(await verifyCsrf(req))) return NextResponse.json({ error: 'Invalid request.' }, { status: 403 })
  const { id } = await params
  const url = new URL(req.url)
  const kind = url.searchParams.get('kind') === 'footer' ? 'footer' : 'header'
  if (kind === 'header') {
    await db.navigationItem.delete({ where: { id } })
  } else {
    await db.footerLink.delete({ where: { id } })
  }
  return NextResponse.json({ ok: true })
}
