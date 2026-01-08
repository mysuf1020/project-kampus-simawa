import { PropsWithChildren } from 'react'
import { cn } from '@/lib/utils'

type TableRowProps = {
  className?: string
}

function TableRow({ children, className }: PropsWithChildren<TableRowProps>) {
  return <div className={cn('contents', className)}>{children}</div>
}
export { TableRow }
