import { NextResponse } from 'next/server'
import { destroySession, verifyCsrf } from '@/lib/auth'
import { audit } from '@/lib/audit'
import { getCurrentUser } from '@/lib/auth'

export async function POST(req: Request) {
  if (!(await verifyCsrf(req))) {
    return NextResponse.json({ error: 'Invalid request.' }, { status: 403 })
  }
  const user = await getCurrentUser()
  await destroySession()
  if (user) await audit('logout', user.id)
  return NextResponse.json({ ok: true })
}
