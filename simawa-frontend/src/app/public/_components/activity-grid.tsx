import { Activity } from '@/lib/apis/activity'
import { Badge } from '@/components/ui'
import { Calendar, MapPin, ArrowRight } from 'lucide-react'
import Link from 'next/link'

type Props = {
  data?: Activity[]
}

export function PublicActivityGrid({ data }: Props) {
  if (!data || data.length === 0) {
    return (
      <div className="text-center py-12">
        <p className="text-neutral-500 text-sm">
          Belum ada aktivitas publik yang tersedia.
        </p>
      </div>
    )
  }

  return (
    <div className="grid gap-6 md:grid-cols-2 lg:grid-cols-3">
      {data.map((act) => (
        <div
          key={act.id}
          className="group relative flex flex-col overflow-hidden rounded-2xl border border-neutral-200 bg-white p-5 shadow-sm transition-all duration-300 hover:-translate-y-1 hover:shadow-lg hover:border-brand-200"
        >
          <div className="mb-4">
            <h3 className="text-lg font-bold text-neutral-900 line-clamp-2 leading-tight group-hover:text-brand-600 transition-colors">
              {act.title}
            </h3>
            <p className="mt-2 text-sm text-neutral-500 line-clamp-2 leading-relaxed">
              {act.description || 'Tidak ada deskripsi singkat.'}
            </p>
          </div>

          <div className="mt-auto space-y-4">
            <div className="flex flex-wrap gap-2">
              {act.start_at && (
                <Badge
                  variant="secondary"
                  className="bg-neutral-50 text-neutral-600 border-neutral-100 font-normal"
                >
                  <Calendar className="mr-1.5 h-3.5 w-3.5 text-neutral-400" />
                  {new Date(act.start_at).toLocaleDateString('id-ID', {
                    day: 'numeric',
                    month: 'short',
                    year: 'numeric',
                  })}
                </Badge>
              )}
              {act.location && (
                <Badge
                  variant="secondary"
                  className="bg-neutral-50 text-neutral-600 border-neutral-100 font-normal"
                >
                  <MapPin className="mr-1.5 h-3.5 w-3.5 text-neutral-400" />
                  {act.location}
                </Badge>
              )}
            </div>

            <div className="pt-4 border-t border-neutral-100 flex items-center justify-between">
              <span className="text-xs font-medium text-brand-600 bg-brand-50 px-2 py-1 rounded-md">
                {act.type || 'Umum'}
              </span>

              <Link
                href={`/public/activity/${act.id}`}
                className="inline-flex items-center text-xs font-semibold text-neutral-900 group-hover:text-brand-600 transition-colors"
              >
                Detail
                <ArrowRight className="ml-1 h-3.5 w-3.5 transition-transform group-hover:translate-x-1" />
              </Link>
            </div>
          </div>
        </div>
      ))}
    </div>
  )
}
