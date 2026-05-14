import { Card, CardHeader, CardTitle, CardContent } from '@/components/ui/card'
import { Skeleton } from '@/components/ui/skeleton'
import { getInvoiceStats } from '@/lib/services/stats.service'
import { formatCurrency } from '@/lib/format'
import { FileText, Clock, CheckCircle, XCircle } from 'lucide-react'

export async function StatsCards() {
  const stats = await getInvoiceStats()

  return (
    <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-4">
      <Card>
        <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
          <CardTitle className="text-sm font-medium">전체 견적서</CardTitle>
          <FileText className="text-muted-foreground h-4 w-4" />
        </CardHeader>
        <CardContent>
          <div className="text-2xl font-bold">{stats.total}</div>
          <p className="text-muted-foreground text-xs">
            총액 {formatCurrency(stats.totalAmount)}
          </p>
        </CardContent>
      </Card>
      <Card>
        <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
          <CardTitle className="text-sm font-medium">대기</CardTitle>
          <Clock className="text-muted-foreground h-4 w-4" />
        </CardHeader>
        <CardContent>
          <div className="text-2xl font-bold">{stats.pending}</div>
          <p className="text-muted-foreground text-xs">검토 대기 중</p>
        </CardContent>
      </Card>
      <Card>
        <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
          <CardTitle className="text-sm font-medium">승인</CardTitle>
          <CheckCircle className="text-muted-foreground h-4 w-4" />
        </CardHeader>
        <CardContent>
          <div className="text-2xl font-bold">{stats.approved}</div>
          <p className="text-muted-foreground text-xs">
            승인율 {stats.approvalRate}%
          </p>
        </CardContent>
      </Card>
      <Card>
        <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
          <CardTitle className="text-sm font-medium">거절</CardTitle>
          <XCircle className="text-muted-foreground h-4 w-4" />
        </CardHeader>
        <CardContent>
          <div className="text-2xl font-bold">{stats.rejected}</div>
          <p className="text-muted-foreground text-xs">거절된 견적서</p>
        </CardContent>
      </Card>
    </div>
  )
}

export function StatsCardsSkeleton() {
  return (
    <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-4">
      {Array.from({ length: 4 }).map((_, i) => (
        <Card key={i}>
          <CardHeader className="pb-2">
            <Skeleton className="h-4 w-24" />
          </CardHeader>
          <CardContent>
            <Skeleton className="mb-1 h-8 w-12" />
            <Skeleton className="h-3 w-32" />
          </CardContent>
        </Card>
      ))}
    </div>
  )
}
