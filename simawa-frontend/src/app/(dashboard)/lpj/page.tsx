'use client'

import { useEffect, useMemo, useState } from 'react'
import { useQuery, useInfiniteQuery } from '@tanstack/react-query'
import { Upload } from 'lucide-react'

import {
  Button,
  Container,
  Dialog,
  DialogContent,
  DialogDescription,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
} from '@/components/ui'
import { Page } from '@/components/commons'
import { listOrganizations } from '@/lib/apis/org'
import { listLPJByOrg } from '@/lib/apis/lpj'
import {
  QueryParamsStateProvider,
  useQueryParamsState,
} from '@/lib/hooks/use-queryparams-state'
import type { LPJPageQueryParamsState } from '@/features/lpj/query-params'
import { useLPJOrgState } from '@/features/lpj/lpj.atoms'
import { FilterLPJ } from './_components/filter-lpj'
import { LPJSubmitCard } from './_components/submit-card'
import { LPJListCard } from './_components/list-card'

function LPJPageInner() {
  const { orgId, setOrgId } = useLPJOrgState()
  const { queryParams, setQueryParams } = useQueryParamsState<LPJPageQueryParamsState>()
  const { page, pageSize, status, search } = queryParams

  const { data: orgs, isLoading: orgLoading } = useQuery({
    queryKey: ['orgs'],
    queryFn: listOrganizations,
  })

  useEffect(() => {
    if (!orgId && orgs?.length) {
      setOrgId(orgs[0].id)
    }
  }, [orgId, orgs, setOrgId])

  // Desktop: useQuery with pagination
  const {
    data: lpjItems,
    isLoading,
    isError,
    isFetching,
    refetch,
  } = useQuery({
    queryKey: ['lpj', orgId, page, pageSize, status],
    queryFn: () =>
      listLPJByOrg(
        orgId,
        status || undefined,
        Number(page || '1') || 1,
        Number(pageSize || '10') || 10,
      ),
    enabled: Boolean(orgId),
  })

  // Mobile: useInfiniteQuery for infinite scroll
  const lpjInfiniteQuery = useInfiniteQuery({
    queryKey: ['lpj-infinite', orgId, status],
    queryFn: ({ pageParam = 1 }) =>
      listLPJByOrg(
        orgId,
        status || undefined,
        pageParam,
        10,
      ),
    enabled: Boolean(orgId),
    initialPageParam: 1,
    getNextPageParam: (lastPage, allPages) => {
      if (lastPage && lastPage.length >= 10) {
        return allPages.length + 1
      }
      return undefined
    },
  })

  const allInfiniteLpj = useMemo(
    () => lpjInfiniteQuery.data?.pages.flat() ?? [],
    [lpjInfiniteQuery.data?.pages]
  )

  const [submitOpen, setSubmitOpen] = useState(false)

  const filteredItems = useMemo(() => {
    if (!lpjItems) return []
    if (!search) return lpjItems
    const q = search.toLowerCase()
    return lpjItems.filter((item) => {
      const inSummary = item.summary?.toLowerCase().includes(q)
      const inActivity = item.activity_id?.toLowerCase().includes(q)
      return Boolean(inSummary || inActivity)
    })
  }, [lpjItems, search])

  const filteredInfiniteItems = useMemo(() => {
    if (!allInfiniteLpj.length) return []
    if (!search) return allInfiniteLpj
    const q = search.toLowerCase()
    return allInfiniteLpj.filter((item) => {
      const inSummary = item.summary?.toLowerCase().includes(q)
      const inActivity = item.activity_id?.toLowerCase().includes(q)
      return Boolean(inSummary || inActivity)
    })
  }, [allInfiniteLpj, search])

  return (
    <Page>
      <Page.Header breadcrumbs={[{ href: '/dashboard', children: 'Dashboard' }, { href: '/lpj', children: 'LPJ & Laporan' }]}>
        <div className="flex flex-col gap-4 md:flex-row md:items-center md:justify-between">
          <div>
            <h1 className="text-2xl font-bold tracking-tight text-neutral-900">
              Laporan Pertanggungjawaban
            </h1>
            <p className="mt-1 text-sm text-neutral-500">
              Kelola pengajuan, revisi, dan arsip laporan kegiatan organisasi.
            </p>
          </div>
          <Dialog open={submitOpen} onOpenChange={setSubmitOpen}>
            <DialogTrigger asChild>
              <Button size="sm" className="bg-brand-600 hover:bg-brand-700 text-white gap-2">
                <Upload className="h-4 w-4" /> Kirim LPJ
              </Button>
            </DialogTrigger>
            <DialogContent className="max-w-3xl rounded-2xl border border-neutral-200 shadow-lg p-0 overflow-hidden">
              <DialogHeader className="p-6 pb-2">
                <DialogTitle className="text-xl font-bold text-neutral-900">
                  Kirim Laporan Pertanggungjawaban
                </DialogTitle>
                <DialogDescription className="text-sm text-neutral-500">
                  Unggah berkas LPJ dalam format PDF untuk ditinjau oleh BEM/DEMA.
                </DialogDescription>
              </DialogHeader>
              <div className="px-6 pb-6">
                <LPJSubmitCard orgId={orgId} onSuccess={() => setSubmitOpen(false)} />
              </div>
            </DialogContent>
          </Dialog>
        </div>
      </Page.Header>
      
      <Page.Body>
        <Container>
          <div className="space-y-6">
            <FilterLPJ
              orgs={orgs}
              orgId={orgId}
              onChange={setOrgId}
              isLoading={orgLoading}
              lpjCount={filteredItems.length}
              queryParams={queryParams}
              setQueryParams={setQueryParams}
            />
            
            {/* Desktop View */}
            <div className="hidden sm:block">
              <LPJListCard
                items={filteredItems}
                isLoading={isLoading}
                isError={isError}
                isFetching={isFetching}
                onRefresh={() => refetch()}
                page={Number(page || '1') || 1}
                onChangePage={(next) => setQueryParams({ page: String(Math.max(1, next)) })}
              />
            </div>
            {/* Mobile View with Infinite Scroll */}
            <div className="sm:hidden">
              <LPJListCard
                items={filteredInfiniteItems}
                isLoading={lpjInfiniteQuery.isLoading}
                isError={lpjInfiniteQuery.isError}
                isFetching={lpjInfiniteQuery.isFetching}
                onRefresh={() => lpjInfiniteQuery.refetch()}
                hasNextPage={lpjInfiniteQuery.hasNextPage}
                onLoadMore={() => lpjInfiniteQuery.fetchNextPage()}
                isFetchingNextPage={lpjInfiniteQuery.isFetchingNextPage}
              />
            </div>
          </div>
        </Container>
      </Page.Body>
    </Page>
  )
}

export default function LPJPage() {
  return (
    <QueryParamsStateProvider<LPJPageQueryParamsState>
      defaultValues={{ page: '1', pageSize: '10', status: '', search: '' }}
    >
      <LPJPageInner />
    </QueryParamsStateProvider>
  )
}
