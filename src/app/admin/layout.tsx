import { redirect } from 'next/navigation'
import Link from 'next/link'
import { getCurrentUser, hasPermission } from '@/lib/auth'
import { db } from '@/lib/db'

export const dynamic = 'force-dynamic'

export default async function AdminLayout({ children }: { children: React.ReactNode }) {
  const user = await getCurrentUser()
  if (!user) redirect('/login?next=/admin')
  if (!hasPermission(user, 'admin.view')) redirect('/')

  // Create a CSRF cookie for any admin page that loads forms
  const pendingAuditCount = await db.auditLog.count({ where: { createdAt: { gte: new Date(Date.now() - 24 * 60 * 60 * 1000) } } }).catch(() => 0)

  const links = [
    { href: '/admin', label: 'Dashboard' },
    { href: '/admin/settings', label: 'Site settings' },
    { href: '/admin/business', label: 'Business profile' },
    { href: '/admin/navigation', label: 'Navigation' },
    { href: '/admin/pages', label: 'Pages' },
    { href: '/admin/legal', label: 'Legal documents' },
    { href: '/admin/media', label: 'Media' },
    { href: '/admin/users', label: 'Users' },
    { href: '/admin/audit', label: `Audit log (${pendingAuditCount})` },
    { href: '/admin/contact', label: 'Contact submissions' },
  ]

  return (
    <div className="min-h-screen bg-muted/20">
      <header className="border-b border-border bg-background">
        <div className="mx-auto flex max-w-7xl items-center justify-between px-4 py-3 sm:px-6 lg:px-8">
          <p className="text-sm font-semibold">ChefMate Admin</p>
          <div className="flex items-center gap-3 text-sm">
            <span className="hidden text-muted-foreground sm:inline">{user.email}</span>
            <Link href="/" className="text-muted-foreground hover:text-foreground hover:underline underline-offset-4">View site</Link>
            <form action="/api/auth/logout" method="POST">
              <input type="hidden" name="csrf" value="" />
              <button type="submit" className="text-destructive hover:underline underline-offset-4">Sign out</button>
            </form>
          </div>
        </div>
      </header>
      <div className="mx-auto flex max-w-7xl flex-col gap-6 px-4 py-6 sm:px-6 lg:flex-row lg:px-8">
        <nav aria-label="Admin sections" className="lg:w-56 lg:shrink-0">
          <ul className="flex gap-2 overflow-x-auto lg:flex-col lg:gap-0">
            {links.map(l => (
              <li key={l.href}>
                <Link
                  href={l.href}
                  className="block whitespace-nowrap rounded-md px-3 py-2 text-sm text-foreground/80 hover:bg-muted hover:text-foreground lg:w-full"
                >
                  {l.label}
                </Link>
              </li>
            ))}
          </ul>
        </nav>
        <main className="flex-1">
          {children}
        </main>
      </div>
    </div>
  )
}
