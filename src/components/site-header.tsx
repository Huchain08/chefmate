'use client'

import Link from 'next/link'
import { usePathname } from 'next/navigation'
import { useState, useEffect } from 'react'
import { Menu } from 'lucide-react'
import { Button } from '@/components/ui/button'
import { Sheet, SheetContent, SheetTrigger, SheetTitle } from '@/components/ui/sheet'
import { cn } from '@/lib/utils'
import type { SiteSettings } from '@/lib/site'
import { ThemeToggle } from '@/components/theme-toggle'

interface NavItem {
  id: string
  label: string
  url: string
  requiresAuth: boolean
}

export function SiteHeader({ settings, navItems }: { settings: SiteSettings; navItems: NavItem[] }) {
  const pathname = usePathname()
  const [mobileOpen, setMobileOpen] = useState(false)
  const [scrolled, setScrolled] = useState(false)

  useEffect(() => {
    const onScroll = () => setScrolled(window.scrollY > 4)
    onScroll()
    window.addEventListener('scroll', onScroll, { passive: true })
    return () => window.removeEventListener('scroll', onScroll)
  }, [])

  useEffect(() => {
    if (pathname) setMobileOpen(false)
  }, [pathname])

  return (
    <header className={cn('sticky top-0 z-40 w-full border-b border-border/70 bg-background/90 backdrop-blur-xl transition-shadow', scrolled && 'shadow-[0_10px_30px_-18px_hsl(var(--foreground)/.35)]')}>
      <a href="#main" className="sr-only focus:not-sr-only focus:absolute focus:left-4 focus:top-4 focus:z-50 focus:rounded-full focus:bg-primary focus:px-4 focus:py-2 focus:text-primary-foreground">Skip to content</a>
      <div className="mx-auto flex h-[4.5rem] max-w-7xl items-center justify-between px-4 sm:px-6 lg:px-8">
        <Link href="/" className="group flex items-center gap-3" aria-label={`${settings.siteName} home`}>
          {settings.logoUrl ? <img src={settings.logoUrl} alt={`${settings.siteName} logo`} className="h-9 w-auto" width={36} height={36} /> : <LogoMark />}
          <span className="font-display text-xl font-black uppercase tracking-[-0.06em]">{settings.siteName}</span>
        </Link>

        <nav aria-label="Main navigation" className="hidden items-center gap-1 md:flex">
          {navItems.map(item => (
            <Link key={item.id} href={item.url} className={cn('rounded-full px-4 py-2 text-xs font-bold uppercase tracking-[0.12em] text-foreground/65 transition-colors hover:bg-muted hover:text-foreground', pathname === item.url && 'bg-foreground text-background hover:bg-foreground hover:text-background')}>
              {item.label}
            </Link>
          ))}
        </nav>

        <div className="flex items-center gap-2">
          <ThemeToggle />
          <Button asChild variant="ghost" size="sm" className="hidden md:inline-flex"><Link href="/recipes">Browse</Link></Button>
          <Button asChild size="sm" className="hidden md:inline-flex rounded-full px-5"><Link href="/scan">Scan fridge</Link></Button>
          <Sheet open={mobileOpen} onOpenChange={setMobileOpen}>
            <SheetTrigger asChild><Button variant="ghost" size="icon" className="md:hidden" aria-label="Open menu" aria-expanded={mobileOpen}><Menu className="h-5 w-5" /></Button></SheetTrigger>
            <SheetContent side="right" className="w-[280px]">
              <SheetTitle className="text-left font-display text-2xl font-black uppercase">{settings.siteName}</SheetTitle>
              <nav aria-label="Mobile navigation" className="mt-6 flex flex-col gap-1">
                {navItems.map(item => <Link key={item.id} href={item.url} className={cn('rounded-xl px-3 py-3 text-sm font-bold uppercase tracking-[0.1em] text-foreground/80 hover:bg-muted', pathname === item.url && 'bg-muted text-foreground')}>{item.label}</Link>)}
                <div className="mt-4 flex flex-col gap-2"><Button asChild variant="outline" size="sm"><Link href="/login">Sign in</Link></Button><Button asChild size="sm"><Link href="/scan">Scan fridge</Link></Button></div>
              </nav>
            </SheetContent>
          </Sheet>
        </div>
      </div>
    </header>
  )
}

function LogoMark() {
  return <span aria-hidden="true" className="inline-flex h-9 w-9 items-center justify-center rounded-full bg-primary text-primary-foreground shadow-[0_5px_0_hsl(var(--foreground)/.15)] transition-transform group-hover:-rotate-6"><svg viewBox="0 0 24 24" width="20" height="20" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><path d="M6 13.87V21h12v-7.13" /><path d="M6 13.87A4 4 0 0 1 7.41 6a5.11 5.11 0 0 1 1.05-1.54C9.95 2.32 12.06 2 12 2c.06.06 2.05.32 3.54 2.46A5.11 5.11 0 0 1 16.59 6 4 4 0 0 1 18 13.87" /></svg></span>
}
