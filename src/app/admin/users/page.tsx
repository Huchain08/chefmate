import { redirect } from 'next/navigation'
import Link from 'next/link'
import { getCurrentUser, hasPermission } from '@/lib/auth'
import { db } from '@/lib/db'
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card'
import { Badge } from '@/components/ui/badge'

export const dynamic = 'force-dynamic'

export default async function AdminUsersPage() {
  const user = await getCurrentUser()
  if (!user) redirect('/login?next=/admin/users')
  if (!hasPermission(user, 'users.view')) redirect('/admin')

  const users = await db.user.findMany({
    orderBy: { createdAt: 'desc' },
    take: 100,
    select: { id: true, email: true, name: true, createdAt: true, lastLoginAt: true, userRoles: { include: { role: true } } },
  })

  return (
    <div>
      <header className="mb-6">
        <h1 className="text-2xl font-bold tracking-tight">Users</h1>
        <p className="mt-1 text-sm text-muted-foreground">All registered users and their roles. Role changes require admin permission.</p>
      </header>
      <Card>
        <CardHeader>
          <CardTitle className="text-base">{users.length} user(s)</CardTitle>
        </CardHeader>
        <CardContent className="p-0">
          <ul className="divide-y divide-border">
            {users.map(u => (
              <li key={u.id} className="flex items-center justify-between gap-2 p-3">
                <div>
                  <p className="text-sm font-medium">{u.email}</p>
                  <p className="text-xs text-muted-foreground">
                    Joined: {new Date(u.createdAt).toLocaleDateString()}
                    {u.lastLoginAt ? ` · Last login: ${new Date(u.lastLoginAt).toLocaleString()}` : ''}
                  </p>
                </div>
                <div className="flex gap-1">
                  {u.userRoles.map(ur => <Badge key={ur.roleId} variant="secondary">{ur.role.name}</Badge>)}
                </div>
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
