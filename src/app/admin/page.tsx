import Link from 'next/link'
import { Suspense } from 'react'
import { Card, CardHeader, CardTitle, CardContent } from '@/components/ui/card'
import { Badge } from '@/components/ui/badge'
import { StatsCards, StatsCardsSkeleton } from '@/components/admin/stats-cards'
import { MonthlyChart } from '@/components/admin/monthly-chart'
import { ExpiryBadge } from '@/components/admin/expiry-badge'
import { getInvoicesFromNotion } from '@/lib/services/invoice.service'
import { getMonthlyStats } from '@/lib/services/stats.service'
import { formatCurrency, formatDate } from '@/lib/format'
import { isExpired, isExpiringSoon } from '@/lib/utils/invoice-helpers'
import { AlertTriangle, BarChart2, FileText } from 'lucide-react'

async function ExpirySection() {
  const { invoices } = await getInvoicesFromNotion(100)
  const expiring = invoices.filter(
    inv => inv.status === 'pending' && (isExpired(inv) || isExpiringSoon(inv))
  )

  if (expiring.length === 0) return null

  return (
    <Card className="border-orange-200 dark:border-orange-900">
      <CardHeader className="pb-3">
        <CardTitle className="flex items-center gap-2 text-base">
          <AlertTriangle className="h-4 w-4 text-orange-500" />
          만료 임박 견적서{' '}
          <Badge
            variant="outline"
            className="border-orange-500 text-orange-500"
          >
            {expiring.length}건
          </Badge>
        </CardTitle>
      </CardHeader>
      <CardContent>
        <ul className="space-y-2">
          {expiring.slice(0, 5).map(inv => (
            <li
              key={inv.id}
              className="flex items-center justify-between text-sm"
            >
              <Link
                href={`/invoice/${inv.id}`}
                target="_blank"
                className="hover:text-primary font-medium"
              >
                {inv.invoiceNumber}
              </Link>
              <div className="text-muted-foreground flex items-center gap-3">
                <span>{inv.clientName}</span>
                <span>{formatCurrency(inv.totalAmount)}</span>
                <span>{formatDate(inv.validUntil, 'short')}</span>
                <ExpiryBadge invoice={inv} />
              </div>
            </li>
          ))}
        </ul>
        {expiring.length > 5 && (
          <p className="text-muted-foreground mt-3 text-xs">
            외 {expiring.length - 5}건 —{' '}
            <Link href="/admin/invoices" className="underline">
              전체 목록 보기
            </Link>
          </p>
        )}
      </CardContent>
    </Card>
  )
}

async function ChartSection() {
  const data = await getMonthlyStats(3)
  return (
    <Card>
      <CardHeader className="pb-2">
        <CardTitle className="flex items-center gap-2 text-base">
          <BarChart2 className="text-muted-foreground h-4 w-4" />
          최근 3개월 매출
        </CardTitle>
      </CardHeader>
      <CardContent>
        <MonthlyChart data={data} />
      </CardContent>
    </Card>
  )
}

export default function AdminPage() {
  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-3xl font-bold">관리자 대시보드</h1>
        <p className="text-muted-foreground mt-2">
          견적서 관리 시스템에 오신 것을 환영합니다
        </p>
      </div>

      {/* 통계 카드 */}
      <Suspense fallback={<StatsCardsSkeleton />}>
        <StatsCards />
      </Suspense>

      {/* 만료 임박 알림 */}
      <Suspense fallback={null}>
        <ExpirySection />
      </Suspense>

      {/* 월별 매출 차트 */}
      <Suspense
        fallback={
          <Card>
            <CardContent className="h-[260px]" />
          </Card>
        }
      >
        <ChartSection />
      </Suspense>

      {/* 바로가기 카드 */}
      <div className="grid gap-4 md:grid-cols-2">
        <Link href="/admin/invoices" className="block">
          <Card className="hover:bg-muted/50 transition-colors">
            <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
              <CardTitle className="text-sm font-medium">견적서 관리</CardTitle>
              <FileText className="text-muted-foreground h-4 w-4" />
            </CardHeader>
            <CardContent>
              <p className="text-muted-foreground text-sm">
                발행한 모든 견적서를 확인하고 관리할 수 있습니다.
              </p>
            </CardContent>
          </Card>
        </Link>

        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">시작하기</CardTitle>
          </CardHeader>
          <CardContent>
            <p className="text-muted-foreground text-sm">
              왼쪽 사이드바에서 <strong>견적서 목록</strong>을 클릭하여 모든
              견적서를 확인하세요.
            </p>
          </CardContent>
        </Card>
      </div>
    </div>
  )
}
