'use client'
import { useState } from 'react'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Label } from '@/components/ui/label'
import { useRouter } from 'next/navigation'
import { Upload, Loader2, X, Plus } from 'lucide-react'
import { toast } from 'sonner'

interface DetectedIngredient { name: string; quantity: number; unit: string }

interface Props { visionConfigured: boolean }

export function ScanForm({ visionConfigured }: Props) {
  const router = useRouter()
  const [uploading, setUploading] = useState(false)
  const [items, setItems] = useState<DetectedIngredient[]>([])
  const [newName, setNewName] = useState('')
  const [newQty, setNewQty] = useState('1')
  const [newUnit, setNewUnit] = useState('piece')
  const [saving, setSaving] = useState(false)

  const onUpload = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0]
    if (!file) return
    if (file.size > 5 * 1024 * 1024) {
      toast.error('Image is larger than 5 MB. Please use a smaller image.')
      return
    }
    if (!['image/jpeg', 'image/png', 'image/webp'].includes(file.type)) {
      toast.error('Please upload a JPG, PNG, or WebP image.')
      return
    }
    setUploading(true)
    try {
      const formData = new FormData()
      formData.append('file', file)
      const res = await fetch('/api/scan', { method: 'POST', body: formData, credentials: 'same-origin' })
      if (res.status === 401) {
        toast.info('Please sign in to use the fridge scanner.')
        router.push('/login?next=/scan')
        return
      }
      if (res.status === 429) {
        toast.error('Too many scans. Please wait a minute and try again.')
        return
      }
      if (!res.ok) {
        const errorData = await res.json().catch(() => null)
        toast.error(errorData?.error || 'Could not process the image. Please try again.')
        return
      }
      const data = await res.json()
      if (Array.isArray(data.ingredients)) {
        setItems(data.ingredients)
        if (data.ingredients.length === 0) {
          toast.info('No ingredients detected. You can add them manually.')
        } else {
          toast.success(`Detected ${data.ingredients.length} ingredient${data.ingredients.length === 1 ? '' : 's'}. Verify and save.`)
        }
      }
    } catch {
      toast.error('Network error. Please try again.')
    } finally {
      setUploading(false)
    }
  }

  const remove = (i: number) => setItems(prev => prev.filter((_, idx) => idx !== i))
  const update = (i: number, patch: Partial<DetectedIngredient>) =>
    setItems(prev => prev.map((it, idx) => idx === i ? { ...it, ...patch } : it))

  const addManual = () => {
    if (!newName.trim()) return
    setItems(prev => [...prev, { name: newName.trim(), quantity: parseFloat(newQty) || 1, unit: newUnit.trim() || 'piece' }])
    setNewName('')
    setNewQty('1')
    setNewUnit('piece')
  }

  const save = async () => {
    setSaving(true)
    try {
      const csrf = document.cookie.match(/chefmate_csrf=([^;]+)/)?.[1] ?? ''
      const res = await fetch('/api/inventory', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json', 'X-CSRF-Token': csrf },
        credentials: 'same-origin',
        body: JSON.stringify({ items }),
      })
      if (res.status === 401) {
        toast.info('Please sign in to save your inventory.')
        router.push('/login?next=/scan')
        return
      }
      if (res.ok) {
        toast.success('Inventory saved. Find matching recipes below.')
        router.push('/recipes?fromInventory=1')
      } else if (res.status === 429) {
        toast.error('Too many requests. Please slow down.')
      } else {
        toast.error('Could not save inventory.')
      }
    } catch {
      toast.error('Network error.')
    } finally {
      setSaving(false)
    }
  }

  return (
    <div>
      <div className="flex flex-col gap-3">
        <Label htmlFor="scan-file" className="text-xs font-medium">Fridge or pantry photo</Label>
        <Input
          id="scan-file"
          type="file"
          accept="image/jpeg,image/png,image/webp"
          capture="environment"
          onChange={onUpload}
          disabled={uploading}
        />
        {uploading && (
          <p className="flex items-center gap-2 text-xs text-muted-foreground">
            <Loader2 className="h-3 w-3 animate-spin" /> Analyzing image...
          </p>
        )}
        {!visionConfigured && (
          <p className="text-xs text-muted-foreground">
            Vision is not configured. You can still add ingredients manually below.
          </p>
        )}
      </div>

      {items.length > 0 && (
        <div className="mt-6">
          <p className="text-sm font-medium">Detected ingredients</p>
          <p className="text-xs text-muted-foreground">Review and edit before saving.</p>
          <ul className="mt-3 max-h-72 space-y-2 overflow-y-auto thin-scroll">
            {items.map((it, i) => (
              <li key={i} className="flex items-center gap-2 rounded-md border border-border p-2 text-sm">
                <Input
                  value={it.name}
                  onChange={(e) => update(i, { name: e.target.value })}
                  className="flex-1 h-8"
                  aria-label={`Ingredient ${i + 1} name`}
                />
                <Input
                  type="number"
                  step="0.1"
                  value={it.quantity}
                  onChange={(e) => update(i, { quantity: parseFloat(e.target.value) || 0 })}
                  className="w-16 h-8"
                  aria-label={`Ingredient ${i + 1} quantity`}
                />
                <Input
                  value={it.unit}
                  onChange={(e) => update(i, { unit: e.target.value })}
                  className="w-20 h-8"
                  aria-label={`Ingredient ${i + 1} unit`}
                />
                <Button type="button" variant="ghost" size="icon" aria-label="Remove" onClick={() => remove(i)}>
                  <X className="h-4 w-4" />
                </Button>
              </li>
            ))}
          </ul>
          <Button onClick={save} disabled={saving} className="mt-4">
            <Upload className="mr-2 h-4 w-4" /> Save to inventory
          </Button>
        </div>
      )}

      <div className="mt-6 border-t border-border pt-4">
        <p className="text-sm font-medium">Add ingredient manually</p>
        <div className="mt-2 flex flex-wrap gap-2">
          <Input
            value={newName}
            onChange={(e) => setNewName(e.target.value)}
            placeholder="e.g. onion"
            className="flex-1 min-w-[140px]"
            onKeyDown={(e) => { if (e.key === 'Enter') { e.preventDefault(); addManual() } }}
          />
          <Input
            type="number"
            step="0.1"
            value={newQty}
            onChange={(e) => setNewQty(e.target.value)}
            className="w-20"
            aria-label="Quantity"
          />
          <Input
            value={newUnit}
            onChange={(e) => setNewUnit(e.target.value)}
            className="w-24"
            aria-label="Unit"
          />
          <Button type="button" variant="outline" onClick={addManual}>
            <Plus className="mr-2 h-4 w-4" /> Add
          </Button>
        </div>
      </div>
    </div>
  )
}
