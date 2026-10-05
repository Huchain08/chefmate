import { NextRequest, NextResponse } from 'next/server'
import { z } from 'zod'
import { audit } from '@/lib/audit'
import { appendFileSync, mkdirSync } from 'fs'
import { dirname, resolve } from 'path'
import { env } from '@/lib/env'

const schema = z.object({
  digest: z.string().max(80).optional(),
  path: z.string().max(200).optional(),
})

// Server-side error log sink — never returns details to the client.
export async function POST(req: NextRequest) {
  const body = await req.json().catch(() => null)
  const parsed = schema.safeParse(body)
  if (!parsed.success) return NextResponse.json({ ok: true })

  const { digest, path } = parsed.data
  try {
    const logPath = resolve(process.cwd(), env.auditLogPath.replace('audit.log', 'errors.log'))
    mkdirSync(dirname(logPath), { recursive: true })
    appendFileSync(logPath, JSON.stringify({
      ts: new Date().toISOString(),
      digest,
      path,
    }) + '\n')
  } catch {}

  await audit('client.error', null, { digest, path })

  return NextResponse.json({ ok: true })
}
