'use client'

import {
  ReactNode,
  PropsWithChildren,
  useState,
  useTransition,
  useEffect,
  useImperativeHandle,
  useRef,
  RefObject,
} from 'react'
import {
  SearchableInput,
  SearchableDebouncedInput,
  SearchableInputElement,
} from './input'
import { SearchableResult, SearchableRenderParams } from './result'
import { SearchableContext } from './context'
import { SearchableResultItem } from './result-item'

type SearchableQueryFn<Q, QResult> = (query: Q) => QResult
type AsyncSearchableQueryFn<Q, QResult> = (query: Q) => Promise<QResult>

type SearchableElement<Q> = {
  clear: VoidFunction
  triggerSearch: (query?: Q) => void
}

type SearchableProps<Q, QResult> = {
  queryFn: SearchableQueryFn<Q, QResult> | AsyncSearchableQueryFn<Q, QResult>
  ref?: RefObject<SearchableElement<Q> | null>
}

// eslint-disable-next-line @typescript-eslint/no-explicit-any
function Searchable<Q = any, QResult = unknown>({
  children,
  queryFn,
  ref,
}: PropsWithChildren<SearchableProps<Q, QResult>>): ReactNode {
  const [data, setData] = useState<unknown>(undefined)
  const [searchQuery, setSearchQuery] = useState<Q | undefined>(undefined)
  const [queryError, setQueryError] = useState<unknown>(null)
  const [isLoading, startTransition] = useTransition()

  // a flag that disable search temporarily when clear() is called
  const tempDisabledRef = useRef<boolean>(false)

  useImperativeHandle(ref, () => ({
    triggerSearch: (query?: Q) => {
      setSearchQuery(query)
    },
    clear: () => {
      setData(undefined)
      setSearchQuery(undefined)
      tempDisabledRef.current = true
      setTimeout(() => {
        tempDisabledRef.current = false
      }, 1000)
    },
  }))

  useEffect(() => {
    if (searchQuery !== undefined && !tempDisabledRef.current) {
      startTransition(async () => {
        try {
          if (queryFn.constructor && queryFn.constructor.name === 'AsyncFunction') {
            const asyncFn = queryFn as AsyncSearchableQueryFn<Q, QResult>
            const result = await asyncFn(searchQuery)
            setData(result)
          } else {
            const result = queryFn(searchQuery)
            setData(result)
          }
        } catch (error) {
          setQueryError(error)
        }
      })
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [searchQuery])

  return (
    <SearchableContext.Provider
      value={{
        isLoading,
        error: queryError,
        setData,
        data,
        searchQuery,
        setSearchQuery,
      }}
    >
      {children}
    </SearchableContext.Provider>
  )
}

Searchable.Input = SearchableInput
Searchable.Result = SearchableResult
Searchable.DebounceInput = SearchableDebouncedInput
Searchable.ResultItem = SearchableResultItem

export {
  Searchable,
  type SearchableRenderParams,
  type SearchableInputElement,
  type SearchableElement,
}
