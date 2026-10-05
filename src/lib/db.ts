import { PrismaClient } from '@prisma/client'
import { env } from './env'

const globalForPrisma = globalThis as unknown as {
  prisma: PrismaClient | undefined
}

// In dev, use DIRECT_URL to bypass pgbouncer connection limits (1 connection)
const connectionString = env.isDev 
  ? process.env.DIRECT_URL || process.env.DATABASE_URL 
  : process.env.DATABASE_URL

export const db =
  globalForPrisma.prisma ??
  new PrismaClient({
    datasources: connectionString ? {
      db: { url: connectionString }
    } : undefined,
    log: process.env.NODE_ENV === 'production' ? ['error'] : ['error', 'warn'],
  })

if (process.env.NODE_ENV !== 'production') globalForPrisma.prisma = db