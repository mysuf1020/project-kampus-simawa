import React from 'react'
import { parseDecimal } from '@/lib/helper/number'
import { cn } from '@/lib/utils'
import { Input, InputProps } from './input'

type InputNumberProps = InputProps & {
  isCurrency?: boolean
  maxInput?: number
  minInput?: number
}

const minmax = (value: string, minmax: { minInput?: number; maxInput?: number }) => {
  const result = parseDecimal(value)
  if (minmax.minInput && result < minmax.minInput) {
    return String(minmax.minInput)
  }
  if (minmax.maxInput && result > minmax.maxInput) {
    return String(minmax.maxInput)
  }
  return value
}

const InputNumber = React.forwardRef<
  HTMLInputElement,
  React.ComponentProps<'input'> & InputNumberProps
>(({ className = false, isCurrency, minInput, maxInput, ...props }, ref) => {
  return (
    <Input
      type="tel"
      className={cn(className)}
      placeholder="0.0"
      ref={ref}
      {...props}
      value={
        typeof props.value === 'string' && props.value && isCurrency
          ? props.value.replace(/\B(?=(\d{3})+(?!\d))/g, '.')
          : props.value
      }
      onChange={(e) => {
        // Remove all non-numeric characters except for decimal point
        const rawValue = e.target.value.replace(/[^\d,]/g, '')
        // Ensure only one decimal point
        const sanitizedValue = rawValue.replace(/\.(?=,*\.)/g, '')

        // Create a new event with the sanitized value
        const newEvent = {
          ...e,
          target: {
            ...e.target,
            value: minmax(sanitizedValue, { minInput, maxInput }),
          },
        }

        if (props.onChange) props.onChange(newEvent)
      }}
    />
  )
})
InputNumber.displayName = 'InputNumber'

export { InputNumber }
