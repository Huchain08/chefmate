import { redirect } from 'next/navigation'
import Link from 'next/link'
import { getCurrentUser, hasPermission } from '@/lib/auth'
import { db } from '@/lib/db'
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card'
import { Badge } from '@/components/ui/badge'

export const dynamic = 'force-dynamic'

export default async function AdminAuditPage() {
  const user = await getCurrentUser()
  if (!user) redirect('/login?next=/admin/audit')
  if (!hasPermission(user, 'audit.view')) redirect('/admin')

  const logs = await db.auditLog.findMany({
    orderBy: { createdAt: 'desc' },
    take: 200,
    select: { id: true, action: true, resource: true, resourceId: true, userId: true, ipAddress: true, createdAt: true, metadata: true },
  })

  return (
    <div>
      <header className="mb-6">
        <h1 className="text-2xl font-bold tracking-tight">Audit log</h1>
        <p className="mt-1 text-sm text-muted-foreground">Latest 200 admin and security events.</p>
      </header>
      <Card>
        <CardHeader>
          <CardTitle className="text-base">{logs.length} events</CardTitle>
        </CardHeader>
        <CardContent className="p-0">
          <ul className="max-h-[600px] divide-y divide-border overflow-y-auto thin-scroll">
            {logs.map(l => (
              <li key={l.id} className="p-3 text-sm">
                <div className="flex items-center justify-between gap-2">
                  <p className="font-medium">{l.action}</p>
                  <Badge variant="outline">{new Date(l.createdAt).toLocaleString()}</Badge>
                </div>
                <p className="text-xs text-muted-foreground">
                  {l.resource && <span>{l.resource}</span>}
                  {l.resourceId && <span> · {l.resourceId}</span>}
                  {l.userId && <span> · user: {l.userId.slice(0, 8)}</span>}
                  {l.ipAddress && <span> · ip: {l.ipAddress}</span>}
                </p>
              </li>
            ))}
          </ul>
        </CardContent>
      </Card>
      <div className="mt-4">
        <Link href="/admin" className="text-sm text-muted-foreground hover:underline underline-offset-4">&larr; Back to dashboard</Link>
      </div>
    </div>
  )
}
