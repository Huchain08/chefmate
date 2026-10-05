import { redirect } from 'next/navigation'
import Link from 'next/link'
import { getCurrentUser, hasPermission, getCsrfToken } from '@/lib/auth'
import { db } from '@/lib/db'
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card'
import { Badge } from '@/components/ui/badge'
import { ContactHandler } from '@/components/admin/contact-handler'

export const dynamic = 'force-dynamic'

export default async function AdminContactPage() {
  const user = await getCurrentUser()
  if (!user) redirect('/login?next=/admin/contact')
  if (!hasPermission(user, 'contact.view')) redirect('/admin')

  const submissions = await db.contactSubmission.findMany({
    orderBy: { createdAt: 'desc' },
    take: 100,
    select: { id: true, name: true, email: true, subject: true, message: true, createdAt: true, handled: true },
  })
  const csrf = await getCsrfToken()

  return (
    <div>
      <header className="mb-6">
        <h1 className="text-2xl font-bold tracking-tight">Contact submissions</h1>
        <p className="mt-1 text-sm text-muted-foreground">Messages submitted through the contact form.</p>
      </header>
      <Card>
        <CardHeader>
          <CardTitle className="text-base">{submissions.length} submission(s)</CardTitle>
        </CardHeader>
        <CardContent className="p-0">
          <ul className="divide-y divide-border">
            {submissions.map(s => (
              <li key={s.id} className="p-3">
                <div className="flex items-center justify-between gap-2">
                  <p className="text-sm font-medium">{s.name} &lt;{s.email}&gt;</p>
                  <div className="flex items-center gap-2">
                    {s.subject && <Badge variant="outline">{s.subject}</Badge>}
                    <Badge variant={s.handled ? 'secondary' : 'outline'} className={s.handled ? 'bg-green-100 text-green-800' : 'bg-amber-100 text-amber-800'}>
                      {s.handled ? 'Handled' : 'Pending'}
                    </Badge>
                  </div>
                </div>
                <p className="mt-1 text-sm text-muted-foreground">{s.message}</p>
                <p className="mt-1 text-xs text-muted-foreground">{new Date(s.createdAt).toLocaleString()}</p>
                {!s.handled && <ContactHandler id={s.id} csrf={csrf} />}
              </li>
            ))}
            {submissions.length === 0 && <li className="p-3 text-sm text-muted-foreground">No submissions yet.</li>}
          </ul>
        </CardContent>
      </Card>
      <div className="mt-4">
        <Link href="/admin" className="text-sm text-muted-foreground hover:underline underline-offset-4">&larr; Back to dashboard</Link>
      </div>
    </div>
  )
}
