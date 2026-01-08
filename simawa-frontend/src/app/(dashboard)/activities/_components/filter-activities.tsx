'use client'

import { useEffect, useState } from 'react'

import {
  Badge,
  Input,
  Label,
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui'
import type { Organization } from '@/lib/apis/org'
import type { ActivitiesPageQueryParamsState } from '@/features/activities/query-params'
import { Sparkles, Search, Users } from 'lucide-react'
import useDebounce from '@/lib/hooks/use-debounce'

type Props = {
  orgs?: Organization[]
  orgId: string
  onChange: (id: string) => void
  isLoading?: boolean
  selectedName?: string
  outboxCount?: number
  queryParams?: ActivitiesPageQueryParamsState
  setQueryParams?: (
    params: Partial<ActivitiesPageQueryParamsState>,
    reset?: boolean,
  ) => void
}

export function FilterActivities({
  orgs,
  orgId,
  onChange,
  isLoading,
  selectedName,
  outboxCount,
  queryParams,
  setQueryParams,
}: Props) {
  const [searchValue, setSearchValue] = useState(queryParams?.search ?? '')
  const { value: searchDebounced } = useDebounce({
    value: searchValue,
    delay: 100,
  })

  useEffect(() => {
    if (!setQueryParams) return
    if (searchDebounced !== queryParams?.search) {
      setQueryParams({ search: searchDebounced, page: '1' })
    }
  }, [searchDebounced, queryParams?.search, setQueryParams])

  return (
    <div className="flex flex-wrap items-center gap-2 bg-white p-3 rounded-lg border border-neutral-200 shadow-sm">
      <Select value={orgId} onValueChange={onChange} disabled={isLoading}>
        <SelectTrigger className="h-8 w-auto min-w-[140px] bg-white border-neutral-200 text-xs">
          <SelectValue placeholder="Organisasi">
            {selectedName || 'Organisasi'}
          </SelectValue>
        </SelectTrigger>
        <SelectContent>
          {orgs?.map((org) => (
            <SelectItem key={org.id} value={org.id} className="text-xs">
              {org.name}
            </SelectItem>
          ))}
        </SelectContent>
      </Select>

      <Select
        value={queryParams?.status || 'ALL'}
        onValueChange={(value) =>
          setQueryParams?.({ status: value === 'ALL' ? '' : value, page: '1' })
        }
      >
        <SelectTrigger className="h-8 w-auto min-w-[100px] bg-white border-neutral-200 text-xs">
          <SelectValue />
        </SelectTrigger>
        <SelectContent>
          <SelectItem value="ALL" className="text-xs">Semua</SelectItem>
          <SelectItem value="DRAFT" className="text-xs">Draft</SelectItem>
          <SelectItem value="PENDING" className="text-xs">Menunggu</SelectItem>
          <SelectItem value="APPROVED" className="text-xs">Disetujui</SelectItem>
          <SelectItem value="REJECTED" className="text-xs">Ditolak</SelectItem>
          <SelectItem value="COMPLETED" className="text-xs">Selesai</SelectItem>
        </SelectContent>
      </Select>

      <div className="relative flex-1 min-w-[150px] max-w-[200px]">
        <Search className="absolute left-2 top-2 h-3.5 w-3.5 text-neutral-400" />
        <Input
          className="h-8 pl-7 bg-white border-neutral-200 text-xs"
          placeholder="Cari..."
          value={searchValue}
          onChange={(e) => setSearchValue(e.target.value)}
        />
      </div>

      <div className="flex items-center gap-1.5 px-2.5 py-1.5 bg-brand-50 rounded-md border border-brand-100 text-brand-700 text-xs font-medium ml-auto">
        <Sparkles className="h-3.5 w-3.5" />
        <span className="font-bold">{outboxCount ?? 0}</span> Aktivitas
      </div>
    </div>
  )
}
