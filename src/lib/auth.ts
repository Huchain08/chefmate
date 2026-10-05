import { cookies } from 'next/headers'
import { db } from '@/lib/db'
import { env } from '@/lib/env'
import { generateToken, hashToken, constantTimeEqual } from '@/lib/password'
import { headers } from 'next/headers'

const SESSION_COOKIE = 'chefmate_session'
const CSRF_COOKIE = 'chefmate_csrf'
const SESSION_TTL_DAYS = 7

export interface SessionUser {
  id: string
  email: string
  name: string | null
  roles: string[]
  permissions: string[]
}

interface SessionRow {
  id: string
  userId: string
  tokenHash: string
  csrfToken: string
  expiresAt: Date
}

function cookieOptions() {
  return {
    httpOnly: true,
    secure: env.cookieSecure,
    sameSite: 'lax' as const,
    path: '/',
    maxAge: SESSION_TTL_DAYS * 24 * 60 * 60,
  }
}

async function getRequestContext(): Promise<{ ip: string; ua: string }> {
  const h = await headers()
  const xff = h.get('x-forwarded-for')
  const ip = (xff?.split(',')[0]?.trim()) || h.get('x-real-ip') || 'unknown'
  const ua = h.get('user-agent') || 'unknown'
  return { ip, ua }
}

export async function createSession(userId: string): Promise<{ sessionId: string; token: string; csrf: string }> {
  const token = generateToken(32)
  const csrf = generateToken(32)
  const tokenHash = hashToken(token)
  const { ip, ua } = await getRequestContext()
  const expiresAt = new Date(Date.now() + SESSION_TTL_DAYS * 24 * 60 * 60 * 1000)

  const session = await db.session.create({
    data: {
      userId,
      tokenHash,
      csrfToken: csrf,
      userAgent: ua,
      ipAddress: ip,
      expiresAt,
    },
  })

  const cookieStore = await cookies()
  cookieStore.set(SESSION_COOKIE, token, cookieOptions())
  cookieStore.set(CSRF_COOKIE, csrf, { ...cookieOptions(), httpOnly: false })
  return { sessionId: session.id, token, csrf }
}

export async function rotateSession(sessionId: string, userId: string): Promise<void> {
  // Rotate session ID on login per instruction.md §8
  const token = generateToken(32)
  const tokenHash = hashToken(token)
  await db.session.update({
    where: { id: sessionId },
    data: { tokenHash, rotatedFrom: sessionId },
  })
  const cookieStore = await cookies()
  cookieStore.set(SESSION_COOKIE, token, cookieOptions())
}

export async function destroySession(): Promise<void> {
  const cookieStore = await cookies()
  const token = cookieStore.get(SESSION_COOKIE)?.value
  if (token) {
    const tokenHash = hashToken(token)
    try {
      await db.session.updateMany({
        where: { tokenHash, revokedAt: null },
        data: { revokedAt: new Date() },
      })
    } catch {}
  }
  cookieStore.delete(SESSION_COOKIE)
  cookieStore.delete(CSRF_COOKIE)
}

export async function getCurrentSession(): Promise<{ session: SessionRow; user: SessionUser } | null> {
  const cookieStore = await cookies()
  const token = cookieStore.get(SESSION_COOKIE)?.value
  if (!token) return null

  const tokenHash = hashToken(token)
  const session = await db.session.findFirst({
    where: { tokenHash, revokedAt: null, expiresAt: { gt: new Date() } },
    include: {
      user: {
        include: {
          userRoles: { include: { role: { include: { permissions: { include: { permission: true } } } } } },
        },
      },
    },
  })
  if (!session) {
    cookieStore.delete(SESSION_COOKIE)
    cookieStore.delete(CSRF_COOKIE)
    return null
  }

  const roles = session.user.userRoles.map(ur => ur.role.name)
  const permissions = session.user.userRoles.flatMap(ur => ur.role.permissions.map(rp => rp.permission.action))

  return {
    session,
    user: {
      id: session.user.id,
      email: session.user.email,
      name: session.user.name,
      roles,
      permissions,
    },
  }
}

export async function getCurrentUser(): Promise<SessionUser | null> {
  const current = await getCurrentSession()
  return current?.user ?? null
}

export function hasPermission(user: SessionUser | null, permission: string): boolean {
  if (!user) return false
  if (user.roles.includes('admin')) return true
  return user.permissions.includes(permission)
}

export function requirePermission(user: SessionUser | null, permission: string): void {
  if (!hasPermission(user, permission)) {
    throw new Response('Forbidden', { status: 403 })
  }
}

export function requireAuth(user: SessionUser | null): void {
  if (!user) {
    throw new Response('Unauthorized', { status: 401 })
  }
}

// CSRF verification — double-submit cookie pattern
export async function verifyCsrf(req: Request): Promise<boolean> {
  const cookieStore = await cookies()
  const cookieCsrf = cookieStore.get(CSRF_COOKIE)?.value
  if (!cookieCsrf) return false

  const headerCsrf = req.headers.get('x-csrf-token')
  if (!headerCsrf) return false

  // Also check Origin/Referer for cross-site defense in depth
  const origin = req.headers.get('origin')
  const referer = req.headers.get('referer')
  const host = req.headers.get('host')
  if (origin && host && !origin.includes(host)) return false
  if (referer && host && !referer.includes(host)) return false

  return constantTimeEqual(cookieCsrf, headerCsrf)
}

export async function getCsrfToken(): Promise<string> {
  const cookieStore = await cookies()
  return cookieStore.get(CSRF_COOKIE)?.value ?? ''
}
