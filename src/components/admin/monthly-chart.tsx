'use client'

import {
  BarChart,
  Bar,
  XAxis,
  YAxis,
  CartesianGrid,
  Tooltip,
  ResponsiveContainer,
} from 'recharts'
import type { MonthlyStats } from '@/lib/services/stats.service'
import { formatCurrency } from '@/lib/format'

interface MonthlyChartProps {
  data: MonthlyStats[]
}

export function MonthlyChart({ data }: MonthlyChartProps) {
  return (
    <ResponsiveContainer width="100%" height={200}>
      <BarChart data={data} margin={{ top: 4, right: 4, left: 0, bottom: 0 }}>
        <CartesianGrid strokeDasharray="3 3" className="stroke-border" />
        <XAxis
          dataKey="month"
          tick={{ fontSize: 12 }}
          className="fill-muted-foreground"
        />
        <YAxis
          tick={{ fontSize: 12 }}
          className="fill-muted-foreground"
          tickFormatter={v => `${(v / 10000).toFixed(0)}만`}
        />
        <Tooltip
          formatter={value => [formatCurrency(Number(value ?? 0)), '매출']}
          contentStyle={{
            borderRadius: '6px',
            fontSize: '12px',
          }}
        />
        <Bar
          dataKey="amount"
          name="매출"
          fill="hsl(var(--primary))"
          radius={[4, 4, 0, 0]}
        />
      </BarChart>
    </ResponsiveContainer>
  )
}
