'use client'

import { useEffect, useState, useMemo } from 'react'
import {
  Input,
  Label,
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui'
import { Organization } from '@/lib/apis/org'
import type { SuratPageQueryParamsState } from '@/features/surat/query-params'
import useDebounce from '@/lib/hooks/use-debounce'
import { Search, Mail } from 'lucide-react'

type Props = {
  orgs?: Organization[]
  orgId: string
  onChange: (id: string) => void
  count?: number
  queryParams?: SuratPageQueryParamsState
  setQueryParams?: (params: Partial<SuratPageQueryParamsState>, reset?: boolean) => void
}

export function FilterOutbox({
  orgs,
  orgId,
  onChange,
  count,
  queryParams,
  setQueryParams,
}: Props) {
  const selectedOrg = useMemo(() => orgs?.find((o) => o.id === orgId), [orgs, orgId])

  const [searchValue, setSearchValue] = useState(queryParams?.outboxSearch ?? '')
  const { value: searchDebounced } = useDebounce({
    value: searchValue,
    delay: 100,
  })

  useEffect(() => {
    if (!setQueryParams) return
    if (searchDebounced !== queryParams?.outboxSearch) {
      setQueryParams({ outboxSearch: searchDebounced, outboxPage: '1' })
    }
  }, [searchDebounced, queryParams?.outboxSearch, setQueryParams])

  return (
    <div className="flex flex-wrap items-center gap-2 p-2 px-4 bg-white rounded-lg border border-neutral-200 shadow-sm">
      <Select value={orgId} onValueChange={onChange}>
        <SelectTrigger className="h-7 w-auto min-w-[140px] bg-white border-neutral-200 text-xs px-2">
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
        value={queryParams?.outboxStatus || 'ALL'}
        onValueChange={(value) =>
          setQueryParams?.({
            outboxStatus: value === 'ALL' ? '' : value,
            outboxPage: '1',
          })
        }
      >
        <SelectTrigger className="h-7 w-auto min-w-[100px] bg-white border-neutral-200 text-xs px-2">
          <SelectValue />
        </SelectTrigger>
        <SelectContent>
          <SelectItem value="ALL" className="text-xs">
            Semua
          </SelectItem>
          <SelectItem value="DRAFT" className="text-xs">
            Draft
          </SelectItem>
          <SelectItem value="PENDING" className="text-xs">
            Menunggu
          </SelectItem>
          <SelectItem value="APPROVED" className="text-xs">
            Disetujui
          </SelectItem>
          <SelectItem value="REJECTED" className="text-xs">
            Ditolak
          </SelectItem>
          <SelectItem value="REVISION" className="text-xs">
            Revisi
          </SelectItem>
        </SelectContent>
      </Select>

      <div className="relative flex-1 min-w-[150px] max-w-[220px]">
        <Search className="absolute left-2 top-1.5 h-3.5 w-3.5 text-neutral-400" />
        <Input
          className="h-7 pl-7 text-xs"
          placeholder="Cari..."
          value={searchValue}
          onChange={(e) => setSearchValue(e.target.value)}
        />
      </div>

      <div className="flex items-center gap-1.5 px-2 py-1 bg-neutral-100 rounded text-neutral-600 ml-auto">
        <Mail className="h-3.5 w-3.5" />
        <span className="text-[10px] font-medium">
          <span className="text-neutral-900 font-bold">{count ?? 0}</span> surat
        </span>
      </div>
    </div>
  )
}
