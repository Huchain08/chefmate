import { NextRequest, NextResponse } from 'next/server'
import { z } from 'zod'
import { db } from '@/lib/db'
import { hashPassword, hashToken } from '@/lib/password'
import { verifyCsrf } from '@/lib/auth'
import { audit } from '@/lib/audit'

const schema = z.object({
  token: z.string().min(10).max(200),
  password: z.string().min(8).max(1024),
})

export async function POST(req: NextRequest) {
  if (!(await verifyCsrf(req))) {
    return NextResponse.json({ error: 'Invalid request.' }, { status: 403 })
  }
  const body = await req.json().catch(() => null)
  const parsed = schema.safeParse(body)
  if (!parsed.success) {
    return NextResponse.json({ error: 'Invalid input.' }, { status: 400 })
  }
  const { token, password } = parsed.data
  const tokenHash = hashToken(token)

  const reset = await db.passwordReset.findUnique({ where: { tokenHash } })
  if (!reset || reset.usedAt || reset.expiresAt < new Date()) {
    return NextResponse.json({ error: 'Reset link is invalid or expired.' }, { status: 400 })
  }

  const hash = await hashPassword(password)
  await db.$transaction([
    db.user.update({ where: { id: reset.userId }, data: { passwordHash: hash } }),
    db.passwordReset.update({ where: { id: reset.id }, data: { usedAt: new Date() } }),
    db.session.updateMany({ where: { userId: reset.userId, revokedAt: null }, data: { revokedAt: new Date() } }),
  ])

  await audit('password.reset.completed', reset.userId)
  return NextResponse.json({ ok: true })
}
