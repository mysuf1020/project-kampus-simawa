'use client'

import { useQuery } from '@tanstack/react-query'
import Image from 'next/image'
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
  Container,
  Spinner,
} from '@/components/ui'
import { Page } from '@/components/commons'
import { fetchPublicGallery } from '@/lib/apis/activity'
import { Calendar } from 'lucide-react'

export default function GalleryPage() {
  const { data, isLoading, isError } = useQuery({
    queryKey: ['public-gallery'],
    queryFn: () => fetchPublicGallery(),
  })

  return (
    <Page>
      <Page.Header breadcrumbs={[{ href: '/gallery', children: 'Galeri Kegiatan' }]}>
        <div className="flex flex-col gap-4">
          <div>
            <h1 className="text-3xl font-bold tracking-tight text-neutral-900">
              Galeri Kegiatan
            </h1>
            <p className="mt-2 text-lg text-neutral-500">
              Dokumentasi kegiatan organisasi mahasiswa Universitas Raharja.
            </p>
          </div>
        </div>
      </Page.Header>

      <Page.Body>
        <Container>
          {isLoading && (
            <div className="flex items-center justify-center py-12">
              <Spinner size="lg" />
            </div>
          )}

          {isError && (
            <div className="rounded-xl border border-red-100 bg-red-50 p-8 text-center text-red-600">
              Gagal memuat galeri. Silakan coba lagi nanti.
            </div>
          )}

          {!isLoading && !isError && (!data?.items || data.items.length === 0) && (
            <div className="rounded-xl border border-dashed border-neutral-200 bg-neutral-50/50 p-12 text-center text-neutral-500">
              Belum ada dokumentasi kegiatan yang diunggah.
            </div>
          )}

          <div className="grid gap-6 sm:grid-cols-2 lg:grid-cols-3">
            {data?.items?.map((activity) => (
              <Card
                key={activity.id}
                className="overflow-hidden hover:shadow-lg transition-shadow"
              >
                <div className="relative aspect-video">
                  {activity.cover_key ? (
                    <Image
                      src={`http://localhost:9000/simawa/${activity.cover_key}`} // Dev default: assume local minio
                      alt={activity.title}
                      fill
                      className="object-cover"
                    />
                  ) : (
                    <div className="w-full h-full bg-neutral-100 flex items-center justify-center text-neutral-400">
                      <ImageIcon className="h-10 w-10" />
                    </div>
                  )}
                </div>
                <CardHeader>
                  <CardTitle className="line-clamp-1 text-lg">{activity.title}</CardTitle>
                  <CardDescription className="line-clamp-2">
                    {activity.description}
                  </CardDescription>
                </CardHeader>
                <CardContent>
                  <div className="flex items-center gap-2 text-sm text-neutral-500">
                    <Calendar className="h-4 w-4" />
                    {activity.start_at
                      ? new Date(activity.start_at).toLocaleDateString('id-ID')
                      : '-'}
                  </div>
                </CardContent>
              </Card>
            ))}
          </div>
        </Container>
      </Page.Body>
    </Page>
  )
}

function ImageIcon({ className }: { className?: string }) {
  return (
    <svg
      className={className}
      fill="none"
      viewBox="0 0 24 24"
      stroke="currentColor"
      strokeWidth="2"
    >
      <rect x="3" y="3" width="18" height="18" rx="2" ry="2" />
      <circle cx="8.5" cy="8.5" r="1.5" />
      <polyline points="21 15 16 10 5 21" />
    </svg>
  )
}
