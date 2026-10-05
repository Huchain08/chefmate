import { redirect } from 'next/navigation'
import Link from 'next/link'
import { getCurrentUser, hasPermission } from '@/lib/auth'
import { db } from '@/lib/db'
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card'
import { Badge } from '@/components/ui/badge'
import { Button } from '@/components/ui/button'

export const dynamic = 'force-dynamic'

export default async function AdminPagesPage() {
  const user = await getCurrentUser()
  if (!user) redirect('/login?next=/admin/pages')
  if (!hasPermission(user, 'pages.view')) redirect('/admin')

  const pages = await db.page.findMany({ orderBy: { updatedAt: 'desc' }, select: { id: true, slug: true, title: true, status: true, updatedAt: true } })

  return (
    <div>
      <header className="mb-6 flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-bold tracking-tight">Pages</h1>
          <p className="mt-1 text-sm text-muted-foreground">Database-driven pages. Drafts are not visible to the public.</p>
        </div>
      </header>
      <Card>
        <CardHeader>
          <CardTitle className="text-base">{pages.length} page(s)</CardTitle>
        </CardHeader>
        <CardContent className="p-0">
          <ul className="divide-y divide-border">
            {pages.map(p => (
              <li key={p.id} className="flex items-center justify-between gap-2 p-3">
                <div>
                  <p className="text-sm font-medium">{p.title}</p>
                  <p className="text-xs text-muted-foreground">/{p.slug}</p>
                </div>
                <Badge variant={p.status === 'published' ? 'secondary' : 'outline'} className={p.status === 'published' ? 'bg-green-100 text-green-800' : 'bg-amber-100 text-amber-800'}>
                  {p.status}
                </Badge>
              </li>
            ))}
            {pages.length === 0 && <li className="p-3 text-sm text-muted-foreground">No pages yet.</li>}
          </ul>
        </CardContent>
      </Card>
      <div className="mt-4">
        <Link href="/admin" className="text-sm text-muted-foreground hover:underline underline-offset-4">&larr; Back to dashboard</Link>
      </div>
    </div>
  )
}
