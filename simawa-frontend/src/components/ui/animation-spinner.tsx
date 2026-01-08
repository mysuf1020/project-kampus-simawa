import { cn } from '@/lib/utils'

const AnimationSpinner = ({
  className,
  size = 24,
}: {
  className?: string
  size?: number
}) => {
  return (
    <div
      className={cn('loader-spin', 'text-brand-500', className)}
      style={{ width: size }}
    />
  )
}

export { AnimationSpinner }
