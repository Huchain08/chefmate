import { NextRequest, NextResponse } from 'next/server'
import { z } from 'zod'
import { db } from '@/lib/db'
import { getCurrentUser, verifyCsrf } from '@/lib/auth'
import { rateLimitFromRequest } from '@/lib/rate-limit'
import { env } from '@/lib/env'

const schema = z.object({ recipeId: z.string().min(1).max(40) })

export async function GET(req: NextRequest) {
  const user = await getCurrentUser()
  if (!user) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
  const url = new URL(req.url)
  const recipeId = url.searchParams.get('recipeId')
  if (recipeId) {
    const fav = await db.userFavourite.findUnique({ where: { userId_recipeId: { userId: user.id, recipeId } } })
    return NextResponse.json({ favourited: Boolean(fav) })
  }
  const favourites = await db.userFavourite.findMany({
    where: { userId: user.id },
    include: { recipe: { select: { id: true, slug: true, title: true, imageUrl: true, cookTimeMin: true } } },
    orderBy: { createdAt: 'desc' },
  })
  return NextResponse.json({ favourites })
}

export async function POST(req: NextRequest) {
  const user = await getCurrentUser()
  if (!user) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
  if (!(await verifyCsrf(req))) return NextResponse.json({ error: 'Invalid request.' }, { status: 403 })

  const rl = rateLimitFromRequest(req, 'favourites', env.rateLimits.apiPerMin, 60, user.id)
  if (!rl.ok) return NextResponse.json({ error: 'Too many requests.' }, { status: 429 })

  const body = await req.json().catch(() => null)
  const parsed = schema.safeParse(body)
  if (!parsed.success) return NextResponse.json({ error: 'Invalid input.' }, { status: 400 })

  try {
    await db.userFavourite.create({ data: { userId: user.id, recipeId: parsed.data.recipeId } })
  } catch (e: any) {
    if (e?.code === 'P2002') return NextResponse.json({ ok: true, alreadyFavourited: true })
    throw e
  }
  return NextResponse.json({ ok: true })
}
