import * as React from 'react'
import { Slot } from '@radix-ui/react-slot'
import { cva, type VariantProps } from 'class-variance-authority'

import { cn } from '@/lib/utils'

const badgeVariants = cva(
  'inline-flex items-center justify-center rounded-xl border px-2 text-xs font-medium gap-5',
  {
    variants: {
      variant: {
        default: 'border-transparent bg-blue-100 text-blue-600',
        secondary:
          'border-transparent bg-neutral-100 text-neutral-700 [a&]:hover:bg-neutral-700',
        destructive:
          'border-transparent bg-red-100 text-red-600 [a&]:hover:bg-destructive/90 focus-visible:ring-destructive/20 dark:focus-visible:ring-destructive/40 dark:bg-destructive/60',
        outline: 'text-foreground [a&]:hover:bg-accent [a&]:hover:text-accent-foreground',
        success:
          'border-transparent bg-primary text-primary-foreground [a&]:hover:bg-primary/90 bg-green-100 text-green-600',
        warning:
          'border-transparent bg-orange-100 text-orange-700 [a&]:hover:bg-orange-700',
        settled: 'border-transparent bg-settled-bg-status text-settled-text-status',
        reconciled:
          'border-transparent bg-reconciled-bg-status text-reconciled-text-status',
        error: 'border-transparent bg-red-100 text-red-600 [a&]:hover:bg-red-600',
      },
    },
  },
)

export type BadgeVariant = VariantProps<typeof badgeVariants>

function Badge({
  className,
  variant,
  asChild = false,
  ...props
}: React.ComponentProps<'span'> & BadgeVariant & { asChild?: boolean }) {
  const Comp = asChild ? Slot : 'span'

  return (
    <Comp
      data-slot="badge"
      className={cn(badgeVariants({ variant }), className)}
      {...props}
    />
  )
}

export { Badge, badgeVariants }
