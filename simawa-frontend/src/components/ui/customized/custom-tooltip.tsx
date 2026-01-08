'use client'

import { Tooltip, TooltipContent, TooltipTrigger } from '@/components/ui/tooltip'
import { cn } from '@/lib/utils'

type CustomTooltipProps = {
  children?: React.ReactNode
  content: React.ReactNode
  className?: string
}

export function CustomTooltip({ children, content, className }: CustomTooltipProps) {
  return (
    <Tooltip>
      <TooltipTrigger>{children}</TooltipTrigger>
      <TooltipContent side="bottom" align="start" className={cn(className, 'px-2 py-1')}>
        {content}
      </TooltipContent>
    </Tooltip>
  )
}
