import * as React from 'react'
import { Slot } from '@radix-ui/react-slot'
import { cva, type VariantProps } from 'class-variance-authority'

import { cn } from '@/lib/utils'

const badgeVariants = cva(
  'inline-flex items-center justify-center rounded-md border px-1.5 py-0.5 text-[10px] font-medium gap-1 leading-tight',
  {
    variants: {
      variant: {
        default: 'border-transparent bg-brand-100 text-brand-700',
        secondary: 'border-neutral-200 bg-neutral-50 text-neutral-600',
        destructive: 'border-transparent bg-red-100 text-red-700',
        outline: 'border-neutral-200 bg-white text-neutral-600',
        success: 'border-transparent bg-green-100 text-green-700',
        warning: 'border-transparent bg-amber-100 text-amber-700',
        info: 'border-transparent bg-blue-100 text-blue-700',
        pending: 'border-transparent bg-yellow-100 text-yellow-700',
        revision: 'border-transparent bg-purple-100 text-purple-700',
        draft: 'border-transparent bg-neutral-100 text-neutral-600',
        error: 'border-transparent bg-red-100 text-red-700',
      },
      size: {
        xs: 'text-[9px] px-1 py-0',
        sm: 'text-[10px] px-1.5 py-0.5',
        default: 'text-xs px-2 py-0.5',
        lg: 'text-sm px-2.5 py-1',
      },
    },
    defaultVariants: {
      variant: 'default',
      size: 'sm',
    },
  },
)

export type BadgeVariant = VariantProps<typeof badgeVariants>

function Badge({
  className,
  variant,
  size,
  asChild = false,
  ...props
}: React.ComponentProps<'span'> & BadgeVariant & { asChild?: boolean }) {
  const Comp = asChild ? Slot : 'span'

  return (
    <Comp
      data-slot="badge"
      className={cn(badgeVariants({ variant, size }), className)}
      {...props}
    />
  )
}

export { Badge, badgeVariants }
