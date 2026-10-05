import { NextRequest, NextResponse } from 'next/server'
import { z } from 'zod'
import { db } from '@/lib/db'
import { getCurrentUser, verifyCsrf } from '@/lib/auth'

const schema = z.object({
  name: z.string().trim().min(1).max(80),
  quantity: z.number().min(0).max(9999),
  unit: z.string().trim().min(1).max(20),
})

export async function POST(req: NextRequest, { params }: { params: Promise<{ listId: string }> }) {
  const user = await getCurrentUser()
  if (!user) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
  if (!(await verifyCsrf(req))) return NextResponse.json({ error: 'Invalid request.' }, { status: 403 })
  const { listId } = await params

  const body = await req.json().catch(() => null)
  const parsed = schema.safeParse(body)
  if (!parsed.success) return NextResponse.json({ error: 'Invalid input.' }, { status: 400 })

  // IDOR protection
  const list = await db.groceryList.findFirst({ where: { id: listId, userId: user.id } })
  if (!list) return NextResponse.json({ error: 'Not found' }, { status: 404 })

  const item = await db.groceryItem.create({
    data: { groceryListId: listId, name: parsed.data.name, quantity: parsed.data.quantity, unit: parsed.data.unit }
  })
  return NextResponse.json(item)
}

export async function DELETE(req: NextRequest, { params }: { params: Promise<{ listId: string }> }) {
  const user = await getCurrentUser()
  if (!user) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
  if (!(await verifyCsrf(req))) return NextResponse.json({ error: 'Invalid request.' }, { status: 403 })
  const { listId } = await params
  await db.groceryList.deleteMany({ where: { id: listId, userId: user.id } })
  return NextResponse.json({ ok: true })
}
