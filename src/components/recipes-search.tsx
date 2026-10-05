'use client'
import { useState, useEffect, useMemo } from 'react'
import { useRouter, useSearchParams } from 'next/navigation'
import { Input } from '@/components/ui/input'
import { Button } from '@/components/ui/button'
import { Label } from '@/components/ui/label'
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select'
import { Checkbox } from '@/components/ui/checkbox'
import { Search, X, Filter } from 'lucide-react'

interface Props {
  initialQuery: string
  cuisines: string[]
  mealTypes: string[]
  difficulties: string[]
  initialCuisine?: string
  initialMealType?: string
  initialDifficulty?: string
  initialMaxCookTime?: string
  initialIsTraditionalIndian?: boolean
  totalCount: number
}

export function RecipesSearch(props: Props) {
  const router = useRouter()
  const sp = useSearchParams()
  const currentQuery = sp.get('q') || ''
  const [query, setQuery] = useState(currentQuery)
  const [showFilters, setShowFilters] = useState(false)

  // Keep input synced with URL when navigating
  useEffect(() => {
    if (currentQuery !== query) setQuery(currentQuery)
     
  }, [currentQuery])

  const activeFilterCount = useMemo(() => {
    let n = 0
    if (props.initialCuisine) n++
    if (props.initialMealType) n++
    if (props.initialDifficulty) n++
    if (props.initialMaxCookTime) n++
    if (props.initialIsTraditionalIndian) n++
    return n
  }, [props.initialCuisine, props.initialMealType, props.initialDifficulty, props.initialMaxCookTime, props.initialIsTraditionalIndian])

  const submit = (next?: Record<string, string | undefined>) => {
    const params = new URLSearchParams()
    if (query) params.set('q', query)
    if (next?.cuisine ?? props.initialCuisine) params.set('cuisine', (next?.cuisine ?? props.initialCuisine)!)
    if (next?.mealType ?? props.initialMealType) params.set('mealType', (next?.mealType ?? props.initialMealType)!)
    if (next?.difficulty ?? props.initialDifficulty) params.set('difficulty', (next?.difficulty ?? props.initialDifficulty)!)
    if (next?.maxCookTime ?? props.initialMaxCookTime) params.set('maxCookTime', (next?.maxCookTime ?? props.initialMaxCookTime)!)
    if (next?.isTraditionalIndian === '1' || (!next && props.initialIsTraditionalIndian)) params.set('isTraditionalIndian', '1')
    const qs = params.toString()
    router.push(`/recipes${qs ? `?${qs}` : ''}`)
  }

  const clearAll = () => {
    setQuery('')
    router.push('/recipes')
  }

  return (
    <div className="rounded-md border border-border bg-card p-4">
      <form onSubmit={(e) => { e.preventDefault(); submit() }} className="flex flex-col gap-3 sm:flex-row sm:items-end">
        <div className="flex-1">
          <Label htmlFor="recipe-q" className="sr-only">Search recipes</Label>
          <Input
            id="recipe-q"
            type="search"
            value={query}
            onChange={(e) => setQuery(e.target.value)}
            placeholder="Search by recipe name, e.g. paneer butter masala"
            className="w-full"
          />
        </div>
        <div className="flex gap-2">
          <Button type="submit"><Search className="mr-2 h-4 w-4" /> Search</Button>
          <Button type="button" variant="outline" onClick={() => setShowFilters(s => !s)}>
            <Filter className="mr-2 h-4 w-4" /> Filters
            {activeFilterCount > 0 && <span className="ml-1 rounded bg-primary-foreground/20 px-1.5 text-xs">{activeFilterCount}</span>}
          </Button>
          {(activeFilterCount > 0 || query) && (
            <Button type="button" variant="ghost" onClick={clearAll} aria-label="Clear all filters">
              <X className="h-4 w-4" />
            </Button>
          )}
        </div>
      </form>

      {showFilters && (
        <div className="mt-4 grid gap-4 border-t border-border pt-4 sm:grid-cols-2 lg:grid-cols-4">
          <div>
            <Label htmlFor="filter-cuisine" className="text-xs font-medium">Cuisine</Label>
            <Select value={props.initialCuisine ?? ''} onValueChange={(v) => submit({ cuisine: v || undefined })}>
              <SelectTrigger id="filter-cuisine" className="mt-1"><SelectValue placeholder="Any" /></SelectTrigger>
              <SelectContent>
                {props.cuisines.map(c => <SelectItem key={c} value={c}>{c}</SelectItem>)}
              </SelectContent>
            </Select>
          </div>
          <div>
            <Label htmlFor="filter-mealtype" className="text-xs font-medium">Meal type</Label>
            <Select value={props.initialMealType ?? ''} onValueChange={(v) => submit({ mealType: v || undefined })}>
              <SelectTrigger id="filter-mealtype" className="mt-1"><SelectValue placeholder="Any" /></SelectTrigger>
              <SelectContent>
                {props.mealTypes.map(m => <SelectItem key={m} value={m}>{m}</SelectItem>)}
              </SelectContent>
            </Select>
          </div>
          <div>
            <Label htmlFor="filter-difficulty" className="text-xs font-medium">Difficulty</Label>
            <Select value={props.initialDifficulty ?? ''} onValueChange={(v) => submit({ difficulty: v || undefined })}>
              <SelectTrigger id="filter-difficulty" className="mt-1"><SelectValue placeholder="Any" /></SelectTrigger>
              <SelectContent>
                {props.difficulties.map(d => <SelectItem key={d} value={d} className="capitalize">{d}</SelectItem>)}
              </SelectContent>
            </Select>
          </div>
          <div>
            <Label htmlFor="filter-cooktime" className="text-xs font-medium">Max cook time (min)</Label>
            <Input
              id="filter-cooktime"
              type="number"
              min="1"
              defaultValue={props.initialMaxCookTime ?? ''}
              onBlur={(e) => submit({ maxCookTime: e.target.value || undefined })}
              className="mt-1"
            />
          </div>
          <div className="sm:col-span-2 lg:col-span-4">
            <Label htmlFor="filter-indian" className="flex items-center gap-2 text-xs font-medium cursor-pointer">
              <Checkbox
                id="filter-indian"
                checked={props.initialIsTraditionalIndian ?? false}
                onCheckedChange={(v) => submit({ isTraditionalIndian: v ? '1' : '' })}
              />
              Show only traditional Indian dishes
            </Label>
          </div>
        </div>
      )}

      <p className="mt-3 text-xs text-muted-foreground">{props.totalCount.toLocaleString()} recipes match.</p>
    </div>
  )
}
