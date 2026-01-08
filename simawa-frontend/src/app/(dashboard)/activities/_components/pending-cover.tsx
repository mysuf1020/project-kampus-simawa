'use client'

import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query'
import { Check, Image as ImageIcon, Loader2, X } from 'lucide-react'

import {
  Badge,
  Button,
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
  Spinner,
  Text,
} from '@/components/ui'
import {
  approveActivityCover,
  listPendingCovers,
  type Activity,
} from '@/lib/apis/activity'

export function ActivityPendingCoverCard() {
  const queryClient = useQueryClient()

  const {
    data: pending,
    isLoading,
    isError,
    isFetching,
  } = useQuery<Activity[]>({
    queryKey: ['activities-pending-cover'],
    queryFn: listPendingCovers,
  })

  const { mutateAsync: decideCover, isPending } = useMutation({
    mutationFn: ({ id, approve }: { id: string; approve: boolean }) =>
      approveActivityCover(id, {
        approve,
        note: approve ? 'Sampul disetujui' : 'Sampul perlu revisi',
      }),
    onSuccess: async () => {
      await queryClient.invalidateQueries({ queryKey: ['activities-pending-cover'] })
      await queryClient.invalidateQueries({ queryKey: ['activities'] })
    },
  })

  return (
    <Card className="border-neutral-200 shadow-sm">
      <CardHeader className="flex flex-row items-center justify-between border-b border-neutral-100 bg-neutral-50/50 pb-4">
        <div className="flex items-center gap-3">
          <div className="flex h-8 w-8 items-center justify-center rounded-lg bg-white border border-neutral-200 shadow-sm">
            <ImageIcon className="h-4 w-4 text-brand-600" />
          </div>
          <div className="space-y-0.5">
            <CardTitle className="text-base font-semibold text-neutral-900">Review Sampul</CardTitle>
            <CardDescription className="text-xs text-neutral-500">
              Setujui atau tolak sampul kegiatan yang diunggah.
            </CardDescription>
          </div>
        </div>
        {pending && pending.length > 0 && (
          <Badge variant="secondary" className="bg-brand-50 text-brand-700 border-brand-100 hover:bg-brand-100">
            {pending.length} Menunggu
          </Badge>
        )}
      </CardHeader>
      <CardContent className="p-4 space-y-4">
        {isLoading && (
          <div className="flex items-center gap-2 text-xs text-neutral-500">
            <Spinner size="sm" /> 
            <span>Memuat data...</span>
          </div>
        )}
        
        {isError && (
          <div className="rounded-lg border border-amber-100 bg-amber-50 p-3 text-center">
            <p className="text-xs font-medium text-amber-800">Fitur ini hanya tersedia untuk BEM/DEMA Admin</p>
          </div>
        )}
        
        {!isLoading && !isError && (!pending || pending.length === 0) && (
          <div className="text-center py-6">
            <p className="text-sm font-medium text-neutral-900">Semua Beres</p>
            <p className="text-xs text-neutral-500 mt-1">
              Tidak ada sampul yang perlu direview saat ini.
            </p>
          </div>
        )}

        <div className="space-y-3">
          {pending?.map((activity) => (
            <div
              key={activity.id}
              className="flex flex-col gap-3 rounded-xl border border-neutral-200 bg-white p-3 shadow-sm transition-all hover:border-brand-200 hover:shadow-md sm:flex-row sm:items-center sm:justify-between"
            >
              <div className="space-y-1">
                <p className="text-sm font-semibold text-neutral-900 line-clamp-1">
                  {activity.title}
                </p>
                <div className="flex items-center gap-2 text-xs text-neutral-500">
                  <Badge variant="outline" className="text-[10px] py-0 h-5 border-neutral-200 text-neutral-600">
                    {activity.status || 'PENDING'}
                  </Badge>
                  <span>•</span>
                  <span>{activity.cover_key ? 'Sampul terlampir' : 'Belum ada sampul'}</span>
                </div>
              </div>
              <div className="flex items-center gap-2">
                <Button
                  size="sm"
                  variant="outline"
                  className="h-8 text-xs border-green-200 text-green-700 hover:bg-green-50 hover:text-green-800 hover:border-green-300"
                  disabled={isPending || isFetching}
                  onClick={() => decideCover({ id: activity.id, approve: true })}
                >
                  {isPending ? (
                    <Loader2 className="mr-1.5 h-3.5 w-3.5 animate-spin" />
                  ) : (
                    <Check className="mr-1.5 h-3.5 w-3.5" />
                  )}
                  Setujui
                </Button>
                <Button
                  size="sm"
                  variant="outline"
                  className="h-8 text-xs border-amber-200 text-amber-700 hover:bg-amber-50 hover:text-amber-800 hover:border-amber-300"
                  disabled={isPending || isFetching}
                  onClick={() => decideCover({ id: activity.id, approve: false })}
                >
                  {isPending ? (
                    <Loader2 className="mr-1.5 h-3.5 w-3.5 animate-spin" />
                  ) : (
                    <X className="mr-1.5 h-3.5 w-3.5" />
                  )}
                  Tolak
                </Button>
              </div>
            </div>
          ))}
        </div>
      </CardContent>
    </Card>
  )
}
