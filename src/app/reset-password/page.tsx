import { ResetPasswordForm } from '@/components/auth-forms'
import { Breadcrumbs } from '@/components/breadcrumbs'
import type { Metadata } from 'next'

export const dynamic = 'force-dynamic'

export async function generateMetadata(): Promise<Metadata> {
  return {
    title: 'Set a new password',
    description: 'Set a new password for your ChefMate account.',
    robots: { index: false, follow: false },
  }
}

export default async function ResetPasswordPage({ searchParams }: { searchParams: Promise<{ token?: string }> }) {
  const { token } = await searchParams
  return (
    <div className="mx-auto max-w-md px-4 py-12 sm:px-6 lg:px-8">
      <Breadcrumbs items={[{ label: 'Home', href: '/' }, { label: 'Reset password', href: '/reset-password' }]} />
      <header className="mt-6 text-center">
        <h1 className="text-2xl font-bold tracking-tight">Set a new password</h1>
        <p className="mt-1 text-sm text-muted-foreground">Choose a new password for your account.</p>
      </header>
      <div className="mt-6">
        <ResetPasswordForm token={token || ''} />
      </div>
    </div>
  )
}
