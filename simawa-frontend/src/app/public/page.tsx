'use client'

import Link from 'next/link'
import { useQuery } from '@tanstack/react-query'
import { Activity, fetchPublicActivities } from '@/lib/apis/activity'
import { Button, Container, Spinner } from '@/components/ui'
import { ArrowLeft, CalendarPlus, Rss } from 'lucide-react'
import { PublicHero } from './_components/hero'
import { PublicActivityGrid } from './_components/activity-grid'

export default function PublicPage() {
  const { data, isLoading, isError } = useQuery<Activity[]>({
    queryKey: ['public-activities'],
    queryFn: () => fetchPublicActivities({ limit: 12 }),
  })

  const apiBase = process.env.NEXT_PUBLIC_API_BASE_PATH || '/api/simawa'

  return (
    <div className="min-h-screen bg-neutral-50 font-sans text-neutral-900">
      {/* Navigation */}
      <header className="fixed top-0 w-full z-50 bg-white/80 backdrop-blur-md border-b border-neutral-200">
        <Container>
          <div className="flex items-center justify-between h-16">
            <Link href="/" className="flex items-center gap-2 group">
              <div className="h-8 w-8 bg-brand-600 rounded-lg flex items-center justify-center text-white font-bold shadow-lg shadow-brand-500/20 group-hover:bg-brand-700 transition-colors">S</div>
              <span className="font-bold text-xl tracking-tight text-neutral-900">SIMAWA</span>
            </Link>
            <div className="flex items-center gap-2">
              <Link href="/">
                <Button variant="ghost" size="sm" className="hidden sm:flex font-medium text-neutral-600 hover:text-neutral-900">
                  <ArrowLeft className="mr-2 h-4 w-4" /> Kembali
                </Button>
              </Link>
              <Link href="/login">
                <Button size="sm" className="bg-neutral-900 hover:bg-neutral-800 text-white rounded-full px-5">
                  Login
                </Button>
              </Link>
            </div>
          </div>
        </Container>
      </header>

      <main className="pt-24 pb-20">
        <Container>
          <div className="space-y-10">
            <PublicHero />

            <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 border-b border-neutral-200 pb-4">
              <h2 className="text-xl font-bold text-neutral-900">Feed Aktivitas Terbaru</h2>
              
              <div className="flex gap-2">
                <Button
                  size="sm"
                  variant="outline"
                  className="bg-white hover:bg-neutral-50 text-neutral-600 border-neutral-200 h-9"
                  onClick={() =>
                    window.open(`${apiBase}/public/activities.ics`, '_blank', 'noreferrer')
                  }
                >
                  <CalendarPlus className="mr-2 h-3.5 w-3.5" />
                  Kalender
                </Button>
                <Button
                  size="sm"
                  variant="outline"
                  className="bg-white hover:bg-neutral-50 text-neutral-600 border-neutral-200 h-9"
                  onClick={() =>
                    window.open(`${apiBase}/public/activities.rss`, '_blank', 'noreferrer')
                  }
                >
                  <Rss className="mr-2 h-3.5 w-3.5" />
                  RSS
                </Button>
              </div>
            </div>

            {isLoading && (
              <div className="flex flex-col items-center justify-center py-20 text-neutral-500">
                <Spinner size="lg" className="text-brand-600" /> 
                <p className="mt-4 text-sm font-medium">Memuat aktivitas publik...</p>
              </div>
            )}
            
            {isError && (
              <div className="rounded-xl border border-red-100 bg-red-50 p-8 text-center">
                <p className="text-red-600 font-medium">Gagal memuat data publik.</p>
                <p className="text-red-500 text-sm mt-1">Silakan coba muat ulang halaman.</p>
              </div>
            )}

            {!isLoading && !isError && (
              <PublicActivityGrid data={data} />
            )}
          </div>
        </Container>
      </main>

      {/* Footer */}
      <footer className="py-8 bg-white border-t border-neutral-200">
        <Container>
          <div className="flex flex-col md:flex-row justify-between items-center gap-4 text-sm text-neutral-500">
            <p>© {new Date().getFullYear()} Universitas Raharja. All rights reserved.</p>
            <div className="flex gap-6">
              <Link href="#" className="hover:text-brand-600 transition-colors">Kebijakan Privasi</Link>
              <Link href="#" className="hover:text-brand-600 transition-colors">Syarat & Ketentuan</Link>
            </div>
          </div>
        </Container>
      </footer>
    </div>
  )
}
