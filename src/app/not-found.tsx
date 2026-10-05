import Link from 'next/link'
import { Button } from '@/components/ui/button'
import { getSiteSettings, getNavigationItems } from '@/lib/site'
import { Home, Search } from 'lucide-react'

export default async function NotFound() {
  const [settings, nav] = await Promise.all([getSiteSettings(), getNavigationItems('header')])
  return (
    <div className="mx-auto flex min-h-[60vh] max-w-3xl flex-col items-center justify-center gap-6 px-4 py-16 text-center">
      <p className="text-7xl font-bold text-primary">404</p>
      <h1 className="text-2xl font-semibold tracking-tight">Page not found</h1>
      <p className="max-w-md text-muted-foreground">
        The page you are looking for may have moved, been removed, or never existed. Try one of the links below to get back on track.
      </p>
      <div className="flex flex-wrap items-center justify-center gap-3">
        <Button asChild>
          <Link href="/"><Home className="mr-2 h-4 w-4" /> Home</Link>
        </Button>
        <Button asChild variant="outline">
          <Link href="/recipes"><Search className="mr-2 h-4 w-4" /> Browse recipes</Link>
        </Button>
      </div>
      <nav aria-label="Site sections" className="mt-6 flex flex-wrap items-center justify-center gap-x-4 gap-y-2 text-sm">
        {nav.map(item => (
          <Link key={item.id} href={item.url} className="text-muted-foreground hover:text-foreground hover:underline underline-offset-4">
            {item.label}
          </Link>
        ))}
      </nav>
    </div>
  )
}
