import { getInvoicesFromNotion } from '@/lib/services/invoice.service'

export interface InvoiceStats {
  total: number
  pending: number
  approved: number
  rejected: number
  totalAmount: number
  approvalRate: number
}

export interface MonthlyStats {
  month: string
  count: number
  amount: number
}

export async function getInvoiceStats(): Promise<InvoiceStats> {
  const { invoices } = await getInvoicesFromNotion(100)

  const base = {
    total: 0,
    pending: 0,
    approved: 0,
    rejected: 0,
    totalAmount: 0,
  }
  const stats = invoices.reduce((acc, invoice) => {
    acc.total++
    acc[invoice.status]++
    acc.totalAmount += invoice.totalAmount
    return acc
  }, base)

  const approvalRate =
    stats.total > 0 ? Math.round((stats.approved / stats.total) * 100) : 0

  return { ...stats, approvalRate }
}

export async function getMonthlyStats(
  months: number = 3
): Promise<MonthlyStats[]> {
  const { invoices } = await getInvoicesFromNotion(100)

  const now = new Date()
  const result: MonthlyStats[] = []

  for (let i = months - 1; i >= 0; i--) {
    const date = new Date(now.getFullYear(), now.getMonth() - i, 1)
    const year = date.getFullYear()
    const month = date.getMonth()

    const monthInvoices = invoices.filter(inv => {
      const d = new Date(inv.issueDate)
      return d.getFullYear() === year && d.getMonth() === month
    })

    result.push({
      month: `${year}.${String(month + 1).padStart(2, '0')}`,
      count: monthInvoices.length,
      amount: monthInvoices.reduce((sum, inv) => sum + inv.totalAmount, 0),
    })
  }

  return result
}
