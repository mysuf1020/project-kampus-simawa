'use client'

import { useMemo } from 'react'
import { useQuery } from '@tanstack/react-query'
import { Download, FileText, CheckCircle2, Clock, Building2, Users } from 'lucide-react'

import { Button, Container } from '@/components/ui'
import { Page } from '@/components/commons'
import { fetchDashboardSummary } from '@/lib/apis/dashboard'
import { StatsGrid } from './_components/stats-grid'
import { LatestActivityCard } from './_components/latest-activity'
import { NotificationsCard } from './_components/notifications-card'

export default function DashboardPage() {
  const { data, isLoading, isError, refetch, isFetching } = useQuery({
    queryKey: ['dashboard-summary'],
    queryFn: fetchDashboardSummary,
  })

  const stats = useMemo(
    () => [
      {
        label: 'Aktivitas Pending',
        value: data?.activities_pending ?? '-',
        trend: data ? `${data.activities_pending} tasks` : '...',
        icon: Clock,
        variant: 'warning' as const,
      },
      {
        label: 'Surat Masuk',
        value: data?.surat_pending ?? '-',
        trend: data ? `${data.surat_pending} surat` : '...',
        icon: FileText,
        variant: 'info' as const,
      },
      {
        label: 'LPJ Menunggu',
        value: data?.lpj_pending ?? '-',
        trend: data ? `${data.lpj_pending} laporan` : '...',
        icon: FileText,
        variant: 'warning' as const,
      },
      {
        label: 'Cover Letter',
        value: data?.cover_pending ?? '-',
        trend: data ? `${data.cover_pending} dokumen` : '...',
        icon: CheckCircle2,
        variant: 'success' as const,
      },
      {
        label: 'Total Organisasi',
        value: data?.org_total ?? '-',
        trend: data ? `${data.org_total} unit` : '...',
        icon: Building2,
        variant: 'neutral' as const,
      },
      {
        label: 'Total Pengguna',
        value: data?.users_total ?? '-',
        trend: data ? `${data.users_total} user` : '...',
        icon: Users,
        variant: 'neutral' as const,
      },
    ],
    [data],
  )

  return (
    <Page>
      <Page.Header breadcrumbs={[{ href: '/dashboard', children: 'Dashboard' }]}>
        <div className="flex flex-col gap-4 md:flex-row md:items-center md:justify-between">
          <div>
            <h1 className="text-2xl font-bold tracking-tight text-neutral-900">
              Ringkasan Sistem
            </h1>
            <p className="mt-1 text-sm text-neutral-500">
              Pantau aktivitas, surat, dan laporan kinerja dalam satu tampilan.
            </p>
          </div>
          <div className="flex items-center gap-2">
            <Button
              variant="outline"
              size="sm"
              className="hidden sm:flex"
            >
              Unduh Laporan
            </Button>
            <Button size="sm" className="bg-brand-600 hover:bg-brand-700 text-white gap-2 shadow-sm shadow-brand-500/20">
              <Download className="h-4 w-4" />
              Export Data
            </Button>
          </div>
        </div>
      </Page.Header>

      <Page.Body>
        <Container>
          <div className="flex flex-col gap-8">
            <StatsGrid items={stats} />

            <div className="grid gap-6 lg:grid-cols-2">
              <LatestActivityCard
                items={data?.last_achievements}
                isLoading={isLoading}
                isFetching={isFetching}
                isError={isError}
                onRefresh={() => refetch()}
              />
              <NotificationsCard />
            </div>
          </div>
        </Container>
      </Page.Body>
    </Page>
  )
}
