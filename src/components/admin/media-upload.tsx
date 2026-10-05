'use client'
import { useState, useRef } from 'react'
import { useRouter } from 'next/navigation'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Label } from '@/components/ui/label'
import { toast } from 'sonner'
import { Loader2, Upload } from 'lucide-react'

interface Props { csrf: string }

export function MediaUpload({ csrf }: Props) {
  const router = useRouter()
  const fileRef = useRef<HTMLInputElement>(null)
  const [alt, setAlt] = useState('')
  const [loading, setLoading] = useState(false)

  const submit = async (e: React.FormEvent) => {
    e.preventDefault()
    const file = fileRef.current?.files?.[0]
    if (!file) return
    if (file.size > 5 * 1024 * 1024) { toast.error('Image is larger than 5 MB.'); return }
    if (!['image/jpeg', 'image/png', 'image/webp'].includes(file.type)) { toast.error('Use JPG, PNG, or WebP.'); return }

    setLoading(true)
    const fd = new FormData()
    fd.append('file', file)
    fd.append('alt', alt)
    try {
      const res = await fetch('/api/admin/media', {
        method: 'POST',
        headers: { 'X-CSRF-Token': csrf },
        credentials: 'same-origin',
        body: fd,
      })
      if (res.ok) {
        toast.success('Uploaded.')
        setAlt('')
        if (fileRef.current) fileRef.current.value = ''
        router.refresh()
      } else if (res.status === 413) {
        toast.error('File too large.')
      } else if (res.status === 415) {
        toast.error('File type not allowed.')
      } else if (res.status === 429) {
        toast.error('Too many uploads. Please slow down.')
      } else {
        toast.error('Upload failed.')
      }
    } finally {
      setLoading(false)
    }
  }

  return (
    <form onSubmit={submit} className="rounded-md border border-border p-4">
      <p className="text-sm font-medium">Upload an image</p>
      <div className="mt-3 grid gap-3 sm:grid-cols-3">
        <div className="sm:col-span-2">
          <Label htmlFor="media-file" className="text-xs">Image file</Label>
          <Input id="media-file" type="file" accept="image/jpeg,image/png,image/webp" ref={fileRef} className="mt-1" required />
        </div>
        <div>
          <Label htmlFor="media-alt" className="text-xs">Alt text</Label>
          <Input id="media-alt" value={alt} onChange={(e) => setAlt(e.target.value)} className="mt-1" maxLength={200} placeholder="Describe the image" />
        </div>
      </div>
      <Button type="submit" className="mt-3" disabled={loading}>
        {loading ? <Loader2 className="mr-2 h-4 w-4 animate-spin" /> : <Upload className="mr-2 h-4 w-4" />} Upload
      </Button>
    </form>
  )
}
