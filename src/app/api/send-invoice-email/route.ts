import { NextRequest, NextResponse } from 'next/server'
import { z } from 'zod'
import { sendInvoiceEmail } from '@/lib/services/email.service'
import { getInvoiceFromNotion } from '@/lib/services/invoice.service'
import { generateInvoiceUrl } from '@/lib/utils/link-generator'
import { checkRateLimit } from '@/lib/rate-limit'
import { logger } from '@/lib/logger'

const requestSchema = z.object({
  invoiceId: z.string().min(1),
  recipientEmail: z.string().email(),
})

export async function POST(request: NextRequest) {
  const ip =
    request.headers.get('x-forwarded-for') ??
    request.headers.get('x-real-ip') ??
    'unknown'

  const rateResult = checkRateLimit(`email:${ip}`, 5, 60000)
  if (!rateResult.allowed) {
    return NextResponse.json(
      { error: '너무 많은 요청입니다. 잠시 후 다시 시도하세요.' },
      { status: 429, headers: { 'Retry-After': String(rateResult.retryAfter) } }
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
      { error: '유효하지 않은 입력입니다.' },
      { status: 400 }
    )
  }

  const { invoiceId, recipientEmail } = parsed.data

  try {
    const invoice = await getInvoiceFromNotion(invoiceId)
    const invoiceUrl = generateInvoiceUrl(invoiceId)

    await sendInvoiceEmail({
      to: recipientEmail,
      invoiceNumber: invoice.invoiceNumber,
      clientName: invoice.clientName,
      amount: invoice.totalAmount,
      validUntil: invoice.validUntil,
      invoiceUrl,
    })

    logger.info('이메일 발송 완료', { invoiceId, recipientEmail })
    return NextResponse.json({ success: true })
  } catch (error) {
    const message =
      error instanceof Error ? error.message : '이메일 발송에 실패했습니다.'
    logger.error('이메일 발송 실패', { invoiceId }, error as Error)
    return NextResponse.json({ error: message }, { status: 500 })
  }
}
