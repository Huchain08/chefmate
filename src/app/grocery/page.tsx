import Link from 'next/link'
import { env } from '@/lib/env'
import { db } from '@/lib/db'
import { getCurrentUser } from '@/lib/auth'
import { getSiteSettings } from '@/lib/site'
import { Breadcrumbs } from '@/components/breadcrumbs'
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card'
import { Button } from '@/components/ui/button'
import { Badge } from '@/components/ui/badge'
import { Mail, ShoppingCart, CheckCircle2, AlertCircle } from 'lucide-react'
import { GroceryListClient } from '@/components/grocery-list-client'
import type { Metadata } from 'next'

export const dynamic = 'force-dynamic'

export async function generateMetadata(): Promise<Metadata> {
  const settings = await getSiteSettings()
  return {
    title: 'Grocery list',
    description: `See which ingredients you already have and which ones you still need to buy.`,
    alternates: { canonical: '/grocery' },
  }
}

interface Props { searchParams: Promise<{ recipe?: string }> }

export default async function GroceryPage({ searchParams }: Props) {
  const { recipe: recipeSlug } = await searchParams
  const settings = await getSiteSettings()
  const user = await getCurrentUser()
  const groceryConfigured = env.grocery.configured

  // If a recipe slug is provided, show what we know about its missing items
  let recipePreview: { title: string; missingCount: number } | null = null
  if (recipeSlug) {
    const r = await db.recipe.findUnique({
      where: { slug: recipeSlug },
      select: { title: true, _count: { select: { ingredients: true } } },
    })
    if (r) {
      recipePreview = { title: r.title, missingCount: r._count.ingredients }
    }
  }

  let userLists: { id: string; name: string; items: { id: string; name: string; quantity: number; unit: string; purchased: boolean; note: string | null }[] }[] = []
  let inventory: { id: string; ingredient: { name: string }; quantity: number; unit: string }[] = []
  if (user) {
    userLists = await db.groceryList.findMany({
      where: { userId: user.id },
      orderBy: { createdAt: 'desc' },
      include: { items: { orderBy: { createdAt: 'asc' } } },
    })
    inventory = await db.userInventory.findMany({
      where: { userId: user.id },
      include: { ingredient: { select: { name: true } } },
    })
  }

  return (
    <div className="mx-auto max-w-5xl px-4 py-8 sm:px-6 lg:px-8">
      <Breadcrumbs items={[
        { label: 'Home', href: '/' },
        { label: 'Grocery list', href: '/grocery' },
      ]} />

      <header className="mt-4">
        <p className="text-sm text-primary">{settings.siteName} grocery</p>
        <h1 className="mt-1 text-3xl font-bold tracking-tight">Grocery list</h1>
        <p className="mt-2 text-muted-foreground">
          See which ingredients you already have and which ones you still need to buy.
        </p>
      </header>

      {recipePreview && (
        <Card className="mt-6">
          <CardHeader>
            <CardTitle className="text-base">Recipe: {recipePreview.title}</CardTitle>
          </CardHeader>
          <CardContent>
            <p className="text-sm text-muted-foreground">
              This recipe needs {recipePreview.missingCount} ingredient{recipePreview.missingCount === 1 ? '' : 's'}.
              {user ? ' Sign in to add them to your list.' : ' Sign in to track which ones you already have.'}
            </p>
          </CardContent>
        </Card>
      )}

      {!user && (
        <Card className="mt-6 border-primary/40 bg-primary/5">
          <CardHeader>
            <CardTitle className="text-base">Sign in to use your grocery list</CardTitle>
          </CardHeader>
          <CardContent className="text-sm text-muted-foreground">
            <p>
              Your grocery list is tied to your account so you can revisit it from any device. Sign in or create an account to start tracking.
            </p>
            <div className="mt-3 flex gap-2">
              <Button asChild size="sm"><Link href="/login?next=/grocery">Sign in</Link></Button>
              <Button asChild size="sm" variant="outline"><Link href="/register?next=/grocery">Create account</Link></Button>
            </div>
          </CardContent>
        </Card>
      )}

      {user && (
        <GroceryListClient lists={userLists} inventory={inventory.map(i => ({ id: i.id, name: i.ingredient.name, quantity: i.quantity, unit: i.unit }))} />
      )}

      <Card className="mt-8">
        <CardHeader>
          <CardTitle className="flex items-center gap-2 text-base">
            <ShoppingCart className="h-5 w-5" /> Grocery delivery integration
          </CardTitle>
        </CardHeader>
        <CardContent>
          {groceryConfigured ? (
            <>
              <p className="text-sm text-muted-foreground">
                ChefMate is connected to <strong>{env.grocery.partnerName || 'a grocery partner'}</strong>. You can send your missing ingredients list to their service from this page.
              </p>
              <div className="mt-3"><Badge variant="secondary">{env.grocery.provider}</Badge></div>
            </>
          ) : (
            <>
              <div className="flex items-start gap-3">
                <AlertCircle className="mt-0.5 h-5 w-5 text-amber-600" />
                <div className="flex-1">
                  <p className="text-sm font-medium">No grocery delivery services yet.</p>
                  <p className="mt-1 text-sm text-muted-foreground">
                    ChefMate is in its starting stage. No grocery delivery partner is connected to this instance yet.
                    If you operate a grocery or quick-commerce service and would like to integrate with ChefMate, please reach out.
                  </p>
                  <Button asChild variant="outline" size="sm" className="mt-3">
                    <a href={`mailto:${env.ownerContactEmail}?subject=ChefMate%20Grocery%20Integration%20Inquiry`}>
                      <Mail className="mr-2 h-4 w-4" /> {env.ownerContactEmail}
                    </a>
                  </Button>
                </div>
              </div>
            </>
          )}
        </CardContent>
      </Card>

      <Card className="mt-6">
        <CardHeader>
          <CardTitle className="flex items-center gap-2 text-base">
            <CheckCircle2 className="h-5 w-5" /> What I have
          </CardTitle>
        </CardHeader>
        <CardContent>
          {user && inventory.length > 0 ? (
            <ul className="grid gap-2 sm:grid-cols-2">
              {inventory.map(i => (
                <li key={i.id} className="rounded-md border border-border p-2 text-sm">
                  <span className="font-medium">{i.ingredient.name}</span>
                  <span className="ml-2 text-muted-foreground">{i.quantity} {i.unit}</span>
                </li>
              ))}
            </ul>
          ) : (
            <p className="text-sm text-muted-foreground">
              {user ? 'No ingredients in your inventory yet.' : 'Sign in to track what you have at home.'}
            </p>
          )}
        </CardContent>
      </Card>
    </div>
  )
}
