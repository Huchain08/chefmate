import { NextRequest, NextResponse } from 'next/server'
import { db } from '@/lib/db'
import { getCurrentUser, verifyCsrf, hasPermission } from '@/lib/auth'
import { rateLimitFromRequest } from '@/lib/rate-limit'
import { env } from '@/lib/env'
import { audit } from '@/lib/audit'
import { randomBytes } from 'crypto'
import { writeFileSync, mkdirSync } from 'fs'
import { join } from 'path'

const ALLOWED_TYPES = env.upload.allowedTypes
const MAX_BYTES = env.upload.maxBytes

function detectMime(buf: Buffer): string | null {
  if (buf.length < 4) return null
  if (buf[0] === 0xff && buf[1] === 0xd8 && buf[2] === 0xff) return 'image/jpeg'
  if (buf[0] === 0x89 && buf[1] === 0x50 && buf[2] === 0x4e && buf[3] === 0x47) return 'image/png'
  if (buf[0] === 0x52 && buf[1] === 0x49 && buf[2] === 0x46 && buf[3] === 0x46 &&
      buf[8] === 0x57 && buf[9] === 0x45 && buf[10] === 0x42 && buf[11] === 0x50) return 'image/webp'
  return null
}

export async function POST(req: NextRequest) {
  const user = await getCurrentUser()
  if (!user) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
  if (!hasPermission(user, 'media.upload')) return NextResponse.json({ error: 'Forbidden' }, { status: 403 })
  if (!(await verifyCsrf(req))) return NextResponse.json({ error: 'Invalid request.' }, { status: 403 })

  const rl = rateLimitFromRequest(req, 'media-upload', 10, 60, user.id)
  if (!rl.ok) return NextResponse.json({ error: 'Too many uploads. Try later.' }, { status: 429 })

  const formData = await req.formData().catch(() => null)
  if (!formData) return NextResponse.json({ error: 'Invalid request.' }, { status: 400 })
  const file = formData.get('file')
  if (!(file instanceof File)) return NextResponse.json({ error: 'No file.' }, { status: 400 })
  if (file.size > MAX_BYTES) return NextResponse.json({ error: 'File too large.' }, { status: 413 })
  if (!ALLOWED_TYPES.includes(file.type)) return NextResponse.json({ error: 'File type not allowed.' }, { status: 415 })

  const buf = Buffer.from(await file.arrayBuffer())
  const detected = detectMime(buf)
  if (!detected || !ALLOWED_TYPES.includes(detected)) {
    return NextResponse.json({ error: 'File content does not match an allowed image type.' }, { status: 415 })
  }

  // Random filename — do not use original name in URL
  const ext = detected.split('/')[1]
  const storedName = `${randomBytes(12).toString('hex')}.${ext}`
  const dir = join(process.cwd(), 'public', 'media')
  try { mkdirSync(dir, { recursive: true }) } catch {}
  writeFileSync(join(dir, storedName), buf)
  const url = `/media/${storedName}`

  const altText = (formData.get('alt') as string | null)?.toString().slice(0, 200) || null
  const asset = await db.mediaAsset.create({
    data: {
      filename: file.name.slice(0, 120),
      storedName,
      mimeType: detected,
      size: file.size,
      altText,
      url,
      uploadedBy: user.id,
    },
  })
  await audit('media.uploaded', user.id, { assetId: asset.id })

  return NextResponse.json({ ok: true, asset })
}
