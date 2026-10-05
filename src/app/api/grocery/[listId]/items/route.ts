import { NextRequest, NextResponse } from 'next/server'
import { db } from '@/lib/db'
import { getCurrentUser, verifyCsrf } from '@/lib/auth'

export async function POST(req: NextRequest, { params }: { params: Promise<{ listId: string }> }) {
  const user = await getCurrentUser()
  if (!user) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
  if (!(await verifyCsrf(req))) return NextResponse.json({ error: 'Invalid request.' }, { status: 403 })
  const { listId } = await params

  const body = await req.json().catch(() => ({}))
  const list = await db.groceryList.findFirst({ where: { id: listId, userId: user.id } })
  if (!list) return NextResponse.json({ error: 'Not found' }, { status: 404 })

  const item = await db.groceryItem.create({
    data: {
      groceryListId: listId,
      name: String(body.name || '').slice(0, 80),
      quantity: Math.min(9999, Number(body.quantity) || 1),
      unit: String(body.unit || 'piece').slice(0, 20),
    }
  })
  return NextResponse.json(item)
}
