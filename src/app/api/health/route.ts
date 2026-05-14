import { NextResponse } from 'next/server'
import { env } from '@/lib/env'

export const runtime = 'nodejs'

export async function GET() {
  return NextResponse.json({
    status: 'ok',
    timestamp: new Date().toISOString(),
    env: env.NODE_ENV,
  })
}
