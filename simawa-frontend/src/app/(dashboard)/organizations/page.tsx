'use client'

import { useEffect, useMemo, useState } from 'react'
import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query'
import axios from 'axios'
import { RefreshCcw, Building2 } from 'lucide-react'
import { toast } from 'sonner'

import {
  Button,
  Container,
  Spinner,
  Tabs,
  TabsContent,
  TabsList,
  TabsTrigger,
} from '@/components/ui'
import { Page } from '@/components/commons'
import { Organization, listOrganizations, updateOrganization, deleteOrganization } from '@/lib/apis/org'
import { OrgCard } from './_components/org-card'
import { CreateOrgDialog } from './_components/create-org-dialog'
import { OrgMembersCard } from './_components/org-members-card'
import { OrgJoinRequestsCard } from './_components/org-join-requests-card'
import { OrgChartCard } from './_components/org-chart-card'

export default function OrganizationsPage() {
  const queryClient = useQueryClient()
  const orgsQuery = useQuery({ queryKey: ['orgs'], queryFn: listOrganizations })
  const [activeOrgId, setActiveOrgId] = useState<string>('')

  const { mutateAsync: update, isPending } = useMutation({
    mutationFn: async ({
      id,
      payload,
    }: {
      id: string
      payload: Partial<Organization>
    }) => {
      await updateOrganization(id, payload)
    },
    onSuccess: async (_, variables) => {
      await queryClient.invalidateQueries({ queryKey: ['orgs'] })
      toast.success('Profil organisasi tersimpan', {
        description: variables.payload.slug
          ? `Alamat halaman: /${variables.payload.slug}`
          : 'Perubahan tersimpan.',
      })
    },
    onError: (err: unknown) => {
      const message = axios.isAxiosError(err)
        ? (err.response?.data as { message?: string } | undefined)?.message || err.message
        : err instanceof Error
          ? err.message
          : 'Gagal menyimpan organisasi'
      toast.error(message)
    },
  })

  const { mutateAsync: deleteOrg } = useMutation({
    mutationFn: deleteOrganization,
    onSuccess: async () => {
      await queryClient.invalidateQueries({ queryKey: ['orgs'] })
      toast.success('Organisasi berhasil dihapus')
    },
    onError: (err: unknown) => {
      const message = axios.isAxiosError(err)
        ? (err.response?.data as { message?: string } | undefined)?.message || err.message
        : err instanceof Error
          ? err.message
          : 'Gagal menghapus organisasi'
      toast.error(message)
    },
  })

  useEffect(() => {
    if (activeOrgId) return
    const first =
      orgsQuery.data?.find((o) => Boolean(o.can_manage))?.id ?? orgsQuery.data?.[0]?.id
    if (first) setActiveOrgId(first)
  }, [activeOrgId, orgsQuery.data])

  const activeOrg = useMemo(
    () => orgsQuery.data?.find((o) => o.id === activeOrgId),
    [activeOrgId, orgsQuery.data],
  )

  const manageableOrgs = useMemo(
    () => (orgsQuery.data ?? []).filter((org) => Boolean(org.can_manage)),
    [orgsQuery.data],
  )
  const canManageAnyOrg = manageableOrgs.length > 0

  return (
    <Page>
      <Page.Header
        breadcrumbs={[
          { href: '/dashboard', children: 'Dashboard' },
          { href: '/organizations', children: 'Organisasi' },
        ]}
      >
        <div className="flex flex-col gap-4 md:flex-row md:items-center md:justify-between">
          <div>
            <h1 className="text-2xl font-bold tracking-tight text-neutral-900">
              Kelola Organisasi
            </h1>
            <p className="mt-1 text-sm text-neutral-500">
              Atur profil, anggota, dan pendaftaran keanggotaan organisasi.
            </p>
          </div>
          <div className="flex items-center gap-2">
            <CreateOrgDialog />
            <Button
              variant="outline"
              size="sm"
              onClick={() => orgsQuery.refetch()}
              className="gap-2"
            >
              <RefreshCcw className="h-3.5 w-3.5" /> Muat ulang
            </Button>
          </div>
        </div>
      </Page.Header>

      <Page.Body>
        <Container>
          <Tabs defaultValue="profile" className="w-full space-y-4 sm:space-y-6">
            <TabsList className="w-full flex-wrap h-auto gap-1 p-1">
              <TabsTrigger
                value="profile"
                className="flex-1 min-w-[80px] text-xs sm:text-sm"
              >
                Profil
              </TabsTrigger>
              {canManageAnyOrg ? (
                <>
                  <TabsTrigger
                    value="members"
                    className="flex-1 min-w-[80px] text-xs sm:text-sm"
                  >
                    Anggota
                  </TabsTrigger>
                  <TabsTrigger
                    value="structure"
                    className="flex-1 min-w-[80px] text-xs sm:text-sm"
                  >
                    Struktur
                  </TabsTrigger>
                  <TabsTrigger
                    value="join"
                    className="flex-1 min-w-[80px] text-xs sm:text-sm"
                  >
                    Pendaftaran
                  </TabsTrigger>
                </>
              ) : null}
            </TabsList>

            <TabsContent value="profile" className="animate-in fade-in-50 duration-300">
              <div className="flex flex-col gap-6">
                {orgsQuery.isLoading && (
                  <div className="flex items-center gap-2 text-sm text-neutral-600">
                    <Spinner size="sm" /> Memuat organisasi...
                  </div>
                )}
                {!orgsQuery.isLoading && manageableOrgs.length === 0 && (
                  <div className="rounded-xl border border-dashed border-neutral-200 bg-neutral-50/50 p-8 text-center">
                    <Building2 className="mx-auto h-10 w-10 text-neutral-300 mb-3" />
                    <p className="text-sm font-medium text-neutral-900">
                      Tidak ada organisasi
                    </p>
                    <p className="text-xs text-neutral-500 mt-1">
                      Anda tidak memiliki akses untuk mengelola organisasi manapun.
                    </p>
                  </div>
                )}
                <div className="grid gap-4 sm:gap-6 grid-cols-1 lg:grid-cols-2">
                  {manageableOrgs.map((org) => (
                    <OrgCard
                      key={org.id}
                      org={org}
                      canManage={Boolean(org.can_manage)}
                      isPending={isPending}
                      onSubmit={async (id, payload) => update({ id, payload })}
                      onDelete={async (id) => { await deleteOrg(id) }}
                      isAdmin={true}
                    />
                  ))}
                </div>
              </div>
            </TabsContent>

            {canManageAnyOrg ? (
              <>
                <TabsContent
                  value="members"
                  className="animate-in fade-in-50 duration-300"
                >
                  <div className="flex flex-col gap-6">
                    <OrgScopePicker
                      orgs={manageableOrgs}
                      orgId={activeOrgId}
                      onChange={setActiveOrgId}
                      isLoading={orgsQuery.isLoading}
                    />
                    <OrgMembersCard orgId={activeOrg?.id} orgName={activeOrg?.name} />
                  </div>
                </TabsContent>

                <TabsContent value="structure" className="animate-in fade-in-50 duration-300">
                  <div className="flex flex-col gap-6">
                    <OrgScopePicker
                      orgs={manageableOrgs}
                      orgId={activeOrgId}
                      onChange={setActiveOrgId}
                      isLoading={orgsQuery.isLoading}
                    />
                    <OrgChartCard orgId={activeOrg?.id} orgName={activeOrg?.name} />
                  </div>
                </TabsContent>

                <TabsContent value="join" className="animate-in fade-in-50 duration-300">
                  <div className="flex flex-col gap-6">
                    <OrgScopePicker
                      orgs={manageableOrgs}
                      orgId={activeOrgId}
                      onChange={setActiveOrgId}
                      isLoading={orgsQuery.isLoading}
                    />
                    <OrgJoinRequestsCard orgId={activeOrg?.id} />
                  </div>
                </TabsContent>
              </>
            ) : null}
          </Tabs>
        </Container>
      </Page.Body>
    </Page>
  )
}

