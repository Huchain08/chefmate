import { LoginForm } from '@/components/auth-forms'
import { getSiteSettings } from '@/lib/site'
import { Breadcrumbs } from '@/components/breadcrumbs'
import type { Metadata } from 'next'

export const dynamic = 'force-dynamic'

export async function generateMetadata(): Promise<Metadata> {
  const settings = await getSiteSettings()
  return {
    title: 'Sign in',
    description: `Sign in to your ${settings.siteName} account.`,
    alternates: { canonical: '/login' },
    robots: { index: false, follow: false },
  }
}

export default async function LoginPage({ searchParams }: { searchParams: Promise<{ next?: string }> }) {
  const { next } = await searchParams
  const settings = await getSiteSettings()
  return (
    <div className="mx-auto max-w-md px-4 py-12 sm:px-6 lg:px-8">
      <Breadcrumbs items={[{ label: 'Home', href: '/' }, { label: 'Sign in', href: '/login' }]} />
      <header className="mt-6 text-center">
        <h1 className="text-2xl font-bold tracking-tight">Sign in to {settings.siteName}</h1>
        <p className="mt-1 text-sm text-muted-foreground">Access your favourites, meal plan, and grocery list.</p>
      </header>
      <div className="mt-6">
        <LoginForm next={next || '/scan'} />
      </div>
    </div>
  )
}
