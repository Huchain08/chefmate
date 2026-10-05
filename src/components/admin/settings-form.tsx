'use client'
import { useState } from 'react'
import { useRouter } from 'next/navigation'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Label } from '@/components/ui/label'
import { Textarea } from '@/components/ui/textarea'
import { toast } from 'sonner'
import { Loader2 } from 'lucide-react'

interface Props {
  initial: { siteName: string; siteDescription: string; primaryColor: string; accentColor: string }
  csrf: string
}

export function SettingsForm({ initial, csrf }: Props) {
  const router = useRouter()
  const [siteName, setSiteName] = useState(initial.siteName)
  const [siteDescription, setSiteDescription] = useState(initial.siteDescription)
  const [primaryColor, setPrimaryColor] = useState(initial.primaryColor)
  const [accentColor, setAccentColor] = useState(initial.accentColor)
  const [loading, setLoading] = useState(false)

  const submit = async (e: React.FormEvent) => {
    e.preventDefault()
    setLoading(true)
    try {
      const res = await fetch('/api/admin/settings', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json', 'X-CSRF-Token': csrf },
        credentials: 'same-origin',
        body: JSON.stringify({ siteName, siteDescription, primaryColor, accentColor }),
      })
      if (res.ok) {
        toast.success('Saved.')
        router.refresh()
      } else if (res.status === 403) {
        toast.error('Session expired. Please reload the page.')
      } else {
        toast.error('Could not save.')
      }
    } finally {
      setLoading(false)
    }
  }

  return (
    <form onSubmit={submit} className="max-w-xl space-y-4">
      <div>
        <Label htmlFor="site-name">Site name</Label>
        <Input id="site-name" value={siteName} onChange={(e) => setSiteName(e.target.value)} className="mt-1" maxLength={60} required />
      </div>
      <div>
        <Label htmlFor="site-desc">Site description</Label>
        <Textarea id="site-desc" value={siteDescription} onChange={(e) => setSiteDescription(e.target.value)} className="mt-1" maxLength={400} rows={3} />
        <p className="mt-1 text-xs text-muted-foreground">Used in meta description, Open Graph, and the homepage.</p>
      </div>
      <div className="grid grid-cols-2 gap-3">
        <div>
          <Label htmlFor="primary-color">Primary color</Label>
          <Input id="primary-color" type="color" value={primaryColor} onChange={(e) => setPrimaryColor(e.target.value)} className="mt-1 h-10 w-full" />
        </div>
        <div>
          <Label htmlFor="accent-color">Accent color</Label>
          <Input id="accent-color" type="color" value={accentColor} onChange={(e) => setAccentColor(e.target.value)} className="mt-1 h-10 w-full" />
        </div>
      </div>
      <Button type="submit" disabled={loading}>
        {loading ? <Loader2 className="mr-2 h-4 w-4 animate-spin" /> : null}
        Save settings
      </Button>
    </form>
  )
}
