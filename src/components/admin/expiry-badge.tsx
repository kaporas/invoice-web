import { Badge } from '@/components/ui/badge'
import type { Invoice } from '@/types/invoice'
import {
  getDaysUntilExpiry,
  isExpired,
  isExpiringSoon,
} from '@/lib/utils/invoice-helpers'

interface ExpiryBadgeProps {
  invoice: Invoice
}

export function ExpiryBadge({ invoice }: ExpiryBadgeProps) {
  if (isExpired(invoice)) {
    return <Badge variant="destructive">만료</Badge>
  }
  if (isExpiringSoon(invoice)) {
    const days = getDaysUntilExpiry(invoice)
    return (
      <Badge
        variant="outline"
        className="border-orange-500 text-orange-500 dark:text-orange-400"
      >
        D-{days}
      </Badge>
    )
  }
  return null
}
