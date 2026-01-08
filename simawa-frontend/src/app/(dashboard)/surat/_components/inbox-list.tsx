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
import { Check, Download, Inbox, X, Loader2, FileText } from 'lucide-react'
import { downloadSurat, type Surat } from '@/lib/apis/surat'
import { SuratApprovalDialog } from './approval-dialog'

type Props = {
  data?: Surat[]
  isLoading?: boolean
}

export function InboxListCard({ data, isLoading }: Props) {
  const [approvalOpen, setApprovalOpen] = useState(false)
  const [selectedSuratId, setSelectedSuratId] = useState<number | null>(null)
  const [approvalAction, setApprovalAction] = useState<'approve' | 'reject' | null>(null)

  const handleDecide = (id: number, action: 'approve' | 'reject') => {
    setSelectedSuratId(id)
    setApprovalAction(action)
    setApprovalOpen(true)
  }

  return (
    <>
      <Card className="border-neutral-200 shadow-sm h-full flex flex-col">
        <CardHeader className="flex flex-row items-center gap-3 border-b border-neutral-100 bg-neutral-50/50 px-6 py-4">
          <div className="flex h-10 w-10 items-center justify-center rounded-lg bg-brand-50 text-brand-600">
            <Inbox className="h-5 w-5" />
          </div>
          <div>
            <CardTitle className="text-base font-semibold text-neutral-900">Surat Masuk</CardTitle>
            <CardDescription className="text-xs text-neutral-500">
              Daftar surat yang menunggu persetujuan Anda.
            </CardDescription>
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
                          <Badge 
                            variant="secondary" 
                            className="text-[10px] h-5 px-1.5 font-normal border-none bg-amber-50 text-amber-700"
                          >
                            {item.status}
                          </Badge>
                        </div>
                      </div>
                    </div>

                    <div className="flex items-center gap-2 self-end sm:self-auto pl-11 sm:pl-0">
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
                        <Download className="h-3.5 w-3.5 mr-1.5" />
                        Preview
                      </Button>
                      
                      {item.status === 'PENDING' && (
                        <>
                          <Button
                            size="sm"
                            variant="outline"
                            className="h-7 text-xs border-green-200 text-green-700 hover:bg-green-50 hover:text-green-800 hover:border-green-300"
                            onClick={() => item.id && handleDecide(item.id, 'approve')}
                          >
                            <Check className="h-3.5 w-3.5 mr-1.5" />
                            Approve
                          </Button>
                          <Button
                            size="sm"
                            variant="outline"
                            className="h-7 text-xs border-red-200 text-red-700 hover:bg-red-50 hover:text-red-800 hover:border-red-300"
                            onClick={() => item.id && handleDecide(item.id, 'reject')}
                          >
                            <X className="h-3.5 w-3.5 mr-1.5" />
                            Tolak
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
