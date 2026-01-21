'use client'

import { useMemo, useState } from 'react'
import { useQuery } from '@tanstack/react-query'
import { toast } from 'sonner'
import {
  Button,
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
  Input,
  Label,
} from '@/components/ui'
import { Page } from '@/components/commons'
import { BarChart2, PieChart, Download, FileText } from 'lucide-react'
import { fetchDashboardSummary } from '@/lib/apis/dashboard'
import {
  exportActivityReport,
  exportSuratReport,
  exportLPJReport,
} from '@/lib/apis/report'

export default function ReportsPage() {
  const { data, isLoading, isError } = useQuery({
    queryKey: ['dashboard-summary', 'reports'],
    queryFn: fetchDashboardSummary,
  })

  const [dateRange, setDateRange] = useState({
    start: new Date(new Date().getFullYear(), new Date().getMonth(), 1)
      .toISOString()
      .split('T')[0],
    end: new Date().toISOString().split('T')[0],
  })

  const [exporting, setExporting] = useState<string | null>(null)

  const handleExport = async (type: 'activity' | 'surat' | 'lpj') => {
    setExporting(type)
    try {
      let blob: Blob
      let filename = ''
      if (type === 'activity') {
        blob = await exportActivityReport(dateRange.start, dateRange.end)
        filename = `laporan_kegiatan_${dateRange.start}_${dateRange.end}.csv`
      } else if (type === 'surat') {
        blob = await exportSuratReport(dateRange.start, dateRange.end)
        filename = `laporan_surat_${dateRange.start}_${dateRange.end}.csv`
      } else {
        blob = await exportLPJReport(dateRange.start, dateRange.end)
        filename = `laporan_lpj_${dateRange.start}_${dateRange.end}.csv`
      }

      const url = window.URL.createObjectURL(blob)
      const a = document.createElement('a')
      a.href = url
      a.download = filename
      document.body.appendChild(a)
      a.click()
      window.URL.revokeObjectURL(url)
      document.body.removeChild(a)
      toast.success('Laporan berhasil diunduh')
    } catch (error) {
      toast.error('Gagal mengunduh laporan')
      console.error(error)
    } finally {
      setExporting(null)
    }
  }

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
      <Page.Header
        breadcrumbs={[
          { href: '/dashboard', children: 'Dashboard' },
          { href: '/reports', children: 'Laporan' },
        ]}
      >
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
                        <div
                          key={item.label}
                          className="flex flex-col p-4 rounded-xl bg-neutral-50 border border-neutral-100"
                        >
                          <span className="text-xs font-medium text-neutral-500 uppercase tracking-wide">
                            {item.label}
                          </span>
                          <span className="text-2xl font-bold text-neutral-900 mt-2">
                            {item.value}
                          </span>
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
                        <div
                          key={item.label}
                          className="flex flex-col p-4 rounded-xl bg-neutral-50 border border-neutral-100"
                        >
                          <span className="text-xs font-medium text-neutral-500 uppercase tracking-wide">
                            {item.label}
                          </span>
                          <span className="text-2xl font-bold text-neutral-900 mt-2">
                            {item.value}
                          </span>
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
