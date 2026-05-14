'use client'

import { useState } from 'react'
import { useRouter } from 'next/navigation'
import { toast } from 'sonner'
import { CheckCircle, XCircle } from 'lucide-react'
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogDescription,
  DialogFooter,
} from '@/components/ui/dialog'
import { Button } from '@/components/ui/button'
import type { InvoiceStatus } from '@/types/invoice'

interface InvoiceRespondButtonProps {
  invoiceId: string
  currentStatus: InvoiceStatus
}

export function InvoiceRespondButton({
  invoiceId,
  currentStatus,
}: InvoiceRespondButtonProps) {
  const [loading, setLoading] = useState(false)
  const [confirmAction, setConfirmAction] = useState<
    'approve' | 'reject' | null
  >(null)
  const router = useRouter()

  if (currentStatus !== 'pending') {
    return null
  }

  const handleRespond = async () => {
    if (!confirmAction) return
    setLoading(true)
    try {
      const res = await fetch(`/api/invoice/${invoiceId}/respond`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ response: confirmAction }),
      })

      const data = await res.json()
      if (!res.ok) throw new Error(data.error ?? '처리에 실패했습니다.')

      toast.success(
        confirmAction === 'approve'
          ? '견적서를 수락하셨습니다.'
          : '견적서를 거절하셨습니다.'
      )
      setConfirmAction(null)
      router.refresh()
    } catch (error) {
      toast.error(
        error instanceof Error ? error.message : '처리에 실패했습니다.'
      )
    } finally {
      setLoading(false)
    }
  }

  return (
    <>
      <div className="flex gap-3">
        <Button onClick={() => setConfirmAction('approve')} disabled={loading}>
          <CheckCircle className="mr-2 h-4 w-4" />
          수락
        </Button>
        <Button
          variant="destructive"
          onClick={() => setConfirmAction('reject')}
          disabled={loading}
        >
          <XCircle className="mr-2 h-4 w-4" />
          거절
        </Button>
      </div>

      <Dialog
        open={confirmAction !== null}
        onOpenChange={() => setConfirmAction(null)}
      >
        <DialogContent>
          <DialogHeader>
            <DialogTitle>
              견적서 {confirmAction === 'approve' ? '수락' : '거절'}
            </DialogTitle>
            <DialogDescription>
              이 견적서를 {confirmAction === 'approve' ? '수락' : '거절'}
              하시겠습니까? 이 작업은 되돌릴 수 없습니다.
            </DialogDescription>
          </DialogHeader>
          <DialogFooter>
            <Button
              variant="outline"
              onClick={() => setConfirmAction(null)}
              disabled={loading}
            >
              취소
            </Button>
            <Button
              variant={confirmAction === 'approve' ? 'default' : 'destructive'}
              onClick={handleRespond}
              disabled={loading}
            >
              {loading
                ? '처리 중...'
                : confirmAction === 'approve'
                  ? '수락'
                  : '거절'}
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </>
  )
}
