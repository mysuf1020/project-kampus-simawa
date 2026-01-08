import { PropsWithChildren } from 'react'
import { cn } from '@/lib/utils'

type ContainerProps = {
  className?: string
}

const Container = (props: PropsWithChildren<ContainerProps>) => {
  const { children, className } = props
  return (
    <div
      className={cn(
        'container mx-auto px-4 sm:px-6 md:px-8 lg:px-10 xl:px-12',
        className,
      )}
    >
      {children}
    </div>
  )
}

export { Container }
