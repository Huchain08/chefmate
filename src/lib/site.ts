import { db } from '@/lib/db'
import { unstable_cache } from 'next/cache'

// Database-driven site settings per instruction.md §2.1
// All public-facing text comes from here, never hardcoded in components.

export interface SiteSettings {
  siteName: string
  siteDescription: string
  primaryDomain: string
  logoUrl: string | null
  faviconUrl: string | null
  primaryColor: string
  accentColor: string
  copyrightHolder: string | null
  contactEmail: string | null
  phoneNumber: string | null
  announcementBannerActive: boolean
  announcementMessage: string | null
  announcementCtaText: string | null
  announcementCtaUrl: string | null
  customDomain: string | null
}

const DEFAULTS: SiteSettings = {
  siteName: 'ChefMate',
  siteDescription:
    'ChefMate helps you cook with the ingredients you already have. Discover recipes, follow step-by-step instructions, and plan meals with what is in your kitchen.',
  primaryDomain: 'localhost:3000',
  logoUrl: null,
  faviconUrl: null,
  primaryColor: '#0f766e',
  accentColor: '#ea580c',
  copyrightHolder: null,
  contactEmail: null,
  phoneNumber: null,
  announcementBannerActive: false,
  announcementMessage: null,
  announcementCtaText: null,
  announcementCtaUrl: null,
  customDomain: null,
}

async function loadSettingsUncached(): Promise<SiteSettings> {
  try {
    const rows = await db.siteSetting.findMany()
    const map: Record<string, string> = {}
    for (const row of rows) map[row.key] = row.value

    const business = await db.businessProfile.findFirst()
    const banner = await db.announcementBanner.findFirst({
      where: { active: true, OR: [{ startAt: null }, { startAt: { lte: new Date() } }], AND: [{ OR: [{ endAt: null }, { endAt: { gte: new Date() } }] }] },
      orderBy: { sortOrder: 'asc' },
    })

    return {
      siteName: map.siteName ?? DEFAULTS.siteName,
      siteDescription: map.siteDescription ?? DEFAULTS.siteDescription,
      primaryDomain: map.primaryDomain ?? DEFAULTS.primaryDomain,
      logoUrl: business?.logoUrl ?? map.logoUrl ?? null,
      faviconUrl: business?.faviconUrl ?? map.faviconUrl ?? null,
      primaryColor: map.primaryColor ?? DEFAULTS.primaryColor,
      accentColor: map.accentColor ?? DEFAULTS.accentColor,
      copyrightHolder: business?.copyrightHolder ?? null,
      contactEmail: business?.contactEmail ?? null,
      phoneNumber: business?.phoneNumber ?? null,
      announcementBannerActive: Boolean(banner),
      announcementMessage: banner?.message ?? null,
      announcementCtaText: banner?.ctaText ?? null,
      announcementCtaUrl: banner?.ctaUrl ?? null,
      customDomain: business?.primaryDomain ?? null,
    }
  } catch {
    // If the database is not ready (build time, first deploy), fall back to defaults.
    return DEFAULTS
  }
}

export const getSiteSettings = unstable_cache(loadSettingsUncached, ['site-settings'], { revalidate: 60, tags: ['site-settings'] })

export async function getNavigationItems(location: 'header' | 'footer' | 'mobile' = 'header') {
  try {
    return await db.navigationItem.findMany({
      where: { location },
      orderBy: { sortOrder: 'asc' },
    })
  } catch {
    return []
  }
}

export async function getFooterLinks() {
  try {
    return await db.footerLink.findMany({
      orderBy: { sortOrder: 'asc' },
    })
  } catch {
    return []
  }
}

export async function getBusinessProfile() {
  try {
    return await db.businessProfile.findFirst()
  } catch {
    return null
  }
}

export async function getLegalDocument(type: 'terms' | 'privacy') {
  try {
    return await db.legalDocument.findUnique({ where: { type } })
  } catch {
    return null
  }
}
