import { FC, PropsWithChildren, ReactNode } from 'react'
import { cn } from '@/lib/utils'

type PageSectionProps = PropsWithChildren<{
  title?: ReactNode
  className?: string
  id?: string | undefined
}>

const PageSection: FC<PageSectionProps> = ({ id, title, children, className }) => {
  return (
    <div className="flex flex-col gap-y-3" id={id}>
      {title && <div className="text-secondary text-sm font-semibold">{title}</div>}

      <div
        className={cn(
          'bg-white rounded-lg border border-border-tertiary py-6 px-7',
          className,
        )}
      >
        {children}
      </div>
    </div>
  )
}

export { PageSection }
