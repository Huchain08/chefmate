import { db } from '@/lib/db'
import { env } from '@/lib/env'
import type { MetadataRoute } from 'next'

export const dynamic = 'force-dynamic'

export default async function sitemap(): Promise<MetadataRoute.Sitemap> {
  const base = env.siteUrl.replace(/\/$/, '')
  const lastModified = new Date()

  const staticRoutes: MetadataRoute.Sitemap = [
    { url: `${base}/`, lastModified, changeFrequency: 'daily', priority: 1 },
    { url: `${base}/recipes`, lastModified, changeFrequency: 'daily', priority: 0.9 },
    { url: `${base}/scan`, lastModified, changeFrequency: 'monthly', priority: 0.6 },
    { url: `${base}/grocery`, lastModified, changeFrequency: 'monthly', priority: 0.6 },
    { url: `${base}/meal-plan`, lastModified, changeFrequency: 'monthly', priority: 0.6 },
    { url: `${base}/game`, lastModified, changeFrequency: 'yearly', priority: 0.3 },
    { url: `${base}/terms`, lastModified, changeFrequency: 'yearly', priority: 0.3 },
    { url: `${base}/privacy`, lastModified, changeFrequency: 'yearly', priority: 0.3 },
    { url: `${base}/contact`, lastModified, changeFrequency: 'yearly', priority: 0.4 },
    { url: `${base}/about`, lastModified, changeFrequency: 'yearly', priority: 0.4 },
    { url: `${base}/sitemap`, lastModified, changeFrequency: 'monthly', priority: 0.3 },
  ]

  let recipeRoutes: MetadataRoute.Sitemap = []
  try {
    const recipes = await db.recipe.findMany({
      where: { status: 'published' },
      select: { slug: true, updatedAt: true },
    })
    recipeRoutes = recipes.map(r => ({
      url: `${base}/recipes/${r.slug}`,
      lastModified: r.updatedAt,
      changeFrequency: 'monthly' as const,
      priority: 0.7,
    }))
  } catch {}

  return [...staticRoutes, ...recipeRoutes]
}
