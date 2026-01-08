import { Activity } from '@/lib/apis/activity'
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
import { Calendar, Check, Loader2, MapPin, Send } from 'lucide-react'

type Props = {
  activities?: Activity[]
  isLoading?: boolean
  isFetching?: boolean
  isError?: boolean
  onRefresh?: () => void
  onSubmit?: (id: string) => Promise<void>
  isSubmitting?: boolean
  onApprove?: (id: string) => Promise<void> | void
  onRevise?: (id: string) => Promise<void> | void
  isApproving?: boolean
  isRevising?: boolean
  page?: number
  onChangePage?: (page: number) => void
  total?: number
}

export function ActivityList({
  activities,
  isError,
  isFetching,
  isLoading,
  onRefresh,
  onSubmit,
  isSubmitting,
  onApprove,
  onRevise,
  isApproving,
  isRevising,
  page = 1,
  onChangePage,
  total,
}: Props) {
  return (
    <Card className="border-neutral-200 shadow-sm">
      <CardHeader className="flex flex-row items-center justify-between border-b border-neutral-100 bg-neutral-50/50 pb-4">
        <div className="space-y-0.5">
          <CardTitle className="text-base font-semibold text-neutral-900">Daftar Aktivitas</CardTitle>
          <CardDescription className="text-xs text-neutral-500">
            Kelola dan pantau status kegiatan organisasi Anda.
          </CardDescription>
        </div>
        <Button 
          variant="outline" 
          size="sm" 
          onClick={onRefresh} 
          className="h-8 gap-2 bg-white text-xs font-medium text-neutral-700 hover:bg-neutral-50"
        >
          {isFetching ? (
            <Loader2 className="h-3.5 w-3.5 animate-spin" />
          ) : (
            <Check className="h-3.5 w-3.5" />
          )}
          Segarkan
        </Button>
      </CardHeader>
      <CardContent className="p-4 space-y-4">
        {isLoading && (
          <div className="space-y-4">
            <div className="flex items-center gap-2 text-xs text-neutral-500">
              <Spinner size="sm" /> 
              <span>Memuat data aktivitas...</span>
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
            <p className="text-sm font-medium text-red-800">Gagal memuat data aktivitas</p>
            <p className="text-xs text-red-600 mt-1">Silakan coba segarkan kembali halaman ini.</p>
          </div>
        )}
        
        {!isLoading && activities?.length === 0 && (
          <div className="flex flex-col items-center justify-center rounded-xl border border-dashed border-neutral-200 bg-neutral-50/50 py-12 text-center">
            <div className="rounded-full bg-neutral-100 p-3 mb-3">
              <Calendar className="h-6 w-6 text-neutral-400" />
            </div>
            <p className="text-sm font-medium text-neutral-900">Belum ada aktivitas</p>
            <p className="text-xs text-neutral-500 mt-1 max-w-xs">
              Aktivitas yang Anda buat atau yang perlu direview akan muncul di sini.
            </p>
          </div>
        )}

        <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-3">
          {activities?.map((activity) => (
            <div
              key={activity.id}
              className="group rounded-2xl border border-neutral-100 bg-white/80 p-4 shadow-sm transition hover:-translate-y-0.5 hover:shadow-md hover:border-brand-200"
            >
              <div>
                <div className="flex items-start justify-between gap-3 mb-2">
                  <div className="space-y-1">
                    <h3 className="font-semibold text-neutral-900 line-clamp-1 text-sm" title={activity.title}>
                      {activity.title}
                    </h3>
                    <p className="text-xs font-medium text-neutral-500 uppercase tracking-wide">
                      {activity.type || 'Kegiatan Umum'}
                    </p>
                  </div>
                  <Badge 
                    variant="secondary" 
                    className={`
                      shrink-0 text-[10px] font-semibold uppercase tracking-wider px-2 py-0.5
                      ${activity.status === 'APPROVED' ? 'bg-green-50 text-green-700 border-green-100' : 
                        activity.status === 'REJECTED' ? 'bg-red-50 text-red-700 border-red-100' :
                        activity.status === 'PENDING' ? 'bg-amber-50 text-amber-700 border-amber-100' :
                        'bg-neutral-100 text-neutral-600 border-neutral-200'}
                    `}
                  >
                    {activity.status === 'APPROVED' ? 'Disetujui' :
                     activity.status === 'REJECTED' ? 'Ditolak' :
                     activity.status === 'PENDING' ? 'Menunggu' :
                     'Draft'}
                  </Badge>
                </div>
                
                {activity.description && (
                  <p className="text-xs text-neutral-600 line-clamp-2 mb-3 leading-relaxed">
                    {activity.description}
                  </p>
                )}
                
                <div className="flex flex-wrap gap-2 mb-4">
                  {activity.start_at && (
                    <div className="flex items-center gap-1.5 rounded-md bg-neutral-50 px-2 py-1 text-[11px] font-medium text-neutral-600 border border-neutral-100">
                      <Calendar className="h-3 w-3 text-neutral-400" />
                      <span>{new Date(activity.start_at).toLocaleDateString('id-ID', { day: 'numeric', month: 'short' })}</span>
                    </div>
                  )}
                  {activity.location && (
                    <div className="flex items-center gap-1.5 rounded-md bg-neutral-50 px-2 py-1 text-[11px] font-medium text-neutral-600 border border-neutral-100">
                      <MapPin className="h-3 w-3 text-neutral-400" />
                      <span className="truncate max-w-[120px]">{activity.location}</span>
                    </div>
                  )}
                </div>
              </div>

              <div className="flex items-center gap-2 pt-3 border-t border-neutral-100 mt-auto">
                <Button
                  size="sm"
                  variant="default"
                  className="h-8 flex-1 text-xs bg-brand-600 hover:bg-brand-700 text-white"
                  onClick={() => onSubmit?.(activity.id)}
                  disabled={isSubmitting}
                >
                  {isSubmitting ? (
                    <Loader2 className="mr-1.5 h-3.5 w-3.5 animate-spin" />
                  ) : (
                    <Send className="mr-1.5 h-3.5 w-3.5" />
                  )}
                  Submit
                </Button>
                
                {activity.status === 'PENDING' && (
                  <>
                    <Button
                      size="icon"
                      variant="outline"
                      className="h-8 w-8 text-green-600 border-green-200 hover:bg-green-50 hover:text-green-700 hover:border-green-300"
                      disabled={isApproving}
                      onClick={() => onApprove?.(activity.id)}
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
                      className="h-8 w-8 text-amber-600 border-amber-200 hover:bg-amber-50 hover:text-amber-700 hover:border-amber-300"
                      disabled={isRevising}
                      onClick={() => onRevise?.(activity.id)}
                      title="Minta Revisi"
                    >
                      {isRevising ? (
                        <Loader2 className="h-3.5 w-3.5 animate-spin" />
                      ) : (
                        <Send className="h-3.5 w-3.5 rotate-180" />
                      )}
                    </Button>
                  </>
                )}
              </div>
            </div>
          ))}
        </div>

        {onChangePage && (
          <div className="flex items-center justify-between border-t border-neutral-100 pt-4 mt-2">
            <span className="text-xs text-neutral-500">
              Halaman <span className="font-medium text-neutral-900">{page}</span>
              {typeof total === 'number' && ` dari total ${Math.ceil(total / 10)} halaman`}
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
                disabled={activities && activities.length < 10} // Simple check, ideally check total
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
