import { FC, PropsWithChildren } from 'react'
import { cn } from '@/lib/utils'

type PageBodyProps = PropsWithChildren<{
  className?: string
}>

const PageBody: FC<PageBodyProps> = ({ children, className }) => {
  return (
    <div className={cn('flex-1 animate-in fade-in duration-500', className)}>
      {children}
    </div>
  )
}

export { PageBody }
