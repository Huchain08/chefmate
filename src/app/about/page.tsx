import Link from 'next/link'
import { getSiteSettings, getBusinessProfile } from '@/lib/site'
import { Breadcrumbs } from '@/components/breadcrumbs'
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card'
import type { Metadata } from 'next'

export const dynamic = 'force-dynamic'

export async function generateMetadata(): Promise<Metadata> {
  const settings = await getSiteSettings()
  return {
    title: 'About',
    description: `About ${settings.siteName} and how it helps you cook with the ingredients you already have.`,
    alternates: { canonical: '/about' },
  }
}

export default async function AboutPage() {
  const [settings, business] = await Promise.all([getSiteSettings(), getBusinessProfile()])

  return (
    <div className="mx-auto max-w-3xl px-4 py-8 sm:px-6 lg:px-8">
      <Breadcrumbs items={[
        { label: 'Home', href: '/' },
        { label: 'About', href: '/about' },
      ]} />

      <header className="mt-4">
        <p className="text-sm text-primary">{settings.siteName}</p>
        <h1 className="mt-1 text-3xl font-bold tracking-tight">About ChefMate</h1>
      </header>

      <div className="mt-6 space-y-4 text-foreground">
        <p>{settings.siteDescription}</p>
        <p>
          ChefMate follows an ingredient-first approach. Instead of choosing a recipe first and then buying every ingredient, you start with what is already available at home. ChefMate identifies the ingredients, recommends recipes that fit, lists what is missing, and helps you cook step-by-step.
        </p>
        <p>
          This is the starting stage of ChefMate. The grocery delivery integration is not yet connected. If you operate a grocery or quick-commerce service and would like to integrate, please reach out at <a className="text-primary underline underline-offset-4 hover:text-foreground" href={`mailto:${settings.contactEmail || 'huchainy2@gmail.com'}`}>{settings.contactEmail || 'huchainy2@gmail.com'}</a>.
        </p>
      </div>

      {business && (business.streetAddress || business.contactEmail || business.phoneNumber) && (
        <Card className="mt-8">
          <CardHeader>
            <CardTitle className="text-base">Contact</CardTitle>
          </CardHeader>
          <CardContent className="text-sm">
            {business.contactEmail && <p>Email: <a className="underline underline-offset-4 hover:text-primary" href={`mailto:${business.contactEmail}`}>{business.contactEmail}</a></p>}
            {business.phoneNumber && <p>Phone: {business.phoneNumber}</p>}
            {business.streetAddress && (
              <address className="mt-2 not-italic text-muted-foreground">
                {business.streetAddress}<br />
                {business.locality}, {business.region} {business.postalCode}<br />
                {business.country}
              </address>
            )}
          </CardContent>
        </Card>
      )}

      <div className="mt-8">
        <Link href="/contact" className="text-sm text-muted-foreground hover:text-foreground hover:underline underline-offset-4">Get in touch &rarr;</Link>
      </div>
    </div>
  )
}
