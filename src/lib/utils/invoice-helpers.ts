import type { Invoice } from '@/types/invoice'

export function getDaysUntilExpiry(invoice: Invoice): number {
  const today = new Date()
  today.setHours(0, 0, 0, 0)
  const expiry = new Date(invoice.validUntil)
  expiry.setHours(0, 0, 0, 0)
  return Math.ceil((expiry.getTime() - today.getTime()) / (1000 * 60 * 60 * 24))
}

export function isExpired(invoice: Invoice): boolean {
  return getDaysUntilExpiry(invoice) < 0
}

export function isExpiringSoon(invoice: Invoice, days: number = 7): boolean {
  const daysLeft = getDaysUntilExpiry(invoice)
  return daysLeft >= 0 && daysLeft <= days
}
