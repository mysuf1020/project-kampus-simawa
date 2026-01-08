'use client'

import { useMemo } from 'react'
import { useQuery } from '@tanstack/react-query'
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
  Tabs,
  TabsContent,
  TabsList,
  TabsTrigger,
  Container,
} from '@/components/ui'
import { Page } from '@/components/commons'
import { BarChart2, PieChart } from 'lucide-react'
import { fetchDashboardSummary } from '@/lib/apis/dashboard'

export default function ReportsPage() {
  const { data, isLoading, isError } = useQuery({
    queryKey: ['dashboard-summary', 'reports'],
    queryFn: fetchDashboardSummary,
  })

  const monthlyStats = useMemo(
    () => [
      { label: 'Aktivitas menunggu', value: data?.activities_pending ?? 0 },
      { label: 'Sampul menunggu', value: data?.cover_pending ?? 0 },
      { label: 'LPJ menunggu', value: data?.lpj_pending ?? 0 },
      { label: 'Surat menunggu', value: data?.surat_pending ?? 0 },
    ],
    [data],
  )

  const dailyStats = useMemo(
    () => [
      { label: 'Total organisasi', value: data?.org_total ?? 0 },
      { label: 'Total pengguna', value: data?.users_total ?? 0 },
      { label: 'LPJ terbaru', value: data?.last_achievements?.length ?? 0 },
    ],
    [data],
  )

  return (
    <Page>
      <Page.Header breadcrumbs={[{ href: '/dashboard', children: 'Dashboard' }, { href: '/reports', children: 'Laporan' }]}>
        <div className="flex flex-col gap-4 md:flex-row md:items-center md:justify-between">
          <div>
            <h1 className="text-2xl font-bold tracking-tight text-neutral-900">
              Laporan Sistem
            </h1>
            <p className="mt-1 text-sm text-neutral-500">
              Ringkasan data kegiatan, administrasi, dan statistik sistem.
            </p>
          </div>
        </div>
      </Page.Header>
      
      <Page.Body>
        <Container>
          <Tabs defaultValue="monthly" className="w-full space-y-6">
            <TabsList>
              <TabsTrigger value="monthly">Bulanan</TabsTrigger>
              <TabsTrigger value="daily">Harian</TabsTrigger>
            </TabsList>

            <TabsContent value="monthly" className="animate-in fade-in-50 duration-300">
              <Card className="border-neutral-200 shadow-sm">
                <CardHeader>
                  <div className="flex items-center gap-3 mb-2">
                    <div className="p-2 bg-blue-50 text-blue-600 rounded-lg">
                      <BarChart2 className="h-5 w-5" />
                    </div>
                    <div>
                      <CardTitle className="text-lg">Laporan Bulanan</CardTitle>
                      <CardDescription>
                        Statistik pending berdasarkan ringkasan dashboard saat ini.
                      </CardDescription>
                    </div>
                  </div>
                </CardHeader>
                <CardContent>
                  {isLoading && (
                    <div className="flex items-center justify-center py-12 text-sm text-neutral-500">
                      Memuat ringkasan laporan bulanan...
                    </div>
                  )}
                  {isError && (
                    <div className="rounded-lg border border-red-100 bg-red-50 p-4 text-center text-sm text-red-600">
                      Gagal memuat data laporan.
                    </div>
                  )}
                  {!isLoading && !isError && (
                    <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-4 pt-4">
                      {monthlyStats.map((item) => (
                        <div key={item.label} className="flex flex-col p-4 rounded-xl bg-neutral-50 border border-neutral-100">
                          <span className="text-xs font-medium text-neutral-500 uppercase tracking-wide">{item.label}</span>
                          <span className="text-2xl font-bold text-neutral-900 mt-2">{item.value}</span>
                        </div>
                      ))}
                    </div>
                  )}
                </CardContent>
              </Card>
            </TabsContent>

            <TabsContent value="daily" className="animate-in fade-in-50 duration-300">
              <Card className="border-neutral-200 shadow-sm">
                <CardHeader>
                  <div className="flex items-center gap-3 mb-2">
                    <div className="p-2 bg-green-50 text-green-600 rounded-lg">
                      <PieChart className="h-5 w-5" />
                    </div>
                    <div>
                      <CardTitle className="text-lg">Laporan Harian</CardTitle>
                      <CardDescription>
                        Gambaran singkat entitas aktif di sistem saat ini.
                      </CardDescription>
                    </div>
                  </div>
                </CardHeader>
                <CardContent>
                  {isLoading && (
                    <div className="flex items-center justify-center py-12 text-sm text-neutral-500">
                      Memuat ringkasan laporan harian...
                    </div>
                  )}
                  {isError && (
                    <div className="rounded-lg border border-red-100 bg-red-50 p-4 text-center text-sm text-red-600">
                      Gagal memuat data laporan.
                    </div>
                  )}
                  {!isLoading && !isError && (
                    <div className="grid gap-4 sm:grid-cols-3 pt-4">
                      {dailyStats.map((item) => (
                        <div key={item.label} className="flex flex-col p-4 rounded-xl bg-neutral-50 border border-neutral-100">
                          <span className="text-xs font-medium text-neutral-500 uppercase tracking-wide">{item.label}</span>
                          <span className="text-2xl font-bold text-neutral-900 mt-2">{item.value}</span>
                        </div>
                      ))}
                    </div>
                  )}
                </CardContent>
              </Card>
            </TabsContent>
          </Tabs>
        </Container>
      </Page.Body>
    </Page>
  )
}
