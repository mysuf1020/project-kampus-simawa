import * as React from 'react'
import { cn } from '@/lib/utils'

import { Text } from './typography/text'
import { Input, type InputProps } from './input'
import Icon from '../icons'

type InputPasswordProps = InputProps & {
  requirementLabel?: string
  error?: boolean
  hideSuffixIcon?: boolean
}

const InputPassword = React.forwardRef<HTMLInputElement, InputPasswordProps>(
  (
    { className, error, requirementLabel, hideSuffixIcon, onFocus, onBlur, ...props },
    ref,
  ) => {
    const [isFocus, setFocus] = React.useState(false)
    const [displayPassword, setDisplayPassword] = React.useState(false)

    return (
      <div className="space-y-1">
        <div className="relative">
          <Input
            ref={ref}
            type={displayPassword ? 'text' : 'password'}
            className={cn('pr-10', className)}
            onFocus={(e) => {
              setFocus(true)
              onFocus?.(e)
            }}
            onBlur={(e) => {
              setFocus(false)
              onBlur?.(e)
            }}
            {...props}
          />
          {!hideSuffixIcon && (
            <button
              type="button"
              tabIndex={-1}
              onClick={() => setDisplayPassword((prevState) => !prevState)}
              className="absolute inset-y-0 right-0 flex items-center pr-3 text-neutral-600 hover:text-neutral-800"
            >
              {displayPassword ? (
                <Icon name="EyeCrossedOutlined" size={16} />
              ) : (
                <Icon name="EyeOutlined" size={16} />
              )}
            </button>
          )}
        </div>
        {isFocus && !error && requirementLabel && (
          <Text className="text-neutral-600">{requirementLabel}</Text>
        )}
      </div>
    )
  },
)
InputPassword.displayName = 'InputPassword'

export { InputPassword }
