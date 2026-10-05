import { redirect } from 'next/navigation'
import Link from 'next/link'
import { getCurrentUser, hasPermission } from '@/lib/auth'
import { db } from '@/lib/db'
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card'
import { Button } from '@/components/ui/button'
import { Badge } from '@/components/ui/badge'
import { ShieldCheck, FileText, Image, Users, Settings, Scale, ListTree, AlertTriangle } from 'lucide-react'
import { getSiteSettings } from '@/lib/site'

export const dynamic = 'force-dynamic'

export default async function AdminDashboard() {
  const user = await getCurrentUser()
  if (!user) redirect('/login?next=/admin')
  if (!hasPermission(user, 'admin.view')) redirect('/')

  const [pageCount, recipeCount, mediaCount, userCount, auditCount, termsDoc, privacyDoc, contactCount] = await Promise.all([
    db.page.count(),
    db.recipe.count(),
    db.mediaAsset.count(),
    db.user.count(),
    db.auditLog.count({ where: { createdAt: { gte: new Date(Date.now() - 24 * 60 * 60 * 1000) } } }),
    db.legalDocument.findUnique({ where: { type: 'terms' } }),
    db.legalDocument.findUnique({ where: { type: 'privacy' } }),
    db.contactSubmission.count({ where: { handled: false } }),
  ])

  const settings = await getSiteSettings()
  const setupTasks: { label: string; done: boolean; href?: string }[] = [
    { label: 'Set site name and description', done: true, href: '/admin/settings' },
    { label: 'Add a primary custom domain', done: Boolean(settings.customDomain), href: '/admin/business' },
    { label: 'Add contact email', done: Boolean(settings.contactEmail), href: '/admin/business' },
    { label: 'Add phone number', done: Boolean(settings.phoneNumber), href: '/admin/business' },
    { label: 'Upload logo', done: Boolean(settings.logoUrl), href: '/admin/media' },
    { label: 'Upload favicon', done: Boolean(settings.faviconUrl), href: '/admin/media' },
    { label: 'Publish Terms and Conditions', done: termsDoc?.status === 'published', href: '/admin/legal/terms' },
    { label: 'Publish Privacy Policy', done: privacyDoc?.status === 'published', href: '/admin/legal/privacy' },
  ]

  return (
    <div className="mx-auto max-w-6xl px-4 py-8 sm:px-6 lg:px-8">
      <header className="mb-6">
        <p className="flex items-center gap-2 text-sm text-primary">
          <ShieldCheck className="h-4 w-4" /> Admin
        </p>
        <h1 className="mt-1 text-2xl font-bold tracking-tight">Dashboard</h1>
        <p className="mt-1 text-sm text-muted-foreground">
          Signed in as {user.email}. Role: {user.roles.join(', ')}.
        </p>
      </header>

      <section className="mb-8">
        <h2 className="text-base font-semibold">Setup tasks</h2>
        <p className="text-sm text-muted-foreground">Owner actions required before this site is fully production-ready.</p>
        <Card className="mt-3">
          <CardContent className="p-0">
            <ul className="divide-y divide-border">
              {setupTasks.map(t => (
                <li key={t.label} className="flex items-center justify-between gap-2 p-3">
                  <span className="flex items-center gap-2 text-sm">
                    {t.done ? (
                      <Badge variant="secondary" className="bg-green-100 text-green-800">Done</Badge>
                    ) : (
                      <Badge variant="secondary" className="bg-amber-100 text-amber-800"><AlertTriangle className="mr-1 h-3 w-3" /> Pending</Badge>
                    )}
                    {t.label}
                  </span>
                  {t.href && !t.done && (
                    <Button asChild size="sm" variant="outline">
                      <Link href={t.href}>Edit</Link>
                    </Button>
                  )}
                </li>
              ))}
            </ul>
          </CardContent>
        </Card>
      </section>

      <section>
        <h2 className="text-base font-semibold">Quick links</h2>
        <div className="mt-3 grid gap-4 sm:grid-cols-2 lg:grid-cols-3">
          <AdminLink icon={Settings} title="Site settings" desc="Site name, description, theme colors" href="/admin/settings" />
          <AdminLink icon={Scale} title="Business profile" desc="Name, contact, address, hours" href="/admin/business" />
          <AdminLink icon={ListTree} title="Navigation" desc="Header and footer links" href="/admin/navigation" />
          <AdminLink icon={FileText} title="Pages" desc="Database-driven pages" href="/admin/pages" />
          <AdminLink icon={Scale} title="Legal documents" desc="Terms and Privacy" href="/admin/legal" />
          <AdminLink icon={Image} title="Media library" desc="Upload and manage images" href="/admin/media" />
          <AdminLink icon={Users} title="Users" desc="Manage users and roles" href="/admin/users" />
          <AdminLink icon={FileText} title="Audit log" desc={`${auditCount} events in the last 24h`} href="/admin/audit" />
          <AdminLink icon={FileText} title="Contact submissions" desc={`${contactCount} unhandled messages`} href="/admin/contact" />
        </div>
      </section>

      <section className="mt-8">
        <h2 className="text-base font-semibold">Counts</h2>
        <div className="mt-3 grid grid-cols-2 gap-4 sm:grid-cols-4">
          <CountCard label="Pages" value={pageCount} />
          <CountCard label="Recipes" value={recipeCount} />
          <CountCard label="Media" value={mediaCount} />
          <CountCard label="Users" value={userCount} />
        </div>
      </section>
    </div>
  )
}

function AdminLink({ icon: Icon, title, desc, href }: { icon: React.ComponentType<{ className?: string }>; title: string; desc: string; href: string }) {
  return (
    <Link href={href}>
      <Card className="card-hover">
        <CardContent className="flex items-start gap-3 p-4">
          <span className="inline-flex h-9 w-9 items-center justify-center rounded-md bg-primary/10 text-primary">
            <Icon className="h-5 w-5" />
          </span>
          <div>
            <p className="text-sm font-medium">{title}</p>
            <p className="text-xs text-muted-foreground">{desc}</p>
          </div>
        </CardContent>
      </Card>
    </Link>
  )
}

function CountCard({ label, value }: { label: string; value: number }) {
  return (
    <Card>
      <CardContent className="p-4">
        <p className="text-xs text-muted-foreground">{label}</p>
        <p className="mt-1 text-2xl font-semibold">{value.toLocaleString()}</p>
      </CardContent>
    </Card>
  )
}
