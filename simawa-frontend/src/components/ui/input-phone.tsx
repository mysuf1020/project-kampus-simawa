import React from 'react'
import Image from 'next/image'
import { cn } from '@/lib/utils'
import { Input, InputProps } from './input'
import {
  Select,
  SelectContent,
  SelectGroup,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from './select'
import { Text } from './typography/text'

type InputPhone = {
  error?: boolean
  countryCodePicker?: boolean
}

const InputPhone = React.forwardRef<HTMLInputElement, InputProps & InputPhone>(
  ({ className, error, countryCodePicker = false, ...props }, ref) => {
    const numberCountrySelect = (
      <div className="min-w-[80px]">
        <Select value="+62">
          <SelectTrigger
            tabIndex={-1}
            className={cn(
              error && 'border-r-red-500',
              'border-b-transparent border-t-transparent border-l-transparent border-r rounded-none pl-0 pr-2',
            )}
          >
            <SelectValue placeholder="Select Country" />
          </SelectTrigger>
          <SelectContent>
            <SelectGroup>
              <SelectItem value="+62">
                <div className="flex items-center gap-2">
                  <Image
                    src={'/assets/country-flags/Flag_Indonesia.svg'}
                    width={18}
                    height={18}
                    alt="Indonesia"
                  />
                  <Text strong>+62</Text>
                </div>
              </SelectItem>
            </SelectGroup>
          </SelectContent>
        </Select>
      </div>
    )
    return (
      <Input
        type="phone"
        className={cn(className)}
        prefix={countryCodePicker ? numberCountrySelect : undefined}
        placeholder="abc123"
        ref={ref}
        {...props}
        onChange={(e) => {
          if (/[^0-9]/.test(e.target.value)) {
            return
          }
          if (props.onChange) props.onChange(e)
        }}
      />
    )
  },
)
InputPhone.displayName = 'InputPhone'

export { InputPhone }
