import { NextResponse } from 'next/server'

// Health check that does not leak details per instruction.md §9.19
export async function GET() {
  return NextResponse.json({ status: 'ok' }, { status: 200 })
}
