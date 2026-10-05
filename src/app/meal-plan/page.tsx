import Link from 'next/link'
import { db } from '@/lib/db'
import { getCurrentUser } from '@/lib/auth'
import { getSiteSettings } from '@/lib/site'
import { Breadcrumbs } from '@/components/breadcrumbs'
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card'
import { Button } from '@/components/ui/button'
import { CalendarDays } from 'lucide-react'
import { MealPlannerClient } from '@/components/meal-planner-client'
import type { Metadata } from 'next'

export const dynamic = 'force-dynamic'

export async function generateMetadata(): Promise<Metadata> {
  const settings = await getSiteSettings()
  return {
    title: 'Meal planner',
    description: `Plan your week with recipes from ${settings.siteName}. Add recipes to breakfast, lunch, dinner, or snacks.`,
    alternates: { canonical: '/meal-plan' },
  }
}

export default async function MealPlanPage() {
  const settings = await getSiteSettings()
  const user = await getCurrentUser()

  let plans: { id: string; date: string; mealType: string; servings: number; recipe: { id: string; slug: string; title: string } }[] = []
  if (user) {
    const rows = await db.mealPlan.findMany({
      where: { userId: user.id, date: { gte: new Date(Date.now() - 7 * 24 * 60 * 60 * 1000) } },
      orderBy: { date: 'asc' },
      include: { recipe: { select: { id: true, slug: true, title: true } } },
    })
    plans = rows.map(p => ({ id: p.id, date: p.date.toISOString(), mealType: p.mealType, servings: p.servings, recipe: p.recipe }))
  }

  return (
    <div className="mx-auto max-w-5xl px-4 py-8 sm:px-6 lg:px-8">
      <Breadcrumbs items={[
        { label: 'Home', href: '/' },
        { label: 'Meal plan', href: '/meal-plan' },
      ]} />

      <header className="mt-4">
        <p className="text-sm text-primary">{settings.siteName} planner</p>
        <h1 className="mt-1 text-3xl font-bold tracking-tight">Meal plan</h1>
        <p className="mt-2 text-muted-foreground">
          Build a weekly plan from your saved recipes and search results.
        </p>
      </header>

      {!user && (
        <Card className="mt-6 border-primary/40 bg-primary/5">
          <CardHeader>
            <CardTitle className="text-base">Sign in to plan your meals</CardTitle>
          </CardHeader>
          <CardContent className="text-sm text-muted-foreground">
            <p>Your meal plan is saved to your account so you can return to it any time.</p>
            <div className="mt-3 flex gap-2">
              <Button asChild size="sm"><Link href="/login?next=/meal-plan">Sign in</Link></Button>
              <Button asChild size="sm" variant="outline"><Link href="/register?next=/meal-plan">Create account</Link></Button>
            </div>
          </CardContent>
        </Card>
      )}

      {user && <MealPlannerClient plans={plans} />}

      <Card className="mt-8">
        <CardHeader>
          <CardTitle className="flex items-center gap-2 text-base">
            <CalendarDays className="h-5 w-5" /> How it works
          </CardTitle>
        </CardHeader>
        <CardContent className="grid gap-2 text-sm text-muted-foreground">
          <p>1. Open a recipe and add it to a slot.</p>
          <p>2. Slots are organized by day and meal type.</p>
          <p>3. Missing ingredients are added to your grocery list automatically.</p>
        </CardContent>
      </Card>
    </div>
  )
}
