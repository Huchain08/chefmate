import Link from 'next/link'
import { db } from '@/lib/db'
import { notFound } from 'next/navigation'
import type { Metadata } from 'next'
import { getSiteSettings, getNavigationItems } from '@/lib/site'
import { Button } from '@/components/ui/button'
import { Badge } from '@/components/ui/badge'
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card'
import { Separator } from '@/components/ui/separator'
import { Clock, Users, Flame, ChefHat, Star, Youtube, ListChecks, ShoppingCart } from 'lucide-react'
import { CookingTimerController, RecipeStepItem } from '@/components/cooking-timer'
import { RecipeActions } from '@/components/recipe-actions'
import { Breadcrumbs } from '@/components/breadcrumbs'
import { getRecipeImage, getRecipeImageAlt } from '@/lib/recipe-image'

export const dynamic = 'force-dynamic'

interface Props { params: Promise<{ slug: string }> }

export async function generateMetadata({ params }: Props): Promise<Metadata> {
  const { slug } = await params
  const recipe = await db.recipe.findUnique({ where: { slug }, select: { title: true, description: true, imageUrl: true, imageAlt: true } })
  if (!recipe) return { title: 'Recipe not found' }
  const settings = await getSiteSettings()
  const title = `${recipe.title} — ${settings.siteName}`
  const description = recipe.description.slice(0, 160)
  return {
    title: recipe.title,
    description,
    alternates: { canonical: `/recipes/${slug}` },
    openGraph: {
      title,
      description,
      images: recipe.imageUrl ? [{ url: recipe.imageUrl, alt: recipe.imageAlt ?? recipe.title }] : [],
      type: 'article',
    },
    twitter: { card: 'summary_large_image', title, description },
  }
}

export default async function RecipeDetailPage({ params }: Props) {
  const { slug } = await params
  const recipe = await db.recipe.findUnique({
    where: { slug },
    include: {
      ingredients: { include: { ingredient: true } },
      steps: { orderBy: { stepNumber: 'asc' } },
    },
  })

  if (!recipe || recipe.status !== 'published') notFound()

  const settings = await getSiteSettings()
  const nav = await getNavigationItems('header')

  return (
    <article className="mx-auto max-w-5xl px-4 py-8 sm:px-6 lg:px-8">
      <Breadcrumbs items={[
        { label: 'Home', href: '/' },
        { label: 'Recipes', href: '/recipes' },
        { label: recipe.title, href: `/recipes/${recipe.slug}` },
      ]} />

      <header className="mt-4 grid gap-6 lg:grid-cols-2">
        <div>
          <div className="flex flex-wrap gap-2">
            {recipe.isTraditionalIndian && <Badge variant="secondary">Traditional Indian</Badge>}
            <Badge variant="outline">{recipe.cuisine}</Badge>
            <Badge variant="outline">{recipe.mealType}</Badge>
            <Badge variant="outline" className="capitalize">{recipe.difficulty}</Badge>
            {recipe.region && <Badge variant="outline">{recipe.region}</Badge>}
          </div>
          <h1 className="mt-3 text-3xl font-bold tracking-tight sm:text-4xl">{recipe.title}</h1>
          <p className="mt-3 text-muted-foreground">{recipe.description}</p>

          <dl className="mt-5 grid grid-cols-2 gap-4 sm:grid-cols-4">
            <Stat icon={Clock} label="Prep" value={`${recipe.prepTimeMin} min`} />
            <Stat icon={Flame} label="Cook" value={`${recipe.cookTimeMin} min`} />
            <Stat icon={Users} label="Serves" value={String(recipe.servings)} />
            <Stat icon={ChefHat} label="Calories" value={recipe.caloriesPerServing ? `${recipe.caloriesPerServing}` : '—'} />
          </dl>

          <div className="mt-6 flex flex-wrap gap-2">
            <RecipeActions recipeId={recipe.id} slug={recipe.slug} />
            <Button asChild variant="outline">
              <Link href={`/grocery?recipe=${recipe.slug}`}><ShoppingCart className="mr-2 h-4 w-4" /> Missing ingredients</Link>
            </Button>
            <Button asChild variant="ghost">
              <Link href={`/recipes/youtube?q=${encodeURIComponent(recipe.title)}`}><Youtube className="mr-2 h-4 w-4" /> Watch tutorials</Link>
            </Button>
          </div>
        </div>

        <div className="aspect-[4/3] overflow-hidden rounded-lg border border-border bg-muted">
          <img src={getRecipeImage(recipe.title, recipe.cuisine, recipe.imageUrl)} alt={getRecipeImageAlt(recipe.title, recipe.imageAlt)} className="h-full w-full object-cover" />
        </div>
      </header>

      <Separator className="my-10" />

      <div className="grid gap-10 lg:grid-cols-3">
        <section aria-labelledby="ingredients-heading" className="lg:col-span-1">
          <h2 id="ingredients-heading" className="flex items-center gap-2 text-xl font-semibold">
            <ListChecks className="h-5 w-5" /> Ingredients
          </h2>
          <p className="mt-1 text-sm text-muted-foreground">
            You will need {recipe.ingredients.length} ingredient{recipe.ingredients.length === 1 ? '' : 's'}.
          </p>
          <ul className="mt-4 space-y-2">
            {recipe.ingredients.map(ri => (
              <li key={ri.id} className="flex items-start justify-between gap-2 rounded-md border border-border p-2 text-sm">
                <span className="font-medium">{ri.ingredient.name}</span>
                <span className="text-muted-foreground">{ri.quantity} {ri.unit}{ri.optional ? ' (optional)' : ''}</span>
              </li>
            ))}
          </ul>

          {(recipe.caloriesPerServing || recipe.proteinG) && (
            <Card className="mt-6">
              <CardHeader>
                <CardTitle className="text-base">Nutrition per serving</CardTitle>
              </CardHeader>
              <CardContent className="grid grid-cols-2 gap-3 text-sm">
                {recipe.caloriesPerServing && <NutritionRow label="Calories" value={`${recipe.caloriesPerServing} kcal`} />}
                {recipe.proteinG && <NutritionRow label="Protein" value={`${recipe.proteinG} g`} />}
                {recipe.carbsG && <NutritionRow label="Carbohydrates" value={`${recipe.carbsG} g`} />}
                {recipe.fatG && <NutritionRow label="Fat" value={`${recipe.fatG} g`} />}
              </CardContent>
            </Card>
          )}
        </section>

        <section aria-labelledby="steps-heading" className="lg:col-span-2">
          <h2 id="steps-heading" className="flex items-center gap-2 text-xl font-semibold">
            <ChefHat className="h-5 w-5" /> Step-by-step instructions
          </h2>
          <p className="mt-1 text-sm text-muted-foreground">
            Steps that mention a duration show a one-tap timer. Total cooking time: {recipe.cookTimeMin} minutes.
          </p>
          <ol className="mt-5 space-y-5">
            {recipe.steps.map(step => (
              <RecipeStepItem
                key={step.id}
                stepNumber={step.stepNumber}
                instruction={step.instruction}
                durationMin={step.durationMin}
              />
            ))}
          </ol>
        </section>
      </div>

      <Separator className="my-10" />
      <CooksAlsoSection currentId={recipe.id} cuisine={recipe.cuisine} />

      <CookingTimerController />

      <nav className="mt-12 flex items-center justify-between text-sm" aria-label="Recipe navigation">
        <Link href="/recipes" className="text-muted-foreground hover:text-foreground hover:underline underline-offset-4">
          All recipes
        </Link>
        <Link href="/meal-plan" className="text-muted-foreground hover:text-foreground hover:underline underline-offset-4">
          Add to meal plan
        </Link>
      </nav>
    </article>
  )
}

