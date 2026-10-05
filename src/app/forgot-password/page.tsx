import { ForgotPasswordForm } from '@/components/auth-forms'
import { getSiteSettings } from '@/lib/site'
import { Breadcrumbs } from '@/components/breadcrumbs'
import type { Metadata } from 'next'

export const dynamic = 'force-dynamic'

export async function generateMetadata(): Promise<Metadata> {
  const settings = await getSiteSettings()
  return {
    title: 'Reset your password',
    description: `Request a password reset link for your ${settings.siteName} account.`,
    alternates: { canonical: '/forgot-password' },
    robots: { index: false, follow: false },
  }
}

export default async function ForgotPasswordPage() {
  const settings = await getSiteSettings()
  return (
    <div className="mx-auto max-w-md px-4 py-12 sm:px-6 lg:px-8">
      <Breadcrumbs items={[{ label: 'Home', href: '/' }, { label: 'Forgot password', href: '/forgot-password' }]} />
      <header className="mt-6 text-center">
        <h1 className="text-2xl font-bold tracking-tight">Forgot your password?</h1>
        <p className="mt-1 text-sm text-muted-foreground">Enter your email and we will send a reset link if the account exists.</p>
      </header>
      <div className="mt-6">
        <ForgotPasswordForm />
      </div>
    </div>
  )
}
