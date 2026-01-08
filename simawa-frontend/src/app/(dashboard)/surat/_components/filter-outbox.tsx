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
    <div className="flex flex-col gap-4">
      <div className="flex flex-col md:flex-row md:items-end gap-4 bg-white p-4 rounded-xl border border-neutral-200 shadow-sm">
        <div className="flex-1 space-y-4 md:space-y-0 md:grid md:grid-cols-[1.5fr,1fr,1.5fr] md:gap-4">
          <div className="space-y-1.5">
            <Label className="text-xs font-medium text-neutral-600">Organisasi</Label>
            <Select value={orgId} onValueChange={onChange}>
              <SelectTrigger className="h-9 bg-white border-neutral-200 text-sm">
                <SelectValue placeholder="Pilih organisasi">
                  {selectedOrg?.name || 'Pilih organisasi'}
                </SelectValue>
              </SelectTrigger>
              <SelectContent>
                {orgs?.map((org) => (
                  <SelectItem key={org.id} value={org.id}>
                    {org.name}
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>
          </div>

          <div className="space-y-1.5">
            <Label className="text-xs font-medium text-neutral-600">Status</Label>
            <Select
              value={queryParams?.outboxStatus || 'ALL'}
              onValueChange={(value) =>
                setQueryParams?.({
                  outboxStatus: value === 'ALL' ? '' : value,
                  outboxPage: '1',
                })
              }
            >
              <SelectTrigger className="h-9 bg-white border-neutral-200 text-sm">
                <SelectValue />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="ALL">Semua Status</SelectItem>
                <SelectItem value="DRAFT">Draft</SelectItem>
                <SelectItem value="PENDING">Menunggu</SelectItem>
                <SelectItem value="APPROVED">Disetujui</SelectItem>
                <SelectItem value="REJECTED">Ditolak</SelectItem>
              </SelectContent>
            </Select>
          </div>

          <div className="space-y-1.5">
            <Label className="text-xs font-medium text-neutral-600">Pencarian</Label>
            <div className="relative">
              <Search className="absolute left-2.5 top-2.5 h-4 w-4 text-neutral-400" />
              <Input
                className="h-9 pl-9 bg-white border-neutral-200 text-sm"
                placeholder="Cari subjek atau nomor..."
                value={searchValue}
                onChange={(e) => setSearchValue(e.target.value)}
              />
            </div>
          </div>
        </div>

        <div className="flex items-center gap-2 px-4 py-2 bg-neutral-50 rounded-lg border border-neutral-100 text-neutral-600 md:h-9 md:self-end md:mb-0.5">
          <Mail className="h-4 w-4" />
          <span className="text-xs font-medium">
            <span className="text-neutral-900 font-bold">{count ?? 0}</span> Surat Keluar
          </span>
        </div>
      </div>
    </div>
  )
}
