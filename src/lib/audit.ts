import { db } from '@/lib/db'
import { headers } from 'next/headers'
import { env } from '@/lib/env'
import { appendFileSync, mkdirSync } from 'fs'
import { dirname, resolve } from 'path'

export async function audit(
  action: string,
  userId: string | null,
  metadata?: Record<string, unknown>,
  resource?: string,
  resourceId?: string
): Promise<void> {
  try {
    const h = await headers()
    const xff = h.get('x-forwarded-for')
    const ip = (xff?.split(',')[0]?.trim()) || h.get('x-real-ip') || 'unknown'
    const ua = h.get('user-agent') || 'unknown'

    await db.auditLog.create({
      data: {
        userId,
        action,
        resource,
        resourceId,
        ipAddress: ip,
        userAgent: ua,
        metadata: metadata ? JSON.stringify(metadata) : null,
      },
    })

    // Mirror to file log for forensic analysis
    const logPath = resolve(process.cwd(), env.auditLogPath)
    try {
      mkdirSync(dirname(logPath), { recursive: true })
      const line = JSON.stringify({
        ts: new Date().toISOString(),
        action,
        userId,
        resource,
        resourceId,
        ip,
        ua,
        metadata,
      }) + '\n'
      appendFileSync(logPath, line)
    } catch {}
  } catch {}
}
