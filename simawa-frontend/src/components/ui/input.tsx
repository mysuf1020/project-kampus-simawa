import * as React from 'react'

import { VariantProps, cva } from 'class-variance-authority'
import { cn } from '@/lib/utils'
import { Text } from './typography/text'

type InputCustomProps = {
  prefix?: React.JSX.Element
  suffix?: React.JSX.Element
  showCounter?: boolean
}
export type InputProps = Omit<React.ComponentProps<'input'>, 'prefix' | 'suffix'> &
  InputCustomProps &
  VariantProps<typeof inputVariants>

const containerClass = `input-container flex h-9 items-center w-full rounded-md
  border border-neutral-300 bg-background text-base
  hover:border-main-500
  hover:shadow
  transition
  focus-within:outline focus-within:outline-offset-2 focus-within:!outline-main-200 focus-within:border focus-within:border-main-500
  text-sm
  md:text-sm`

const inputClass = `
file:border-0 file:bg-transparent file:text-sm file:font-medium file:text-foreground
placeholder:text-neutral-400
focus-visible:outline-none
focus:caret-main-500
disabled:hover:cursor-not-allowed
text-sm
md:text-sm`

const inputVariants = cva(inputClass, {
  variants: {
    inputSize: {
      sm: 'px-2 py-1.5',
      default: 'px-3 py-2',
      lg: 'px-3.5 py-2.5',
    },
  },
  defaultVariants: {
    inputSize: 'default',
  },
})

const Input = React.forwardRef<HTMLInputElement, InputProps>(
  ({ className, type = 'text', prefix, inputSize, suffix, showCounter, ...props }, forwardedRef) => {
    return (
      <div
        className={cn(
          containerClass,
          props.disabled &&
            'bg-neutral-100 text-neutral-400 hover:border-neutral-200 hover:shadow-none hover:cursor-not-allowed',
          className,
        )}
      >
        {prefix && <div className="pl-3">{prefix}</div>}
        <input
          {...props}
          ref={forwardedRef}
          type={type}
          className={cn(
            'bg-transparent w-full truncate overflow-hidden',
            inputVariants({ inputSize }),
          )}
        />
        {showCounter && (
          <Text className="flex-none text-secondary mr-2">
            {props.value?.toString().length} / {props.maxLength}
          </Text>
        )}
        {suffix && suffix}
      </div>
    )
  },
)
Input.displayName = 'Input'

export { Input }
