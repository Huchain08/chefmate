'use client'
import Link from 'next/link'
import { useState, useEffect } from 'react'
import { X } from 'lucide-react'
import { Button } from '@/components/ui/button'
import type { SiteSettings } from '@/lib/site'

export function AnnouncementBar({ settings }: { settings: SiteSettings }) {
  const [hidden, setHidden] = useState(false)
  const [hydrated, setHydrated] = useState(false)

  useEffect(() => {
    setHydrated(true)
    if (typeof window === 'undefined') return
    if (sessionStorage.getItem('chefmate.announcement.dismissed') === '1') {
      setHidden(true)
    }
  }, [])

  if (!hydrated || !settings.announcementBannerActive || !settings.announcementMessage || hidden) return null

  const dismiss = () => {
    sessionStorage.setItem('chefmate.announcement.dismissed', '1')
    setHidden(true)
  }

  return (
    <div role="region" aria-label="Announcement" className="bg-primary text-primary-foreground">
      <div className="mx-auto flex max-w-7xl items-center justify-between gap-4 px-4 py-2 text-sm sm:px-6 lg:px-8">
        <p className="flex-1">{settings.announcementMessage}</p>
        <div className="flex items-center gap-2">
          {settings.announcementCtaText && settings.announcementCtaUrl && (
            <Button asChild size="sm" variant="secondary" className="h-7 px-2 text-xs">
              <Link href={settings.announcementCtaUrl}>{settings.announcementCtaText}</Link>
            </Button>
          )}
          <button type="button" aria-label="Dismiss announcement" onClick={dismiss} className="rounded p-1 hover:bg-primary-foreground/10">
            <X className="h-4 w-4" />
          </button>
        </div>
      </div>
    </div>
  )
}
