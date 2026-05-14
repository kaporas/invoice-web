import { Resend } from 'resend'
import { env } from '@/lib/env'
import { formatCurrency, formatDate } from '@/lib/format'

interface SendInvoiceEmailParams {
  to: string
  invoiceNumber: string
  clientName: string
  amount: number
  validUntil: string
  invoiceUrl: string
}

export async function sendInvoiceEmail(
  params: SendInvoiceEmailParams
): Promise<void> {
  if (!env.RESEND_API_KEY) {
    throw new Error(
      '이메일 서비스가 설정되지 않았습니다 (RESEND_API_KEY 미설정)'
    )
  }

  const resend = new Resend(env.RESEND_API_KEY)
  const from = env.RESEND_FROM_EMAIL ?? 'onboarding@resend.dev'
  const { to, invoiceNumber, clientName, amount, validUntil, invoiceUrl } =
    params

  const { error } = await resend.emails.send({
    from,
    to,
    subject: `[견적서] ${invoiceNumber} 안내드립니다`,
    html: `
      <!DOCTYPE html>
      <html lang="ko">
      <body style="font-family: sans-serif; color: #333; max-width: 600px; margin: 0 auto; padding: 24px;">
        <h2 style="font-size: 20px; margin-bottom: 8px;">견적서 안내</h2>
        <p style="color: #666;">안녕하세요, ${clientName}님.</p>
        <p style="color: #666;">아래 견적서를 확인해 주세요.</p>

        <table style="width: 100%; border-collapse: collapse; margin: 24px 0;">
          <tr style="border-bottom: 1px solid #eee;">
            <td style="padding: 10px 0; color: #888; width: 120px;">견적서 번호</td>
            <td style="padding: 10px 0; font-weight: bold;">${invoiceNumber}</td>
          </tr>
          <tr style="border-bottom: 1px solid #eee;">
            <td style="padding: 10px 0; color: #888;">총액</td>
            <td style="padding: 10px 0; font-weight: bold;">${formatCurrency(amount)}</td>
          </tr>
          <tr>
            <td style="padding: 10px 0; color: #888;">유효기간</td>
            <td style="padding: 10px 0;">${formatDate(validUntil, 'long')}</td>
          </tr>
        </table>

        <a href="${invoiceUrl}"
           style="display: inline-block; background: #000; color: #fff; padding: 12px 24px;
                  text-decoration: none; border-radius: 6px; font-size: 14px;">
          견적서 확인하기
        </a>

        <p style="margin-top: 32px; font-size: 12px; color: #aaa;">
          문의사항은 발행자에게 직접 연락해 주세요.
        </p>
      </body>
      </html>
    `,
  })

  if (error) {
    throw new Error(`이메일 발송 실패: ${error.message}`)
  }
}
