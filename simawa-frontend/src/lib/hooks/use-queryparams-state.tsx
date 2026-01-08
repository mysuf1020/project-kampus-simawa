/* eslint-disable @typescript-eslint/no-explicit-any */
'use client'

import { useRouter, usePathname, useSearchParams } from 'next/navigation'
import { createContext, useContext, useCallback, ReactNode, useMemo } from 'react'

type QueryParams = Record<string, any>

interface QueryParamsContextType<T extends QueryParams> {
  queryParams: T
  setQueryParams: (params: Partial<T>, reset?: boolean) => void
}

const QueryParamsContext = createContext<QueryParamsContextType<any> | null>(null)

interface QueryParamsStateProviderProps<T extends QueryParams> {
  children: ReactNode
  defaultValues: T
}

export function QueryParamsStateProvider<T extends QueryParams>({
  children,
  defaultValues,
}: QueryParamsStateProviderProps<T>) {
  const router = useRouter()
  const pathname = usePathname()
  const searchParams = useSearchParams()

  const defaultValueFromSearchParams = useMemo(() => {
    const result = { ...defaultValues } as QueryParams
    if (result && typeof result === 'object') {
      const keys = Object.keys(defaultValues)

      for (const key of keys) {
        const value = searchParams.get(key)
        if (value) {
          result[key] = value
        }
      }
    }
    return result as T
  }, [defaultValues, searchParams])

  const setQueryParams = useCallback(
    (params: Partial<T>, reset: boolean = false) => {
      const newParams = new URLSearchParams(reset ? '' : searchParams.toString())

      for (const [key, value] of Object.entries(params)) {
        if (value === '' || value === null || value === undefined) {
          newParams.delete(key)
        } else {
          newParams.set(key, String(value))
        }
      }

      const queryString = newParams.toString()
      router.replace(`${pathname}${queryString ? `?${queryString}` : ''}`, {
        scroll: false,
      })
    },
    [pathname, router, searchParams],
  )

  const value = useMemo(() => {
    const currentParamsObj = Object.fromEntries(searchParams.entries())
    const qp: T = { ...defaultValueFromSearchParams, ...currentParamsObj }
    return {
      queryParams: qp,
      setQueryParams,
    }
  }, [searchParams, defaultValueFromSearchParams, setQueryParams])
  return (
    <QueryParamsContext.Provider value={value}>{children}</QueryParamsContext.Provider>
  )
}

export function useQueryParamsState<T extends QueryParams>() {
  const context = useContext(QueryParamsContext)
  if (context === null) {
    throw new Error(
      '`useQueryParamsState` must be used within a `QueryParamsStateProvider`',
    )
  }
  return context as QueryParamsContextType<T>
}
