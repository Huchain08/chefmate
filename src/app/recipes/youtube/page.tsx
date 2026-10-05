import Link from 'next/link'
import { env } from '@/lib/env'
import { db } from '@/lib/db'
import type { Metadata } from 'next'
import { getSiteSettings } from '@/lib/site'
import { Youtube, ArrowLeft } from 'lucide-react'
import { Button } from '@/components/ui/button'
import { Breadcrumbs } from '@/components/breadcrumbs'
import { YoutubeSearchForm } from '@/components/youtube-search-form'

export const dynamic = 'force-dynamic'

export async function generateMetadata(): Promise<Metadata> {
  const settings = await getSiteSettings()
  return {
    title: 'Recipe tutorial search',
    description: `Search for public cooking tutorial videos for recipes not yet in the ${settings.siteName} database.`,
    alternates: { canonical: '/recipes/youtube' },
    robots: { index: false, follow: false },
  }
}

interface VideoItem {
  videoId: string
  title: string
  description: string
  channel: string
  thumbnail: string
  publishedAt: string
}

interface Props { searchParams: Promise<{ q?: string }> }

export default async function YoutubeSearchPage({ searchParams }: Props) {
  const { q } = await searchParams
  const query = (q || '').trim()
  const settings = await getSiteSettings()

  let internalMatch: { slug: string; title: string } | null = null
  if (query) {
    try {
      internalMatch = await db.recipe.findFirst({
        where: { status: 'published', title: { contains: query } },
        select: { slug: true, title: true },
      })
    } catch {}
  }

  let videos: VideoItem[] = []
  let error: string | null = null
  let apiKeyConfigured = Boolean(env.youtube.apiKey)

  if (query && apiKeyConfigured) {
    try {
      const url = new URL('https://www.googleapis.com/youtube/v3/search')
      url.searchParams.set('part', 'snippet')
      url.searchParams.set('type', 'video')
      url.searchParams.set('maxResults', '10')
      url.searchParams.set('q', `${env.youtube.baseQuery} ${query}`)
      url.searchParams.set('key', env.youtube.apiKey)
      const res = await fetch(url.toString(), { cache: 'no-store' })
      if (!res.ok) {
        error = 'YouTube search is temporarily unavailable.'
      } else {
        const data = await res.json()
        videos = (data.items || []).map((item: any) => ({
          videoId: item.id?.videoId ?? '',
          title: item.snippet?.title ?? '',
          description: item.snippet?.description ?? '',
          channel: item.snippet?.channelTitle ?? '',
          thumbnail: item.snippet?.thumbnails?.medium?.url ?? '',
          publishedAt: item.snippet?.publishedAt ?? '',
        })).filter((v: VideoItem) => v.videoId)
      }
    } catch {
      error = 'Could not reach YouTube. Please try again later.'
    }
  }

  return (
    <div className="mx-auto max-w-5xl px-4 py-8 sm:px-6 lg:px-8">
      <Breadcrumbs items={[
        { label: 'Home', href: '/' },
        { label: 'Recipes', href: '/recipes' },
        { label: 'Tutorial search', href: '/recipes/youtube' },
      ]} />

      <header className="mt-4">
        <p className="text-sm text-primary">{settings.siteName}</p>
        <h1 className="mt-1 text-3xl font-bold tracking-tight">Recipe tutorial search</h1>
        <p className="mt-2 text-muted-foreground max-w-2xl">
          If you cannot find a recipe in the ChefMate database, search for public cooking tutorial videos here. We never host these videos; we only link to them on YouTube.
        </p>
      </header>

      <YoutubeSearchForm initialQuery={query} apiKeyConfigured={apiKeyConfigured} />

      {internalMatch && (
        <div className="mt-6 rounded-md border border-primary/40 bg-primary/5 p-4">
          <p className="text-sm font-medium">This recipe is already in ChefMate.</p>
          <p className="mt-1 text-sm text-muted-foreground">View the full step-by-step instructions on the recipe page.</p>
          <Button asChild className="mt-3" size="sm">
            <Link href={`/recipes/${internalMatch.slug}`}>Open recipe</Link>
          </Button>
        </div>
      )}

      {!apiKeyConfigured && query && (
        <div className="mt-6 rounded-md border border-dashed border-border p-6 text-center">
          <Youtube className="mx-auto h-8 w-8 text-muted-foreground" />
          <p className="mt-3 font-medium">YouTube search is not configured.</p>
          <p className="mt-1 text-sm text-muted-foreground">
            The owner has not added a YouTube API key yet. You can search for the same query directly on YouTube.
          </p>
          <Button asChild variant="outline" className="mt-4">
            <a href={`https://www.youtube.com/results?search_query=${encodeURIComponent(`${env.youtube.baseQuery} ${query}`)}`} rel="noopener noreferrer nofollow" target="_blank">
              Search on YouTube
            </a>
          </Button>
        </div>
      )}

      {error && <p className="mt-6 text-sm text-destructive">{error}</p>}

      {videos.length > 0 && (
        <section aria-labelledby="results-heading" className="mt-8">
          <h2 id="results-heading" className="text-lg font-semibold">
            Tutorial videos for &quot;{query}&quot;
          </h2>
          <ul className="mt-4 grid gap-4 sm:grid-cols-2">
            {videos.map(v => (
              <li key={v.videoId} className="overflow-hidden rounded-md border border-border">
                <a href={`https://www.youtube.com/watch?v=${v.videoId}`} target="_blank" rel="noopener noreferrer nofollow" className="block">
                  <div className="aspect-video w-full bg-muted">
                    {v.thumbnail && (
                       
                      <img src={v.thumbnail} alt="" className="h-full w-full object-cover" loading="lazy" />
                    )}
                  </div>
                  <div className="p-3">
                    <p className="line-clamp-2 text-sm font-medium hover:text-primary">{v.title}</p>
                    <p className="mt-1 text-xs text-muted-foreground">{v.channel}</p>
                  </div>
                </a>
              </li>
            ))}
          </ul>
        </section>
      )}

      <div className="mt-10">
        <Button asChild variant="ghost">
          <Link href="/recipes"><ArrowLeft className="mr-2 h-4 w-4" /> Back to recipes</Link>
        </Button>
      </div>
    </div>
  )
}
