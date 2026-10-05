import Link from 'next/link'
import { db } from '@/lib/db'
import { Card, CardContent } from '@/components/ui/card'
import { Badge } from '@/components/ui/badge'
import { RecipesSearch } from '@/components/recipes-search'
import type { Metadata } from 'next'
import { getSiteSettings } from '@/lib/site'
import { getRecipeImage, getRecipeImageAlt } from '@/lib/recipe-image'
import { TiltCard } from '@/components/motion'

export const dynamic = 'force-dynamic'

export async function generateMetadata(): Promise<Metadata> {
  const settings = await getSiteSettings()
  return {
    title: 'Recipes',
    description: `Browse ${settings.siteName} recipes including traditional Indian dishes and global recipes with step-by-step instructions.`,
    alternates: { canonical: '/recipes' },
  }
}

interface SearchParams {
  q?: string
  cuisine?: string
  mealType?: string
  difficulty?: string
  maxCookTime?: string
  isTraditionalIndian?: string
  page?: string
}

const CUISINES = ['Indian', 'South Indian', 'Punjabi', 'Bengali', 'Gujarati', 'Maharashtrian', 'Rajasthani', 'Kashmiri', 'Tamil', 'Kerala', 'Andhra', 'Hyderabadi', 'Italian', 'Chinese', 'Thai', 'Mexican', 'American', 'French', 'Japanese', 'Mediterranean', 'Middle Eastern', 'Continental']
const MEAL_TYPES = ['Breakfast', 'Lunch', 'Dinner', 'Snack', 'Dessert', 'Drinks']
const DIFFICULTIES = ['easy', 'medium', 'hard']

export default async function RecipesPage({ searchParams }: { searchParams: Promise<SearchParams> }) {
  const sp = await searchParams
  const page = Math.max(1, parseInt(sp.page || '1', 10) || 1)
  const pageSize = 24

  const where: Record<string, unknown> = { status: 'published' }
  if (sp.q) where.title = { contains: sp.q }
  if (sp.cuisine) where.cuisine = sp.cuisine
  if (sp.mealType) where.mealType = sp.mealType
  if (sp.difficulty) where.difficulty = sp.difficulty
  if (sp.isTraditionalIndian === '1') where.isTraditionalIndian = true
  if (sp.maxCookTime) where.cookTimeMin = { lte: parseInt(sp.maxCookTime, 10) }

  const [total, recipes] = await Promise.all([
    db.recipe.count({ where: where as never }),
    db.recipe.findMany({
      where: where as never,
      orderBy: { createdAt: 'desc' },
      skip: (page - 1) * pageSize,
      take: pageSize,
      select: { id: true, slug: true, title: true, description: true, cuisine: true, mealType: true, difficulty: true, cookTimeMin: true, prepTimeMin: true, imageUrl: true, imageAlt: true, isTraditionalIndian: true, caloriesPerServing: true },
    }),
  ])

  const totalPages = Math.max(1, Math.ceil(total / pageSize))
  const settings = await getSiteSettings()

  return (
    <div className="mx-auto max-w-7xl px-4 py-10 sm:px-6 lg:px-8">
      <header className="animate-fade-up mb-6">
        <p className="text-sm text-primary">{settings.siteName} recipes</p>
        <h1 className="mt-1 text-3xl font-bold tracking-tight">Browse recipes</h1>
        <p className="mt-2 text-muted-foreground">
          {total.toLocaleString()} recipes available. Use the filters to narrow down by cuisine, meal type, or difficulty.
        </p>
      </header>

      <RecipesSearch
        initialQuery={sp.q || ''}
        cuisines={CUISINES}
        mealTypes={MEAL_TYPES}
        difficulties={DIFFICULTIES}
        initialCuisine={sp.cuisine}
        initialMealType={sp.mealType}
        initialDifficulty={sp.difficulty}
        initialMaxCookTime={sp.maxCookTime}
        initialIsTraditionalIndian={sp.isTraditionalIndian === '1'}
        totalCount={total}
      />

      {recipes.length === 0 ? (
        <div className="mt-12 rounded-md border border-dashed border-border p-10 text-center">
          <p className="text-lg font-medium">No matching recipes found.</p>
          <p className="mt-2 text-sm text-muted-foreground">
            Try removing filters or searching the web for tutorial videos.
          </p>
          <div className="mt-4">
            <Link
              href={`/recipes/youtube?q=${encodeURIComponent(sp.q || '')}`}
              className="inline-flex items-center rounded-md border border-border px-4 py-2 text-sm font-medium hover:bg-muted"
            >
              Search tutorial videos
            </Link>
          </div>
        </div>
      ) : (
        <ul className="mt-8 grid gap-4 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4" aria-label="Recipe results">
          {recipes.map(r => (
            <li key={r.id} className="animate-fade-up" style={{ animationDelay: `${Math.min(recipes.indexOf(r), 7) * 55}ms` }}>
              <Link href={`/recipes/${r.slug}`} className="group block">
                <TiltCard>
                  <Card className="card-hover overflow-hidden">
                    <div className="aspect-[4/3] w-full bg-muted">
                      <img src={getRecipeImage(r.title, r.cuisine, r.imageUrl)} alt={getRecipeImageAlt(r.title, r.imageAlt)} className="h-full w-full object-cover transition-transform duration-500 group-hover:scale-105" loading="lazy" />
                    </div>
                    <CardContent className="p-3">
                      <p className="text-sm font-medium line-clamp-1 group-hover:text-primary">{r.title}</p>
                      <p className="mt-1 line-clamp-2 text-xs text-muted-foreground">{r.description}</p>
                      <div className="mt-2 flex flex-wrap gap-1">
                        {r.isTraditionalIndian && <Badge variant="secondary" className="text-[10px]">Traditional Indian</Badge>}
                        <Badge variant="outline" className="text-[10px]">{r.cuisine}</Badge>
                        <Badge variant="outline" className="text-[10px]">{r.cookTimeMin} min</Badge>
                      </div>
                    </CardContent>
                  </Card>
                </TiltCard>
              </Link>
            </li>
          ))}
        </ul>
      )}

      {totalPages > 1 && (
        <nav aria-label="Pagination" className="mt-10 flex items-center justify-center gap-2">
          {Array.from({ length: totalPages }, (_, i) => i + 1).map(p => {
            const params = new URLSearchParams(sp as Record<string, string>)
            if (p === 1) params.delete('page')
            else params.set('page', String(p))
            const qs = params.toString()
            return (
              <Link
                key={p}
                href={`/recipes${qs ? `?${qs}` : ''}`}
                className={`inline-flex h-9 min-w-9 items-center justify-center rounded-md border px-3 text-sm ${p === page ? 'bg-primary text-primary-foreground border-primary' : 'border-border hover:bg-muted'}`}
                aria-current={p === page ? 'page' : undefined}
              >
                {p}
              </Link>
            )
          })}
        </nav>
      )}
    </div>
  )
}
