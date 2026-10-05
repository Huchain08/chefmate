'use client'
import { useEffect, useState } from 'react'
import { useRouter, useSearchParams } from 'next/navigation'
import { Button } from '@/components/ui/button'
import { Star, ShoppingCart, ListChecks } from 'lucide-react'
import { toast } from 'sonner'

interface Props { recipeId: string; slug: string }

export function RecipeActions({ recipeId, slug }: Props) {
  const [favourited, setFavourited] = useState(false)
  const [authed, setAuthed] = useState(false)
  const [busy, setBusy] = useState(false)
  const router = useRouter()
  const searchParams = useSearchParams()

  // Fetch auth status and favourites whenever component mounts or searchParams change (e.g., after login redirect)
  useEffect(() => {
    const checkAuth = async () => {
      try {
        const res = await fetch('/api/me', { credentials: 'same-origin' })
        const user = res.ok ? await res.json() : null
        
        if (user?.id) {
          setAuthed(true)
          // Fetch favourite status
          const favRes = await fetch(`/api/favourites?recipeId=${recipeId}`, { credentials: 'same-origin' })
          const favData = favRes.ok ? await favRes.json() : null
          if (favData?.favourited) setFavourited(true)
        } else {
          setAuthed(false)
          setFavourited(false)
        }
      } catch {
        setAuthed(false)
        setFavourited(false)
      }
    }
    
    checkAuth()
  }, [recipeId, searchParams])

  const toggleFavourite = async () => {
    if (!authed) {
      toast.info('Please sign in to save recipes.')
      router.push('/login?next=' + encodeURIComponent(`/recipes/${slug}`))
      return
    }
    setBusy(true)
    try {
      const csrf = document.cookie.match(/chefmate_csrf=([^;]+)/)?.[1] ?? ''
      const res = await fetch(favourited ? `/api/favourites/${recipeId}` : '/api/favourites', {
        method: favourited ? 'DELETE' : 'POST',
        headers: { 'Content-Type': 'application/json', 'X-CSRF-Token': csrf },
        credentials: 'same-origin',
        body: favourited ? undefined : JSON.stringify({ recipeId }),
      })
      if (res.ok) {
        setFavourited(!favourited)
        toast.success(favourited ? 'Removed from favourites' : 'Saved to favourites')
      } else if (res.status === 429) {
        toast.error('Too many requests. Please slow down.')
      } else {
        toast.error('Could not update favourite.')
      }
    } catch {
      toast.error('Network error.')
    } finally {
      setBusy(false)
    }
  }

  const addMissingToGrocery = async () => {
    setBusy(true)
    try {
      const csrf = document.cookie.match(/chefmate_csrf=([^;]+)/)?.[1] ?? ''
      const res = await fetch(`/api/grocery/from-recipe/${recipeId}`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json', 'X-CSRF-Token': csrf },
        credentials: 'same-origin',
      })
      if (res.ok) {
        const d = await res.json()
        toast.success(`Added ${d.addedCount} missing items to your grocery list.`)
        router.push('/grocery')
      } else if (res.status === 401) {
        toast.info('Please sign in to use the grocery list.')
        router.push('/login?next=' + encodeURIComponent(`/recipes/${slug}`))
      } else if (res.status === 429) {
        toast.error('Too many requests.')
      } else {
        toast.error('Could not build grocery list.')
      }
    } catch {
      toast.error('Network error.')
    } finally {
      setBusy(false)
    }
  }

  return (
    <>
      <Button onClick={toggleFavourite} disabled={busy} variant={favourited ? 'default' : 'outline'}>
        <Star className={`mr-2 h-4 w-4 ${favourited ? 'fill-current' : ''}`} />
        {favourited ? 'Saved' : 'Save recipe'}
      </Button>
      <Button onClick={addMissingToGrocery} disabled={busy} variant="outline">
        <ShoppingCart className="mr-2 h-4 w-4" /> Add missing ingredients
      </Button>
    </>
  )
}
