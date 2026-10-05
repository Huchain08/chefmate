import { RegisterForm } from '@/components/auth-forms'
import { getSiteSettings } from '@/lib/site'
import { Breadcrumbs } from '@/components/breadcrumbs'
import type { Metadata } from 'next'

export const dynamic = 'force-dynamic'

export async function generateMetadata(): Promise<Metadata> {
  const settings = await getSiteSettings()
  return {
    title: 'Create account',
    description: `Create a ${settings.siteName} account.`,
    alternates: { canonical: '/register' },
    robots: { index: false, follow: false },
  }
}

export default async function RegisterPage({ searchParams }: { searchParams: Promise<{ next?: string }> }) {
  const { next } = await searchParams
  const settings = await getSiteSettings()
  return (
    <div className="mx-auto max-w-md px-4 py-12 sm:px-6 lg:px-8">
      <Breadcrumbs items={[{ label: 'Home', href: '/' }, { label: 'Create account', href: '/register' }]} />
      <header className="mt-6 text-center">
        <h1 className="text-2xl font-bold tracking-tight">Create your {settings.siteName} account</h1>
        <p className="mt-1 text-sm text-muted-foreground">Save recipes, plan meals, and track your kitchen inventory.</p>
      </header>
      <div className="mt-6">
        <RegisterForm next={next || '/scan'} />
      </div>
    </div>
  )
}
