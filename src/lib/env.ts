// Server-side environment variable validation.
// Public, non-secret variables prefixed with NEXT_PUBLIC_.
// Private variables are NEVER exposed to the client bundle.
// Fails fast when a required variable is missing in production.

function required(name: string, value: string | undefined): string {
  if (!value || value.trim() === '') {
    if (process.env.NODE_ENV === 'production') {
      throw new Error(`Missing required environment variable: ${name}`)
    }
    // In dev, fall back to a safe placeholder that does not get used in prod.
    return ''
  }
  return value.trim()
}

function asInt(name: string, value: string | undefined, fallback: number): number {
  const n = Number(value)
  if (!Number.isFinite(n) || n <= 0) return fallback
  return Math.floor(n)
}

function asBool(value: string | undefined, fallback = false): boolean {
  if (value === undefined) return fallback
  return value === '1' || value.toLowerCase() === 'true' || value.toLowerCase() === 'yes'
}

export const env = {
  nodeEnv: process.env.NODE_ENV ?? 'development',
  isProd: process.env.NODE_ENV === 'production',
  isDev: process.env.NODE_ENV !== 'production',

  appName: process.env.NEXT_PUBLIC_APP_NAME || 'ChefMate',
  primaryDomain: process.env.NEXT_PUBLIC_PRIMARY_DOMAIN || 'localhost:3000',
  siteUrl: process.env.NEXT_PUBLIC_SITE_URL || 'http://localhost:3000',

  // In dev, use DIRECT_URL to bypass pgbouncer connection limits
  databaseUrl: required('DATABASE_URL', process.env.DIRECT_URL || process.env.DATABASE_URL),
  sessionSecret: required('SESSION_SECRET', process.env.SESSION_SECRET),
  passwordResetSecret: required('PASSWORD_RESET_SECRET', process.env.PASSWORD_RESET_SECRET),
  cookieSecure: asBool(process.env.COOKIE_SECURE, false),

  argon2: {
    memoryKib: asInt('ARGON2_MEMORY_KIB', process.env.ARGON2_MEMORY_KIB, 19456),
    iterations: asInt('ARGON2_ITERATIONS', process.env.ARGON2_ITERATIONS, 2),
    parallelism: asInt('ARGON2_PARALLELISM', process.env.ARGON2_PARALLELISM, 1),
  },

  rateLimits: {
    loginPerMin: asInt('RATE_LIMIT_LOGIN_PER_MIN', process.env.RATE_LIMIT_LOGIN_PER_MIN, 5),
    passwordResetPerHour: asInt('RATE_LIMIT_PASSWORD_RESET_PER_HOUR', process.env.RATE_LIMIT_PASSWORD_RESET_PER_HOUR, 3),
    contactPerHour: asInt('RATE_LIMIT_CONTACT_PER_HOUR', process.env.RATE_LIMIT_CONTACT_PER_HOUR, 5),
    registerPerHour: asInt('RATE_LIMIT_REGISTER_PER_HOUR', process.env.RATE_LIMIT_REGISTER_PER_HOUR, 5),
    apiPerMin: asInt('RATE_LIMIT_API_PER_MIN', process.env.RATE_LIMIT_API_PER_MIN, 60),
  },

  upload: {
    maxBytes: asInt('UPLOAD_MAX_BYTES', process.env.UPLOAD_MAX_BYTES, 5 * 1024 * 1024),
    allowedTypes: (process.env.UPLOAD_ALLOWED_TYPES || 'image/jpeg,image/png,image/webp').split(',').map(s => s.trim()).filter(Boolean),
  },

  youtube: {
    apiKey: process.env.YOUTUBE_API_KEY || '',
    baseQuery: process.env.YOUTUBE_SEARCH_BASE_QUERY || 'recipe',
  },

  grocery: {
    provider: process.env.GROCERY_PROVIDER || '',
    apiKey: process.env.GROCERY_API_KEY || '',
    apiUrl: process.env.GROCERY_API_BASE_URL || '',
    partnerName: process.env.GROCERY_PARTNER_NAME || '',
    configured: Boolean(process.env.GROCERY_PROVIDER && process.env.GROCERY_API_KEY && process.env.GROCERY_API_BASE_URL),
  },

  vision: {
    provider: process.env.VISION_PROVIDER || '',
    model: process.env.VISION_MODEL || '',
    enabled: Boolean(process.env.VISION_PROVIDER),
  },

  ownerContactEmail: process.env.OWNER_CONTACT_EMAIL || 'huchainy2@gmail.com',
  auditLogPath: process.env.AUDIT_LOG_PATH || './logs/audit.log',
}

export type Env = typeof env

// Public env passed to client bundles. Only safe, non-secret values.
export const publicEnv = {
  appName: env.appName,
  primaryDomain: env.primaryDomain,
  siteUrl: env.siteUrl,
  groceryConfigured: env.grocery.configured,
  groceryPartnerName: env.grocery.partnerName,
  visionEnabled: env.vision.enabled,
  ownerContactEmail: env.ownerContactEmail,
} as const
