import { NextRequest, NextResponse } from 'next/server'
import { z } from 'zod'
import { updateInvoiceStatus } from '@/lib/services/invoice.service'
import { checkRateLimit } from '@/lib/rate-limit'
import { revalidateTag } from 'next/cache'
import { logger } from '@/lib/logger'

const requestSchema = z.object({
  response: z.enum(['approve', 'reject']),
})

export async function POST(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  const { id } = await params

  const ip =
    request.headers.get('x-forwarded-for') ??
    request.headers.get('x-real-ip') ??
    'unknown'

  // 건당 24시간 3회 제한
  const rateResult = checkRateLimit(`respond:${ip}:${id}`, 3, 60000 * 60 * 24)
  if (!rateResult.allowed) {
    return NextResponse.json(
      { error: '이미 응답하셨거나 너무 많은 요청입니다.' },
      { status: 429 }
    )
  }

  let body: unknown
  try {
    body = await request.json()
  } catch {
    return NextResponse.json({ error: '잘못된 요청입니다.' }, { status: 400 })
  }

  const parsed = requestSchema.safeParse(body)
  if (!parsed.success) {
    return NextResponse.json(
      { error: '유효하지 않은 응답입니다.' },
      { status: 400 }
    )
  }

  const status = parsed.data.response === 'approve' ? 'approved' : 'rejected'

  try {
    await updateInvoiceStatus(id, status)
    revalidateTag('invoice')
    logger.info('클라이언트 견적서 응답 완료', { invoiceId: id, status })
    return NextResponse.json({ success: true })
  } catch (error) {
    const message =
      error instanceof Error ? error.message : '처리에 실패했습니다.'
    const isConflict = message.includes('이미 처리된')
    logger.error('견적서 응답 처리 실패', { invoiceId: id }, error as Error)
    return NextResponse.json(
      { error: message },
      { status: isConflict ? 409 : 500 }
    )
  }
}
