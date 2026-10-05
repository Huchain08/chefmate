'use client'
import { useState } from 'react'
import { useRouter } from 'next/navigation'
import Link from 'next/link'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Label } from '@/components/ui/label'
import { toast } from 'sonner'
import { Loader2 } from 'lucide-react'

function FieldErrors({ errors }: { errors: Record<string, string> }) {
  if (Object.keys(errors).length === 0) return null
  return (
    <ul className="rounded-md border border-destructive/40 bg-destructive/5 p-3 text-sm text-destructive">
      {Object.entries(errors).map(([k, v]) => <li key={k}>{v}</li>)}
    </ul>
  )
}

export function LoginForm({ next }: { next: string }) {
  const router = useRouter()
  const [email, setEmail] = useState('')
  const [password, setPassword] = useState('')
  const [errors, setErrors] = useState<Record<string, string>>({})
  const [loading, setLoading] = useState(false)

  const submit = async (e: React.FormEvent) => {
    e.preventDefault()
    setErrors({})
    setLoading(true)
    try {
      const csrf = document.cookie.match(/chefmate_csrf=([^;]+)/)?.[1] ?? ''
      const res = await fetch('/api/auth/login', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json', 'X-CSRF-Token': csrf },
        credentials: 'same-origin',
        body: JSON.stringify({ email, password, next }),
      })
      const data = await res.json().catch(() => ({}))
      if (res.ok) {
        toast.success('Signed in.')
        router.push(next || '/')
        router.refresh()
      } else if (res.status === 429) {
        setErrors({ form: 'Too many attempts. Please wait a minute and try again.' })
      } else {
        // Generic error per instruction.md §8 (reduce enumeration)
        setErrors({ form: data?.error || 'Email or password is incorrect.' })
      }
    } catch {
      setErrors({ form: 'Network error. Please try again.' })
    } finally {
      setLoading(false)
    }
  }

  return (
    <form onSubmit={submit} className="space-y-4">
      <FieldErrors errors={errors} />
      <div>
        <Label htmlFor="login-email">Email</Label>
        <Input id="login-email" type="email" autoComplete="email" required value={email} onChange={(e) => setEmail(e.target.value)} className="mt-1" />
      </div>
      <div>
        <Label htmlFor="login-password">Password</Label>
        <Input id="login-password" type="password" autoComplete="current-password" required minLength={8} value={password} onChange={(e) => setPassword(e.target.value)} className="mt-1" />
      </div>
      <Button type="submit" className="w-full" disabled={loading}>
        {loading ? <Loader2 className="mr-2 h-4 w-4 animate-spin" /> : null}
        Sign in
      </Button>
      <p className="text-center text-xs text-muted-foreground">
        <Link href="/forgot-password" className="hover:underline underline-offset-4">Forgot your password?</Link>
        <span className="mx-2">or</span>
        <Link href={`/register?next=${encodeURIComponent(next)}`} className="hover:underline underline-offset-4">Create an account</Link>
      </p>
    </form>
  )
}

export function RegisterForm({ next }: { next: string }) {
  const router = useRouter()
  const [name, setName] = useState('')
  const [email, setEmail] = useState('')
  const [password, setPassword] = useState('')
  const [confirm, setConfirm] = useState('')
  const [errors, setErrors] = useState<Record<string, string>>({})
  const [loading, setLoading] = useState(false)

  const submit = async (e: React.FormEvent) => {
    e.preventDefault()
    setErrors({})
    const errs: Record<string, string> = {}
    if (password.length < 8) errs.password = 'Password must be at least 8 characters.'
    if (password !== confirm) errs.confirm = 'Passwords do not match.'
    if (Object.keys(errs).length) { setErrors(errs); return }

    setLoading(true)
    try {
      const csrf = document.cookie.match(/chefmate_csrf=([^;]+)/)?.[1] ?? ''
      const res = await fetch('/api/auth/register', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json', 'X-CSRF-Token': csrf },
        credentials: 'same-origin',
        body: JSON.stringify({ name, email, password }),
      })
      const data = await res.json().catch(() => ({}))
      if (res.ok) {
        toast.success('Account created.')
        router.push(next || '/')
        router.refresh()
      } else if (res.status === 429) {
        setErrors({ form: 'Too many sign-up attempts. Please wait an hour and try again.' })
      } else {
        setErrors({ form: data?.error || 'Could not create account.' })
      }
    } catch {
      setErrors({ form: 'Network error. Please try again.' })
    } finally {
      setLoading(false)
    }
  }

  return (
    <form onSubmit={submit} className="space-y-4">
      <FieldErrors errors={errors} />
      <div>
        <Label htmlFor="reg-name">Name</Label>
        <Input id="reg-name" type="text" autoComplete="name" value={name} onChange={(e) => setName(e.target.value)} className="mt-1" />
      </div>
      <div>
        <Label htmlFor="reg-email">Email</Label>
        <Input id="reg-email" type="email" autoComplete="email" required value={email} onChange={(e) => setEmail(e.target.value)} className="mt-1" />
      </div>
      <div>
        <Label htmlFor="reg-password">Password</Label>
        <Input id="reg-password" type="password" autoComplete="new-password" required minLength={8} value={password} onChange={(e) => setPassword(e.target.value)} className="mt-1" />
        <p className="mt-1 text-xs text-muted-foreground">At least 8 characters.</p>
      </div>
      <div>
        <Label htmlFor="reg-confirm">Confirm password</Label>
        <Input id="reg-confirm" type="password" autoComplete="new-password" required minLength={8} value={confirm} onChange={(e) => setConfirm(e.target.value)} className="mt-1" />
      </div>
      <Button type="submit" className="w-full" disabled={loading}>
        {loading ? <Loader2 className="mr-2 h-4 w-4 animate-spin" /> : null}
        Create account
      </Button>
      <p className="text-center text-xs text-muted-foreground">
        <Link href={`/login?next=${encodeURIComponent(next)}`} className="hover:underline underline-offset-4">Already have an account? Sign in</Link>
      </p>
    </form>
  )
}

