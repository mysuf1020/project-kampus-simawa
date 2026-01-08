'use client'

import * as React from 'react'
import * as RadioGroupPrimitive from '@radix-ui/react-radio-group'

import { cn } from '@/lib/utils'

export type RadioGroupProps = React.ComponentPropsWithoutRef<
  typeof RadioGroupPrimitive.Root
>

const RadioGroup = React.forwardRef<
  React.ElementRef<typeof RadioGroupPrimitive.Root>,
  RadioGroupProps
>(({ className, ...props }, ref) => {
  return (
    <RadioGroupPrimitive.Root
      className={cn('grid gap-2', className)}
      {...props}
      ref={ref}
    />
  )
})
RadioGroup.displayName = RadioGroupPrimitive.Root.displayName

const RadioGroupItem = React.forwardRef<
  React.ElementRef<typeof RadioGroupPrimitive.Item>,
  React.ComponentPropsWithoutRef<typeof RadioGroupPrimitive.Item>
>(({ className, id, children, ...props }, ref) => {
  return (
    <div className="flex flex-row items-center gap-x-1.5">
      <RadioGroupPrimitive.Item
        id={id}
        ref={ref}
        className={cn(
          'aspect-square h-3.5 w-3.5 rounded-full border-[2px] border-neutral-500 text-primary ring-offset-background hover:border-[2px] hover:border-main-500 focus:outline-none focus-visible:ring-2 focus-visible:ring-brand-300 focus-visible:ring-offset-2 disabled:cursor-not-allowed disabled:opacity-50',
          'data-[state=checked]:bg-main-500 data-[state=checked]:border-main-500 data-[state=checked]:hover:opacity-80 active:ring-4 active:bg-[#171a1e1c] active:ring-[#171a1e1c] disabled:bg-neutral-300 data-[state=checked]:disabled:opacity-60 transition',
          className,
        )}
        {...props}
      >
        <RadioGroupPrimitive.Indicator className="flex items-center justify-center">
          <div className="w-1.5 h-1.5 bg-white rounded-full" />
        </RadioGroupPrimitive.Indicator>
      </RadioGroupPrimitive.Item>
      <label htmlFor={id}>{children}</label>
    </div>
  )
})
RadioGroupItem.displayName = RadioGroupPrimitive.Item.displayName

export { RadioGroup, RadioGroupItem }
