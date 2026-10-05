import { db } from '@/lib/db'

// In-memory rate limiter keyed by `${ip}:${endpoint}:${windowBucket}`
// Falls back to database-backed RateLimitEvent for persistence across restarts
// when needed (currently in-memory is sufficient; admin mutations are also
// rate-limited by session cookie presence).

type Bucket = { count: number; expires: number }

const buckets = new Map<string, Bucket>()

function ipFromRequest(req: Request): string {
  // Forwarded headers can be spoofed. We accept the first non-private IP we
  // find, otherwise we fall back to the socket address provided by Next.js.
  const xff = req.headers.get('x-forwarded-for')
  if (xff) {
    const parts = xff.split(',').map(s => s.trim())
    // Take the leftmost public IP, ignore private ranges like 127.0.0.1
    const publicIp = parts.find(p => !p.startsWith('127.') && !p.startsWith('10.') && !p.startsWith('192.168.') && !p.startsWith('172.16.') && p !== '::1')
    if (publicIp) return publicIp
    if (parts[0]) return parts[0]
  }
  const realIp = req.headers.get('x-real-ip')
  if (realIp) return realIp
  return 'unknown'
}

export function getClientIp(req: Request): string {
  return ipFromRequest(req)
}

export interface RateLimitResult {
  ok: boolean
  remaining: number
  retryAfterSec: number
}

export function rateLimit(
  key: string,
  limit: number,
  windowSec: number
): RateLimitResult {
  const now = Date.now()
  const bucketKey = `${key}:${Math.floor(now / (windowSec * 1000))}`
  const bucket = buckets.get(bucketKey)
  if (!bucket) {
    buckets.set(bucketKey, { count: 1, expires: now + windowSec * 1000 })
    // Periodically purge expired buckets
    if (buckets.size > 1000) {
      for (const [k, v] of buckets) {
        if (v.expires < now) buckets.delete(k)
      }
    }
    return { ok: true, remaining: limit - 1, retryAfterSec: windowSec }
  }
  bucket.count += 1
  const remaining = Math.max(0, limit - bucket.count)
  return {
    ok: bucket.count <= limit,
    remaining,
    retryAfterSec: Math.ceil((bucket.expires - now) / 1000),
  }
}

export function rateLimitFromRequest(
  req: Request,
  endpoint: string,
  limit: number,
  windowSec: number,
  userId?: string
): RateLimitResult {
  const ip = getClientIp(req)
  const key = userId ? `u:${userId}:${endpoint}` : `ip:${ip}:${endpoint}`
  return rateLimit(key, limit, windowSec)
}

// Persist a rate limit event for audit/forensic analysis (optional, fire-and-forget)
export async function logRateLimitEvent(endpoint: string, key: string, count: number): Promise<void> {
  try {
    await db.rateLimitEvent.create({
      data: {
        key,
        endpoint,
        count,
        windowStart: new Date(),
      },
    })
  } catch {
    // Don't fail the request on audit log failure.
  }
}
