import { getLegalDocument, getSiteSettings } from '@/lib/site'
import { Breadcrumbs } from '@/components/breadcrumbs'
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card'
import { AlertCircle } from 'lucide-react'
import DOMPurify from 'isomorphic-dompurify'
import type { Metadata } from 'next'

export const dynamic = 'force-dynamic'

export async function generateMetadata(): Promise<Metadata> {
  const settings = await getSiteSettings()
  return {
    title: 'Privacy Policy',
    description: `Privacy Policy for the ${settings.siteName} service.`,
    alternates: { canonical: '/privacy' },
  }
}

export default async function PrivacyPage() {
  const [doc, settings] = await Promise.all([getLegalDocument('privacy'), getSiteSettings()])

  return (
    <div className="mx-auto max-w-3xl px-4 py-8 sm:px-6 lg:px-8">
      <Breadcrumbs items={[
        { label: 'Home', href: '/' },
        { label: 'Privacy', href: '/privacy' },
      ]} />
      <header className="mt-4">
        <h1 className="text-3xl font-bold tracking-tight">Privacy Policy</h1>
      </header>

      {!doc || doc.status !== 'published' ? (
        <Card className="mt-6 border-amber-200 bg-amber-50">
          <CardHeader>
            <CardTitle className="flex items-center gap-2 text-base">
              <AlertCircle className="h-5 w-5 text-amber-600" /> Privacy Policy is not published yet
            </CardTitle>
          </CardHeader>
          <CardContent className="text-sm text-amber-800">
            <p>
              The owner of this site has not yet published approved legal text for this Privacy Policy.
              This page will display the official policy once it is added by the site owner.
            </p>
            <p className="mt-2">
              For questions in the meantime, contact <a href={`mailto:${settings.contactEmail || 'huchainy2@gmail.com'}`} className="underline underline-offset-4 hover:text-foreground">{settings.contactEmail || 'huchainy2@gmail.com'}</a>.
            </p>
          </CardContent>
        </Card>
      ) : (
        <div className="mt-6 prose prose-sm max-w-none">
          <p className="text-sm text-muted-foreground">Last updated: {new Date(doc.publishedAt ?? doc.updatedAt).toLocaleDateString()}</p>
          <div dangerouslySetInnerHTML={{ __html: DOMPurify.sanitize(doc.body, { ALLOWED_TAGS: ['h1', 'h2', 'h3', 'h4', 'p', 'ul', 'ol', 'li', 'a', 'strong', 'em', 'br', 'blockquote', 'code', 'pre'], ALLOWED_ATTR: ['href', 'target', 'rel'] }) }} />
        </div>
      )}
    </div>
  )
}
