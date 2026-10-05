import { NextRequest, NextResponse } from 'next/server'
import { z } from 'zod'
import { db } from '@/lib/db'
import { getCurrentUser, verifyCsrf, hasPermission } from '@/lib/auth'
import { audit } from '@/lib/audit'
import { revalidateTag } from 'next/cache'

const schema = z.object({
  name: z.string().trim().min(1).max(120),
  description: z.string().max(500).optional(),
  contactEmail: z.string().email().max(254).optional().or(z.literal('')),
  phoneNumber: z.string().max(40).optional().or(z.literal('')),
  streetAddress: z.string().max(200).optional().or(z.literal('')),
  locality: z.string().max(120).optional().or(z.literal('')),
  region: z.string().max(120).optional().or(z.literal('')),
  postalCode: z.string().max(20).optional().or(z.literal('')),
  country: z.string().max(80).optional().or(z.literal('')),
  latitude: z.string().optional().or(z.literal('')),
  longitude: z.string().optional().or(z.literal('')),
  openingHours: z.string().max(200).optional().or(z.literal('')),
  logoUrl: z.string().max(500).optional().or(z.literal('')),
  faviconUrl: z.string().max(500).optional().or(z.literal('')),
  copyrightHolder: z.string().max(120).optional().or(z.literal('')),
  primaryDomain: z.string().max(200).optional().or(z.literal('')),
  socialLinks: z.string().max(2000).optional().or(z.literal('')),
})

export async function POST(req: NextRequest) {
  const user = await getCurrentUser()
  if (!user) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
  if (!hasPermission(user, 'business.edit')) return NextResponse.json({ error: 'Forbidden' }, { status: 403 })
  if (!(await verifyCsrf(req))) return NextResponse.json({ error: 'Invalid request.' }, { status: 403 })

  const body = await req.json().catch(() => null)
  const parsed = schema.safeParse(body)
  if (!parsed.success) return NextResponse.json({ error: 'Invalid input.' }, { status: 400 })

  const d = parsed.data
  const lat = d.latitude ? parseFloat(d.latitude) : null
  const lng = d.longitude ? parseFloat(d.longitude) : null
  if (lat !== null && (isNaN(lat) || lat < -90 || lat > 90)) return NextResponse.json({ error: 'Invalid latitude.' }, { status: 400 })
  if (lng !== null && (isNaN(lng) || lng < -180 || lng > 180)) return NextResponse.json({ error: 'Invalid longitude.' }, { status: 400 })

  const existing = await db.businessProfile.findFirst()
  const data = {
    name: d.name,
    description: d.description || null,
    contactEmail: d.contactEmail || null,
    phoneNumber: d.phoneNumber || null,
    streetAddress: d.streetAddress || null,
    locality: d.locality || null,
    region: d.region || null,
    postalCode: d.postalCode || null,
    country: d.country || null,
    latitude: lat,
    longitude: lng,
    openingHours: d.openingHours || null,
    logoUrl: d.logoUrl || null,
    faviconUrl: d.faviconUrl || null,
    copyrightHolder: d.copyrightHolder || null,
    primaryDomain: d.primaryDomain || null,
    socialLinks: d.socialLinks || null,
    updatedBy: user.id,
  }
  if (existing) {
    await db.businessProfile.update({ where: { id: existing.id }, data })
  } else {
    await db.businessProfile.create({ data })
  }
  revalidateTag('site-settings', 'max')
  await audit('business.updated', user.id)

  return NextResponse.json({ ok: true })
}
