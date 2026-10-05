'use client'
import { useState } from 'react'
import { useRouter } from 'next/navigation'
import { Button } from '@/components/ui/button'
import { toast } from 'sonner'
import { CheckCircle2 } from 'lucide-react'

export function ContactHandler({ id, csrf }: { id: string; csrf: string }) {
  const router = useRouter()
  const [busy, setBusy] = useState(false)

  const markHandled = async () => {
    setBusy(true)
    try {
      const res = await fetch(`/api/admin/contact/${id}`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json', 'X-CSRF-Token': csrf },
        credentials: 'same-origin',
        body: JSON.stringify({ handled: true }),
      })
      if (res.ok) {
        toast.success('Marked as handled.')
        router.refresh()
      } else {
        toast.error('Could not update.')
      }
    } finally {
      setBusy(false)
    }
  }

  return (
    <Button size="sm" variant="outline" className="mt-2" onClick={markHandled} disabled={busy}>
      <CheckCircle2 className="mr-2 h-4 w-4" /> Mark as handled
    </Button>
  )
}
