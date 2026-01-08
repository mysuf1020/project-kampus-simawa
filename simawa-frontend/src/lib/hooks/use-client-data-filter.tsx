'use client'
import { useState, useMemo, Dispatch, SetStateAction } from 'react'
type AggregateFilter<T, FP> = (data: T[], params: FP) => T[]
type KeyBasedFilter<T> = { [key: string]: (data: T[], value: unknown) => T[] }
type UseClientDataFilterReturn<T, FP> = {
  // data that is filtered
  data: T[]
  setFilterParams: Dispatch<SetStateAction<FP>>
  activeFilter: FP
}

const useClientDataFilter = <T, FP extends { [key: string]: unknown }>(
  initialData: T[],
  defaultFilterParams: FP,
  filterImpl?: KeyBasedFilter<T> | AggregateFilter<T, FP>,
  // filterImpl?: { [key in keyof K]?: (data: T[], value: unknown) => T[] },
): UseClientDataFilterReturn<T, FP> => {
  const [allData, _] = useState<T[]>(initialData)
  const [filterParams, setFilterParams] = useState<FP>(defaultFilterParams)

  const filteredData = useMemo<T[]>(() => {
    let _filtered = allData
    if (!filterImpl) return _filtered

    if (filterImpl && typeof filterImpl === 'function') {
      _filtered = filterImpl(_filtered, filterParams)
    } else {
      Array.from(Object.entries(filterParams)).map((entry) => {
        const [key, value] = entry

        if (Object.keys(filterImpl).includes(key)) {
          _filtered = Object(filterImpl)[key](_filtered, value)
        }
      })
    }

    return _filtered
  }, [filterParams, allData, filterImpl])

  return {
    data: filteredData,
    setFilterParams,
    activeFilter: filterParams,
  }
}

export { useClientDataFilter, type UseClientDataFilterReturn }
