import { NextRequest, NextResponse } from 'next/server'
import { z } from 'zod'
import { db } from '@/lib/db'
import { getCurrentUser, verifyCsrf } from '@/lib/auth'
import { rateLimitFromRequest } from '@/lib/rate-limit'
import { env } from '@/lib/env'

const schema = z.object({
  date: z.string().regex(/^\d{4}-\d{2}-\d{2}$/),
  mealType: z.enum(['Breakfast', 'Lunch', 'Dinner', 'Snack']),
  recipeId: z.string().min(1).max(40),
  servings: z.number().int().min(1).max(20).optional(),
})

export async function GET() {
  const user = await getCurrentUser()
  if (!user) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
  const plans = await db.mealPlan.findMany({
    where: { userId: user.id },
    orderBy: { date: 'asc' },
    include: { recipe: { select: { id: true, slug: true, title: true } } },
  })
  return NextResponse.json({ plans })
}

export async function POST(req: NextRequest) {
  const user = await getCurrentUser()
  if (!user) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
  if (!(await verifyCsrf(req))) return NextResponse.json({ error: 'Invalid request.' }, { status: 403 })

  const rl = rateLimitFromRequest(req, 'meal-plan', env.rateLimits.apiPerMin, 60, user.id)
  if (!rl.ok) return NextResponse.json({ error: 'Too many requests.' }, { status: 429 })

  const body = await req.json().catch(() => null)
  const parsed = schema.safeParse(body)
  if (!parsed.success) return NextResponse.json({ error: 'Invalid input.' }, { status: 400 })

  const date = new Date(parsed.data.date + 'T00:00:00Z')
  try {
    const plan = await db.mealPlan.create({
      data: {
        userId: user.id,
        date,
        mealType: parsed.data.mealType,
        recipeId: parsed.data.recipeId,
        servings: parsed.data.servings ?? 1,
      },
    })
    return NextResponse.json(plan)
  } catch (e: any) {
    if (e?.code === 'P2002') return NextResponse.json({ error: 'A plan already exists for that slot.' }, { status: 409 })
    return NextResponse.json({ error: 'Could not create plan.' }, { status: 500 })
  }
}
