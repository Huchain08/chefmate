import { NextRequest, NextResponse } from 'next/server'
import { getCurrentUser, verifyCsrf } from '@/lib/auth'
import { rateLimitFromRequest } from '@/lib/rate-limit'
import { env } from '@/lib/env'
import { audit } from '@/lib/audit'
import { db } from '@/lib/db'

const ALLOWED_TYPES = env.upload.allowedTypes
const MAX_BYTES = env.upload.maxBytes

// Magic-byte validation for the allowed image types
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

  const rl = rateLimitFromRequest(req, 'scan', env.rateLimits.apiPerMin, 60, user.id)
  if (!rl.ok) return NextResponse.json({ error: 'Too many requests.' }, { status: 429 })

  const formData = await req.formData().catch(() => null)
  if (!formData) return NextResponse.json({ error: 'Invalid request.' }, { status: 400 })
  const file = formData.get('file')
  if (!(file instanceof File)) return NextResponse.json({ error: 'No file uploaded.' }, { status: 400 })
  if (file.size > MAX_BYTES) return NextResponse.json({ error: 'File too large.' }, { status: 413 })
  if (!ALLOWED_TYPES.includes(file.type)) return NextResponse.json({ error: 'File type not allowed.' }, { status: 415 })

  const buf = Buffer.from(await file.arrayBuffer())
  const detected = detectMime(buf)
  if (!detected || !ALLOWED_TYPES.includes(detected)) {
    return NextResponse.json({ error: 'File content does not match an allowed image type.' }, { status: 415 })
  }

  // Persist upload metadata (NOT the bytes — we discard them after recognition).
  const storedName = `${Date.now()}-${Math.random().toString(36).slice(2, 10)}-${file.name.replace(/[^\w.-]/g, '_')}`
  await db.uploadedFile.create({
    data: {
      userId: user.id,
      filename: file.name.slice(0, 120),
      storedName,
      mimeType: detected,
      size: file.size,
      purpose: 'fridge-scan',
    },
  })

  await audit('scan.uploaded', user.id, { size: file.size, mime: detected })

  // Vision recognition via z-ai-web-dev-sdk when configured
  if (env.vision.enabled && env.vision.provider === 'zai' && env.vision.model) {
    try {
      const ZAI = (await import('z-ai-web-dev-sdk')).default
      const zai = await ZAI.create()
      const dataUrl = `data:${detected};base64,${buf.toString('base64')}`
      const prompt = `You are an ingredient recognition assistant. Look at this fridge or pantry photo and return a JSON array of detected ingredients. Each item should have a "name", "quantity" (estimated number), and "unit" (piece, g, ml, kg, etc). Return only JSON, no prose. If you cannot identify ingredients, return an empty array. Example: [{"name":"tomato","quantity":3,"unit":"piece"}]`
      const res: any = await zai.chat.completions.createVision({
        messages: [
          { role: 'user', content: [
            { type: 'text', text: prompt },
            { type: 'image_url', image_url: { url: dataUrl } },
          ] as any },
        ],
        model: env.vision.model,
      })
      const text = res?.choices?.[0]?.message?.content || '[]'
      // Extract JSON from the model output
      const jsonMatch = text.match(/\[[\s\S]*\]/)
      const ingredients = jsonMatch ? JSON.parse(jsonMatch[0]) : []
      return NextResponse.json({ ingredients })
    } catch (e: any) {
      await audit('scan.recognition_failed', user.id, { error: String(e?.message || e).slice(0, 200) })
      // Fall through to no-vision response
    }
  }

  // If vision is not configured or failed, return an empty list so the user
  // can add ingredients manually. This keeps the UX honest per instruction.md.
  return NextResponse.json({ ingredients: [], note: 'Vision service is not configured. Please add ingredients manually.' })
}
