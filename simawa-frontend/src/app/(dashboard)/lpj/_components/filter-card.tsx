'use client'

import {
  Badge,
  Flex,
  Input,
  Label,
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
} from '@/components/ui'
import type { Organization } from '@/lib/apis/org'
import type { LPJPageQueryParamsState } from '@/features/lpj/query-params'

type Props = {
  orgs?: Organization[]
  orgId: string
  onChange: (id: string) => void
  isLoading?: boolean
  lpjCount?: number
  queryParams?: LPJPageQueryParamsState
  setQueryParams?: (params: Partial<LPJPageQueryParamsState>, reset?: boolean) => void
}

export function LPJFilterCard({
  orgs,
  orgId,
  onChange,
  isLoading,
  lpjCount,
  queryParams,
  setQueryParams,
}: Props) {
  const selectedOrg = orgs?.find((o) => o.id === orgId)

  return (
    <Flex direction="col" gap="3" className="w-full rounded-xl bg-white/0 p-0">
      <div className="flex flex-col gap-2 md:flex-row md:items-center">
        <div className="flex-1 space-y-2">
          <div>
            <Label className="text-xs text-neutral-600">Organisasi</Label>
            <Select value={orgId} onValueChange={onChange} disabled={isLoading}>
              <SelectTrigger className="mt-1 h-9 rounded-lg border border-neutral-200 bg-white text-sm text-neutral-800">
                {selectedOrg?.name || 'Pilih organisasi'}
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
          <div className="grid gap-2 sm:grid-cols-2">
            <div className="space-y-1">
              <Label className="text-xs text-neutral-600">Status</Label>
              <Select
                value={queryParams?.status || 'ALL'}
                onValueChange={(value) =>
                  setQueryParams?.({
                    status: value === 'ALL' ? '' : value,
                    page: '1',
                  })
                }
              >
                <SelectTrigger className="mt-1 h-9 rounded-lg border border-neutral-200 bg-white text-sm text-neutral-800">
                  {(!queryParams?.status || queryParams.status === 'ALL') && 'Semua'}
                  {queryParams?.status === 'PENDING' && 'Menunggu'}
                  {queryParams?.status === 'APPROVED' && 'Disetujui'}
                  {queryParams?.status === 'REVISION_REQUESTED' && 'Perlu revisi'}
                  {queryParams?.status === 'REJECTED' && 'Ditolak'}
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="ALL">Semua</SelectItem>
                  <SelectItem value="PENDING">Menunggu</SelectItem>
                  <SelectItem value="APPROVED">Disetujui</SelectItem>
                  <SelectItem value="REVISION_REQUESTED">Perlu revisi</SelectItem>
                  <SelectItem value="REJECTED">Ditolak</SelectItem>
                </SelectContent>
              </Select>
            </div>
            <div className="space-y-1">
              <Label className="text-xs text-neutral-600">Cari ringkasan</Label>
              <Input
                className="mt-1 h-9 rounded-lg border border-neutral-200 bg-white text-sm text-neutral-800 placeholder:text-neutral-400"
                placeholder="Cari LPJ..."
                value={queryParams?.search || ''}
                onChange={(e) => setQueryParams?.({ search: e.target.value, page: '1' })}
              />
            </div>
          </div>
        </div>
        <Flex
          alignItems="center"
          gap="2"
          className="rounded-xl border border-neutral-200 bg-neutral-50 px-3 py-2 text-xs text-neutral-700"
        >
          <div className="leading-tight">
            <p className="text-sm font-semibold text-neutral-900">
              {selectedOrg?.name || 'Pilih organisasi'}
            </p>
            <p className="text-[11px] text-neutral-500">
              {selectedOrg?.slug ? `/${selectedOrg.slug}` : 'Alamat belum diatur'}
            </p>
          </div>
          {typeof lpjCount === 'number' && (
            <Badge className="ml-2 bg-white text-neutral-800 ring-1 ring-neutral-200">
              {lpjCount} LPJ
            </Badge>
          )}
        </Flex>
      </div>
    </Flex>
  )
}
