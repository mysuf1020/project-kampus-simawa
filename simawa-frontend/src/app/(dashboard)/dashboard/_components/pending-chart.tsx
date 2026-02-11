'use client'

import {
  BarChart,
  Bar,
  XAxis,
  YAxis,
  CartesianGrid,
  Tooltip,
  ResponsiveContainer,
  Cell,
} from 'recharts'
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from '@/components/ui'
import type { DashboardSummary } from '@/lib/apis/dashboard'

type Props = {
  data?: DashboardSummary
  isLoading?: boolean
}

const COLORS = ['#f59e0b', '#3b82f6', '#ef4444', '#8b5cf6']

export function PendingChart({ data, isLoading }: Props) {
  const chartData = [
    {
      name: 'Aktivitas',
      value: data?.activities_pending ?? 0,
      color: COLORS[0],
    },
    {
      name: 'Surat',
      value: data?.surat_pending ?? 0,
      color: COLORS[1],
    },
    {
      name: 'LPJ',
      value: data?.lpj_pending ?? 0,
      color: COLORS[2],
    },
    {
      name: 'Cover',
      value: data?.cover_pending ?? 0,
      color: COLORS[3],
    },
  ]

  const totalPending = chartData.reduce((sum, item) => sum + item.value, 0)

  return (
    <Card className="border-neutral-200 shadow-sm h-full flex flex-col">
      <CardHeader className="pb-2 border-b border-neutral-100 bg-neutral-50/50">
        <div className="flex items-center justify-between">
          <div className="space-y-1">
            <CardTitle className="text-base font-semibold text-neutral-900">
              Item Menunggu Persetujuan
            </CardTitle>
            <CardDescription className="text-xs text-neutral-500">
              Total {totalPending} item perlu ditindaklanjuti
            </CardDescription>
          </div>
          <div className="flex items-center gap-1.5 rounded-full bg-amber-50 border border-amber-200 px-3 py-1">
            <span className="h-2 w-2 rounded-full bg-amber-500 animate-pulse" />
            <span className="text-xs font-semibold text-amber-700">
              {totalPending}
            </span>
          </div>
        </div>
      </CardHeader>
      <CardContent className="pt-4 flex-1">
        {isLoading ? (
          <div className="flex items-center justify-center h-[200px] text-neutral-400 text-sm">
            Memuat data...
          </div>
        ) : (
          <ResponsiveContainer width="100%" height={200}>
            <BarChart
              data={chartData}
              margin={{ top: 5, right: 10, left: -10, bottom: 5 }}
            >
              <CartesianGrid strokeDasharray="3 3" stroke="#f0f0f0" />
              <XAxis
                dataKey="name"
                tick={{ fontSize: 12, fill: '#737373' }}
                axisLine={{ stroke: '#e5e5e5' }}
                tickLine={false}
              />
              <YAxis
                allowDecimals={false}
                tick={{ fontSize: 12, fill: '#737373' }}
                axisLine={false}
                tickLine={false}
              />
              <Tooltip
                contentStyle={{
                  borderRadius: '8px',
                  border: '1px solid #e5e5e5',
                  boxShadow: '0 4px 6px -1px rgba(0,0,0,0.1)',
                  fontSize: '12px',
                }}
                formatter={(value) => [`${value} item`, 'Pending']}
              />
              <Bar dataKey="value" radius={[6, 6, 0, 0]} barSize={40}>
                {chartData.map((entry, index) => (
                  <Cell key={`cell-${index}`} fill={entry.color} />
                ))}
              </Bar>
            </BarChart>
          </ResponsiveContainer>
        )}

        <div className="grid grid-cols-2 gap-2 mt-4">
          {chartData.map((item) => (
            <div
              key={item.name}
              className="flex items-center gap-2 rounded-lg border border-neutral-100 px-3 py-2"
            >
              <span
                className="h-3 w-3 rounded-sm shrink-0"
                style={{ backgroundColor: item.color }}
              />
              <span className="text-xs text-neutral-600 flex-1">
                {item.name}
              </span>
              <span className="text-xs font-bold text-neutral-900">
                {item.value}
              </span>
            </div>
          ))}
        </div>
      </CardContent>
    </Card>
  )
}
