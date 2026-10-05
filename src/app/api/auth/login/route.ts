import { NextRequest, NextResponse } from 'next/server'
import { z } from 'zod'
import { db } from '@/lib/db'
import { hashPassword, verifyPassword, generateToken, hashToken } from '@/lib/password'
import { createSession } from '@/lib/auth'
import { rateLimitFromRequest } from '@/lib/rate-limit'
import { env } from '@/lib/env'
import { audit } from '@/lib/audit'

const schema = z.object({
  email: z.string().email().max(254),
  password: z.string().min(8).max(1024),
  next: z.string().max(200).optional(),
})

export async function POST(req: NextRequest) {
  const body = await req.json().catch(() => null)
  const parsed = schema.safeParse(body)
  if (!parsed.success) {
    return NextResponse.json({ error: 'Invalid email or password.' }, { status: 400 })
  }
  const { email, password } = parsed.data

  // Rate limit by IP
  const rl = rateLimitFromRequest(req, 'login', env.rateLimits.loginPerMin, 60)
  if (!rl.ok) {
    return NextResponse.json({ error: 'Too many login attempts. Try again later.' }, { status: 429, headers: { 'Retry-After': String(rl.retryAfterSec) } })
  }

  const user = await db.user.findUnique({ where: { email: email.toLowerCase() } })
  // Always do the hash work to reduce timing attacks
  const dummyHash = '$argon2id$v=19$m=19456,t=2,p=1$AAAAAAAAAAAAAAAAAAAAAA$AAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAA'
  const ok = user?.passwordHash
    ? await verifyPassword(password, user.passwordHash)
    : await verifyPassword(password, dummyHash)

  if (!user || !user.passwordHash || !ok) {
    await audit('login.failed', user?.id ?? null, { email })
    return NextResponse.json({ error: 'Email or password is incorrect.' }, { status: 401 })
  }

  // Account lockout
  if (user.lockedUntil && user.lockedUntil > new Date()) {
    return NextResponse.json({ error: 'Account is temporarily locked. Try again later.' }, { status: 423 })
  }

  // Reset failed counters
  await db.user.update({
    where: { id: user.id },
    data: { failedLoginCount: 0, lockedUntil: null, lastLoginAt: new Date() },
  })

  await createSession(user.id)
  await audit('login.success', user.id)

  return NextResponse.json({ ok: true })
}
