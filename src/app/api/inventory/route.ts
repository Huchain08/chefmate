import { NextRequest, NextResponse } from 'next/server'
import { z } from 'zod'
import { db } from '@/lib/db'
import { getCurrentUser, verifyCsrf } from '@/lib/auth'
import { rateLimitFromRequest } from '@/lib/rate-limit'
import { env } from '@/lib/env'
import { audit } from '@/lib/audit'

const schema = z.object({
  items: z.array(z.object({
    name: z.string().trim().min(1).max(80),
    quantity: z.number().min(0).max(9999),
    unit: z.string().trim().min(1).max(20),
  })).max(200),
})

export async function POST(req: NextRequest) {
  const user = await getCurrentUser()
  if (!user) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
  if (!(await verifyCsrf(req))) return NextResponse.json({ error: 'Invalid request.' }, { status: 403 })

  const rl = rateLimitFromRequest(req, 'inventory-write', env.rateLimits.apiPerMin, 60, user.id)
  if (!rl.ok) return NextResponse.json({ error: 'Too many requests.' }, { status: 429 })

  const body = await req.json().catch(() => null)
  const parsed = schema.safeParse(body)
  if (!parsed.success) return NextResponse.json({ error: 'Invalid input.' }, { status: 400 })

  // Upsert each ingredient by name (case-insensitive)
  let upserted = 0
  for (const it of parsed.data.items) {
    const slug = it.name.toLowerCase().replace(/[^a-z0-9]+/g, '-').replace(/^-+|-+$/g, '')
    if (!slug) continue
    const ingredient = await db.ingredient.upsert({
      where: { slug },
      update: { name: it.name },
      create: { name: it.name, slug, category: 'unknown', unit: it.unit },
    })
    await db.userInventory.upsert({
      where: { userId_ingredientId: { userId: user.id, ingredientId: ingredient.id } },
      update: { quantity: it.quantity, unit: it.unit },
      create: { userId: user.id, ingredientId: ingredient.id, quantity: it.quantity, unit: it.unit },
    })
    upserted++
  }

  await audit('inventory.updated', user.id, { count: upserted })
  return NextResponse.json({ ok: true, count: upserted })
}

export async function GET() {
  const user = await getCurrentUser()
  if (!user) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
  const items = await db.userInventory.findMany({
    where: { userId: user.id },
    include: { ingredient: { select: { name: true, slug: true, category: true } } },
  })
  return NextResponse.json({ items })
}
