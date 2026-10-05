'use client'
import { useState } from 'react'
import { useRouter } from 'next/navigation'
import { Button } from '@/components/ui/button'
import { Textarea } from '@/components/ui/textarea'
import { Badge } from '@/components/ui/badge'
import { toast } from 'sonner'
import { Loader2, Save, Send, FileText } from 'lucide-react'
import Link from 'next/link'

interface Props {
  type: 'terms' | 'privacy'
  title: string
  doc: { body: string; status: string; updatedAt: string; publishedAt: string | null } | null
  csrf: string
}

export function LegalEditor({ type, title, doc, csrf }: Props) {
  const router = useRouter()
  const [body, setBody] = useState(doc?.body || '')
  const [status, setStatus] = useState(doc?.status || 'draft')
  const [loading, setLoading] = useState(false)

  const save = async (publish: boolean) => {
    if (publish && !body.trim()) {
      toast.error('Cannot publish an empty document.')
      return
    }
    setLoading(true)
    try {
      const res = await fetch(`/api/admin/legal/${type}`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json', 'X-CSRF-Token': csrf },
        credentials: 'same-origin',
        body: JSON.stringify({ body, publish }),
      })
      if (res.ok) {
        if (publish) {
          setStatus('published')
          toast.success('Published.')
        } else {
          setStatus('draft')
          toast.success('Saved as draft.')
        }
        router.refresh()
      } else if (res.status === 403) {
        toast.error('Session expired. Reload.')
      } else {
        toast.error('Could not save.')
      }
    } finally {
      setLoading(false)
    }
  }

  return (
    <div className="rounded-md border border-border">
      <div className="border-b border-border p-4">
        <div className="flex items-center justify-between">
          <h2 className="flex items-center gap-2 text-base font-semibold">
            <FileText className="h-4 w-4" /> {title}
          </h2>
          <Badge variant={status === 'published' ? 'secondary' : 'outline'} className={status === 'published' ? 'bg-green-100 text-green-800' : 'bg-amber-100 text-amber-800'}>
            {status === 'published' ? 'Published' : 'Draft'}
          </Badge>
        </div>
        {doc?.publishedAt && (
          <p className="mt-1 text-xs text-muted-foreground">
            Last published: {new Date(doc.publishedAt).toLocaleString()}
          </p>
        )}
        <p className="mt-1 text-xs text-muted-foreground">
          Use plain text. Headings, lists, and links are supported.
        </p>
      </div>
      <div className="p-4">
        <Textarea
          value={body}
          onChange={(e) => setBody(e.target.value)}
          rows={14}
          placeholder="Paste your approved legal text here. Do not paste template or placeholder text."
          className="font-mono text-xs"
        />
        <div className="mt-3 flex gap-2">
          <Button variant="outline" onClick={() => save(false)} disabled={loading}>
            {loading ? <Loader2 className="mr-2 h-4 w-4 animate-spin" /> : <Save className="mr-2 h-4 w-4" />} Save draft
          </Button>
          <Button onClick={() => save(true)} disabled={loading}>
            {loading ? <Loader2 className="mr-2 h-4 w-4 animate-spin" /> : <Send className="mr-2 h-4 w-4" />} Publish
          </Button>
          <Link href={`/${type}`} className="ml-auto self-center text-xs text-muted-foreground hover:underline underline-offset-4">
            View public page
          </Link>
        </div>
      </div>
    </div>
  )
}
