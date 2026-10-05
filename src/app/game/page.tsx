import { getSiteSettings } from '@/lib/site'
import { Breadcrumbs } from '@/components/breadcrumbs'
import { FoodSlicerGame } from '@/components/food-slicer-game'
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card'
import { Gamepad2 } from 'lucide-react'
import type { Metadata } from 'next'

export const dynamic = 'force-dynamic'

export async function generateMetadata(): Promise<Metadata> {
  const settings = await getSiteSettings()
  return {
    title: 'Chef Slice game',
    description: `A small in-app arcade game on ${settings.siteName}. Slice falling foods and avoid the bombs.`,
    alternates: { canonical: '/game' },
    robots: { index: true, follow: true },
  }
}

export default async function GamePage() {
  const settings = await getSiteSettings()
  return (
    <div className="mx-auto max-w-3xl px-4 py-8 sm:px-6 lg:px-8">
      <Breadcrumbs items={[
        { label: 'Home', href: '/' },
        { label: 'Game', href: '/game' },
      ]} />

      <header className="mt-4">
        <p className="text-sm text-primary">{settings.siteName} arcade</p>
        <h1 className="mt-1 text-3xl font-bold tracking-tight">Chef Slice</h1>
        <p className="mt-2 text-muted-foreground">
          A small slicing game built into ChefMate. Slice the falling foods. Avoid the bombs.
        </p>
      </header>

      <div className="mt-6">
        <FoodSlicerGame />
      </div>

      <Card className="mt-6">
        <CardHeader>
          <CardTitle className="flex items-center gap-2 text-base">
            <Gamepad2 className="h-5 w-5" /> How to play
          </CardTitle>
        </CardHeader>
        <CardContent className="grid gap-2 text-sm text-muted-foreground">
          <p>Move your cursor or finger across the canvas to slice falling foods.</p>
          <p>Fruits are worth 1 point, vegetables 1 point, sandwiches 2 points, and dishes 3 points.</p>
          <p>Bombs cost you a life. Missing a non-bomb item also costs a life.</p>
          <p>The game ends after 60 seconds or when you run out of lives.</p>
        </CardContent>
      </Card>
    </div>
  )
}
