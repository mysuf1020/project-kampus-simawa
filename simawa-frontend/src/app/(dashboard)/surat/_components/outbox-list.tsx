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
import { Download, Outdent, FileText, Send } from 'lucide-react'
import { downloadSurat, type Surat } from '@/lib/apis/surat'

type Props = {
  data?: Surat[]
  isLoading?: boolean
  page?: number
  onChangePage?: (page: number) => void
}

export function OutboxListCard({ data, isLoading, page = 1, onChangePage }: Props) {
  return (
    <Card className="border-neutral-200 shadow-sm">
      <CardHeader className="flex flex-row items-center gap-3 border-b border-neutral-100 bg-neutral-50/50 px-6 py-4">
        <div className="flex h-10 w-10 items-center justify-center rounded-lg bg-orange-50 text-orange-600">
          <Outdent className="h-5 w-5" />
        </div>
        <div>
          <CardTitle className="text-base font-semibold text-neutral-900">Riwayat Surat Keluar</CardTitle>
          <CardDescription className="text-xs text-neutral-500">
            Daftar surat yang sudah dikirim dari organisasi ini.
          </CardDescription>
        </div>
      </CardHeader>
      <CardContent className="p-0">
        {isLoading && (
          <div className="flex flex-col items-center justify-center py-12 text-neutral-500">
            <Spinner size="sm" className="mb-2 text-brand-600" />
            <span className="text-xs">Memuat riwayat surat...</span>
          </div>
        )}
        
        {!isLoading && data?.length === 0 && (
          <div className="flex flex-col items-center justify-center py-12 text-neutral-400">
            <Send className="h-8 w-8 mb-2 opacity-20" />
            <span className="text-xs">Belum ada surat keluar.</span>
          </div>
        )}

        {!isLoading && data && data.length > 0 && (
          <div className="divide-y divide-neutral-100">
            {data.map((item) => {
              const idLabel = String(item.id ?? '').slice(0, 6)
              return (
                <div
                  key={item.id}
                  className="group flex items-center justify-between p-4 hover:bg-neutral-50/50 transition-colors"
                >
                  <div className="flex items-start gap-3 overflow-hidden">
                    <div className="mt-0.5 h-8 w-8 rounded-lg bg-orange-50 flex items-center justify-center text-orange-600 shrink-0 border border-orange-100">
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
                    Unduh
                  </Button>
                </div>
              )
            })}
          </div>
        )}
        
        {onChangePage && (
          <div className="flex items-center justify-between border-t border-neutral-100 bg-neutral-50/30 px-4 py-3">
            <span className="text-xs text-neutral-500">Halaman {page}</span>
            <div className="flex gap-2">
              <Button
                size="sm"
                variant="outline"
                className="h-7 text-xs bg-white"
                disabled={page <= 1}
                onClick={() => page > 1 && onChangePage(page - 1)}
              >
                Sebelumnya
              </Button>
              <Button 
                size="sm" 
                variant="outline" 
                className="h-7 text-xs bg-white"
                onClick={() => onChangePage(page + 1)}
              >
                Berikutnya
              </Button>
            </div>
          </div>
        )}
      </CardContent>
    </Card>
  )
}
