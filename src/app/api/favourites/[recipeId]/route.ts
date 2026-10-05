import { NextRequest, NextResponse } from 'next/server'
import { db } from '@/lib/db'
import { getCurrentUser, verifyCsrf } from '@/lib/auth'

export async function DELETE(req: NextRequest, { params }: { params: Promise<{ recipeId: string }> }) {
  const user = await getCurrentUser()
  if (!user) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
  if (!(await verifyCsrf(req))) return NextResponse.json({ error: 'Invalid request.' }, { status: 403 })
  const { recipeId } = await params
  await db.userFavourite.deleteMany({ where: { userId: user.id, recipeId } })
  return NextResponse.json({ ok: true })
}
