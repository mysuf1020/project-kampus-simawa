import { useEffect, useMemo, useState } from 'react'

export default function useDebounce<T>({
  value,
  delay = 500,
}: {
  value: T
  delay?: number
}) {
  const stringVal = JSON.stringify(value)
  const [debouncedValue, setDebouncedValue] = useState(stringVal)
  const [isDebounce, setIsDebounce] = useState(true)

  useEffect(
    () => {
      // Update debounced value after delay
      const handler = setTimeout(() => {
        setIsDebounce(false)
        setDebouncedValue(stringVal)
      }, delay)

      // Cancel the timeout if value changes (also on delay change or unmount)
      // This is how we prevent debounced value from updating if value is changed ...
      // .. within the delay period. Timeout gets cleared and restarted.
      return () => {
        setIsDebounce(true)
        clearTimeout(handler)
      }
    },
    [stringVal, delay], // Only re-call effect if value or delay changes
  )

  const finalValue = useMemo(() => JSON.parse(debouncedValue), [debouncedValue])
  return { value: finalValue as T, isDebounce }
}