function OrgScopePicker({
  orgs,
  orgId,
  onChange,
  isLoading,
}: {
  orgs?: Organization[]
  orgId: string
  onChange: (id: string) => void
  isLoading?: boolean
}) {
  return (
    <div className="flex flex-col gap-4 rounded-xl border border-neutral-200 bg-white p-4 shadow-sm sm:flex-row sm:items-center sm:justify-between">
      <div className="flex items-center gap-3">
        <div className="flex h-10 w-10 items-center justify-center rounded-lg bg-brand-50 text-brand-600">
          <Building2 className="h-5 w-5" />
        </div>
        <div>
          <p className="text-sm font-semibold text-neutral-900">Pilih Organisasi</p>
          <p className="text-xs text-neutral-500">
            Pilih organisasi untuk mengelola datanya.
          </p>
        </div>
      </div>
      <div className="min-w-[240px]">
        <select
          disabled={isLoading || !orgs?.length}
          className="h-10 w-full rounded-lg border border-neutral-200 bg-white px-3 text-sm text-neutral-900 outline-none focus:border-brand-500 focus:ring-2 focus:ring-brand-500/20 transition-all"
          value={orgId}
          onChange={(e) => onChange(e.target.value)}
        >
          {(orgs ?? []).map((o) => (
            <option key={o.id} value={o.id}>
              {o.name}
            </option>
          ))}
        </select>
      </div>
    </div>
  )
}
