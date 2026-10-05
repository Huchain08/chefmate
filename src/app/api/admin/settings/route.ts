import { NextRequest, NextResponse } from 'next/server'
import { z } from 'zod'
import { db } from '@/lib/db'
import { getCurrentUser, verifyCsrf, hasPermission } from '@/lib/auth'
import { audit } from '@/lib/audit'
import { revalidateTag } from 'next/cache'

const schema = z.object({
  siteName: z.string().trim().min(1).max(60),
  siteDescription: z.string().trim().min(1).max(400),
  primaryColor: z.string().regex(/^#[0-9a-f]{6}$/i),
  accentColor: z.string().regex(/^#[0-9a-f]{6}$/i),
})

export async function POST(req: NextRequest) {
  const user = await getCurrentUser()
  if (!user) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
  if (!hasPermission(user, 'settings.edit')) return NextResponse.json({ error: 'Forbidden' }, { status: 403 })
  if (!(await verifyCsrf(req))) return NextResponse.json({ error: 'Invalid request.' }, { status: 403 })

  const body = await req.json().catch(() => null)
  const parsed = schema.safeParse(body)
  if (!parsed.success) return NextResponse.json({ error: 'Invalid input.' }, { status: 400 })

  const { siteName, siteDescription, primaryColor, accentColor } = parsed.data

  await db.$transaction([
    db.siteSetting.upsert({ where: { key: 'siteName' }, update: { value: siteName }, create: { key: 'siteName', value: siteName, type: 'string' } }),
    db.siteSetting.upsert({ where: { key: 'siteDescription' }, update: { value: siteDescription }, create: { key: 'siteDescription', value: siteDescription, type: 'string' } }),
    db.siteSetting.upsert({ where: { key: 'primaryColor' }, update: { value: primaryColor }, create: { key: 'primaryColor', value: primaryColor, type: 'string' } }),
    db.siteSetting.upsert({ where: { key: 'accentColor' }, update: { value: accentColor }, create: { key: 'accentColor', value: accentColor, type: 'string' } }),
  ])

  revalidateTag('site-settings', 'max')
  await audit('settings.updated', user.id, { siteName })

  return NextResponse.json({ ok: true })
}
