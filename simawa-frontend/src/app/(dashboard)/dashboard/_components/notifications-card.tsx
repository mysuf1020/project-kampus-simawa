import { useQuery } from '@tanstack/react-query'
import { Bell, Check, Loader2, MailOpen } from 'lucide-react'

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
import {
  listNotifications,
  markNotificationRead,
  type Notification,
} from '@/lib/apis/notification'
import { useNotificationsFilter } from '../notifications.atoms'

export function NotificationsCard() {
  const { data, isLoading, isError, refetch, isFetching } = useQuery<Notification[]>({
    queryKey: ['notifications'],
    queryFn: listNotifications,
  })

  const unread = data?.filter((n) => !n.read_at) ?? []
  const { showOnlyUnread, setShowOnlyUnread } = useNotificationsFilter()

  const items = showOnlyUnread ? unread : (data ?? [])

  const handleMarkRead = async (id: string) => {
    await markNotificationRead(id)
    await refetch()
  }

  return (
    <Card className="border-neutral-200 shadow-sm h-full flex flex-col">
      <CardHeader className="flex flex-row items-center justify-between pb-4 border-b border-neutral-100 bg-neutral-50/50">
        <div className="space-y-1">
          <CardTitle className="text-base font-semibold text-neutral-900">
            Notifikasi
          </CardTitle>
          <CardDescription className="text-xs text-neutral-500">
            Pemberitahuan terbaru untuk Anda.
          </CardDescription>
        </div>
        <Button
          variant="ghost"
          size="sm"
          className="h-8 text-xs font-medium text-neutral-600 hover:text-brand-600 hover:bg-brand-50"
          onClick={() => refetch()}
          disabled={isFetching || isLoading}
        >
          {isFetching ? (
            <Loader2 className="mr-1.5 h-3.5 w-3.5 animate-spin" />
          ) : (
            <Check className="mr-1.5 h-3.5 w-3.5" />
          )}
          Refresh
        </Button>
      </CardHeader>
      <CardContent className="p-0 flex-1 overflow-y-auto max-h-[400px]">
        {isLoading && (
          <div className="flex flex-col items-center justify-center py-12 text-neutral-500">
            <Spinner size="sm" className="mb-2 text-brand-600" />
            <span className="text-xs">Memuat notifikasi...</span>
          </div>
        )}

        {isError && (
          <div className="flex flex-col items-center justify-center py-12 text-red-500">
            <span className="text-xs">Gagal memuat notifikasi.</span>
          </div>
        )}

        {!isLoading && items.length === 0 && (
          <div className="flex flex-col items-center justify-center py-12 text-neutral-400">
            <Bell className="h-8 w-8 mb-2 opacity-20" />
            <span className="text-xs">Tidak ada notifikasi baru.</span>
          </div>
        )}

        {!isLoading && !isError && items.length > 0 && (
          <div className="divide-y divide-neutral-100">
            {items.map((n) => (
              <div
                key={n.id}
                className={`group flex items-start gap-3 p-4 transition-colors ${!n.read_at ? 'bg-brand-50/30 hover:bg-brand-50/60' : 'hover:bg-neutral-50/50'}`}
              >
                <div
                  className={`mt-1 h-2 w-2 rounded-full shrink-0 ${!n.read_at ? 'bg-brand-500' : 'bg-neutral-300'}`}
                />
                <div className="flex-1 space-y-1 min-w-0">
                  <div className="flex items-center justify-between gap-2">
                    <p
                      className={`text-sm ${!n.read_at ? 'font-semibold text-neutral-900' : 'font-medium text-neutral-700'}`}
                    >
                      {n.title}
                    </p>
                    {!n.read_at && (
                      <Badge className="bg-brand-100 text-brand-700 border-none px-1.5 py-0 text-[10px] h-5">
                        Baru
                      </Badge>
                    )}
                  </div>
                  {n.body && (
                    <p className="text-xs text-neutral-500 line-clamp-2 leading-relaxed">
                      {n.body}
                    </p>
                  )}
                  {!n.read_at && (
                    <div className="pt-2">
                      <Button
                        size="xs"
                        variant="ghost"
                        className="h-6 text-[10px] text-brand-600 hover:text-brand-700 hover:bg-brand-50 px-2 -ml-2"
                        onClick={() => handleMarkRead(n.id)}
                      >
                        <MailOpen className="mr-1.5 h-3 w-3" />
                        Tandai sudah dibaca
                      </Button>
                    </div>
                  )}
                </div>
              </div>
            ))}
          </div>
        )}
      </CardContent>

      <div className="p-3 border-t border-neutral-100 bg-neutral-50/30 flex items-center justify-between text-xs text-neutral-500">
        <span>
          {unread.length > 0 ? `${unread.length} belum dibaca` : 'Semua sudah dibaca'}
        </span>
        {data && data.length > 0 && (
          <Button
            size="sm"
            variant="ghost"
            className="h-7 text-xs hover:bg-neutral-100"
            onClick={() => setShowOnlyUnread(!showOnlyUnread)}
          >
            {showOnlyUnread ? 'Tampilkan Semua' : 'Hanya Belum Dibaca'}
          </Button>
        )}
      </div>
    </Card>
  )
}
