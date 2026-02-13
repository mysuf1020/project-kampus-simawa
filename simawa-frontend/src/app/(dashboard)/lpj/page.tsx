'use client'

import { useEffect, useMemo } from 'react'
import { useQuery, useInfiniteQuery } from '@tanstack/react-query'
import { Upload, FileText, CheckCircle2, Clock, XCircle, AlertCircle, RotateCw } from 'lucide-react'

import {
  Badge,
  Button,
  Container,
  Tabs,
  TabsContent,
  TabsList,
  TabsTrigger,
  Spinner,
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
      listLPJByOrg(orgId, status || undefined, pageParam, 10),
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
    [lpjInfiniteQuery.data?.pages],
  )

  const stats = useMemo(() => {
    if (!lpjItems) return { total: 0, pending: 0, approved: 0, rejected: 0, revision: 0 }
    return {
      total: lpjItems.length,
      pending: lpjItems.filter((item) => item.status === 'PENDING').length,
      approved: lpjItems.filter((item) => item.status === 'APPROVED').length,
      rejected: lpjItems.filter((item) => item.status === 'REJECTED').length,
      revision: lpjItems.filter((item) => item.status === 'REVISION_REQUESTED').length,
    }
  }, [lpjItems])

  const pendingCount = stats.pending

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
      <Page.Header
        breadcrumbs={[
          { href: '/dashboard', children: 'Dashboard' },
          { href: '/lpj', children: 'LPJ & Laporan' },
        ]}
      >
        <div className="flex flex-col gap-4 md:flex-row md:items-center md:justify-between">
          <div>
            <h1 className="text-2xl font-bold tracking-tight text-neutral-900">
              Laporan Pertanggungjawaban
            </h1>
            <p className="mt-1 text-sm text-neutral-500">
              Kelola pengajuan, revisi, dan arsip laporan kegiatan organisasi.
            </p>
          </div>
          <Badge
            variant="secondary"
            className="bg-brand-50 text-brand-700 hover:bg-brand-100 border-brand-100"
          >
            Data Terbaru
          </Badge>
        </div>
      </Page.Header>

      <Page.Body>
        <Container>
          <div className="space-y-6">
            {/* Stats Overview */}
            <div className="grid grid-cols-2 gap-3 sm:grid-cols-4 lg:grid-cols-5">
              <div className="rounded-xl border border-neutral-200 bg-white p-4 shadow-sm">
                <div className="flex items-center gap-3">
                  <div className="flex h-10 w-10 items-center justify-center rounded-lg bg-brand-50">
                    <FileText className="h-5 w-5 text-brand-600" />
                  </div>
                  <div>
                    <p className="text-2xl font-bold text-neutral-900">{stats.total}</p>
                    <p className="text-xs text-neutral-500">Total LPJ</p>
                  </div>
                </div>
              </div>
              <div className="rounded-xl border border-amber-100 bg-amber-50/50 p-4 shadow-sm">
                <div className="flex items-center gap-3">
                  <div className="flex h-10 w-10 items-center justify-center rounded-lg bg-amber-100">
                    <Clock className="h-5 w-5 text-amber-600" />
                  </div>
                  <div>
                    <p className="text-2xl font-bold text-amber-700">{stats.pending}</p>
                    <p className="text-xs text-amber-600">Menunggu</p>
                  </div>
                </div>
              </div>
              <div className="rounded-xl border border-green-100 bg-green-50/50 p-4 shadow-sm">
                <div className="flex items-center gap-3">
                  <div className="flex h-10 w-10 items-center justify-center rounded-lg bg-green-100">
                    <CheckCircle2 className="h-5 w-5 text-green-600" />
                  </div>
                  <div>
                    <p className="text-2xl font-bold text-green-700">{stats.approved}</p>
                    <p className="text-xs text-green-600">Disetujui</p>
                  </div>
                </div>
              </div>
              <div className="rounded-xl border border-blue-100 bg-blue-50/50 p-4 shadow-sm">
                <div className="flex items-center gap-3">
                  <div className="flex h-10 w-10 items-center justify-center rounded-lg bg-blue-100">
                    <AlertCircle className="h-5 w-5 text-blue-600" />
                  </div>
                  <div>
                    <p className="text-2xl font-bold text-blue-700">{stats.revision}</p>
                    <p className="text-xs text-blue-600">Revisi</p>
                  </div>
                </div>
              </div>
              <div className="rounded-xl border border-red-100 bg-red-50/50 p-4 shadow-sm col-span-2 sm:col-span-1">
                <div className="flex items-center gap-3">
                  <div className="flex h-10 w-10 items-center justify-center rounded-lg bg-red-100">
                    <XCircle className="h-5 w-5 text-red-600" />
                  </div>
                  <div>
                    <p className="text-2xl font-bold text-red-700">{stats.rejected}</p>
                    <p className="text-xs text-red-600">Ditolak</p>
                  </div>
                </div>
              </div>
            </div>

            {/* Tabs */}
            <Tabs defaultValue="list" className="w-full space-y-4">
              <TabsList className="w-full flex-wrap h-auto gap-1 p-1 bg-neutral-100/50 border border-neutral-200 rounded-xl">
                <TabsTrigger
                  value="list"
                  className="flex-1 min-w-[100px] gap-1.5 text-xs sm:text-sm data-[state=active]:bg-white data-[state=active]:shadow-sm rounded-lg"
                >
                  <FileText className="h-3.5 w-3.5" />
                  Daftar LPJ
                  {pendingCount > 0 && (
                    <Badge variant="warning" size="xs">
                      {pendingCount}
                    </Badge>
                  )}
                </TabsTrigger>
                <TabsTrigger
                  value="submit"
                  className="flex-1 min-w-[100px] text-xs sm:text-sm data-[state=active]:bg-white data-[state=active]:shadow-sm rounded-lg"
                >
                  <Upload className="h-3.5 w-3.5 mr-1" />
                  Kirim LPJ
                </TabsTrigger>
              </TabsList>

            <TabsContent
              value="list"
              className="space-y-4 animate-in fade-in-50 duration-300"
            >
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
                  orgs={orgs}
                  isLoading={isLoading}
                  isError={isError}
                  isFetching={isFetching}
                  onRefresh={() => refetch()}
                  page={Number(page || '1') || 1}
                  onChangePage={(next) =>
                    setQueryParams({ page: String(Math.max(1, next)) })
                  }
                />
              </div>
              {/* Mobile View with Infinite Scroll */}
              <div className="sm:hidden">
                <LPJListCard
                  items={filteredInfiniteItems}
                  orgs={orgs}
                  isLoading={lpjInfiniteQuery.isLoading}
                  isError={lpjInfiniteQuery.isError}
                  isFetching={lpjInfiniteQuery.isFetching}
                  onRefresh={() => lpjInfiniteQuery.refetch()}
                  hasNextPage={lpjInfiniteQuery.hasNextPage}
                  onLoadMore={() => lpjInfiniteQuery.fetchNextPage()}
                  isFetchingNextPage={lpjInfiniteQuery.isFetchingNextPage}
                />
              </div>
            </TabsContent>

            <TabsContent value="submit" className="animate-in fade-in-50 duration-300">
              <LPJSubmitCard orgId={orgId} onSuccess={() => refetch()} />
            </TabsContent>
            </Tabs>
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
