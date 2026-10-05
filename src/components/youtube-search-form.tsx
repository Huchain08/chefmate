'use client'
import { useState } from 'react'
import { useRouter } from 'next/navigation'
import { Input } from '@/components/ui/input'
import { Button } from '@/components/ui/button'
import { Label } from '@/components/ui/label'
import { Search } from 'lucide-react'

interface Props { initialQuery: string; apiKeyConfigured: boolean }

export function YoutubeSearchForm({ initialQuery, apiKeyConfigured }: Props) {
  const router = useRouter()
  const [q, setQ] = useState(initialQuery)

  return (
    <form
      onSubmit={(e) => { e.preventDefault(); router.push(`/recipes/youtube?q=${encodeURIComponent(q)}`) }}
      className="mt-6 flex flex-col gap-3 sm:flex-row sm:items-end"
    >
      <div className="flex-1">
        <Label htmlFor="yt-q" className="text-xs font-medium">Search a dish name</Label>
        <Input
          id="yt-q"
          type="search"
          value={q}
          onChange={(e) => setQ(e.target.value)}
          placeholder="e.g. chole bhature, lasagna, sushi roll"
          className="mt-1"
        />
      </div>
      <Button type="submit"><Search className="mr-2 h-4 w-4" /> Search tutorials</Button>
      {!apiKeyConfigured && (
        <p className="text-xs text-muted-foreground sm:ml-2 sm:self-center">
          A YouTube API key is not configured. Direct YouTube links are used as a fallback.
        </p>
      )}
    </form>
  )
}
