'use client'

import * as React from 'react'
import { Slot } from '@radix-ui/react-slot'
import { cva, type VariantProps } from 'class-variance-authority'

import { cn } from '@/lib/utils'
import { Spinner } from './spinner'

const buttonVariants = cva(
  'inline-flex items-center justify-center gap-1.5 whitespace-nowrap rounded-lg text-sm font-medium transition-all duration-200 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-brand-500/30 focus-visible:ring-offset-1 disabled:pointer-events-none disabled:opacity-50',
  {
    variants: {
      variant: {
        default:
          'bg-brand-600 text-white shadow-sm hover:bg-brand-700 active:bg-brand-800',
        destructive: 'bg-red-600 text-white shadow-sm hover:bg-red-700 active:bg-red-800',
        success:
          'bg-green-600 text-white shadow-sm hover:bg-green-700 active:bg-green-800',
        warning:
          'bg-amber-500 text-white shadow-sm hover:bg-amber-600 active:bg-amber-700',
        outline:
          'border border-neutral-200 bg-white text-neutral-700 shadow-sm hover:bg-neutral-50 hover:border-neutral-300 active:bg-neutral-100',
        secondary:
          'bg-neutral-100 text-neutral-700 hover:bg-neutral-200 active:bg-neutral-300',
        ghost:
          'text-neutral-600 hover:bg-neutral-100 hover:text-neutral-900 active:bg-neutral-200',
        link: 'text-brand-600 underline-offset-4 hover:underline',
        icon: 'h-8 w-8 rounded-lg text-neutral-600 hover:bg-neutral-100 hover:text-neutral-900',
      },
      size: {
        xs: 'h-6 px-2 text-xs rounded-md',
        sm: 'h-7 px-2.5 text-xs',
        default: 'h-8 px-3 py-1.5',
        lg: 'h-9 px-4',
        xl: 'h-10 px-5',
        icon: 'h-8 w-8',
      },
    },
    defaultVariants: {
      variant: 'default',
      size: 'default',
    },
  },
)

export interface ButtonProps
  extends
    React.ButtonHTMLAttributes<HTMLButtonElement>,
    VariantProps<typeof buttonVariants> {
  asChild?: boolean
  isLoading?: boolean
}

const Button = React.forwardRef<HTMLButtonElement, ButtonProps>(
  ({ className, variant, size, asChild = false, isLoading, children, ...props }, ref) => {
    const Comp = asChild ? Slot : 'button'

    return (
      <Comp
        className={cn(
          buttonVariants({ variant, size }),
          className,
          isLoading && 'pointer-events-none opacity-80',
        )}
        ref={ref}
        {...props}
      >
        {!asChild && isLoading && <Spinner size="sm" />}
        {children}
      </Comp>
    )
  },
)
Button.displayName = 'Button'

export { Button, buttonVariants }
