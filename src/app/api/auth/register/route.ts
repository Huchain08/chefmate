import { NextRequest, NextResponse } from 'next/server'
import { z } from 'zod'
import { db } from '@/lib/db'
import { hashPassword } from '@/lib/password'
import { createSession } from '@/lib/auth'
import { rateLimitFromRequest } from '@/lib/rate-limit'
import { env } from '@/lib/env'
import { audit } from '@/lib/audit'

const schema = z.object({
  name: z.string().trim().min(1).max(80).optional(),
  email: z.string().email().max(254),
  password: z.string().min(8).max(1024),
})

export async function POST(req: NextRequest) {
  const body = await req.json().catch(() => null)
  const parsed = schema.safeParse(body)
  if (!parsed.success) {
    return NextResponse.json({ error: 'Please provide a valid email and a password of at least 8 characters.' }, { status: 400 })
  }
  const { name, email, password } = parsed.data

  const rl = rateLimitFromRequest(req, 'register', env.rateLimits.registerPerHour, 3600)
  if (!rl.ok) {
    return NextResponse.json({ error: 'Too many sign-ups from this address. Try again later.' }, { status: 429 })
  }

  const existing = await db.user.findUnique({ where: { email: email.toLowerCase() } })
  if (existing) {
    // Generic error per instruction.md §8 (reduce enumeration)
    return NextResponse.json({ error: 'Could not create account.' }, { status: 400 })
  }

  const hash = await hashPassword(password)
  const user = await db.user.create({
    data: {
      email: email.toLowerCase(),
      name: name?.slice(0, 80),
      passwordHash: hash,
    },
  })
  // Assign the default "user" role
  const userRole = await db.role.findUnique({ where: { name: 'user' } })
  if (userRole) {
    await db.userRole.create({ data: { userId: user.id, roleId: userRole.id } })
  }

  await createSession(user.id)
  await audit('register.success', user.id)

  return NextResponse.json({ ok: true })
}
