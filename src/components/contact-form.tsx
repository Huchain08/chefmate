'use client'
import { useState } from 'react'
import { useRouter } from 'next/navigation'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Label } from '@/components/ui/label'
import { Textarea } from '@/components/ui/textarea'
import { toast } from 'sonner'
import { Loader2, Send } from 'lucide-react'

export function ContactForm({ csrf }: { csrf: string }) {
  const router = useRouter()
  const [name, setName] = useState('')
  const [email, setEmail] = useState('')
  const [subject, setSubject] = useState('')
  const [message, setMessage] = useState('')
  const [loading, setLoading] = useState(false)
  const [errors, setErrors] = useState<Record<string, string>>({})

  const submit = async (e: React.FormEvent) => {
    e.preventDefault()
    setErrors({})
    const errs: Record<string, string> = {}
    if (!name.trim()) errs.name = 'Please enter your name.'
    if (!email.match(/^[^\s@]+@[^\s@]+\.[^\s@]+$/)) errs.email = 'Please enter a valid email.'
    if (message.trim().length < 5) errs.message = 'Please write at least a few words.'
    if (Object.keys(errs).length) { setErrors(errs); return }

    setLoading(true)
    try {
      const csrf = document.cookie.match(/chefmate_csrf=([^;]+)/)?.[1] ?? ''
      const res = await fetch('/api/contact', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json', 'X-CSRF-Token': csrf },
        credentials: 'same-origin',
        body: JSON.stringify({ name, email, subject, message }),
      })
      if (res.ok) {
        toast.success('Message sent.')
        setName(''); setEmail(''); setSubject(''); setMessage('')
      } else if (res.status === 429) {
        setErrors({ form: 'Too many messages. Please wait an hour.' })
      } else {
        setErrors({ form: 'Could not send message.' })
      }
    } catch {
      setErrors({ form: 'Network error.' })
    } finally {
      setLoading(false)
    }
  }

  return (
    <form onSubmit={submit} className="space-y-4">
      {errors.form && <p className="rounded-md border border-destructive/40 bg-destructive/5 p-3 text-sm text-destructive">{errors.form}</p>}
      <div>
        <Label htmlFor="c-name">Name</Label>
        <Input id="c-name" required value={name} onChange={(e) => setName(e.target.value)} className="mt-1" maxLength={120} />
        {errors.name && <p className="mt-1 text-xs text-destructive">{errors.name}</p>}
      </div>
      <div>
        <Label htmlFor="c-email">Email</Label>
        <Input id="c-email" type="email" required value={email} onChange={(e) => setEmail(e.target.value)} className="mt-1" maxLength={254} />
        {errors.email && <p className="mt-1 text-xs text-destructive">{errors.email}</p>}
      </div>
      <div>
        <Label htmlFor="c-subject">Subject</Label>
        <Input id="c-subject" value={subject} onChange={(e) => setSubject(e.target.value)} className="mt-1" maxLength={200} />
      </div>
      <div>
        <Label htmlFor="c-message">Message</Label>
        <Textarea id="c-message" required value={message} onChange={(e) => setMessage(e.target.value)} className="mt-1" rows={5} maxLength={4000} />
        {errors.message && <p className="mt-1 text-xs text-destructive">{errors.message}</p>}
      </div>
      <Button type="submit" disabled={loading}>
        {loading ? <Loader2 className="mr-2 h-4 w-4 animate-spin" /> : <Send className="mr-2 h-4 w-4" />} Send message
      </Button>
    </form>
  )
}
