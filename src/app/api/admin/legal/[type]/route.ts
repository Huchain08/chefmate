import { NextRequest, NextResponse } from 'next/server'
import { z } from 'zod'
import DOMPurify from 'isomorphic-dompurify'
import { db } from '@/lib/db'
import { getCurrentUser, verifyCsrf, hasPermission } from '@/lib/auth'
import { audit } from '@/lib/audit'

const schema = z.object({
  body: z.string().max(100000),
  publish: z.boolean().optional(),
})

export async function POST(req: NextRequest, { params }: { params: Promise<{ type: string }> }) {
  const { type } = await params
  if (type !== 'terms' && type !== 'privacy') {
    return NextResponse.json({ error: 'Unknown document type.' }, { status: 400 })
  }
  const user = await getCurrentUser()
  if (!user) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
  if (!hasPermission(user, 'legal.edit')) return NextResponse.json({ error: 'Forbidden' }, { status: 403 })
  if (!(await verifyCsrf(req))) return NextResponse.json({ error: 'Invalid request.' }, { status: 403 })

  const body = await req.json().catch(() => null)
  const parsed = schema.safeParse(body)
  if (!parsed.success) return NextResponse.json({ error: 'Invalid input.' }, { status: 400 })

  // Sanitize HTML body before storage (defense in depth)
  const clean = DOMPurify.sanitize(parsed.data.body, {
    ALLOWED_TAGS: ['h1', 'h2', 'h3', 'h4', 'p', 'ul', 'ol', 'li', 'a', 'strong', 'em', 'br', 'blockquote', 'code', 'pre'],
    ALLOWED_ATTR: ['href', 'target', 'rel'],
  })

  const publish = parsed.data.publish === true
  const existing = await db.legalDocument.findUnique({ where: { type } })
  if (existing) {
    const updated = await db.legalDocument.update({
      where: { type },
      data: {
        body: clean,
        status: publish ? 'published' : 'draft',
        publishedAt: publish ? new Date() : existing.publishedAt,
        approvedBy: publish ? user.id : existing.approvedBy,
        version: publish ? existing.version + 1 : existing.version,
      },
    })
    await audit(`legal.${publish ? 'published' : 'saved'}`, user.id, { type, version: updated.version })
  } else {
    const created = await db.legalDocument.create({
      data: {
        type,
        title: type === 'terms' ? 'Terms and Conditions' : 'Privacy Policy',
        body: clean,
        status: publish ? 'published' : 'draft',
        publishedAt: publish ? new Date() : null,
        approvedBy: publish ? user.id : null,
        version: 1,
      },
    })
    await audit(`legal.${publish ? 'published' : 'saved'}`, user.id, { type, version: 1 })
  }

  return NextResponse.json({ ok: true })
}
