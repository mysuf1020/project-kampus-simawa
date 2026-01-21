'use client'

import { useEffect, useMemo } from 'react'
import { useQuery, useInfiniteQuery } from '@tanstack/react-query'
import { Upload } from 'lucide-react'

import {
  Badge,
  Button,
  Container,
  Tabs,
  TabsContent,
  TabsList,
  TabsTrigger,
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

  const pendingCount = useMemo(() => {
    return lpjItems?.filter((item) => item.status === 'PENDING').length ?? 0
  }, [lpjItems])

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
        <div className="flex flex-col gap-2">
          <h1 className="text-xl font-bold tracking-tight text-neutral-900">
            Laporan Pertanggungjawaban
          </h1>
          <p className="text-sm text-neutral-500">
            Kelola pengajuan, revisi, dan arsip laporan kegiatan organisasi.
          </p>
        </div>
      </Page.Header>

      <Page.Body>
        <Container>
          <Tabs defaultValue="list" className="w-full space-y-4">
            <TabsList className="w-full flex-wrap h-auto gap-1 p-1 bg-neutral-100/50 border border-neutral-200">
              <TabsTrigger
                value="list"
                className="flex-1 min-w-[80px] gap-1.5 text-xs sm:text-sm data-[state=active]:bg-white data-[state=active]:shadow-sm"
              >
                Daftar LPJ
                {pendingCount > 0 && (
                  <Badge variant="warning" size="xs">
                    {pendingCount}
                  </Badge>
                )}
              </TabsTrigger>
              <TabsTrigger
                value="submit"
                className="flex-1 min-w-[80px] text-xs sm:text-sm data-[state=active]:bg-white data-[state=active]:shadow-sm"
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