async function CooksAlsoSection({ currentId, cuisine }: { currentId: string; cuisine: string }) {
  let related: { id: string; slug: string; title: string; imageUrl: string | null; imageAlt: string | null; cookTimeMin: number }[] = []
  try {
    related = await db.recipe.findMany({
      where: { status: 'published', cuisine, id: { not: currentId } },
      take: 4,
      orderBy: { createdAt: 'desc' },
      select: { id: true, slug: true, title: true, imageUrl: true, imageAlt: true, cookTimeMin: true },
    })
  } catch {
    return null
  }
  if (related.length === 0) return null
  return (
    <section aria-labelledby="related-heading">
      <h2 id="related-heading" className="text-xl font-semibold">More {cuisine} recipes</h2>
      <div className="mt-4 grid gap-4 sm:grid-cols-2 lg:grid-cols-4">
        {related.map(r => (
          <Link key={r.id} href={`/recipes/${r.slug}`} className="group block">
            <Card className="card-hover overflow-hidden">
              <div className="aspect-[4/3] w-full bg-muted">
                <img src={getRecipeImage(r.title, cuisine, r.imageUrl)} alt={getRecipeImageAlt(r.title, r.imageAlt)} className="h-full w-full object-cover transition-transform duration-500 group-hover:scale-105" loading="lazy" />
              </div>
              <CardContent className="p-3">
                <p className="line-clamp-1 text-sm font-medium group-hover:text-primary">{r.title}</p>
                <p className="mt-1 text-xs text-muted-foreground">{r.cookTimeMin} min</p>
              </CardContent>
            </Card>
          </Link>
        ))}
      </div>
    </section>
  )
}

function Stat({ icon: Icon, label, value }: { icon: React.ComponentType<{ className?: string }>; label: string; value: string }) {
  return (
    <div className="rounded-md border border-border p-3">
      <div className="flex items-center gap-2 text-xs text-muted-foreground">
        <Icon className="h-3.5 w-3.5" /> {label}
      </div>
      <p className="mt-1 text-sm font-semibold">{value}</p>
    </div>
  )
}

function NutritionRow({ label, value }: { label: string; value: string }) {
  return (
    <div>
      <p className="text-xs text-muted-foreground">{label}</p>
      <p className="text-sm font-medium">{value}</p>
    </div>
  )
}
