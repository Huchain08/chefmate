import Link from 'next/link'
import { db } from '@/lib/db'
import { getSiteSettings } from '@/lib/site'
import { Breadcrumbs } from '@/components/breadcrumbs'
import type { Metadata } from 'next'

export const dynamic = 'force-dynamic'

export async function generateMetadata(): Promise<Metadata> {
  const settings = await getSiteSettings()
  return {
    title: 'Sitemap',
    description: `A full directory of all pages on ${settings.siteName}.`,
    alternates: { canonical: '/sitemap' },
  }
}

const STATIC_SECTIONS = [
  {
    heading: 'Main',
    links: [
      { label: 'Home', href: '/', description: 'Start here — discover what ChefMate can do.' },
      { label: 'Recipes', href: '/recipes', description: 'Browse the full library of Indian and global recipes.' },
      { label: 'Scan fridge', href: '/scan', description: 'Upload a photo or enter your ingredients and get instant recipe matches.' },
      { label: 'Meal plan', href: '/meal-plan', description: 'Plan your meals for the week.' },
      { label: 'Grocery list', href: '/grocery', description: 'Your auto-populated shopping list of missing ingredients.' },
      { label: 'Chef Slice game', href: '/game', description: 'Take a break — slice falling foods and avoid the bombs.' },
    ],
  },
  {
    heading: 'Account',
    links: [
      { label: 'Register', href: '/register', description: 'Create a free account.' },
      { label: 'Log in', href: '/login', description: 'Sign in to your account.' },
      { label: 'Forgot password', href: '/forgot-password', description: 'Reset your password via email.' },
    ],
  },
  {
    heading: 'Company',
    links: [
      { label: 'About', href: '/about', description: 'Learn about ChefMate and our ingredient-first approach.' },
      { label: 'Contact', href: '/contact', description: 'Get in touch with the team.' },
    ],
  },
  {
    heading: 'Legal',
    links: [
      { label: 'Terms of Service', href: '/terms', description: 'The rules that govern your use of ChefMate.' },
      { label: 'Privacy Policy', href: '/privacy', description: 'How we collect, use, and protect your data.' },
      { label: 'XML Sitemap', href: '/sitemap.xml', description: 'Machine-readable sitemap for search engines.' },
    ],
  },
]

export default async function SitemapPage() {
  const [settings, recipes] = await Promise.all([
    getSiteSettings(),
    db.recipe.findMany({
      where: { status: 'published' },
      select: { slug: true, title: true, cuisine: true, mealType: true },
      orderBy: [{ cuisine: 'asc' }, { title: 'asc' }],
    }),
  ])

  // Group recipes by cuisine for a readable directory
  const byCuisine = recipes.reduce<Record<string, typeof recipes>>((acc, recipe) => {
    const key = recipe.cuisine
    if (!acc[key]) acc[key] = []
    acc[key].push(recipe)
    return acc
  }, {})
  const cuisines = Object.keys(byCuisine).sort()

  return (
    <div className="mx-auto max-w-4xl px-4 py-8 sm:px-6 lg:px-8">
      <Breadcrumbs items={[
        { label: 'Home', href: '/' },
        { label: 'Sitemap', href: '/sitemap' },
      ]} />

      <header className="mt-4">
        <p className="text-sm text-primary">{settings.siteName}</p>
        <h1 className="mt-1 text-3xl font-bold tracking-tight">Sitemap</h1>
        <p className="mt-2 text-muted-foreground">
          A full directory of every page on {settings.siteName}.
        </p>
      </header>

      {/* Static sections */}
      <div className="mt-10 grid gap-10 sm:grid-cols-2">
        {STATIC_SECTIONS.map(section => (
          <section key={section.heading}>
            <h2 className="text-xs font-semibold uppercase tracking-widest text-muted-foreground">
              {section.heading}
            </h2>
            <ul className="mt-3 space-y-3">
              {section.links.map(link => (
                <li key={link.href}>
                  <Link
                    href={link.href}
                    className="font-medium text-foreground hover:text-primary hover:underline underline-offset-4"
                  >
                    {link.label}
                  </Link>
                  <p className="mt-0.5 text-sm text-muted-foreground">{link.description}</p>
                </li>
              ))}
            </ul>
          </section>
        ))}
      </div>

      {/* Recipes directory */}
      {recipes.length > 0 && (
        <section className="mt-12">
          <h2 className="text-xs font-semibold uppercase tracking-widest text-muted-foreground">
            Recipes ({recipes.length})
          </h2>
          <p className="mt-1 text-sm text-muted-foreground">
            All published recipes, grouped by cuisine.
          </p>

          <div className="mt-6 space-y-8">
            {cuisines.map(cuisine => (
              <div key={cuisine}>
                <h3 className="text-sm font-semibold text-foreground border-b pb-1 mb-3">
                  {cuisine}
                  <span className="ml-2 text-xs font-normal text-muted-foreground">
                    ({byCuisine[cuisine].length})
                  </span>
                </h3>
                <ul className="grid gap-x-8 gap-y-1.5 sm:grid-cols-2 lg:grid-cols-3">
                  {byCuisine[cuisine].map(recipe => (
                    <li key={recipe.slug}>
                      <Link
                        href={`/recipes/${recipe.slug}`}
                        className="text-sm text-foreground hover:text-primary hover:underline underline-offset-4"
                      >
                        {recipe.title}
                      </Link>
                    </li>
                  ))}
                </ul>
              </div>
            ))}
          </div>
        </section>
      )}
    </div>
  )
}
