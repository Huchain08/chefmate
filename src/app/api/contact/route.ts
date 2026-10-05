import { NextRequest, NextResponse } from 'next/server'
import { z } from 'zod'
import { db } from '@/lib/db'
import { getCurrentUser, verifyCsrf } from '@/lib/auth'
import { rateLimitFromRequest } from '@/lib/rate-limit'
import { env } from '@/lib/env'
import { audit } from '@/lib/audit'

const schema = z.object({
  name: z.string().trim().min(1).max(120),
  email: z.string().email().max(254),
  subject: z.string().max(200).optional(),
  message: z.string().trim().min(5).max(4000),
})

// Mail header injection prevention
function containsHeaderInjection(s: string): boolean {
  return /[\r\n]/.test(s)
}

export async function POST(req: NextRequest) {
  const rl = rateLimitFromRequest(req, 'contact', env.rateLimits.contactPerHour, 3600)
  if (!rl.ok) return NextResponse.json({ error: 'Too many messages. Try again later.' }, { status: 429 })

  const body = await req.json().catch(() => null)
  const parsed = schema.safeParse(body)
  if (!parsed.success) return NextResponse.json({ error: 'Please fill all fields with valid values.' }, { status: 400 })

  const { name, email, subject, message } = parsed.data
  if (containsHeaderInjection(name) || containsHeaderInjection(email) || containsHeaderInjection(subject || '')) {
    return NextResponse.json({ error: 'Invalid input.' }, { status: 400 })
  }

  const user = await getCurrentUser()
  const submission = await db.contactSubmission.create({
    data: {
      userId: user?.id,
      name: name.slice(0, 120),
      email: email.toLowerCase(),
      subject: subject?.slice(0, 200) || null,
      message: message.slice(0, 4000),
    },
  })

  await audit('contact.submitted', user?.id ?? null, { submissionId: submission.id })

  // Owner action: configure an SMTP provider and email handler to send
  // the message to env.ownerContactEmail. For now it is persisted for review
  // in the admin contact-submissions queue.

  return NextResponse.json({ ok: true })
}
