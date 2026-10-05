import { NextRequest, NextResponse } from 'next/server'
import { z } from 'zod'
import { db } from '@/lib/db'
import { getCurrentUser, verifyCsrf } from '@/lib/auth'
import { rateLimitFromRequest } from '@/lib/rate-limit'
import { env } from '@/lib/env'

const schema = z.object({
  name: z.string().trim().min(1).max(80).optional(),
  source: z.string().max(80).optional(),
})

export async function GET() {
  const user = await getCurrentUser()
  if (!user) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
  const lists = await db.groceryList.findMany({
    where: { userId: user.id },
    orderBy: { createdAt: 'desc' },
    include: { items: { orderBy: { createdAt: 'asc' } } },
  })
  return NextResponse.json({ lists })
}

export async function POST(req: NextRequest) {
  const user = await getCurrentUser()
  if (!user) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
  if (!(await verifyCsrf(req))) return NextResponse.json({ error: 'Invalid request.' }, { status: 403 })

  const rl = rateLimitFromRequest(req, 'grocery', env.rateLimits.apiPerMin, 60, user.id)
  if (!rl.ok) return NextResponse.json({ error: 'Too many requests.' }, { status: 429 })

  const body = await req.json().catch(() => null)
  const parsed = schema.safeParse(body)
  if (!parsed.success) return NextResponse.json({ error: 'Invalid input.' }, { status: 400 })

  const list = await db.groceryList.create({
    data: {
      userId: user.id,
      name: parsed.data.name || 'My Grocery List',
      source: parsed.data.source,
    },
    include: { items: true },
  })
  return NextResponse.json(list)
}
