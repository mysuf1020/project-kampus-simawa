import { ArrowRight, CheckCircle2, Clock } from 'lucide-react'
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

type Props = {
  items?: string[]
  isLoading?: boolean
  isFetching?: boolean
  isError?: boolean
  onRefresh?: () => void
}

export function LatestActivityCard({
  items,
  isError,
  isFetching,
  isLoading,
  onRefresh,
}: Props) {
  return (
    <Card className="border-neutral-200 shadow-sm h-full flex flex-col">
      <CardHeader className="flex flex-row items-center justify-between pb-4 border-b border-neutral-100 bg-neutral-50/50">
        <div className="space-y-1">
          <CardTitle className="text-base font-semibold text-neutral-900">Aktivitas Terbaru</CardTitle>
          <CardDescription className="text-xs text-neutral-500">
            Pencapaian dan laporan kinerja terkini.
          </CardDescription>
        </div>
        <Button
          variant="ghost"
          size="sm"
          className="h-8 text-xs font-medium text-neutral-600 hover:text-brand-600 hover:bg-brand-50"
          onClick={onRefresh}
          disabled={isFetching || isLoading}
        >
          {isFetching || isLoading ? (
            <Spinner size="xs" className="mr-1.5" />
          ) : (
            <Clock className="mr-1.5 h-3.5 w-3.5" />
          )}
          Refresh
        </Button>
      </CardHeader>
      <CardContent className="p-0 flex-1">
        {(isLoading) && (
          <div className="flex flex-col items-center justify-center py-12 text-neutral-500">
            <Spinner size="sm" className="mb-2 text-brand-600" />
            <span className="text-xs">Memuat aktivitas...</span>
          </div>
        )}
        
        {isError && (
          <div className="flex flex-col items-center justify-center py-12 text-red-500">
            <span className="text-xs">Gagal memuat data.</span>
          </div>
        )}

        {!isLoading && !isError && items?.length === 0 && (
          <div className="flex flex-col items-center justify-center py-12 text-neutral-400">
            <CheckCircle2 className="h-8 w-8 mb-2 opacity-20" />
            <span className="text-xs">Belum ada aktivitas tercatat.</span>
          </div>
        )}

        {!isLoading && !isError && items && items.length > 0 && (
          <div className="divide-y divide-neutral-100">
            {items.map((title, idx) => (
              <div
                key={idx}
                className="group flex items-start gap-3 p-4 hover:bg-neutral-50/50 transition-colors"
              >
                <div className="mt-0.5 h-8 w-8 rounded-full bg-green-50 flex items-center justify-center text-green-600 shrink-0 border border-green-100">
                  <CheckCircle2 className="h-4 w-4" />
                </div>
                <div className="flex-1 min-w-0">
                  <p className="text-sm font-medium text-neutral-900 line-clamp-1 group-hover:text-brand-700 transition-colors">
                    {title}
                  </p>
                  <p className="text-xs text-neutral-500 mt-0.5">
                    Laporan Pertanggungjawaban (LPJ) telah disetujui.
                  </p>
                </div>
                <Badge variant="outline" className="shrink-0 bg-white border-neutral-200 text-neutral-500 text-[10px] font-normal">
                  Selesai
                </Badge>
              </div>
            ))}
          </div>
        )}
      </CardContent>
      
      {!isLoading && !isError && items && items.length > 0 && (
        <div className="p-3 border-t border-neutral-100 bg-neutral-50/30">
          <Button variant="ghost" size="sm" className="w-full text-xs text-brand-600 hover:text-brand-700 hover:bg-brand-50 h-8 justify-center">
            Lihat Semua Aktivitas <ArrowRight className="ml-1 h-3 w-3" />
          </Button>
        </div>
      )}
    </Card>
  )
}
