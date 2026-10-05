'use client'
import { useState } from 'react'
import { Button } from '@/components/ui/button'
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select'
import { Input } from '@/components/ui/input'
import { Label } from '@/components/ui/label'
import Link from 'next/link'
import { Plus, X, Calendar } from 'lucide-react'
import { toast } from 'sonner'

interface Plan { id: string; date: string; mealType: string; servings: number; recipe: { id: string; slug: string; title: string } }

interface Props { plans: Plan[] }

const MEAL_TYPES = ['Breakfast', 'Lunch', 'Dinner', 'Snack']

const fmtDate = (d: string | Date) => {
  const date = typeof d === 'string' ? new Date(d) : d
  return date.toISOString().slice(0, 10)
}

export function MealPlannerClient({ plans: initial }: Props) {
  const [plans, setPlans] = useState(initial)
  const [date, setDate] = useState(fmtDate(new Date()))
  const [mealType, setMealType] = useState<string>('Dinner')
  const [recipeQuery, setRecipeQuery] = useState('')
  const [searchResults, setSearchResults] = useState<{ id: string; slug: string; title: string }[]>([])
  const [searching, setSearching] = useState(false)
  const csrf = () => document.cookie.match(/chefmate_csrf=([^;]+)/)?.[1] ?? ''

  const search = async () => {
    if (!recipeQuery.trim()) return
    setSearching(true)
    try {
      const res = await fetch(`/api/recipes/search?q=${encodeURIComponent(recipeQuery)}&limit=8`)
      if (res.ok) {
        const d = await res.json()
        setSearchResults(d.recipes || [])
        if (!d.recipes?.length) toast.info('No recipes matched your search.')
      }
    } finally {
      setSearching(false)
    }
  }

  const addPlan = async (recipeId: string, recipeSlug: string, recipeTitle: string) => {
    try {
      const res = await fetch('/api/meal-plan', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json', 'X-CSRF-Token': csrf() },
        credentials: 'same-origin',
        body: JSON.stringify({ date, mealType, recipeId, servings: 1 }),
      })
      if (res.ok) {
        const d = await res.json()
        setPlans(prev => [...prev, { id: d.id, date, mealType, servings: 1, recipe: { id: recipeId, slug: recipeSlug, title: recipeTitle } }])
        toast.success(`Added ${recipeTitle} to ${mealType}.`)
      } else if (res.status === 409) {
        toast.error('You already have a plan for that meal slot.')
      } else if (res.status === 429) {
        toast.error('Too many requests. Please slow down.')
      } else {
        toast.error('Could not add to plan.')
      }
    } catch {}
  }

  const removePlan = async (id: string) => {
    setPlans(prev => prev.filter(p => p.id !== id))
    try {
      await fetch(`/api/meal-plan/${id}`, {
        method: 'DELETE',
        headers: { 'X-CSRF-Token': csrf() },
        credentials: 'same-origin',
      })
    } catch {}
  }

  // Group by date
  const grouped = plans.reduce((acc, p) => {
    const d = fmtDate(p.date)
    if (!acc[d]) acc[d] = []
    acc[d].push(p)
    return acc
  }, {} as Record<string, Plan[]>)

  const sortedDates = Object.keys(grouped).sort()

  return (
    <div className="mt-6">
      <div className="rounded-md border border-border p-4">
        <p className="text-sm font-medium">Add a recipe to your plan</p>
        <div className="mt-3 grid gap-3 sm:grid-cols-3">
          <div>
            <Label htmlFor="plan-date" className="text-xs">Date</Label>
            <Input id="plan-date" type="date" value={date} onChange={(e) => setDate(e.target.value)} className="mt-1" />
          </div>
          <div>
            <Label htmlFor="plan-mealtype" className="text-xs">Meal</Label>
            <Select value={mealType} onValueChange={setMealType}>
              <SelectTrigger id="plan-mealtype" className="mt-1"><SelectValue /></SelectTrigger>
              <SelectContent>
                {MEAL_TYPES.map(m => <SelectItem key={m} value={m}>{m}</SelectItem>)}
              </SelectContent>
            </Select>
          </div>
          <div>
            <Label htmlFor="plan-search" className="text-xs">Search recipe</Label>
            <div className="mt-1 flex gap-2">
              <Input id="plan-search" value={recipeQuery} onChange={(e) => setRecipeQuery(e.target.value)} placeholder="e.g. biryani" onKeyDown={(e) => { if (e.key === 'Enter') { e.preventDefault(); search() } }} />
              <Button variant="outline" onClick={search} disabled={searching}>Search</Button>
            </div>
          </div>
        </div>
        {searchResults.length > 0 && (
          <ul className="mt-3 max-h-48 overflow-y-auto thin-scroll rounded-md border border-border">
            {searchResults.map(r => (
              <li key={r.id} className="flex items-center justify-between gap-2 border-b border-border/60 p-2 text-sm last:border-b-0">
                <span>{r.title}</span>
                <Button size="sm" variant="outline" onClick={() => addPlan(r.id, r.slug, r.title)}>
                  <Plus className="mr-1 h-3 w-3" /> Add
                </Button>
              </li>
            ))}
          </ul>
        )}
      </div>

      {sortedDates.length === 0 ? (
        <p className="mt-6 text-sm text-muted-foreground">No meals planned yet. Add a recipe above to get started.</p>
      ) : (
        <div className="mt-6 space-y-4">
          {sortedDates.map(d => (
            <div key={d} className="rounded-md border border-border">
              <div className="border-b border-border bg-muted/40 px-3 py-2">
                <p className="flex items-center gap-2 text-sm font-medium">
                  <Calendar className="h-4 w-4" /> {new Date(d + 'T00:00:00').toLocaleDateString(undefined, { weekday: 'long', year: 'numeric', month: 'long', day: 'numeric' })}
                </p>
              </div>
              <ul className="divide-y divide-border">
                {grouped[d].map(p => (
                  <li key={p.id} className="flex items-center justify-between gap-2 p-3">
                    <div>
                      <p className="text-xs text-muted-foreground">{p.mealType}</p>
                      <Link href={`/recipes/${p.recipe.slug}`} className="text-sm font-medium hover:underline">{p.recipe.title}</Link>
                      <p className="text-xs text-muted-foreground">{p.servings} serving{p.servings === 1 ? '' : 's'}</p>
                    </div>
                    <Button variant="ghost" size="icon" aria-label="Remove" onClick={() => removePlan(p.id)}>
                      <X className="h-4 w-4" />
                    </Button>
                  </li>
                ))}
              </ul>
            </div>
          ))}
        </div>
      )}
    </div>
  )
}
