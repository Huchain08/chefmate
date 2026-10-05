import { getSiteSettings, getBusinessProfile, getNavigationItems } from '@/lib/site'
import { env } from '@/lib/env'

export const dynamic = 'force-dynamic'

// llms.txt: machine-readable description for LLMs per instruction.md §10
export async function GET() {
  const [settings, business, nav] = await Promise.all([
    getSiteSettings(),
    getBusinessProfile(),
    getNavigationItems('header'),
  ])

  const base = env.siteUrl.replace(/\/$/, '')
  const lines: string[] = []
  lines.push(`# ${settings.siteName}`)
  lines.push('')
  lines.push(`> ${settings.siteDescription}`)
  lines.push('')
  lines.push('## About')
  lines.push(`${settings.siteName} is a cooking and meal-planning platform that helps you cook with the ingredients you already have at home.`)
  lines.push('')
  if (business?.contactEmail) {
    lines.push(`Contact: ${business.contactEmail}`)
  }
  lines.push(`Primary URL: ${base}`)
  lines.push('')
  lines.push('## Sections')
  for (const item of nav) {
    const url = item.url.startsWith('http') ? item.url : `${base}${item.url}`
    lines.push(`- [${item.label}](${url})`)
  }
  lines.push('')
  lines.push('## Content policy')
  lines.push('- The database is the source of truth for all public content.')
  lines.push('- Reviews, testimonials, ratings, and metrics are never invented.')
  lines.push('- Legal documents are only shown when published by the site owner.')
  lines.push('')
  lines.push('## Allowed')
  lines.push('Reading public pages and recipes is permitted. Crawling the sitemap is permitted.')
  lines.push('')
  lines.push('## Disallowed')
  lines.push('Admin routes, authentication routes, API mutation routes, and user-specific routes are not public content and should not be indexed.')

  return new Response(lines.join('\n'), {
    headers: { 'Content-Type': 'text/plain; charset=utf-8', 'Cache-Control': 'public, max-age=3600' },
  })
}
