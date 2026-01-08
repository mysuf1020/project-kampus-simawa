import {
  PropsWithChildren,
  ReactElement,
  ChangeEvent,
  useEffect,
  useImperativeHandle,
  useState,
  useRef,
  forwardRef,
} from 'react'
import { Slot } from '@radix-ui/react-slot'
import useDebounce from '@/lib/hooks/use-debounce'
import { useSearchableQuery } from './context'

type PrimitiveInputValue = string | readonly string[] | number | undefined
// eslint-disable-next-line @typescript-eslint/no-explicit-any
type SearchableInputProps<Q = any> = PropsWithChildren<{
  onChange?: (e: ChangeEvent<HTMLInputElement>) => void
  value?: Q
  asChild?: boolean
}>

// Debounced input must be controlled, hence the value is required
// eslint-disable-next-line @typescript-eslint/no-explicit-any
type SearchableDebouncedInputProps<Q = any> = Omit<SearchableInputProps<Q>, 'value'> & {
  debounce: number
  value: Q
}

type SearchableInputElement = {
  position: {
    top?: number
    left?: number
    bottom?: number
    right?: number
    width?: number
  }
}

const SearchableDebouncedInput = forwardRef<
  SearchableInputElement,
  SearchableDebouncedInputProps
>(
  (
    { onChange, value, asChild, debounce = 0, ...props },
    ref,
  ): ReactElement<SearchableDebouncedInputProps> => {
    if (value === undefined || value === null) {
      throw new Error(
        'Cannot debounce an uncontrolled input. Please provide value props if debounce is set.',
      )
    }

    const { value: debouncedValue } = useDebounce({
      value,
      delay: debounce,
    })

    const { setSearchQuery } = useSearchableQuery()

    useEffect(() => {
      setSearchQuery(debouncedValue)
    }, [debouncedValue, setSearchQuery])

    const useInputRef = useRef<HTMLInputElement>(null)

    useImperativeHandle<SearchableInputElement, SearchableInputElement>(ref, () => {
      const rect = useInputRef?.current?.getBoundingClientRect()
      return {
        position: {
          top: rect?.top,
          left: rect?.left,
          bottom: rect?.bottom,
          right: rect?.right,
          width: rect?.width,
        },
      }
    }, [useInputRef])

    const Comp = asChild ? Slot : 'input'

    return (
      <Comp
        {...props}
        ref={useInputRef}
        value={value as PrimitiveInputValue}
        onChange={onChange}
      />
    )
  },
)
SearchableDebouncedInput.displayName = 'SearchableDebouncedInput'

function SearchableInput<Q>({
  value,
  onChange,
  asChild,
  ...props
}: SearchableInputProps<Q>): ReactElement<SearchableInputProps<Q>> {
  const [internalValue, setInternalValue] = useState<Q | undefined>(value)
  const { setSearchQuery } = useSearchableQuery<Q>()

  useEffect(() => {
    setInternalValue(value)
  }, [value])

  useEffect(() => {
    setSearchQuery(internalValue)
  }, [internalValue, setSearchQuery])

  const handleInternalOnChange = (e: ChangeEvent<HTMLInputElement>) => {
    onChange?.(e)
    setInternalValue(e.target.value as Q)
  }

  const Comp = asChild ? Slot : 'input'
  return (
    <Comp
      {...props}
      value={internalValue as PrimitiveInputValue}
      onChange={handleInternalOnChange}
    />
  )
}

export { SearchableInput, SearchableDebouncedInput, type SearchableInputElement }
