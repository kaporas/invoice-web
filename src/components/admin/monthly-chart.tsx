'use client'

import {
  AreaChart,
  Area,
  XAxis,
  CartesianGrid,
  Tooltip,
  ResponsiveContainer,
} from 'recharts'
import type { MonthlyStats } from '@/lib/services/stats.service'
import { formatCurrency } from '@/lib/format'

interface MonthlyChartProps {
  data: MonthlyStats[]
}

interface TooltipEntry {
  value?: number
  payload?: MonthlyStats
}

function ChartTooltip({
  active,
  payload,
  label,
}: {
  active?: boolean
  payload?: TooltipEntry[]
  label?: string
}) {
  if (!active || !payload?.length) return null

  const amount = payload[0]?.value ?? 0
  const count = payload[0]?.payload?.count ?? 0

  return (
    <div className="bg-background border-border rounded-xl border px-4 py-3 shadow-lg">
      <p className="text-muted-foreground mb-1 text-xs font-medium">{label}</p>
      <p className="text-foreground text-base font-bold">
        {formatCurrency(Number(amount))}
      </p>
      <p className="text-muted-foreground mt-0.5 text-xs">{count}건</p>
    </div>
  )
}

export function MonthlyChart({ data }: MonthlyChartProps) {
  return (
    <ResponsiveContainer width="100%" height={200}>
      <AreaChart data={data} margin={{ top: 8, right: 8, left: 0, bottom: 0 }}>
        <defs>
          <linearGradient id="amountGradient" x1="0" y1="0" x2="0" y2="1">
            <stop
              offset="0%"
              stopColor="hsl(var(--primary))"
              stopOpacity={0.25}
            />
            <stop
              offset="100%"
              stopColor="hsl(var(--primary))"
              stopOpacity={0}
            />
          </linearGradient>
        </defs>

        <CartesianGrid
          strokeDasharray="3 3"
          stroke="hsl(var(--border))"
          vertical={false}
        />

        <XAxis
          dataKey="month"
          axisLine={false}
          tickLine={false}
          tick={{ fontSize: 12, fill: 'hsl(var(--muted-foreground))' }}
          dy={6}
        />

        <Tooltip
          content={<ChartTooltip />}
          cursor={{
            stroke: 'hsl(var(--muted-foreground))',
            strokeWidth: 1,
            strokeDasharray: '4 4',
          }}
        />

        <Area
          type="monotone"
          dataKey="amount"
          stroke="hsl(var(--primary))"
          strokeWidth={2.5}
          fill="url(#amountGradient)"
          dot={false}
          activeDot={{
            r: 5,
            fill: 'hsl(var(--primary))',
            stroke: 'hsl(var(--background))',
            strokeWidth: 2,
          }}
        />
      </AreaChart>
    </ResponsiveContainer>
  )
}
