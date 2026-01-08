'use client'

import { useMutation, useQuery } from '@tanstack/react-query'
import { Eye, FileText, Loader2, RefreshCw } from 'lucide-react'
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
import { getSurat, listSurat, type Surat } from '@/lib/apis/surat'

export function AllSuratListCard() {
  const { data, isLoading, isError, isFetching, refetch } = useQuery<Surat[]>({
    queryKey: ['surat-all'],
    queryFn: listSurat,
  })

  const { mutateAsync: fetchDetail, isPending: isLoadingDetail } = useMutation({
    mutationFn: (id: number) => getSurat(id),
  })

  const handleView = async (id: number) => {
    try {
      const surat = await fetchDetail(id)
      if (!surat) {
        toast.error('Detail surat tidak ditemukan')
        return
      }
      toast.info(`Surat #${id}`, {
        description: `${surat.subject} • Status: ${surat.status}`,
      })
    } catch (err) {
      console.error(err)
      toast.error('Gagal mengambil detail surat')
    }
  }

  return (
    <Card className="border-neutral-200 shadow-sm h-full flex flex-col">
      <CardHeader className="flex flex-row items-center justify-between pb-4 border-b border-neutral-100 bg-neutral-50/50">
        <div className="space-y-1">
          <CardTitle className="text-base font-semibold text-neutral-900">Semua Surat</CardTitle>
          <CardDescription className="text-xs text-neutral-500">
            Daftar surat terbaru di sistem (Admin View).
          </CardDescription>
        </div>
        <Button
          variant="ghost"
          size="sm"
          className="h-8 text-xs font-medium text-neutral-600 hover:text-brand-600 hover:bg-brand-50"
          onClick={() => refetch()}
          disabled={isFetching}
        >
          {isFetching ? (
            <Loader2 className="mr-1.5 h-3.5 w-3.5 animate-spin" />
          ) : (
            <RefreshCw className="mr-1.5 h-3.5 w-3.5" />
          )}
          Refresh
        </Button>
      </CardHeader>
      <CardContent className="p-0 flex-1">
        {isLoading && (
          <div className="flex flex-col items-center justify-center py-12 text-neutral-500">
            <Spinner size="sm" className="mb-2 text-brand-600" />
            <span className="text-xs">Memuat daftar surat...</span>
          </div>
        )}
        
        {isError && (
          <div className="flex flex-col items-center justify-center py-12 text-red-500">
            <span className="text-xs">Gagal memuat daftar surat.</span>
          </div>
        )}

        {!isLoading && !isError && (!data || data.length === 0) && (
          <div className="flex flex-col items-center justify-center py-12 text-neutral-400">
            <FileText className="h-8 w-8 mb-2 opacity-20" />
            <span className="text-xs">Belum ada surat tercatat.</span>
          </div>
        )}

        {!isLoading && !isError && data && data.length > 0 && (
          <div className="divide-y divide-neutral-100">
            {data.slice(0, 10).map((item) => (
              <div
                key={item.id}
                className="group flex items-center justify-between p-4 hover:bg-neutral-50/50 transition-colors"
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
                        #{String(item.id).slice(0, 6)}
                      </span>
                      <span>•</span>
                      <span>No: {item.number || '-'}</span>
                      <span>•</span>
                      <Badge 
                        variant="secondary" 
                        className={`text-[10px] h-5 px-1.5 font-normal border-none ${
                          item.status === 'APPROVED' ? 'bg-green-50 text-green-700' :
                          item.status === 'REJECTED' ? 'bg-red-50 text-red-700' :
                          'bg-amber-50 text-amber-700'
                        }`}
                      >
                        {item.status}
                      </Badge>
                    </div>
                  </div>
                </div>
                
                <Button
                  size="sm"
                  variant="ghost"
                  className="h-8 text-xs text-neutral-500 hover:text-brand-600 hover:bg-brand-50"
                  disabled={isLoadingDetail}
                  onClick={() => item.id && handleView(item.id)}
                >
                  {isLoadingDetail ? (
                    <Loader2 className="h-3.5 w-3.5 animate-spin" />
                  ) : (
                    <Eye className="h-3.5 w-3.5" />
                  )}
                  <span className="ml-1.5 hidden sm:inline">Detail</span>
                </Button>
              </div>
            ))}
          </div>
        )}
      </CardContent>
    </Card>
  )
}
