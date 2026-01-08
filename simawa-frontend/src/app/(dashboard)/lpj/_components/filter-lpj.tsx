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
    <div className="flex flex-wrap items-center gap-2 bg-white p-3 rounded-lg border border-neutral-200 shadow-sm">
      <Select value={orgId} onValueChange={onChange} disabled={isLoading}>
        <SelectTrigger className="h-8 w-auto min-w-[140px] bg-white border-neutral-200 text-xs">
          <SelectValue placeholder="Organisasi">
            {selectedOrg?.name || 'Organisasi'}
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
        value={statusValue}
        onValueChange={(value) =>
          setQueryParams?.({
            status: value === 'ALL' ? '' : value,
            page: '1',
          })
        }
      >
        <SelectTrigger className="h-8 w-auto min-w-[100px] bg-white border-neutral-200 text-xs">
          <SelectValue />
        </SelectTrigger>
        <SelectContent>
          <SelectItem value="ALL" className="text-xs">Semua</SelectItem>
          <SelectItem value="PENDING" className="text-xs">Menunggu</SelectItem>
          <SelectItem value="APPROVED" className="text-xs">Disetujui</SelectItem>
          <SelectItem value="REVISION_REQUESTED" className="text-xs">Perlu revisi</SelectItem>
          <SelectItem value="REJECTED" className="text-xs">Ditolak</SelectItem>
        </SelectContent>
      </Select>

      <div className="relative flex-1 min-w-[150px] max-w-[200px]">
        <Search className="absolute left-2 top-2 h-3.5 w-3.5 text-neutral-400" />
        <Input
          className="h-8 pl-7 bg-white border-neutral-200 text-xs"
          placeholder="Cari..."
          value={searchDraft}
          onChange={(e) => setSearchDraft(e.target.value)}
        />
      </div>

      <div className="flex items-center gap-1.5 px-2.5 py-1.5 bg-brand-50 rounded-md border border-brand-100 text-brand-700 text-xs font-medium ml-auto">
        <FileText className="h-3.5 w-3.5" />
        <span className="font-bold">{lpjCount ?? 0}</span> Laporan
      </div>
    </div>
  )
}
