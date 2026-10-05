import { NextRequest, NextResponse } from 'next/server'
import { db } from '@/lib/db'
import { getCurrentUser, verifyCsrf } from '@/lib/auth'
import { rateLimitFromRequest } from '@/lib/rate-limit'
import { env } from '@/lib/env'

// Build a "missing ingredients" grocery list from a recipe.
export async function POST(req: NextRequest, { params }: { params: Promise<{ recipeId: string }> }) {
  const user = await getCurrentUser()
  if (!user) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
  if (!(await verifyCsrf(req))) return NextResponse.json({ error: 'Invalid request.' }, { status: 403 })
  const { recipeId } = await params

  const rl = rateLimitFromRequest(req, 'grocery-from-recipe', env.rateLimits.apiPerMin, 60, user.id)
  if (!rl.ok) return NextResponse.json({ error: 'Too many requests.' }, { status: 429 })

  const recipe = await db.recipe.findUnique({
    where: { id: recipeId },
    include: { ingredients: { include: { ingredient: true } } },
  })
  if (!recipe) return NextResponse.json({ error: 'Recipe not found' }, { status: 404 })

  const inventory = await db.userInventory.findMany({ where: { userId: user.id } })
  const invIds = new Set(inventory.map(i => i.ingredientId))

  let list = await db.groceryList.findFirst({ where: { userId: user.id, name: 'From recipes' } })
  if (!list) list = await db.groceryList.create({ data: { userId: user.id, name: 'From recipes', source: recipe.title } })

  let addedCount = 0
  for (const ri of recipe.ingredients) {
    if (ri.optional) continue
    if (invIds.has(ri.ingredientId)) continue
    const existing = await db.groceryItem.findFirst({ where: { groceryListId: list.id, name: ri.ingredient.name } })
    if (existing) continue
    await db.groceryItem.create({
      data: {
        groceryListId: list.id,
        ingredientId: ri.ingredientId,
        name: ri.ingredient.name,
        quantity: ri.quantity,
        unit: ri.unit,
      },
    })
    addedCount++
  }

  return NextResponse.json({ ok: true, listId: list.id, addedCount })
}
