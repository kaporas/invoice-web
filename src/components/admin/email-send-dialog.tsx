'use client'

import { useState } from 'react'
import { useForm } from 'react-hook-form'
import { zodResolver } from '@hookform/resolvers/zod'
import { z } from 'zod'
import { toast } from 'sonner'
import { Mail } from 'lucide-react'
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
} from '@/components/ui/dialog'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Label } from '@/components/ui/label'

const emailSchema = z.object({
  recipientEmail: z.string().email('유효한 이메일 주소를 입력하세요'),
})

type EmailFormData = z.infer<typeof emailSchema>

interface EmailSendDialogProps {
  invoiceId: string
  invoiceNumber: string
}

export function EmailSendDialog({
  invoiceId,
  invoiceNumber,
}: EmailSendDialogProps) {
  const [open, setOpen] = useState(false)
  const [sending, setSending] = useState(false)

  const {
    register,
    handleSubmit,
    formState: { errors },
    reset,
  } = useForm<EmailFormData>({
    resolver: zodResolver(emailSchema),
  })

  const onSubmit = async (data: EmailFormData) => {
    setSending(true)
    try {
      const response = await fetch('/api/send-invoice-email', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          invoiceId,
          recipientEmail: data.recipientEmail,
        }),
      })

      const result = await response.json()
      if (!response.ok) {
        throw new Error(result.error ?? '이메일 발송에 실패했습니다.')
      }

      toast.success(
        `${invoiceNumber} 견적서가 ${data.recipientEmail}로 발송되었습니다`
      )
      reset()
      setOpen(false)
    } catch (error) {
      toast.error(
        error instanceof Error ? error.message : '이메일 발송에 실패했습니다.'
      )
    } finally {
      setSending(false)
    }
  }

  return (
    <>
      <Button
        variant="ghost"
        size="icon"
        className="h-8 w-8"
        onClick={() => setOpen(true)}
      >
        <Mail className="h-4 w-4" />
        <span className="sr-only">이메일 발송</span>
      </Button>

      <Dialog open={open} onOpenChange={setOpen}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>견적서 이메일 발송</DialogTitle>
          </DialogHeader>
          <form onSubmit={handleSubmit(onSubmit)} className="space-y-4">
            <p className="text-muted-foreground text-sm">
              <strong>{invoiceNumber}</strong> 견적서 링크를 이메일로
              발송합니다.
            </p>
            <div className="space-y-1">
              <Label htmlFor="email">수신 이메일</Label>
              <Input
                id="email"
                type="email"
                placeholder="client@example.com"
                {...register('recipientEmail')}
              />
              {errors.recipientEmail && (
                <p className="text-destructive text-sm">
                  {errors.recipientEmail.message}
                </p>
              )}
            </div>
            <div className="flex justify-end gap-2">
              <Button
                type="button"
                variant="outline"
                onClick={() => setOpen(false)}
              >
                취소
              </Button>
              <Button type="submit" disabled={sending}>
                {sending ? '발송 중...' : '발송'}
              </Button>
            </div>
          </form>
        </DialogContent>
      </Dialog>
    </>
  )
}
