import { NextRequest, NextResponse } from 'next/server'
import { db } from '@/lib/db'

export async function GET(req: NextRequest) {
  const url = new URL(req.url)
  const q = url.searchParams.get('q')?.trim() || ''
  const limit = Math.min(20, parseInt(url.searchParams.get('limit') || '10', 10) || 10)

  const where = q
    ? { status: 'published' as const, title: { contains: q } }
    : { status: 'published' as const }

  const recipes = await db.recipe.findMany({
    where,
    take: limit,
    orderBy: { createdAt: 'desc' },
    select: { id: true, slug: true, title: true, cuisine: true, cookTimeMin: true },
  })

  return NextResponse.json({ recipes })
}
