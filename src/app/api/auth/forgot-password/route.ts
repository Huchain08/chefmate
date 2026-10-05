import { NextRequest, NextResponse } from 'next/server'
import { z } from 'zod'
import { db } from '@/lib/db'
import { generateToken, hashToken } from '@/lib/password'
import { rateLimitFromRequest } from '@/lib/rate-limit'
import { env } from '@/lib/env'
import { audit } from '@/lib/audit'

const schema = z.object({ email: z.string().email().max(254) })

export async function POST(req: NextRequest) {
  const body = await req.json().catch(() => null)
  const parsed = schema.safeParse(body)
  if (!parsed.success) {
    return NextResponse.json({ error: 'Please provide a valid email.' }, { status: 400 })
  }

  const rl = rateLimitFromRequest(req, 'password-reset', env.rateLimits.passwordResetPerHour, 3600)
  if (!rl.ok) {
    return NextResponse.json({ error: 'Too many requests. Try again later.' }, { status: 429 })
  }

  const user = await db.user.findUnique({ where: { email: parsed.data.email.toLowerCase() } })
  if (user) {
    const token = generateToken(32)
    const tokenHash = hashToken(token)
    const expiresAt = new Date(Date.now() + 30 * 60 * 1000) // 30 minutes
    await db.passwordReset.create({ data: { userId: user.id, tokenHash, expiresAt } })
    // Email is intentionally NOT sent in this build; owner must configure SMTP.
    // For development, the token is returned in the audit log only.
    await audit('password.reset.requested', user.id, { tokenPreview: token.slice(0, 6) })
    // In a production deployment, the owner should configure SMTP and email the
    // link ${env.siteUrl}/reset-password?token=${token} to the user.
    // We do not return the token in the response body to avoid leaking it.
  }

  // Always respond ok to reduce user enumeration per instruction.md §8
  return NextResponse.json({ ok: true })
}
