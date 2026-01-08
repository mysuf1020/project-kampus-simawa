'use client'

import { useEffect, useMemo } from 'react'
import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query'
import { Plus } from 'lucide-react'

import { Badge, Button, Container, Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui'
import { Page } from '@/components/commons'
import {
  approveActivity,
  createActivity,
  listActivitiesByOrg,
  reviseActivity,
  submitActivity,
  type ListActivitiesParams,
} from '@/lib/apis/activity'
import { listOrganizations } from '@/lib/apis/org'
import { useActivityOrgState } from '@/features/activities/activities.atoms'
import {
  QueryParamsStateProvider,
  useQueryParamsState,
} from '@/lib/hooks/use-queryparams-state'
import type { ActivitiesPageQueryParamsState } from '@/features/activities/query-params'

import { ActivityCreateForm, ActivityFormValues } from './_components/create-form'
import { ActivityList } from './_components/activity-list'
import { ActivityPendingCoverCard } from './_components/pending-cover'
import { ActivityProposalUploadCard } from './_components/proposal-upload'
import { FilterActivities } from './_components/filter-activities'

function ActivitiesPageInner() {
  const queryClient = useQueryClient()
  const { orgId, setOrgId } = useActivityOrgState()
  const { queryParams, setQueryParams } =
    useQueryParamsState<ActivitiesPageQueryParamsState>()
  const { page, pageSize, status, type, search } = queryParams

  const { data: orgs, isLoading: orgLoading } = useQuery({
    queryKey: ['orgs'],
    queryFn: listOrganizations,
  })

  useEffect(() => {
    if (!orgId && orgs?.length) setOrgId(orgs[0].id)
  }, [orgId, orgs, setOrgId])

  const {
    data: activitiesResp,
    isLoading,
    isFetching,
    isError,
    refetch,
  } = useQuery({
    queryKey: ['activities', orgId, page, pageSize, status, type],
    queryFn: () =>
      listActivitiesByOrg(orgId, {
        page,
        size: pageSize,
        status,
        type,
      } as ListActivitiesParams),
    enabled: Boolean(orgId),
  })

  const { mutateAsync: create, isPending: isCreating } = useMutation({
    mutationFn: createActivity,
    onSuccess: async () => {
      await queryClient.invalidateQueries({ queryKey: ['activities', orgId] })
    },
  })

  const { mutateAsync: submit, isPending: isSubmittingActivity } = useMutation({
    mutationFn: submitActivity,
    onSuccess: async () => {
      await queryClient.invalidateQueries({ queryKey: ['activities', orgId] })
    },
  })

  const { mutateAsync: approve, isPending: isApproving } = useMutation({
    mutationFn: (id: string) => approveActivity(id, { approve: true }),
    onSuccess: async () => {
      await queryClient.invalidateQueries({ queryKey: ['activities', orgId] })
    },
  })

  const { mutateAsync: revise, isPending: isRevising } = useMutation({
    mutationFn: (id: string) => reviseActivity(id, 'Perlu revisi'),
    onSuccess: async () => {
      await queryClient.invalidateQueries({ queryKey: ['activities', orgId] })
    },
  })

  const handleCreate = async (values: ActivityFormValues) => {
    await create(values)
  }

  const handleSubmit = async (id: string) => {
    await submit(id)
  }

  const handleApprove = async (id: string) => {
    await approve(id)
  }

  const handleRevise = async (id: string) => {
    await revise(id)
  }

  const activeOrg = useMemo(
    () => orgs?.find((o) => o.id === orgId)?.name ?? '—',
    [orgId, orgs],
  )

  const activities = activitiesResp?.items || []
  const totalActivities = activitiesResp?.total ?? activities.length

  const filteredActivities = activities.filter((a) => {
    if (!search) return true
    const q = search.toLowerCase()
    const inTitle = a.title?.toLowerCase().includes(q)
    const inDesc = a.description?.toLowerCase().includes(q)
    return Boolean(inTitle || inDesc)
  })

  return (
    <Page>
      <Page.Header breadcrumbs={[{ href: '/dashboard', children: 'Dashboard' }, { href: '/activities', children: 'Aktivitas' }]}>
        <div className="flex flex-col gap-4 md:flex-row md:items-center md:justify-between">
          <div>
            <h1 className="text-2xl font-bold tracking-tight text-neutral-900">
              Daftar Aktivitas
            </h1>
            <Badge className="bg-brand-50 text-brand-700 border-brand-100">
              Kelola kegiatan organisasi, pengajuan proposal, dan laporan kegiatan.
            </Badge>
          </div>
          <div className="flex items-center gap-2">
            <Badge variant="secondary" className="bg-brand-50 text-brand-700 hover:bg-brand-100 border-brand-100">
              Data Terbaru
            </Badge>
          </div>
        </div>
      </Page.Header>
      
      <Page.Body>
        <Container>
          <Tabs defaultValue="list" className="w-full space-y-6">
            <TabsList>
              <TabsTrigger value="list">Daftar Aktivitas</TabsTrigger>
              <TabsTrigger value="create">Buat Aktivitas</TabsTrigger>
              <TabsTrigger value="review">Review Sampul</TabsTrigger>
            </TabsList>

            <TabsContent value="list" className="space-y-6">
              <FilterActivities
                orgs={orgs}
                orgId={orgId}
                onChange={setOrgId}
                isLoading={orgLoading}
                selectedName={activeOrg}
                outboxCount={filteredActivities.length}
                queryParams={queryParams}
                setQueryParams={setQueryParams}
              />
              <ActivityList
                activities={filteredActivities}
                isLoading={isLoading}
                isFetching={isFetching}
                isError={isError}
                onRefresh={() => refetch()}
                onSubmit={handleSubmit}
                onApprove={handleApprove}
                onRevise={handleRevise}
                isSubmitting={isSubmittingActivity}
                isApproving={isApproving}
                isRevising={isRevising}
                page={Number(page || '1') || 1}
                total={totalActivities}
                onChangePage={(next) => setQueryParams({ page: String(Math.max(1, next)) })}
              />
            </TabsContent>

            <TabsContent value="create" className="space-y-6">
              <div className="grid gap-6 lg:grid-cols-2">
                <ActivityCreateForm
                  orgId={orgId}
                  onCreate={handleCreate}
                  isLoading={isCreating}
                />
                <ActivityProposalUploadCard orgId={orgId} />
              </div>
            </TabsContent>

            <TabsContent value="review">
              <ActivityPendingCoverCard />
            </TabsContent>
          </Tabs>
        </Container>
      </Page.Body>
    </Page>
  )
}

export default function ActivitiesPage() {
  return (
    <QueryParamsStateProvider<ActivitiesPageQueryParamsState>
      defaultValues={{ page: '1', pageSize: '10', status: '', type: '', search: '' }}
    >
      <ActivitiesPageInner />
    </QueryParamsStateProvider>
  )
}
