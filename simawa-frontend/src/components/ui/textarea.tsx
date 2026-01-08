import * as React from 'react'
import { cva } from 'class-variance-authority'
import { cn } from '@/lib/utils'

type TextAreaCustomProps = {
  showCharacterCount?: boolean
}

type TextAreaProps = React.ComponentProps<'textarea'> & TextAreaCustomProps

const textAreaFrameVariants = cva(
  `rounded-md border border-neutral-300 hover:border-brand-500 hover:shadow focus:border focus-within:border-brand-500 p-0.5`,
  {
    variants: {
      disabled: {
        false: null,
        true: ['bg-neutral-100'],
      },
    },
  },
)

const TextArea = React.forwardRef<HTMLTextAreaElement, TextAreaProps>(
  (
    {
      className,
      showCharacterCount = false,
      onChange,
      maxLength,
      disabled,
      defaultValue,
      value,
      ...props
    },
    ref,
  ) => {
    const valueCount = React.useMemo<number | undefined>(() => {
      if (typeof value === 'number') {
        return value
      }
      return value?.length
    }, [value])

    const defaultValueCount = React.useMemo<number>(() => {
      if (typeof defaultValue === 'number') {
        return defaultValue
      }

      return defaultValue?.length ?? 0
    }, [defaultValue])

    const defaultCharacterCount = React.useMemo<number | undefined>(() => {
      if (defaultValue !== undefined) {
        return defaultValueCount
      }

      return valueCount
    }, [defaultValue, defaultValueCount, valueCount])
    const [currentCharacterCount, setCurrentCharacterCount] = React.useState<
      number | undefined
    >(defaultCharacterCount ?? 0)

    return (
      <div className={textAreaFrameVariants({ disabled })}>
        <textarea
          className={cn(
            `flex min-h-[80px] w-full
              bg-background
              px-3 py-2 text-base
              placeholder:text-muted-foreground transition
              focus-visible:outline-none
              focus:caret-brand-500
              disabled:bg-neutral-100 disabled:text-neutral-400 disabled:hover:border-transparent disabled:hover:shadow-none disabled:hover:cursor-not-allowed
              md:text-sm
              resize-none
          `,
            className,
          )}
          ref={ref}
          disabled={disabled}
          onChange={(event) => {
            onChange?.(event)
            if (showCharacterCount) {
              setCurrentCharacterCount(event.target.value.length)
            }
          }}
          maxLength={maxLength}
          defaultValue={defaultValue}
          value={value}
          {...props}
        />
        {showCharacterCount && (
          <div className={cn('flex flex-row-reverse px-1 pb-1 bg-white')}>
            <span className={cn('text-neutral-400 text-sm')}>
              {valueCount ?? currentCharacterCount} / {maxLength ?? '-'}
            </span>
          </div>
        )}
      </div>
    )
  },
)
TextArea.displayName = 'Textarea'

export { TextArea }
