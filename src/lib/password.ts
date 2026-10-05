import { hash, verify } from '@node-rs/argon2'
import { env } from '@/lib/env'

const ARGON2_OPTIONS = {
  algorithm: 2,
  memoryCost: env.argon2.memoryKib,
  timeCost: env.argon2.iterations,
  parallelism: env.argon2.parallelism,
}

export async function hashPassword(password: string): Promise<string> {
  if (password.length < 8) {
    throw new Error('Password must be at least 8 characters')
  }
  if (password.length > 1024) {
    throw new Error('Password too long')
  }
  return hash(password, ARGON2_OPTIONS)
}

export async function verifyPassword(password: string, hash: string): Promise<boolean> {
  if (!password || !hash) return false
  try {
    return await verify(hash, password)
  } catch {
    return false
  }
}

// Strong, URL-safe random token using Node's crypto (no eval, no Math.random)
import { randomBytes, createHash, timingSafeEqual } from 'crypto'

export function generateToken(bytes = 32): string {
  return randomBytes(bytes).toString('base64url')
}

export function hashToken(token: string): string {
  return createHash('sha256').update(token).digest('hex')
}

export function constantTimeEqual(a: string, b: string): boolean {
  const ab = Buffer.from(a)
  const bb = Buffer.from(b)
  if (ab.length !== bb.length) return false
  return timingSafeEqual(ab, bb)
}
