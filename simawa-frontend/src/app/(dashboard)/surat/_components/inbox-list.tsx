'use client'

import { useState } from 'react'
import { useMutation, useQueryClient } from '@tanstack/react-query'
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
} from '@/components/ui'
import { Skeleton } from '@/components/ui/skeleton'
import { Check, Download, Inbox, X, FileText, RotateCcw } from 'lucide-react'
import { downloadSurat, type Surat } from '@/lib/apis/surat'
import { SuratApprovalDialog } from './approval-dialog'

type Props = {
  data?: Surat[]
  isLoading?: boolean
}

export function InboxListCard({ data, isLoading }: Props) {
  const [approvalOpen, setApprovalOpen] = useState(false)
  const [selectedSuratId, setSelectedSuratId] = useState<number | null>(null)
  const [approvalAction, setApprovalAction] = useState<
    'approve' | 'reject' | 'revise' | null
  >(null)

  const handleDecide = (id: number, action: 'approve' | 'reject' | 'revise') => {
    setSelectedSuratId(id)
    setApprovalAction(action)
    setApprovalOpen(true)
  }

  const getStatusBadge = (status: string) => {
    const statusConfig: Record<string, { bg: string; text: string; label: string }> = {
      PENDING: { bg: 'bg-amber-50', text: 'text-amber-700', label: 'Menunggu' },
      APPROVED: { bg: 'bg-green-50', text: 'text-green-700', label: 'Disetujui' },
      REJECTED: { bg: 'bg-red-50', text: 'text-red-700', label: 'Ditolak' },
      REVISION: { bg: 'bg-blue-50', text: 'text-blue-700', label: 'Revisi' },
      DRAFT: { bg: 'bg-neutral-100', text: 'text-neutral-600', label: 'Draft' },
    }
    const config = statusConfig[status] || statusConfig.PENDING
    return (
      <Badge
        variant="secondary"
        className={`text-[10px] h-5 px-1.5 font-normal border-none ${config.bg} ${config.text}`}
      >
        {config.label}
      </Badge>
    )
  }

  return (
    <>
      <Card className="border-neutral-200 shadow-sm h-full flex flex-col">
        <CardHeader className="flex flex-col sm:flex-row sm:items-center gap-3 border-b border-neutral-100 bg-neutral-50/50 px-4 sm:px-6 py-4">
          <div className="flex items-center gap-3">
            <div className="flex h-10 w-10 items-center justify-center rounded-lg bg-brand-50 text-brand-600 shrink-0">
              <Inbox className="h-5 w-5" />
            </div>
            <div>
              <CardTitle className="text-sm sm:text-base font-semibold text-neutral-900">
                Surat Masuk
              </CardTitle>
              <CardDescription className="text-xs text-neutral-500">
                Daftar surat yang menunggu persetujuan.
              </CardDescription>
            </div>
          </div>
        </CardHeader>
        <CardContent className="p-0 flex-1">
          {isLoading && (
            <div className="flex flex-col items-center justify-center py-12 text-neutral-500">
              <Spinner size="sm" className="mb-2 text-brand-600" />
              <span className="text-xs">Memuat surat masuk...</span>
            </div>
          )}

          {!isLoading && data?.length === 0 && (
            <div className="flex flex-col items-center justify-center py-12 text-neutral-400">
              <Inbox className="h-8 w-8 mb-2 opacity-20" />
              <span className="text-xs">Tidak ada surat masuk yang perlu direview.</span>
            </div>
          )}

          {!isLoading && data && data.length > 0 && (
            <div className="divide-y divide-neutral-100">
              {data.map((item) => {
                const idLabel = String(item.id ?? '').slice(0, 6)
                return (
                  <div
                    key={item.id}
                    className="group flex flex-col gap-3 p-4 hover:bg-neutral-50/50 transition-colors sm:flex-row sm:items-center sm:justify-between"
                  >
                    <div className="flex items-start gap-3 overflow-hidden">
                      <div className="mt-0.5 h-8 w-8 rounded-lg bg-blue-50 flex items-center justify-center text-blue-600 shrink-0 border border-blue-100">
                        <FileText className="h-4 w-4" />
                      </div>
                      <div className="space-y-1 min-w-0">
                        <p className="text-sm font-medium text-neutral-900 truncate pr-4">
                          {item.subject || 'Tanpa Judul'}
                        </p>
                        <div className="flex items-center gap-2 text-xs text-neutral-500">
                          <span className="font-mono bg-neutral-100 px-1.5 rounded text-neutral-600">
                            #{idLabel}
                          </span>
                          <span>•</span>
                          {getStatusBadge(item.status)}
                        </div>
                      </div>
                    </div>

                    <div className="flex flex-wrap items-center gap-2 self-end sm:self-auto pl-11 sm:pl-0">
                      <Button
                        size="sm"
                        variant="ghost"
                        className="h-7 text-xs text-neutral-500 hover:text-brand-600 hover:bg-brand-50"
                        disabled={!item.id}
                        onClick={async () => {
                          if (!item.id) return
                          const res = await downloadSurat(item.id)
                          const url = res?.url
                          if (url && typeof window !== 'undefined') {
                            window.open(url, '_blank', 'noopener,noreferrer')
                          }
                        }}
                      >
                        <Download className="h-3.5 w-3.5 sm:mr-1.5" />
                        <span className="hidden sm:inline">Preview</span>
                      </Button>

                      {item.status === 'PENDING' && (
                        <>
                          <Button
                            size="sm"
                            variant="outline"
                            className="h-7 text-xs border-green-200 text-green-700 hover:bg-green-50 hover:text-green-800 hover:border-green-300"
                            onClick={() => item.id && handleDecide(item.id, 'approve')}
                          >
                            <Check className="h-3.5 w-3.5 sm:mr-1.5" />
                            <span className="hidden sm:inline">Approve</span>
                          </Button>
                          <Button
                            size="sm"
                            variant="outline"
                            className="h-7 text-xs border-blue-200 text-blue-700 hover:bg-blue-50 hover:text-blue-800 hover:border-blue-300"
                            onClick={() => item.id && handleDecide(item.id, 'revise')}
                          >
                            <RotateCcw className="h-3.5 w-3.5 sm:mr-1.5" />
                            <span className="hidden sm:inline">Revisi</span>
                          </Button>
                          <Button
                            size="sm"
                            variant="outline"
                            className="h-7 text-xs border-red-200 text-red-700 hover:bg-red-50 hover:text-red-800 hover:border-red-300"
                            onClick={() => item.id && handleDecide(item.id, 'reject')}
                          >
                            <X className="h-3.5 w-3.5 sm:mr-1.5" />
                            <span className="hidden sm:inline">Tolak</span>
                          </Button>
                        </>
                      )}
                    </div>
                  </div>
                )
              })}
            </div>
          )}
        </CardContent>
      </Card>

      <SuratApprovalDialog
        suratId={selectedSuratId}
        open={approvalOpen}
        onOpenChange={setApprovalOpen}
        action={approvalAction}
      />
    </>
  )
}
