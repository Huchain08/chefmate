import Link from 'next/link'
import type { SiteSettings } from '@/lib/site'

type BusinessProfile = { contactEmail: string | null }

interface FooterLinkRow {
  id: string
  label: string
  url: string
  section: string
}

export function SiteFooter({
  settings,
  business,
  footerLinks,
}: {
  settings: SiteSettings
  business: BusinessProfile | null
  footerLinks: FooterLinkRow[]
}) {
  const year = new Date().getFullYear()
  const holder = settings.copyrightHolder || settings.siteName

  // Group footer links by section
  const grouped: Record<string, FooterLinkRow[]> = {}
  for (const link of footerLinks) {
    if (!grouped[link.section]) grouped[link.section] = []
    grouped[link.section].push(link)
  }

  return (
    <footer className="mt-auto border-t border-border bg-muted/30">
      <div className="mx-auto max-w-7xl px-4 py-10 sm:px-6 lg:px-8">
        <div className="grid grid-cols-2 gap-8 md:grid-cols-4">
          <div className="col-span-2 md:col-span-1">
            <p className="text-sm font-semibold text-foreground">{settings.siteName}</p>
            <p className="mt-2 text-sm text-muted-foreground max-w-xs">{settings.siteDescription}</p>
            {business?.contactEmail && (
              <a href={`mailto:${business.contactEmail}`} className="mt-3 inline-block text-sm text-foreground underline underline-offset-4 hover:text-primary">
                {business.contactEmail}
              </a>
            )}
          </div>
          {Object.entries(grouped).map(([section, items]) => (
            <div key={section}>
              <p className="text-sm font-semibold text-foreground capitalize">{section}</p>
              <ul className="mt-2 space-y-2">
                {items.map(l => (
                  <li key={l.id}>
                    <Link href={l.url} className="text-sm text-muted-foreground hover:text-foreground hover:underline underline-offset-4">
                      {l.label}
                    </Link>
                  </li>
                ))}
              </ul>
            </div>
          ))}
        </div>

        <div className="mt-10 flex flex-col items-start justify-between gap-2 border-t border-border pt-6 sm:flex-row sm:items-center">
          <p className="text-xs text-muted-foreground">
            &copy; {year} {holder}. All rights reserved.
          </p>
          <div className="flex gap-4">
            <Link href="/terms" className="text-xs text-muted-foreground hover:text-foreground hover:underline underline-offset-4">Terms</Link>
            <Link href="/privacy" className="text-xs text-muted-foreground hover:text-foreground hover:underline underline-offset-4">Privacy</Link>
            <Link href="/sitemap.xml" className="text-xs text-muted-foreground hover:text-foreground hover:underline underline-offset-4">Sitemap</Link>
          </div>
        </div>
      </div>
    </footer>
  )
}
