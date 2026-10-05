import Link from 'next/link'
import { getSiteSettings, getBusinessProfile } from '@/lib/site'
import { Breadcrumbs } from '@/components/breadcrumbs'
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card'
import { Mail } from 'lucide-react'
import { ContactForm } from '@/components/contact-form'
import type { Metadata } from 'next'

export const dynamic = 'force-dynamic'

export async function generateMetadata(): Promise<Metadata> {
  const settings = await getSiteSettings()
  return {
    title: 'Contact',
    description: `Get in touch with the ${settings.siteName} team.`,
    alternates: { canonical: '/contact' },
  }
}

export default async function ContactPage() {
  const [settings, business] = await Promise.all([getSiteSettings(), getBusinessProfile()])

  return (
    <div className="mx-auto max-w-3xl px-4 py-8 sm:px-6 lg:px-8">
      <Breadcrumbs items={[
        { label: 'Home', href: '/' },
        { label: 'Contact', href: '/contact' },
      ]} />

      <header className="mt-4">
        <p className="text-sm text-primary">{settings.siteName}</p>
        <h1 className="mt-1 text-3xl font-bold tracking-tight">Contact</h1>
        <p className="mt-2 text-muted-foreground">Send us a message and we will respond by email.</p>
      </header>

      <div className="mt-6 grid gap-6 lg:grid-cols-3">
        <Card className="lg:col-span-2">
          <CardHeader>
            <CardTitle className="text-base">Send a message</CardTitle>
          </CardHeader>
          <CardContent>
            <ContactForm csrf={''} />
          </CardContent>
        </Card>

        <Card>
          <CardHeader>
            <CardTitle className="text-base">Direct contact</CardTitle>
          </CardHeader>
          <CardContent className="text-sm">
            {business?.contactEmail || settings.contactEmail ? (
              <a href={`mailto:${business?.contactEmail || settings.contactEmail}`} className="flex items-center gap-2 text-primary hover:underline underline-offset-4">
                <Mail className="h-4 w-4" /> {business?.contactEmail || settings.contactEmail}
              </a>
            ) : (
              <a href="mailto:huchainy2@gmail.com" className="flex items-center gap-2 text-primary hover:underline underline-offset-4">
                <Mail className="h-4 w-4" /> huchainy2@gmail.com
              </a>
            )}
            {business?.phoneNumber && <p className="mt-3 text-muted-foreground">{business.phoneNumber}</p>}
          </CardContent>
        </Card>
      </div>

      <div className="mt-6">
        <Link href="/" className="text-sm text-muted-foreground hover:text-foreground hover:underline underline-offset-4">&larr; Back to home</Link>
      </div>
    </div>
  )
}
