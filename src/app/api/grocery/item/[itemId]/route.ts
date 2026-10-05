import { NextRequest, NextResponse } from 'next/server'
import { db } from '@/lib/db'
import { getCurrentUser, verifyCsrf } from '@/lib/auth'

export async function PATCH(req: NextRequest, { params }: { params: Promise<{ itemId: string }> }) {
  const user = await getCurrentUser()
  if (!user) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
  if (!(await verifyCsrf(req))) return NextResponse.json({ error: 'Invalid request.' }, { status: 403 })
  const { itemId } = await params
  const body = await req.json().catch(() => ({}))

  // IDOR protection: confirm the item belongs to a list owned by the user
  const item = await db.groceryItem.findUnique({
    where: { id: itemId },
    include: { groceryList: { select: { userId: true } } },
  })
  if (!item || item.groceryList.userId !== user.id) return NextResponse.json({ error: 'Not found' }, { status: 404 })

  const updated = await db.groceryItem.update({
    where: { id: itemId },
    data: { purchased: Boolean(body.purchased) },
  })
  return NextResponse.json(updated)
}

export async function DELETE(req: NextRequest, { params }: { params: Promise<{ itemId: string }> }) {
  const user = await getCurrentUser()
  if (!user) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
  if (!(await verifyCsrf(req))) return NextResponse.json({ error: 'Invalid request.' }, { status: 403 })
  const { itemId } = await params

  const item = await db.groceryItem.findUnique({
    where: { id: itemId },
    include: { groceryList: { select: { userId: true } } },
  })
  if (!item || item.groceryList.userId !== user.id) return NextResponse.json({ error: 'Not found' }, { status: 404 })

  await db.groceryItem.delete({ where: { id: itemId } })
  return NextResponse.json({ ok: true })
}
