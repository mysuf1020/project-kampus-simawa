'use client'

import { useEffect, useState } from 'react'
import { useQuery } from '@tanstack/react-query'
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
import { AllSuratListCard } from './_components/all-list'

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

  const filteredOutbox = (outboxQuery.data || []).filter((item) => {
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
      <Page.Header breadcrumbs={[{ href: '/dashboard', children: 'Dashboard' }, { href: '/surat', children: 'Surat' }]}>
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
              <Button size="sm" className="bg-brand-600 hover:bg-brand-700 text-white gap-2">
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
            <TabsList className="bg-neutral-100/50 border border-neutral-200 p-1">
              <TabsTrigger value="inbox" className="gap-2 data-[state=active]:bg-white data-[state=active]:shadow-sm">
                Surat Masuk
                {pendingInboxCount > 0 && (
                  <Badge
                    variant="secondary"
                    className="bg-brand-100 text-brand-700 hover:bg-brand-100 border-none px-1.5 py-0.5 text-[10px]"
                  >
                    {pendingInboxCount}
                  </Badge>
                )}
              </TabsTrigger>
              <TabsTrigger value="outbox" className="data-[state=active]:bg-white data-[state=active]:shadow-sm">Riwayat Keluar</TabsTrigger>
              <TabsTrigger value="all" className="data-[state=active]:bg-white data-[state=active]:shadow-sm">Semua Surat</TabsTrigger>
            </TabsList>

            <TabsContent value="inbox" className="animate-in fade-in-50 duration-300">
              <InboxListCard
                data={inboxQuery.data}
                isLoading={inboxQuery.isLoading}
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
                <OutboxListCard
                  data={filteredOutbox}
                  isLoading={outboxQuery.isLoading}
                  page={Number(outboxPage || '1') || 1}
                  onChangePage={(next) =>
                    setQueryParams({ outboxPage: String(Math.max(1, next)) })
                  }
                />
              </div>
            </TabsContent>

            <TabsContent value="all" className="animate-in fade-in-50 duration-300">
              <AllSuratListCard />
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
