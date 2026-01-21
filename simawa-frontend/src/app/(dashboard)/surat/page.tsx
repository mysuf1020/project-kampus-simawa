'use client'

import { useEffect, useMemo, useState } from 'react'
import { useQuery, useInfiniteQuery } from '@tanstack/react-query'
import { RefreshCcw, Mail, Plus } from 'lucide-react'
import Link from 'next/link'

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
import { listInboxSurat, listOutboxSurat } from '@/lib/apis/surat'
import { listOrganizations } from '@/lib/apis/org'
import {
  QueryParamsStateProvider,
  useQueryParamsState,
} from '@/lib/hooks/use-queryparams-state'
import type { SuratPageQueryParamsState } from '@/features/surat/query-params'
import { FilterOutbox } from './_components/filter-outbox'
import { InboxListCard } from './_components/inbox-list'
import { OutboxListCard } from './_components/outbox-list'
import { DraftFormCard } from './_components/draft-form'

function SuratPageInner() {
  const [orgId, setOrgId] = useState('')
  const { queryParams, setQueryParams } = useQueryParamsState<SuratPageQueryParamsState>()
  const { tab, outboxPage, outboxPageSize, outboxStatus, outboxSearch } = queryParams

  const { data: orgs } = useQuery({ queryKey: ['orgs'], queryFn: listOrganizations })

  useEffect(() => {
    if (!orgId && orgs?.length) setOrgId(orgs[0].id)
  }, [orgId, orgs])

  const inboxQuery = useQuery({
    queryKey: ['surat-inbox'],
    queryFn: () => listInboxSurat(),
  })
  // Desktop: useQuery with pagination
  const outboxQuery = useQuery({
    queryKey: ['surat-outbox', orgId, outboxPage, outboxPageSize, outboxStatus],
    queryFn: () =>
      listOutboxSurat(orgId, {
        page: outboxPage,
        size: outboxPageSize,
        status: outboxStatus,
      }),
    enabled: Boolean(orgId),
  })

  // Mobile: useInfiniteQuery for infinite scroll
  const outboxInfiniteQuery = useInfiniteQuery({
    queryKey: ['surat-outbox-infinite', orgId, outboxStatus],
    queryFn: ({ pageParam = 1 }) =>
      listOutboxSurat(orgId, {
        page: String(pageParam),
        size: '10',
        status: outboxStatus,
      }),
    enabled: Boolean(orgId),
    initialPageParam: 1,
    getNextPageParam: (lastPage, allPages) => {
      if (lastPage && lastPage.length >= 10) {
        return allPages.length + 1
      }
      return undefined
    },
  })

  const allInfiniteOutbox = useMemo(
    () => outboxInfiniteQuery.data?.pages.flat() ?? [],
    [outboxInfiniteQuery.data?.pages],
  )

  const filteredOutbox = (outboxQuery.data || []).filter((item) => {
    if (!outboxSearch) return true
    const q = outboxSearch.toLowerCase()
    const inSubject = item.subject?.toLowerCase().includes(q)
    const inNumber = item.number?.toLowerCase().includes(q)
    return Boolean(inSubject || inNumber)
  })

  const filteredInfiniteOutbox = allInfiniteOutbox.filter((item) => {
    if (!outboxSearch) return true
    const q = outboxSearch.toLowerCase()
    const inSubject = item.subject?.toLowerCase().includes(q)
    const inNumber = item.number?.toLowerCase().includes(q)
    return Boolean(inSubject || inNumber)
  })

  const activeTab = tab || 'inbox'
  const pendingInboxCount =
    (inboxQuery.data || []).filter((item) => item.status === 'PENDING').length || 0

  return (
    <Page>
      <Page.Header
        breadcrumbs={[
          { href: '/dashboard', children: 'Dashboard' },
          { href: '/surat', children: 'Surat' },
        ]}
      >
        <div className="flex flex-col gap-4 md:flex-row md:items-center md:justify-between">
          <div>
            <h1 className="text-2xl font-bold tracking-tight text-neutral-900">
              Surat Masuk & Riwayat
            </h1>
            <p className="mt-1 text-sm text-neutral-500">
              Kelola surat masuk yang perlu tinjauan dan pantau riwayat surat keluar.
            </p>
          </div>
          <div className="flex items-center gap-2">
            <Link href="/surat/create">
              <Button
                size="sm"
                className="bg-brand-600 hover:bg-brand-700 text-white gap-2"
              >
                <Plus className="h-4 w-4" /> Buat Surat
              </Button>
            </Link>
            <Button
              variant="outline"
              size="sm"
              onClick={() => {
                inboxQuery.refetch()
                outboxQuery.refetch()
              }}
              className="gap-2"
            >
              <RefreshCcw className="h-3.5 w-3.5" />
            </Button>
          </div>
        </div>
      </Page.Header>

      <Page.Body>
        <Container>
          <Tabs
            value={activeTab}
            onValueChange={(value) => {
              setQueryParams({ tab: value as string })
            }}
            className="w-full space-y-6"
          >
            <TabsList className="w-full flex-wrap h-auto gap-1 p-1 bg-neutral-100/50 border border-neutral-200">
              <TabsTrigger
                value="inbox"
                className="flex-1 min-w-[80px] gap-1.5 text-xs sm:text-sm data-[state=active]:bg-white data-[state=active]:shadow-sm"
              >
                Daftar Surat
                {pendingInboxCount > 0 && (
                  <Badge
                    variant="secondary"
                    className="bg-brand-100 text-brand-700 hover:bg-brand-100 border-none px-1.5 py-0.5 text-[10px]"
                  >
                    {pendingInboxCount}
                  </Badge>
                )}
              </TabsTrigger>
              <TabsTrigger
                value="create"
                className="flex-1 min-w-[80px] text-xs sm:text-sm data-[state=active]:bg-white data-[state=active]:shadow-sm"
              >
                Buat Surat
              </TabsTrigger>
              <TabsTrigger
                value="outbox"
                className="flex-1 min-w-[80px] text-xs sm:text-sm data-[state=active]:bg-white data-[state=active]:shadow-sm"
              >
                Riwayat
              </TabsTrigger>
            </TabsList>

            <TabsContent value="inbox" className="animate-in fade-in-50 duration-300">
              <InboxListCard data={inboxQuery.data} isLoading={inboxQuery.isLoading} />
            </TabsContent>

            <TabsContent value="create" className="animate-in fade-in-50 duration-300">
              <DraftFormCard
                orgId={orgId}
                onSent={() => {
                  inboxQuery.refetch()
                  outboxQuery.refetch()
                  setQueryParams({ tab: 'inbox' })
                }}
              />
            </TabsContent>

            <TabsContent value="outbox" className="animate-in fade-in-50 duration-300">
              <div className="space-y-6">
                <FilterOutbox
                  orgs={orgs}
                  orgId={orgId}
                  onChange={setOrgId}
                  count={filteredOutbox.length}
                  queryParams={queryParams}
                  setQueryParams={setQueryParams}
                />
                {/* Desktop View */}
                <div className="hidden sm:block">
                  <OutboxListCard
                    data={filteredOutbox}
                    isLoading={outboxQuery.isLoading}
                    page={Number(outboxPage || '1') || 1}
                    onChangePage={(next) =>
                      setQueryParams({ outboxPage: String(Math.max(1, next)) })
                    }
                  />
                </div>
                {/* Mobile View with Infinite Scroll */}
                <div className="sm:hidden">
                  <OutboxListCard
                    data={filteredInfiniteOutbox}
                    isLoading={outboxInfiniteQuery.isLoading}
                    hasNextPage={outboxInfiniteQuery.hasNextPage}
                    onLoadMore={() => outboxInfiniteQuery.fetchNextPage()}
                    isFetchingNextPage={outboxInfiniteQuery.isFetchingNextPage}
                  />
                </div>
              </div>
            </TabsContent>
          </Tabs>
        </Container>
      </Page.Body>
    </Page>
  )
}

export default function SuratPage() {
  return (
    <QueryParamsStateProvider<SuratPageQueryParamsState>
      defaultValues={{
        tab: 'inbox',
        outboxPage: '1',
        outboxPageSize: '10',
        outboxStatus: '',
        outboxSearch: '',
      }}
    >
      <SuratPageInner />
    </QueryParamsStateProvider>
  )
}
