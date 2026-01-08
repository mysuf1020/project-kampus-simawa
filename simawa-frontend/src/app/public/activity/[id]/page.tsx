'use client'

import { useQuery } from '@tanstack/react-query'
import { useParams, useRouter } from 'next/navigation'
import Link from 'next/link'
import { Calendar, MapPin, ArrowLeft, Clock, Share2, Tag, Building2 } from 'lucide-react'

import { Button, Container, Spinner, Badge, Card, CardContent } from '@/components/ui'
import { fetchPublicActivityById, type Activity } from '@/lib/apis/activity'

export default function PublicActivityDetailPage() {
  const params = useParams()
  const router = useRouter()
  const id = params?.id as string

  const { data: activity, isLoading, isError } = useQuery<Activity>({
    queryKey: ['public-activity', id],
    queryFn: () => fetchPublicActivityById(id),
    enabled: !!id,
  })

  if (isLoading) {
    return (
      <div className="flex min-h-screen items-center justify-center bg-neutral-50">
        <div className="flex flex-col items-center gap-3 text-neutral-500">
          <Spinner size="lg" className="text-brand-600" />
          <p className="text-sm font-medium">Memuat detail aktivitas...</p>
        </div>
      </div>
    )
  }

  if (isError || !activity) {
    return (
      <div className="flex min-h-screen items-center justify-center bg-neutral-50">
        <div className="text-center max-w-md px-6">
          <h2 className="text-xl font-bold text-neutral-900">Aktivitas Tidak Ditemukan</h2>
          <p className="mt-2 text-sm text-neutral-500">
            Aktivitas yang Anda cari mungkin sudah dihapus atau tidak tersedia untuk publik.
          </p>
          <Button 
            className="mt-6 bg-brand-600 hover:bg-brand-700 text-white"
            onClick={() => router.push('/public')}
          >
            Kembali ke Daftar
          </Button>
        </div>
      </div>
    )
  }

  return (
    <div className="min-h-screen bg-neutral-50 font-sans text-neutral-900 pb-20">
      {/* Navigation */}
      <header className="fixed top-0 w-full z-50 bg-white/80 backdrop-blur-md border-b border-neutral-200">
        <Container>
          <div className="flex items-center justify-between h-16">
            <Link href="/" className="flex items-center gap-2 group">
              <div className="h-8 w-8 bg-brand-600 rounded-lg flex items-center justify-center text-white font-bold shadow-lg shadow-brand-500/20 group-hover:bg-brand-700 transition-colors">S</div>
              <span className="font-bold text-xl tracking-tight text-neutral-900">SIMAWA</span>
            </Link>
            <Link href="/public">
              <Button variant="ghost" size="sm" className="hidden sm:flex font-medium text-neutral-600 hover:text-neutral-900">
                <ArrowLeft className="mr-2 h-4 w-4" /> Kembali ke Daftar
              </Button>
            </Link>
          </div>
        </Container>
      </header>

      <main className="pt-24 md:pt-32">
        <Container className="max-w-4xl">
          {/* Header Section */}
          <div className="space-y-6 mb-8">
            <div className="flex flex-wrap gap-2 items-center">
              <Badge variant="secondary" className="bg-brand-50 text-brand-700 border-brand-100 hover:bg-brand-100">
                {activity.type || 'Kegiatan Umum'}
              </Badge>
              {activity.status === 'COMPLETED' && (
                <Badge variant="secondary" className="bg-green-50 text-green-700 border-green-100">
                  Selesai
                </Badge>
              )}
            </div>
            
            <h1 className="text-3xl md:text-4xl lg:text-5xl font-bold tracking-tight text-neutral-900 leading-tight">
              {activity.title}
            </h1>

            <div className="flex flex-wrap gap-4 text-sm text-neutral-500">
              {activity.start_at && (
                <div className="flex items-center gap-2">
                  <Calendar className="h-4 w-4 text-neutral-400" />
                  <span>
                    {new Date(activity.start_at).toLocaleDateString('id-ID', {
                      weekday: 'long',
                      day: 'numeric',
                      month: 'long',
                      year: 'numeric'
                    })}
                  </span>
                </div>
              )}
              {activity.start_at && (
                <div className="flex items-center gap-2">
                  <Clock className="h-4 w-4 text-neutral-400" />
                  <span>
                    {new Date(activity.start_at).toLocaleTimeString('id-ID', {
                      hour: '2-digit',
                      minute: '2-digit'
                    })}
                    {activity.end_at ? ` - ${new Date(activity.end_at).toLocaleTimeString('id-ID', { hour: '2-digit', minute: '2-digit' })}` : ''} WIB
                  </span>
                </div>
              )}
            </div>
          </div>

          <div className="grid lg:grid-cols-[1fr,320px] gap-8">
            {/* Main Content */}
            <div className="space-y-8">
              {/* Cover Image Placeholder */}
              <div className="relative aspect-video w-full overflow-hidden rounded-2xl bg-neutral-100 border border-neutral-200 shadow-sm flex items-center justify-center">
                {/* Image would go here */}
                <div className="text-center text-neutral-400">
                  <div className="mx-auto w-16 h-16 rounded-full bg-neutral-200 flex items-center justify-center mb-2">
                    <Building2 className="h-8 w-8 text-neutral-400" />
                  </div>
                  <p className="text-sm font-medium">Cover Kegiatan</p>
                </div>
              </div>

              {/* Description */}
              <div className="prose prose-neutral max-w-none">
                <h3 className="text-xl font-bold text-neutral-900 mb-4">Tentang Kegiatan</h3>
                <p className="text-neutral-600 leading-relaxed whitespace-pre-wrap">
                  {activity.description || 'Tidak ada deskripsi lengkap untuk kegiatan ini.'}
                </p>
              </div>
            </div>

            {/* Sidebar */}
            <div className="space-y-6">
              {/* Info Card */}
              <Card className="border-neutral-200 shadow-sm sticky top-24">
                <CardContent className="p-6 space-y-6">
                  <div>
                    <h4 className="font-semibold text-neutral-900 mb-4 flex items-center gap-2">
                      <MapPin className="h-4 w-4 text-brand-600" />
                      Lokasi
                    </h4>
                    <p className="text-sm text-neutral-600">
                      {activity.location || 'Lokasi belum ditentukan'}
                    </p>
                  </div>

                  <div className="pt-6 border-t border-neutral-100">
                    <h4 className="font-semibold text-neutral-900 mb-4 flex items-center gap-2">
                      <Tag className="h-4 w-4 text-brand-600" />
                      Detail Info
                    </h4>
                    <ul className="space-y-3 text-sm text-neutral-600">
                      <li className="flex justify-between">
                        <span className="text-neutral-500">Penyelenggara</span>
                        <span className="font-medium text-neutral-900 truncate max-w-[150px]">
                          {/* Org Name ideally fetched from activity.org or separate call */}
                          Organisasi
                        </span>
                      </li>
                      <li className="flex justify-between">
                        <span className="text-neutral-500">Status</span>
                        <span className="font-medium text-neutral-900 capitalize">
                          {(activity.status || 'Scheduled').toLowerCase()}
                        </span>
                      </li>
                    </ul>
                  </div>

                  <div className="pt-6 border-t border-neutral-100">
                    <Button 
                      className="w-full bg-white border border-neutral-200 text-neutral-700 hover:bg-neutral-50 hover:text-neutral-900"
                      onClick={() => {
                        if (navigator.share) {
                          navigator.share({
                            title: activity.title,
                            text: activity.description,
                            url: window.location.href,
                          })
                        } else {
                          toast.info('Link tersalin ke clipboard')
                          navigator.clipboard.writeText(window.location.href)
                        }
                      }}
                    >
                      <Share2 className="mr-2 h-4 w-4" />
                      Bagikan Kegiatan
                    </Button>
                  </div>
                </CardContent>
              </Card>
            </div>
          </div>
        </Container>
      </main>
    </div>
  )
}
