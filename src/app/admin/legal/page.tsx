import { redirect } from 'next/navigation'
import Link from 'next/link'
import { getCurrentUser, hasPermission, getCsrfToken } from '@/lib/auth'
import { db } from '@/lib/db'
import { LegalEditor } from '@/components/admin/legal-editor'

export const dynamic = 'force-dynamic'

export default async function LegalPage() {
  const user = await getCurrentUser()
  if (!user) redirect('/login?next=/admin/legal')
  if (!hasPermission(user, 'legal.edit')) redirect('/admin')

  const [termsDoc, privacyDoc] = await Promise.all([
    db.legalDocument.findUnique({ where: { type: 'terms' } }),
    db.legalDocument.findUnique({ where: { type: 'privacy' } }),
  ])
  const csrf = await getCsrfToken()

  return (
    <div>
      <header className="mb-6">
        <h1 className="text-2xl font-bold tracking-tight">Legal documents</h1>
        <p className="mt-1 text-sm text-muted-foreground">
          Edit your Terms and Conditions and Privacy Policy. Documents stay in draft mode until you publish them.
          Do not publish placeholder or template text. Only publish owner-approved legal content.
        </p>
      </header>
      <div className="grid gap-6 lg:grid-cols-2">
        <LegalEditor
          type="terms"
          title="Terms and Conditions"
          doc={termsDoc ? { body: termsDoc.body, status: termsDoc.status, updatedAt: termsDoc.updatedAt.toISOString(), publishedAt: termsDoc.publishedAt?.toISOString() ?? null } : null}
          csrf={csrf}
        />
        <LegalEditor
          type="privacy"
          title="Privacy Policy"
          doc={privacyDoc ? { body: privacyDoc.body, status: privacyDoc.status, updatedAt: privacyDoc.updatedAt.toISOString(), publishedAt: privacyDoc.publishedAt?.toISOString() ?? null } : null}
          csrf={csrf}
        />
      </div>
      <div className="mt-6">
        <Link href="/admin" className="text-sm text-muted-foreground hover:text-foreground hover:underline underline-offset-4">&larr; Back to dashboard</Link>
      </div>
    </div>
  )
}
