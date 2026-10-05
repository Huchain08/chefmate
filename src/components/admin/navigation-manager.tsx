'use client'
import { useState } from 'react'
import { useRouter } from 'next/navigation'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Label } from '@/components/ui/label'
import { toast } from 'sonner'
import { Loader2, Plus, Trash2 } from 'lucide-react'

interface Item { id: string; label: string; url: string; sortOrder: number; section?: string }

interface Props {
  kind: 'header' | 'footer'
  items: Item[]
  csrf: string
}

export function NavigationManager({ kind, items: initial, csrf }: Props) {
  const router = useRouter()
  const [items, setItems] = useState(initial)
  const [label, setLabel] = useState('')
  const [url, setUrl] = useState('')
  const [section, setSection] = useState('default')
  const [loading, setLoading] = useState(false)

  const add = async () => {
    if (!label.trim() || !url.trim()) return
    setLoading(true)
    try {
      const res = await fetch(`/api/admin/navigation?kind=${kind}`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json', 'X-CSRF-Token': csrf },
        credentials: 'same-origin',
        body: JSON.stringify({ label, url, section: kind === 'footer' ? section : undefined }),
      })
      if (res.ok) {
        const d = await res.json()
        setItems(prev => [...prev, d])
        setLabel('')
        setUrl('')
        toast.success('Added.')
      } else {
        toast.error('Could not add.')
      }
    } finally {
      setLoading(false)
    }
  }

  const remove = async (id: string) => {
    setItems(prev => prev.filter(it => it.id !== id))
    try {
      await fetch(`/api/admin/navigation/${id}?kind=${kind}`, {
        method: 'DELETE',
        headers: { 'X-CSRF-Token': csrf },
        credentials: 'same-origin',
      })
      router.refresh()
    } catch {}
  }

  return (
    <div className="rounded-md border border-border">
      <div className="border-b border-border p-3">
        <p className="text-sm font-medium capitalize">{kind} items</p>
      </div>
      <div className="p-3">
        <ul className="space-y-1">
          {items.map(it => (
            <li key={it.id} className="flex items-center justify-between gap-2 rounded-md border border-border/60 p-2 text-sm">
              <span>
                <span className="font-medium">{it.label}</span>
                <span className="ml-2 text-xs text-muted-foreground">{it.url}</span>
                {it.section && it.section !== 'default' && <span className="ml-2 text-xs text-muted-foreground">[{it.section}]</span>}
              </span>
              <Button variant="ghost" size="icon" aria-label="Remove" onClick={() => remove(it.id)}>
                <Trash2 className="h-4 w-4" />
              </Button>
            </li>
          ))}
          {items.length === 0 && <li className="p-2 text-xs text-muted-foreground">No items yet.</li>}
        </ul>
        <div className="mt-3 flex flex-wrap gap-2 border-t border-border pt-3">
          <Input value={label} onChange={(e) => setLabel(e.target.value)} placeholder="Label" className="flex-1 min-w-[120px]" maxLength={60} />
          <Input value={url} onChange={(e) => setUrl(e.target.value)} placeholder="/recipes or https://" className="flex-1 min-w-[120px]" maxLength={200} />
          {kind === 'footer' && (
            <Input value={section} onChange={(e) => setSection(e.target.value)} placeholder="Section" className="w-32" maxLength={40} />
          )}
          <Button onClick={add} disabled={loading}>
            {loading ? <Loader2 className="h-4 w-4 animate-spin" /> : <Plus className="mr-1 h-4 w-4" />} Add
          </Button>
        </div>
      </div>
    </div>
  )
}
