'use client'

import * as React from 'react'
import { Slot } from '@radix-ui/react-slot'
import { cva, type VariantProps } from 'class-variance-authority'

import { cn } from '@/lib/utils'
import { Spinner } from './spinner'

const buttonVariants = cva(
  'inline-flex items-center justify-center gap-2 whitespace-nowrap rounded-md text-sm font-semibold transition-colors focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring focus-visible:ring-offset-2 disabled:pointer-events-none',
  {
    variants: {
      variant: {
        default:
          'bg-brand-500 text-white shadow-sm hover:bg-brand-600 disabled:bg-neutral-200',
        outline:
          'border border-main-500 text-main-600 hover:bg-main-50 disabled:border-neutral-200 disabled:text-neutral-400',
        secondary:
          'bg-neutral-100 text-neutral-900 hover:bg-neutral-200 disabled:text-neutral-400',
        ghost: 'hover:bg-neutral-100 text-neutral-900',
        link: 'text-blue-500 underline-offset-4 hover:underline',
        icon: 'h-9 w-9 rounded-full text-neutral-700 hover:bg-neutral-100 disabled:text-neutral-400',
      },
      size: {
        xs: 'h-7 px-2 text-xs',
        sm: 'h-8 px-3',
        default: 'h-10 px-4 py-2',
        lg: 'h-11 px-8',
        icon: 'h-9 w-9',
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
