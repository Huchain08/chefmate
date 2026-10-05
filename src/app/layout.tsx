import type { Metadata, Viewport } from 'next'
import './globals.css'
import { Toaster } from '@/components/ui/toaster'
import { Toaster as Sonner } from '@/components/ui/sonner'
import { ThemeProvider } from '@/components/theme-provider'
import { SiteHeader } from '@/components/site-header'
import { SiteFooter } from '@/components/site-footer'
import { AnnouncementBar } from '@/components/announcement-bar'
import { ScrollProgress } from '@/components/scroll-progress'
import { getSiteSettings, getBusinessProfile, getNavigationItems, getFooterLinks } from '@/lib/site'
import { env } from '@/lib/env'

export const dynamic = 'force-dynamic'

export async function generateMetadata(): Promise<Metadata> {
  const settings = await getSiteSettings()
  const business = await getBusinessProfile()
  const title = settings.siteName
  const description = settings.siteDescription
  const canonical = `${env.siteUrl.replace(/\/$/, '')}/`

  return {
    title: {
      default: `${title} — Cook with what you have`,
      template: `%s — ${title}`,
    },
    description,
    metadataBase: new URL(env.siteUrl),
    alternates: { canonical },
    applicationName: title,
    authors: business?.copyrightHolder ? [{ name: business.copyrightHolder }] : [],
    creator: business?.copyrightHolder ?? title,
    publisher: title,
    keywords: ['recipes', 'indian recipes', 'meal planning', 'cooking timer', 'ingredient-based cooking', 'chefmate'],
    robots: {
      index: true,
      follow: true,
      googleBot: { index: true, follow: true, 'max-image-preview': 'large', 'max-snippet': -1, 'max-video-preview': -1 },
    },
    icons: {
      icon: [
        { url: '/favicon.svg', type: 'image/svg+xml' },
        { url: settings.faviconUrl ?? '/favicon.svg', sizes: 'any' },
      ],
      apple: settings.faviconUrl ?? '/favicon.svg',
    },
    manifest: '/manifest.webmanifest',
    openGraph: {
      type: 'website',
      siteName: title,
      title: `${title} — Cook with what you have`,
      description,
      url: canonical,
      images: settings.logoUrl ? [{ url: settings.logoUrl, width: 1200, height: 630, alt: title }] : [],
    },
    twitter: {
      card: 'summary_large_image',
      title: `${title} — Cook with what you have`,
      description,
      images: settings.logoUrl ? [settings.logoUrl] : [],
    },
    verification: undefined,
    category: 'food',
  }
}

export const viewport: Viewport = {
  themeColor: [
    { media: '(prefers-color-scheme: light)', color: '#ffffff' },
    { media: '(prefers-color-scheme: dark)', color: '#0a0a0a' },
  ],
  width: 'device-width',
  initialScale: 1,
}

export default async function RootLayout({ children }: Readonly<{ children: React.ReactNode }>) {
  const [settings, business, navItems, footerLinks] = await Promise.all([
    getSiteSettings(),
    getBusinessProfile(),
    getNavigationItems('header'),
    getFooterLinks(),
  ])

  const jsonLd = {
    '@context': 'https://schema.org',
    '@type': business?.streetAddress ? 'LocalBusiness' : 'WebApplication',
    name: settings.siteName,
    description: settings.siteDescription,
    url: env.siteUrl,
    ...(business?.contactEmail && { email: business.contactEmail }),
    ...(business?.phoneNumber && { telephone: business.phoneNumber }),
    ...(business?.streetAddress && {
      address: {
        '@type': 'PostalAddress',
        streetAddress: business.streetAddress,
        addressLocality: business.locality,
        addressRegion: business.region,
        postalCode: business.postalCode,
        addressCountry: business.country,
      },
      ...(business.latitude && business.longitude && {
        geo: { '@type': 'GeoCoordinates', latitude: business.latitude, longitude: business.longitude },
      }),
      ...(business.openingHours && { openingHours: business.openingHours }),
    }),
    applicationCategory: 'FoodApplication',
    operatingSystem: 'Web',
  }

  return (
    <html lang="en" suppressHydrationWarning>
      <head>
        <link rel="preconnect" href="https://fonts.googleapis.com" />
        <link rel="preconnect" href="https://fonts.gstatic.com" crossOrigin="anonymous" />
        <script
          type="application/ld+json"
          dangerouslySetInnerHTML={{ __html: JSON.stringify(jsonLd) }}
        />
      </head>
      <body className="min-h-screen flex flex-col bg-background text-foreground antialiased">
        <ThemeProvider attribute="class" defaultTheme="light" enableSystem={false}>
          <ScrollProgress />
          <AnnouncementBar settings={settings} />
          <SiteHeader settings={settings} navItems={navItems} />
          <main id="main" className="flex-1 w-full">{children}</main>
          <SiteFooter settings={settings} business={business} footerLinks={footerLinks} />
          <Toaster />
          <Sonner />
        </ThemeProvider>
      </body>
    </html>
  )
}
