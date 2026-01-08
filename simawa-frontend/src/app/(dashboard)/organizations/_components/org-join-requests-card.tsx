'use client'

import { useMemo, useState } from 'react'
import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query'
import { Check, Loader2, UserPlus, X } from 'lucide-react'
import { toast } from 'sonner'

import {
  Badge,
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
  Text,
  Spinner,
} from '@/components/ui'
import {
  decideJoinRequest,
  listJoinRequests,
  type OrgJoinRequest,
} from '@/lib/apis/org-join'

type Props = {
  orgId?: string
}

export function OrgJoinRequestsCard({ orgId }: Props) {
  const queryClient = useQueryClient()
  const [status, setStatus] = useState<'PENDING' | 'APPROVED' | 'REJECTED'>('PENDING')

  const query = useQuery<OrgJoinRequest[]>({
    queryKey: ['org-join-requests', orgId, status],
    queryFn: () => listJoinRequests(orgId as string, status),
    enabled: Boolean(orgId),
  })

  const headerCopy = useMemo(() => {
    switch (status) {
      case 'APPROVED':
        return {
          title: 'Pendaftaran Anggota',
          desc: 'Permintaan bergabung yang sudah disetujui.',
          badge: 'Disetujui',
        }
      case 'REJECTED':
        return {
          title: 'Pendaftaran Anggota',
          desc: 'Permintaan bergabung yang ditolak.',
          badge: 'Ditolak',
        }
      default:
        return {
          title: 'Pendaftaran Anggota',
          desc: 'Permintaan bergabung yang menunggu ditinjau.',
          badge: 'Menunggu',
        }
    }
  }, [status])

  const decide = useMutation({
    mutationFn: async ({ requestId, approve }: { requestId: string; approve: boolean }) =>
      decideJoinRequest(orgId as string, requestId, approve),
    onSuccess: async () => {
      await queryClient.invalidateQueries({ queryKey: ['org-join-requests', orgId] })
      await queryClient.invalidateQueries({ queryKey: ['org-members', orgId] })
    },
  })

  const handleDecide = async (requestId: string, approve: boolean) => {
    try {
      await decide.mutateAsync({ requestId, approve })
      toast.success(approve ? 'Permintaan diterima' : 'Permintaan ditolak')
    } catch (err) {
      const message = err instanceof Error ? err.message : 'Gagal memproses permintaan'
      toast.error(message)
    }
  }

  return (
    <Card className="border-neutral-200 shadow-sm">
      <CardHeader className="flex flex-row items-center justify-between border-b border-neutral-100 bg-neutral-50/50 px-6 py-4">
        <div className="flex items-center gap-3">
          <div className="flex h-10 w-10 items-center justify-center rounded-lg bg-orange-50 text-orange-600">
            <UserPlus className="h-5 w-5" />
          </div>
          <div>
            <CardTitle className="text-base font-semibold text-neutral-900">{headerCopy.title}</CardTitle>
            <CardDescription className="text-xs text-neutral-500">{headerCopy.desc}</CardDescription>
          </div>
        </div>
        <Badge variant="secondary" className="bg-white text-neutral-700 border-neutral-200">
          {query.data?.length ?? 0} {headerCopy.badge}
        </Badge>
      </CardHeader>
      
      <CardContent className="p-6 space-y-4">
        {!orgId ? (
          <div className="flex items-center justify-center py-12 text-center text-sm text-neutral-500 bg-neutral-50 rounded-xl border border-dashed border-neutral-200">
            <p>Pilih organisasi terlebih dahulu.</p>
          </div>
        ) : (
          <Tabs
            value={status}
            onValueChange={(v) => setStatus(v as typeof status)}
            className="w-full"
          >
            <TabsList className="bg-neutral-100/50 border border-neutral-200 p-1 w-full sm:w-auto h-auto flex-wrap">
              <TabsTrigger value="PENDING" className="data-[state=active]:bg-white data-[state=active]:shadow-sm">Menunggu</TabsTrigger>
              <TabsTrigger value="APPROVED" className="data-[state=active]:bg-white data-[state=active]:shadow-sm">Disetujui</TabsTrigger>
              <TabsTrigger value="REJECTED" className="data-[state=active]:bg-white data-[state=active]:shadow-sm">Ditolak</TabsTrigger>
            </TabsList>

            <TabsContent value={status} className="mt-4 space-y-3">
              {query.isLoading ? (
                <div className="flex items-center justify-center py-8 text-xs text-neutral-500">
                  <Spinner size="sm" className="mr-2" /> Memuat permintaan...
                </div>
              ) : query.isError ? (
                <div className="p-4 rounded-lg bg-red-50 text-red-600 text-xs text-center border border-red-100">
                  Gagal memuat data.
                </div>
              ) : (query.data?.length ?? 0) === 0 ? (
                <div className="text-center py-8 text-sm text-neutral-500 bg-neutral-50 rounded-lg border border-neutral-100">
                  Belum ada data untuk status ini.
                </div>
              ) : (
                <div className="space-y-3">
                  {query.data?.map((r) => (
                    <div
                      key={r.id}
                      className="group rounded-xl border border-neutral-200 bg-white p-4 hover:border-brand-200 hover:shadow-sm transition-all"
                    >
                      <div className="flex flex-col sm:flex-row sm:items-start justify-between gap-4">
                        <div className="space-y-1">
                          <div className="flex items-center gap-2">
                            <p className="text-sm font-semibold text-neutral-900">
                              {r.applicant_name || 'Pemohon'}
                            </p>
                            <Badge variant="outline" className="text-[10px] bg-neutral-50 text-neutral-600 border-neutral-200">
                              {r.applicant_nim || '-'}
                            </Badge>
                          </div>
                          
                          <div className="text-xs text-neutral-500">
                            <p>{r.applicant_email || '-'}</p>
                            {r.applicant_jurusan && <p className="mt-0.5">{r.applicant_jurusan}</p>}
                          </div>
                          
                          {r.message && (
                            <div className="mt-3 bg-neutral-50 p-2.5 rounded-lg border border-neutral-100 text-xs text-neutral-600 italic">
                              "{r.message}"
                            </div>
                          )}
                          
                          {status !== 'PENDING' && r.decision_note && (
                            <p className="mt-2 text-xs text-neutral-500">
                              Catatan: {r.decision_note}
                            </p>
                          )}
                        </div>

                        {status === 'PENDING' && (
                          <div className="flex gap-2 sm:flex-col sm:gap-2 pt-2 sm:pt-0">
                            <Button
                              size="sm"
                              className="h-8 text-xs bg-brand-600 hover:bg-brand-700 text-white gap-1.5"
                              disabled={decide.isPending}
                              onClick={() => handleDecide(r.id, true)}
                            >
                              {decide.isPending ? (
                                <Loader2 className="h-3 w-3 animate-spin" />
                              ) : (
                                <Check className="h-3 w-3" />
                              )}
                              Terima
                            </Button>
                            <Button
                              size="sm"
                              variant="outline"
                              className="h-8 text-xs gap-1.5 hover:bg-red-50 hover:text-red-600 hover:border-red-200"
                              disabled={decide.isPending}
                              onClick={() => handleDecide(r.id, false)}
                            >
                              <X className="h-3 w-3" /> Tolak
                            </Button>
                          </div>
                        )}
                      </div>
                    </div>
                  ))}
                </div>
              )}
            </TabsContent>
          </Tabs>
        )}
      </CardContent>
    </Card>
  )
}
