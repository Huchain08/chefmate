import { redirect } from 'next/navigation'
import Link from 'next/link'
import { getCurrentUser, hasPermission } from '@/lib/auth'
import { db } from '@/lib/db'
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card'
import { Badge } from '@/components/ui/badge'
import { Upload, Trash2 } from 'lucide-react'
import { MediaUpload } from '@/components/admin/media-upload'

export const dynamic = 'force-dynamic'

export default async function AdminMediaPage() {
  const user = await getCurrentUser()
  if (!user) redirect('/login?next=/admin/media')
  if (!hasPermission(user, 'media.view')) redirect('/admin')

  const media = await db.mediaAsset.findMany({ orderBy: { createdAt: 'desc' }, take: 100 })

  return (
    <div>
      <header className="mb-6">
        <h1 className="text-2xl font-bold tracking-tight">Media library</h1>
        <p className="mt-1 text-sm text-muted-foreground">Upload images for recipes, hero, and pages. Allowed types: JPG, PNG, WebP up to 5 MB.</p>
      </header>
      {hasPermission(user, 'media.upload') && <MediaUpload csrf={await (await import('@/lib/auth')).getCsrfToken()} />}

      <Card className="mt-6">
        <CardHeader>
          <CardTitle className="text-base">{media.length} media asset(s)</CardTitle>
        </CardHeader>
        <CardContent>
          <ul className="grid gap-3 sm:grid-cols-3 lg:grid-cols-4">
            {media.map(m => (
              <li key={m.id} className="rounded-md border border-border p-3 text-sm">
                {m.mimeType.startsWith('image/') && m.url && (
                   
                  <img src={m.url} alt={m.altText || m.filename} className="mb-2 aspect-square w-full rounded object-cover" loading="lazy" />
                )}
                <p className="truncate text-xs font-medium">{m.filename}</p>
                <p className="text-xs text-muted-foreground">{(m.size / 1024).toFixed(0)} KB</p>
                <p className="mt-1 break-all text-[10px] text-muted-foreground">{m.url}</p>
              </li>
            ))}
            {media.length === 0 && <li className="col-span-full text-sm text-muted-foreground">No media uploaded yet.</li>}
          </ul>
        </CardContent>
      </Card>
      <div className="mt-4">
        <Link href="/admin" className="text-sm text-muted-foreground hover:underline underline-offset-4">&larr; Back to dashboard</Link>
      </div>
    </div>
  )
}
