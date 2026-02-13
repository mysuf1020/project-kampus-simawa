'use client'

import { useState } from 'react'
import { useMutation, useQueryClient } from '@tanstack/react-query'
import { Check, Download, Info, Loader2, RefreshCw, X, FileText, Building2, User } from 'lucide-react'
import { toast } from 'sonner'

import {
  Badge,
  Button,
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
  Spinner,
  InfiniteScrollLoader,
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
  TextArea,
} from '@/components/ui'
import { Skeleton } from '@/components/ui/skeleton'
import { approveLPJ, addLPJRevision, getLPJDownloadURL, type LPJ } from '@/lib/apis/lpj'
import dayjs from 'dayjs'
import 'dayjs/locale/id'

dayjs.locale('id')

type Props = {
  items?: LPJ[]
  orgs?: { id: string; name: string }[]
  isLoading?: boolean
  isError?: boolean
  isFetching?: boolean
  page?: number
  onChangePage?: (page: number) => void
  onRefresh?: () => void
  hasNextPage?: boolean
  onLoadMore?: () => void
  isFetchingNextPage?: boolean
}

type NoteModalState = {
  open: boolean
  type: 'reject' | 'revision' | null
  lpjId: string
  note: string
}

export function LPJListCard({
  items,
  orgs,
  isLoading,
  isError,
  isFetching,
  page = 1,
  onChangePage,
  onRefresh,
  hasNextPage,
  onLoadMore,
  isFetchingNextPage,
}: Props) {
  const queryClient = useQueryClient()
  const [noteModal, setNoteModal] = useState<NoteModalState>({
    open: false,
    type: null,
    lpjId: '',
    note: '',
  })

  const { mutateAsync: approve, isPending: isApproving } = useMutation({
    mutationFn: ({
      lpjId,
      approve,
      note,
    }: {
      lpjId: string
      approve: boolean
      note?: string
    }) => approveLPJ(lpjId, approve, note || (approve ? 'LPJ disetujui' : 'Ditolak')),
    onSuccess: async () => {
      await queryClient.invalidateQueries({ queryKey: ['lpj'] })
      toast.success('Keputusan LPJ tersimpan')
    },
    onError: () => {
      toast.error('Gagal mengubah status LPJ')
    },
  })

  const { mutateAsync: revise, isPending: isRevising } = useMutation({
    mutationFn: ({ lpjId, note }: { lpjId: string; note: string }) =>
      addLPJRevision(lpjId, note),
    onSuccess: async () => {
      await queryClient.invalidateQueries({ queryKey: ['lpj'] })
      toast.success('Status LPJ diubah menjadi "Diminta Revisi"')
    },
    onError: (error: Error) => {
      console.error('Revision error:', error)
      toast.error(`Gagal menambahkan revisi LPJ: ${error.message || 'Unknown error'}`)
    },
  })

  const { mutateAsync: download, isPending: isDownloading } = useMutation({
    mutationFn: (activityId: string) => getLPJDownloadURL(activityId),
    onSuccess: (url) => {
      if (typeof window !== 'undefined') {
        window.open(url, '_blank', 'noopener,noreferrer')
      }
    },
    onError: () => {
      toast.error('Gagal mengambil file LPJ')
    },
  })

  const handleApprove = async (lpj: LPJ, approveValue: boolean) => {
    const targetId = lpj.id
    if (!targetId) {
      toast.error('ID LPJ tidak ditemukan')
      return
    }
    if (!approveValue) {
      // Open modal for rejection note
      setNoteModal({
        open: true,
        type: 'reject',
        lpjId: targetId,
        note: 'Perlu perbaikan',
      })
      return
    }
    await approve({ lpjId: targetId, approve: approveValue })
  }

  const handleRevision = async (lpj: LPJ) => {
    const targetId = lpj.id
    if (!targetId) {
      toast.error('ID LPJ tidak ditemukan')
      return
    }
    // Open modal for revision note
    setNoteModal({
      open: true,
      type: 'revision',
      lpjId: targetId,
      note: 'Perlu revisi',
    })
  }

  const handleNoteSubmit = async () => {
    if (!noteModal.note.trim()) {
      toast.error('Catatan wajib diisi')
      return
    }
    if (noteModal.type === 'reject') {
      await approve({ lpjId: noteModal.lpjId, approve: false, note: noteModal.note })
    } else if (noteModal.type === 'revision') {
      await revise({ lpjId: noteModal.lpjId, note: noteModal.note })
    }
    setNoteModal({ open: false, type: null, lpjId: '', note: '' })
  }

  const closeNoteModal = () => {
    setNoteModal({ open: false, type: null, lpjId: '', note: '' })
  }

  const busy = isApproving || isRevising

  const statusTone: Record<string, string> = {
    PENDING: 'bg-amber-50 text-amber-700 border-amber-100',
    APPROVED: 'bg-green-50 text-green-700 border-green-100',
    REJECTED: 'bg-red-50 text-red-700 border-red-100',
    REVISION_REQUESTED: 'bg-blue-50 text-blue-700 border-blue-100',
  }

  const statusLabel: Record<string, string> = {
    PENDING: 'Menunggu review',
    APPROVED: 'Disetujui',
    REJECTED: 'Ditolak',
    REVISION_REQUESTED: 'Diminta revisi',
  }

  const renderMeta = (lpj: LPJ) => {
    const updated = lpj.updated_at ? dayjs(lpj.updated_at).format('DD MMM YYYY') : ''
    const size = lpj.file_size ? `${(lpj.file_size / 1024 / 1024).toFixed(1)} MB` : ''
    const parts = [updated && `Diupdate ${updated}`, size && `PDF ${size}`].filter(
      Boolean,
    )
    return parts.join(' • ')
  }

  return (
    <Card className="border-neutral-200 shadow-sm">
      <CardHeader className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 border-b border-neutral-100 bg-neutral-50/50 pb-4">
        <div className="space-y-0.5">
          <CardTitle className="text-sm sm:text-base font-semibold text-neutral-900">
            Daftar LPJ
          </CardTitle>
          <CardDescription className="text-xs text-neutral-500">
            Daftar laporan pertanggungjawaban.
          </CardDescription>
        </div>
        <Button
          variant="outline"
          size="sm"
          onClick={onRefresh}
          className="h-8 gap-2 bg-white text-xs font-medium text-neutral-700 hover:bg-neutral-50 w-full sm:w-auto"
        >
          {isFetching ? (
            <Loader2 className="h-3.5 w-3.5 animate-spin" />
          ) : (
            <RefreshCw className="h-3.5 w-3.5" />
          )}
          Segarkan
        </Button>
      </CardHeader>
      <CardContent className="p-4 space-y-4">
        {isLoading && (
          <div className="space-y-4">
            <div className="flex items-center gap-2 text-xs text-neutral-500">
              <Spinner size="sm" />
              <span>Memuat data LPJ...</span>
            </div>
            <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-3">
              {Array.from({ length: 6 }).map((_, idx) => (
                <div
                  key={idx}
                  className="rounded-xl border border-neutral-100 bg-white p-4"
                >
                  <Skeleton className="h-4 w-3/4 mb-2" />
                  <Skeleton className="h-3 w-1/2 mb-4" />
                  <div className="flex gap-2">
                    <Skeleton className="h-6 w-16 rounded-full" />
                    <Skeleton className="h-6 w-16 rounded-full" />
                  </div>
                </div>
              ))}
            </div>
          </div>
        )}

        {isError && (
          <div className="rounded-lg border border-red-100 bg-red-50 p-4 text-center">
            <p className="text-sm font-medium text-red-800">Gagal memuat data LPJ</p>
            <p className="text-xs text-red-600 mt-1">
              Silakan coba segarkan kembali halaman ini.
            </p>
          </div>
        )}

        {!isLoading && !isError && (!items || items.length === 0) && (
          <div className="flex flex-col items-center justify-center rounded-xl border border-dashed border-neutral-200 bg-neutral-50/50 py-12 text-center">
            <div className="rounded-full bg-neutral-100 p-3 mb-3">
              <FileText className="h-6 w-6 text-neutral-400" />
            </div>
            <p className="text-sm font-medium text-neutral-900">Belum ada LPJ</p>
            <p className="text-xs text-neutral-500 mt-1 max-w-xs">
              Belum ada laporan pertanggungjawaban yang diunggah.
            </p>
          </div>
        )}

        <div className="grid gap-3 sm:gap-4 grid-cols-1 sm:grid-cols-2 lg:grid-cols-3">
          {items?.map((lpj) => (
            <div
              key={lpj.id}
              className="group flex flex-col justify-between rounded-xl border border-neutral-200 bg-white p-3 sm:p-4 shadow-sm transition-all hover:border-brand-200 hover:shadow-md"
            >
              <div>
                <div className="flex items-start justify-between gap-3 mb-2">
                  <div className="space-y-1">
                    <h3
                      className="font-semibold text-neutral-900 line-clamp-1 text-sm"
                      title={lpj.summary}
                    >
                      {lpj.summary || 'LPJ Kegiatan'}
                    </h3>
                    {lpj.activity_id && (
                      <p className="text-xs text-neutral-500 truncate max-w-[180px]">
                        Ref: {lpj.activity_id}
                      </p>
                    )}
                  </div>
                  <Badge
                    variant="secondary"
                    className={`
                      shrink-0 text-[10px] font-semibold uppercase tracking-wider px-2 py-0.5
                      ${statusTone[lpj.status] || 'bg-neutral-100 text-neutral-600 border-neutral-200'}
                    `}
                  >
                    {statusLabel[lpj.status] || lpj.status}
                  </Badge>
                </div>

                {/* Sender & Org info */}
                <div className="flex flex-wrap items-center gap-2 mb-2">
                  {(() => {
                    const orgName = orgs?.find((o) => o.id === lpj.org_id)?.name
                    return orgName ? (
                      <div className="flex items-center gap-1 rounded-md bg-brand-50 px-2 py-0.5 text-[10px] font-medium text-brand-700 border border-brand-100">
                        <Building2 className="h-3 w-3 text-brand-500" />
                        <span className="truncate max-w-[120px]">{orgName}</span>
                      </div>
                    ) : null
                  })()}
                  {lpj.submitted_by && (
                    <div className="flex items-center gap-1 rounded-md bg-neutral-50 px-2 py-0.5 text-[10px] font-medium text-neutral-600 border border-neutral-100">
                      <User className="h-3 w-3 text-neutral-400" />
                      <span className="truncate max-w-[120px]">{lpj.submitted_by}</span>
                    </div>
                  )}
                </div>

                <div className="text-xs text-neutral-500 mb-4 space-y-1">
                  <p>{renderMeta(lpj)}</p>
                  {lpj.revision_no ? (
                    <p className="font-medium text-amber-600">
                      Revisi ke-{lpj.revision_no}
                    </p>
                  ) : null}
                  {lpj.note && (
                    <div className="mt-2 rounded-md bg-neutral-50 p-2 text-xs italic text-neutral-600 border border-neutral-100">
                      &quot;{lpj.note}&quot;
                    </div>
                  )}
                </div>
              </div>

              <div className="flex items-center gap-2 pt-3 border-t border-neutral-100 mt-auto">
                <Button
                  size="sm"
                  variant="outline"
                  className="h-8 flex-1 text-xs"
                  disabled={isDownloading}
                  onClick={() =>
                    (lpj.id || lpj.activity_id) && download(lpj.id || lpj.activity_id!)
                  }
                >
                  {isDownloading ? (
                    <Loader2 className="mr-1.5 h-3.5 w-3.5 animate-spin" />
                  ) : (
                    <Download className="mr-1.5 h-3.5 w-3.5" />
                  )}
                  Unduh PDF
                </Button>

                {lpj.status === 'PENDING' && (
                  <>
                    <Button
                      size="icon"
                      variant="outline"
                      className="h-8 w-8 text-green-600 border-green-200 hover:bg-green-50 hover:text-green-700 hover:border-green-300"
                      disabled={busy}
                      onClick={() => handleApprove(lpj, true)}
                      title="Setujui"
                    >
                      {isApproving ? (
                        <Loader2 className="h-3.5 w-3.5 animate-spin" />
                      ) : (
                        <Check className="h-3.5 w-3.5" />
                      )}
                    </Button>
                    <Button
                      size="icon"
                      variant="outline"
                      className="h-8 w-8 text-red-600 border-red-200 hover:bg-red-50 hover:text-red-700 hover:border-red-300"
                      disabled={busy}
                      onClick={() => handleApprove(lpj, false)}
                      title="Tolak"
                    >
                      {isApproving ? (
                        <Loader2 className="h-3.5 w-3.5 animate-spin" />
                      ) : (
                        <X className="h-3.5 w-3.5" />
                      )}
                    </Button>
                    <Button
                      size="icon"
                      variant="outline"
                      className="h-8 w-8 text-amber-600 border-amber-200 hover:bg-amber-50 hover:text-amber-700 hover:border-amber-300"
                      disabled={busy}
                      onClick={() => handleRevision(lpj)}
                      title="Minta Revisi"
                    >
                      {isRevising ? (
                        <Loader2 className="h-3.5 w-3.5 animate-spin" />
                      ) : (
                        <Info className="h-3.5 w-3.5" />
                      )}
                    </Button>
                  </>
                )}
              </div>
            </div>
          ))}
        </div>

        {/* Mobile: Infinite Scroll */}
        {hasNextPage && onLoadMore && (
          <div className="sm:hidden">
            <InfiniteScrollLoader
              onLoadMore={onLoadMore}
              isLoading={isFetchingNextPage}
              hasMore={hasNextPage}
            />
          </div>
        )}

        {/* Desktop: Pagination */}
        {onChangePage && (
          <div className="hidden sm:flex flex-row items-center justify-between border-t border-neutral-100 pt-4 mt-2">
            <span className="text-xs text-neutral-500">
              Halaman <span className="font-medium text-neutral-900">{page}</span>
            </span>
            <div className="flex gap-2">
              <Button
                size="sm"
                variant="outline"
                className="h-8 text-xs"
                disabled={page <= 1}
                onClick={() => page > 1 && onChangePage(page - 1)}
              >
                Sebelumnya
              </Button>
              <Button
                size="sm"
                variant="outline"
                className="h-8 text-xs"
                onClick={() => onChangePage(page + 1)}
                disabled={items && items.length < 10}
              >
                Berikutnya
              </Button>
            </div>
          </div>
        )}
      </CardContent>

      {/* Note Modal for Rejection/Revision */}
      <Dialog open={noteModal.open} onOpenChange={(open) => !open && closeNoteModal()}>
        <DialogContent className="sm:max-w-md">
          <DialogHeader>
            <DialogTitle>
              {noteModal.type === 'reject' ? 'Catatan Penolakan LPJ' : 'Catatan Revisi LPJ'}
            </DialogTitle>
            <DialogDescription>
              {noteModal.type === 'reject'
                ? 'Berikan alasan penolakan LPJ ini.'
                : 'Berikan catatan untuk revisi LPJ ini.'}
            </DialogDescription>
          </DialogHeader>
          <div className="py-4">
            <TextArea
              value={noteModal.note}
              onChange={(e) => setNoteModal((prev) => ({ ...prev, note: e.target.value }))}
              placeholder={noteModal.type === 'reject' ? 'Alasan penolakan...' : 'Catatan revisi...'}
              rows={4}
              className="w-full"
            />
          </div>
          <DialogFooter className="gap-2 sm:gap-0">
            <Button variant="outline" onClick={closeNoteModal} disabled={busy}>
              Batal
            </Button>
            <Button
              onClick={handleNoteSubmit}
              disabled={busy || !noteModal.note.trim()}
              className={
                noteModal.type === 'reject'
                  ? 'bg-red-600 hover:bg-red-700 text-white'
                  : 'bg-amber-600 hover:bg-amber-700 text-white'
              }
            >
              {busy && <Loader2 className="mr-2 h-4 w-4 animate-spin" />}
              {noteModal.type === 'reject' ? 'Tolak LPJ' : 'Minta Revisi'}
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </Card>
  )
}
