import { getSiteSettings } from '@/lib/site'
import { env } from '@/lib/env'
import type { MetadataRoute } from 'next'

export const dynamic = 'force-dynamic'

export default async function manifest(): Promise<MetadataRoute.Manifest> {
  const settings = await getSiteSettings()
  return {
    name: settings.siteName,
    short_name: settings.siteName,
    description: settings.siteDescription,
    start_url: '/',
    display: 'standalone',
    background_color: '#ffffff',
    theme_color: settings.primaryColor,
    icons: settings.faviconUrl ? [{ src: settings.faviconUrl, sizes: '192x192', type: 'image/png' }, { src: settings.faviconUrl, sizes: '512x512', type: 'image/png' }] : [{ src: '/favicon.svg', sizes: 'any', type: 'image/svg+xml' }],
    categories: ['food', 'lifestyle', 'productivity'],
  }
}
