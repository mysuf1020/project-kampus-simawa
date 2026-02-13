'use client'

import { useEffect, useMemo, useState } from 'react'
import {
  Input,
  Label,
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui'
import type { Organization } from '@/lib/apis/org'
import type { LPJPageQueryParamsState } from '@/features/lpj/query-params'
import useDebounce from '@/lib/hooks/use-debounce'
import { FileText, Search, Sparkles } from 'lucide-react'

type Props = {
  orgs?: Organization[]
  orgId: string
  onChange: (id: string) => void
  isLoading?: boolean
  lpjCount?: number
  queryParams?: LPJPageQueryParamsState
  setQueryParams?: (params: Partial<LPJPageQueryParamsState>, reset?: boolean) => void
}

export function FilterLPJ({
  orgs,
  orgId,
  onChange,
  isLoading,
  lpjCount,
  queryParams,
  setQueryParams,
}: Props) {
  const selectedOrg = useMemo(() => orgs?.find((o) => o.id === orgId), [orgs, orgId])
  const statusValue = queryParams?.status || 'ALL'
  const [searchDraft, setSearchDraft] = useState(queryParams?.search || '')

  const statusLabels: Record<string, string> = {
    ALL: 'Semua',
    PENDING: 'Menunggu',
    APPROVED: 'Disetujui',
    REVISION_REQUESTED: 'Revisi',
    REJECTED: 'Ditolak',
  }

  const { value: searchDebounced } = useDebounce({
    value: searchDraft,
    delay: 100,
  })

  // Debounce search input to avoid laggy typing and sync with query params
  useEffect(() => {
    if (!setQueryParams) return
    if (searchDebounced !== queryParams?.search) {
      setQueryParams({ search: searchDebounced, page: '1' })
    }
  }, [searchDebounced, queryParams?.search, setQueryParams])

  return (
    <div className="flex flex-wrap items-center gap-2 p-2 px-4 bg-white rounded-lg border border-neutral-200 shadow-sm">
      <Select 
        value={orgId || 'ALL'} 
        onValueChange={(value) => {
          onChange(value === 'ALL' ? '' : value)
          setQueryParams?.({ page: '1' }) // Reset page when org changes
        }} 
        disabled={isLoading}
      >
        <SelectTrigger className="h-7 w-auto min-w-[120px] bg-white border-neutral-200 text-xs px-2">
          <SelectValue placeholder="Organisasi">
            {selectedOrg?.name || 'Semua Organisasi'}
          </SelectValue>
        </SelectTrigger>
        <SelectContent>
          <SelectItem value="ALL" className="text-xs">
            Semua Organisasi
          </SelectItem>
          {orgs?.map((org) => (
            <SelectItem key={org.id} value={org.id} className="text-xs">
              {org.name}
            </SelectItem>
          ))}
        </SelectContent>
      </Select>

      <Select
        value={statusValue}
        onValueChange={(value) =>
          setQueryParams?.({
            status: value === 'ALL' ? '' : value,
            page: '1',
          })
        }
      >
        <SelectTrigger className="h-7 w-auto min-w-[90px] bg-white border-neutral-200 text-xs px-2">
          <SelectValue placeholder="Status">
            {statusLabels[statusValue] || 'Semua'}
          </SelectValue>
        </SelectTrigger>
        <SelectContent>
          <SelectItem value="ALL" className="text-xs">
            Semua
          </SelectItem>
          <SelectItem value="PENDING" className="text-xs">
            Menunggu
          </SelectItem>
          <SelectItem value="APPROVED" className="text-xs">
            Disetujui
          </SelectItem>
          <SelectItem value="REVISION_REQUESTED" className="text-xs">
            Revisi
          </SelectItem>
          <SelectItem value="REJECTED" className="text-xs">
            Ditolak
          </SelectItem>
        </SelectContent>
      </Select>

      <div className="relative flex-1 min-w-[120px] max-w-[200px]">
        <Search className="absolute left-2 top-1.5 h-3.5 w-3.5 text-neutral-400" />
        <Input
          className="h-7 pl-7 text-xs"
          placeholder="Cari..."
          value={searchDraft}
          onChange={(e) => setSearchDraft(e.target.value)}
        />
      </div>

      <div className="flex items-center gap-1.5 px-2 py-1 bg-brand-50 rounded text-brand-700 text-[10px] font-medium ml-auto">
        <FileText className="h-3 w-3" />
        <span className="font-bold">{lpjCount ?? 0}</span> laporan
      </div>
    </div>
  )
}
