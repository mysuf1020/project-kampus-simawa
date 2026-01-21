'use client'

import { useState } from 'react'
import { useQuery } from '@tanstack/react-query'
import { FileText, RotateCw, Search } from 'lucide-react'
import { format } from 'date-fns'
import { id } from 'date-fns/locale'

import {
  Button,
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
  Container,
  Input,
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
  Spinner,
} from '@/components/ui'
import { Page } from '@/components/commons'
import { listAuditLogs } from '@/lib/apis/audit'
import { SkeletonTable } from '@/components/ui/skeleton/skeleton-table'

export default function AuditLogPage() {
  const [page, setPage] = useState(1)
  const [pageSize] = useState(20)
  const [actionFilter, setActionFilter] = useState('')
  const [entityFilter, setEntityFilter] = useState('')

  const { data, isLoading, isError, refetch, isFetching } = useQuery({
    queryKey: ['audit-logs', page, pageSize, actionFilter, entityFilter],
    queryFn: () =>
      listAuditLogs({
        page,
        size: pageSize,
        action: actionFilter || undefined,
        entity_type: entityFilter || undefined,
      }),
  })

  const items = data?.items ?? []
  const total = data?.total ?? 0
  const totalPages = Math.ceil(total / pageSize)

  return (
    <Page>
      <Page.Header
        breadcrumbs={[
          { href: '/dashboard', children: 'Dashboard' },
          { href: '/audit', children: 'Audit Log' },
        ]}
      >
        <div className="flex flex-col gap-4 md:flex-row md:items-center md:justify-between">
          <div>
            <h1 className="text-2xl font-bold tracking-tight text-neutral-900">
              Audit Log
            </h1>
            <p className="mt-1 text-sm text-neutral-500">
              Riwayat aktivitas sistem untuk keamanan dan pemantauan.
            </p>
          </div>
          <Button variant="outline" size="sm" className="gap-2" onClick={() => refetch()}>
            {isFetching ? <Spinner size="xs" /> : <RotateCw className="h-3.5 w-3.5" />}
            Muat ulang
          </Button>
        </div>
      </Page.Header>

      <Page.Body>
        <Container>
          <Card className="border-neutral-200 shadow-sm">
            <CardHeader className="pb-4">
              <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
                <div className="space-y-1">
                  <CardTitle className="text-base font-semibold">
                    Riwayat Aktivitas
                  </CardTitle>
                  <CardDescription>
                    Menampilkan {items.length} dari total {total} aktivitas.
                  </CardDescription>
                </div>
                <div className="flex flex-wrap gap-2">
                  <Select value={actionFilter} onValueChange={setActionFilter}>
                    <SelectTrigger className="w-[180px] h-9 text-xs">
                      <SelectValue placeholder="Filter Aksi" />
                    </SelectTrigger>
                    <SelectContent>
                      <SelectItem value="ALL">Semua Aksi</SelectItem>
                      <SelectItem value="LOGIN">Login</SelectItem>
                      <SelectItem value="CREATE">Create</SelectItem>
                      <SelectItem value="UPDATE">Update</SelectItem>
                      <SelectItem value="DELETE">Delete</SelectItem>
                      <SelectItem value="APPROVE">Approve</SelectItem>
                      <SelectItem value="REJECT">Reject</SelectItem>
                    </SelectContent>
                  </Select>

                  <Select value={entityFilter} onValueChange={setEntityFilter}>
                    <SelectTrigger className="w-[180px] h-9 text-xs">
                      <SelectValue placeholder="Filter Entitas" />
                    </SelectTrigger>
                    <SelectContent>
                      <SelectItem value="ALL">Semua Entitas</SelectItem>
                      <SelectItem value="USER">User</SelectItem>
                      <SelectItem value="SURAT">Surat</SelectItem>
                      <SelectItem value="LPJ">LPJ</SelectItem>
                      <SelectItem value="ACTIVITY">Activity</SelectItem>
                      <SelectItem value="ORGANIZATION">Organization</SelectItem>
                    </SelectContent>
                  </Select>
                </div>
              </div>
            </CardHeader>
            <CardContent>
              {isLoading ? (
                <SkeletonTable />
              ) : isError ? (
                <div className="p-8 text-center text-red-500 text-sm">
                  Gagal memuat data audit log.
                </div>
              ) : items.length === 0 ? (
                <div className="p-12 text-center text-neutral-500 text-sm">
                  Tidak ada riwayat aktivitas ditemukan.
                </div>
              ) : (
                <div className="rounded-md border border-neutral-200">
                  <div className="overflow-x-auto">
                    <table className="w-full text-sm text-left">
                      <thead className="bg-neutral-50 text-neutral-500 font-medium border-b border-neutral-200">
                        <tr>
                          <th className="px-4 py-3 w-[180px]">Waktu</th>
                          <th className="px-4 py-3 w-[150px]">Aksi</th>
                          <th className="px-4 py-3">Deskripsi</th>
                          <th className="px-4 py-3 w-[150px]">Entitas</th>
                          <th className="px-4 py-3 w-[120px]">IP Address</th>
                        </tr>
                      </thead>
                      <tbody className="divide-y divide-neutral-100">
                        {items.map((log) => (
                          <tr
                            key={log.id}
                            className="hover:bg-neutral-50/50 transition-colors"
                          >
                            <td className="px-4 py-3 text-neutral-500 whitespace-nowrap text-xs">
                              {format(new Date(log.created_at), 'dd MMM yyyy HH:mm', {
                                locale: id,
                              })}
                            </td>
                            <td className="px-4 py-3 font-medium">
                              <span className="inline-flex items-center rounded-md bg-neutral-100 px-2 py-1 text-xs font-medium text-neutral-600 ring-1 ring-inset ring-neutral-500/10">
                                {log.action}
                              </span>
                            </td>
                            <td className="px-4 py-3 text-neutral-700 max-w-md truncate">
                              {log.description}
                            </td>
                            <td className="px-4 py-3 text-neutral-500 text-xs">
                              {log.entity_type}{' '}
                              <span className="text-neutral-300">#</span>
                              {log.entity_id.substring(0, 8)}
                            </td>
                            <td className="px-4 py-3 text-neutral-500 text-xs font-mono">
                              {log.ip_address}
                            </td>
                          </tr>
                        ))}
                      </tbody>
                    </table>
                  </div>
                </div>
              )}

              <div className="flex items-center justify-between border-t border-neutral-100 pt-4 mt-4">
                <span className="text-xs text-neutral-500">
                  Halaman {page} dari {totalPages || 1}
                </span>
                <div className="flex gap-2">
                  <Button
                    size="sm"
                    variant="outline"
                    className="h-8 text-xs"
                    disabled={page <= 1}
                    onClick={() => setPage((p) => Math.max(1, p - 1))}
                  >
                    Sebelumnya
                  </Button>
                  <Button
                    size="sm"
                    variant="outline"
                    className="h-8 text-xs"
                    onClick={() => setPage((p) => p + 1)}
                    disabled={page >= totalPages}
                  >
                    Berikutnya
                  </Button>
                </div>
              </div>
            </CardContent>
          </Card>
        </Container>
      </Page.Body>
    </Page>
  )
}