export function ForgotPasswordForm() {
  const [email, setEmail] = useState('')
  const [done, setDone] = useState(false)
  const [loading, setLoading] = useState(false)
  const [error, setError] = useState('')

  const submit = async (e: React.FormEvent) => {
    e.preventDefault()
    setLoading(true)
    setError('')
    try {
      const csrf = document.cookie.match(/chefmate_csrf=([^;]+)/)?.[1] ?? ''
      const res = await fetch('/api/auth/forgot-password', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json', 'X-CSRF-Token': csrf },
        credentials: 'same-origin',
        body: JSON.stringify({ email }),
      })
      // Always show success message per instruction.md §8 (no enumeration)
      setDone(true)
      if (res.status === 429) {
        setError('Too many requests. Please wait an hour and try again.')
      }
    } catch {
      setDone(true)
    } finally {
      setLoading(false)
    }
  }

  if (done) {
    return (
      <div className="rounded-md border border-border bg-muted/30 p-4 text-sm">
        <p>If an account exists for that email, we have sent a reset link. The link expires in 30 minutes.</p>
        {error && <p className="mt-2 text-destructive">{error}</p>}
        <p className="mt-3"><Link href="/login" className="underline underline-offset-4">Back to sign in</Link></p>
      </div>
    )
  }

  return (
    <form onSubmit={submit} className="space-y-4">
      <div>
        <Label htmlFor="forgot-email">Email</Label>
        <Input id="forgot-email" type="email" autoComplete="email" required value={email} onChange={(e) => setEmail(e.target.value)} className="mt-1" />
      </div>
      <Button type="submit" className="w-full" disabled={loading}>
        {loading ? <Loader2 className="mr-2 h-4 w-4 animate-spin" /> : null}
        Send reset link
      </Button>
    </form>
  )
}

export function ResetPasswordForm({ token }: { token: string }) {
  const router = useRouter()
  const [password, setPassword] = useState('')
  const [confirm, setConfirm] = useState('')
  const [errors, setErrors] = useState<Record<string, string>>({})
  const [loading, setLoading] = useState(false)

  const submit = async (e: React.FormEvent) => {
    e.preventDefault()
    setErrors({})
    const errs: Record<string, string> = {}
    if (!token) errs.token = 'Reset token is missing. Please use the link from your email.'
    if (password.length < 8) errs.password = 'Password must be at least 8 characters.'
    if (password !== confirm) errs.confirm = 'Passwords do not match.'
    if (Object.keys(errs).length) { setErrors(errs); return }

    setLoading(true)
    try {
      const csrf = document.cookie.match(/chefmate_csrf=([^;]+)/)?.[1] ?? ''
      const res = await fetch('/api/auth/reset-password', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json', 'X-CSRF-Token': csrf },
        credentials: 'same-origin',
        body: JSON.stringify({ token, password }),
      })
      if (res.ok) {
        toast.success('Password updated. Please sign in.')
        router.push('/login')
      } else if (res.status === 429) {
        setErrors({ form: 'Too many attempts. Please wait.' })
      } else {
        setErrors({ form: 'Reset link is invalid or expired.' })
      }
    } catch {
      setErrors({ form: 'Network error.' })
    } finally {
      setLoading(false)
    }
  }

  return (
    <form onSubmit={submit} className="space-y-4">
      <FieldErrors errors={errors} />
      <div>
        <Label htmlFor="reset-password">New password</Label>
        <Input id="reset-password" type="password" autoComplete="new-password" required minLength={8} value={password} onChange={(e) => setPassword(e.target.value)} className="mt-1" />
      </div>
      <div>
        <Label htmlFor="reset-confirm">Confirm password</Label>
        <Input id="reset-confirm" type="password" autoComplete="new-password" required minLength={8} value={confirm} onChange={(e) => setConfirm(e.target.value)} className="mt-1" />
      </div>
      <Button type="submit" className="w-full" disabled={loading}>
        {loading ? <Loader2 className="mr-2 h-4 w-4 animate-spin" /> : null}
        Set new password
      </Button>
    </form>
  )
}
