'use client'

import * as React from 'react'
import * as SeparatorPrimitive from '@radix-ui/react-separator'

import { cn } from '@/lib/utils'
import { Text } from './typography/text'

const Separator = React.forwardRef<
  React.ElementRef<typeof SeparatorPrimitive.Root>,
  React.ComponentPropsWithoutRef<typeof SeparatorPrimitive.Root> & {
    label?: string
    labelClassName?: string
    borderColor?: 'primary' | 'secondary' | 'tertiary'
    style?: 'solid' | 'dashed'
  }
>(
  (
    {
      className,
      orientation = 'horizontal',
      borderColor = 'primary',
      decorative = true,
      label,
      labelClassName,
      style = 'solid',
      ...props
    },
    ref,
  ) => (
    <div
      className="relative"
      style={{ height: orientation === 'horizontal' ? 'auto' : '100%' }}
    >
      {style == 'solid' && (
        <SeparatorPrimitive.Root
          ref={ref}
          decorative={decorative}
          orientation={orientation}
          className={cn(
            'shrink-0',
            borderColor === 'primary' && 'bg-border',
            borderColor === 'secondary' && 'bg-border-secondary',
            borderColor === 'tertiary' && 'bg-border-tertiary',
            orientation === 'horizontal' ? 'h-[1px] w-full' : 'h-full w-[1px]',
            className,
          )}
          {...props}
        />
      )}
      {style == 'dashed' && (
        <svg
          xmlns="http://www.w3.org/2000/svg"
          className={cn(
            orientation === 'horizontal' ? 'w-full h-0.5' : 'h-full w-0.5',
            className,
          )}
        >
          <line
            x1="0"
            y1="1"
            x2="100%"
            y2="1"
            height={2}
            strokeDasharray={'10,5'}
            strokeWidth={1}
            className={cn(
              borderColor === 'primary' && 'stroke-border',
              borderColor === 'secondary' && 'stroke-border-secondary',
              borderColor === 'tertiary' && 'stroke -border-tertiary',
            )}
          />
        </svg>
      )}
      {label && (
        <div className="absolute top-[-12px] left-0 right-0 flex justify-center">
          <Text
            className={cn(
              'mx-auto inline bg-white px-3 text-neutral-700',
              labelClassName,
            )}
          >
            {label}
          </Text>
        </div>
      )}
    </div>
  ),
)
Separator.displayName = SeparatorPrimitive.Root.displayName

export { Separator }
