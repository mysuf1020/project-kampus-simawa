import {
  Card,
  CardContent,
  CardHeader,
  CardTitle,
} from '@/components/ui'
import { cn } from '@/lib/utils'
import { LucideIcon } from 'lucide-react'

type StatItem = {
  label: string
  value: string | number
  trend: string
  icon?: LucideIcon
  variant?: 'neutral' | 'success' | 'warning' | 'info'
}

type Props = {
  items: StatItem[]
}

const variants = {
  neutral: 'text-neutral-600 bg-neutral-100',
  success: 'text-green-600 bg-green-100',
  warning: 'text-amber-600 bg-amber-100',
  info: 'text-blue-600 bg-blue-100',
}

export function StatsGrid({ items }: Props) {
  return (
    <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-3">
      {items.map((item, idx) => {
        const Icon = item.icon
        const variantClass = variants[item.variant || 'neutral']

        return (
          <Card
            key={item.label + idx}
            className="border-neutral-200 shadow-sm hover:shadow-md transition-all duration-200"
          >
            <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
              <CardTitle className="text-sm font-medium text-neutral-500">
                {item.label}
              </CardTitle>
              {Icon && (
                <div className={cn("rounded-lg p-2", variantClass)}>
                  <Icon className="h-4 w-4" />
                </div>
              )}
            </CardHeader>
            <CardContent>
              <div className="text-2xl font-bold text-neutral-900">{item.value}</div>
              <p className="text-xs text-neutral-500 mt-1">
                {item.trend}
              </p>
            </CardContent>
          </Card>
        )
      })}
    </div>
  )
}
