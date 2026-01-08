import { createContext, useContext } from 'react'

// eslint-disable-next-line @typescript-eslint/no-explicit-any
type SearchableState<Q = any, QResult = unknown> = {
  isLoading: boolean
  data?: QResult
  setData: (data?: QResult) => void
  searchQuery?: Q
  setSearchQuery?: (query?: Q) => void
  error?: unknown
}

const SearchableContext = createContext<SearchableState>({
  isLoading: false,
  data: undefined,
  searchQuery: undefined,
  error: null,
  setData: () => {},
  setSearchQuery: () => {},
})

type UseSearchableResultReturn<QResult = unknown> = {
  isLoading: boolean
  data?: QResult
  error?: unknown
}

const useSearchableResult = <
  QResult = unknown,
>(): UseSearchableResultReturn<QResult> => {
  const context = useContext(SearchableContext)

  if (!context) {
    throw new Error(
      '[useSearchableResult]: Unable to Find SearchableContext in useSearchableResult. Please provide it first before using',
    )
  }

  return {
    isLoading: context.isLoading,
    data: context.data as QResult | undefined,
    error: context.error,
  }
}
type UseSearchableQueryReturn<Q> = {
  searchQuery?: Q
  setSearchQuery: (query?: Q) => void
}

// eslint-disable-next-line @typescript-eslint/no-explicit-any
const useSearchableQuery = <Q = any,>(): UseSearchableQueryReturn<Q> => {
  const context = useContext(SearchableContext)

  if (!context) {
    throw new Error(
      '[useSearchableQuery]: Unable to Find SearchableContext in useSearchableQuery. Please provide it first before using',
    )
  }

  return {
    searchQuery: context.searchQuery as Q | undefined,
    setSearchQuery: context.setSearchQuery as (query?: Q) => void,
  }
}

export {
  type SearchableState,
  SearchableContext,
  useSearchableResult,
  useSearchableQuery,
}
