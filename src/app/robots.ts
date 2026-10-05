import { env } from '@/lib/env'
import type { MetadataRoute } from 'next'

export default function robots(): MetadataRoute.Robots {
  const base = env.siteUrl.replace(/\/$/, '')
  return {
    rules: [
      { userAgent: '*', allow: '/', disallow: ['/admin', '/api', '/login', '/register', '/forgot-password', '/reset-password', '/meal-plan', '/grocery', '/scan'] },
    ],
    sitemap: `${base}/sitemap.xml`,
    host: base,
  }
}
