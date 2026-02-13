'use client'

import { useRouter } from 'next/navigation'
import Link from 'next/link'
import { FileText, FileUp, Archive, ArrowRight, Package } from 'lucide-react'

import {
  Badge,
  Button,
  Card,
  CardContent,
  Container,
} from '@/components/ui'
import { Page } from '@/components/commons'

export default function SuratPage() {
  const router = useRouter()

  return (
    <Page>
      <Page.Header
        breadcrumbs={[
          { href: '/dashboard', children: 'Dashboard' },
          { href: '/surat', children: 'Surat' },
        ]}
      >
        <div className="flex flex-col gap-4 md:flex-row md:items-center md:justify-between">
          <div>
            <h1 className="text-2xl font-bold tracking-tight text-neutral-900">
              Manajemen Surat
            </h1>
            <p className="mt-1 text-sm text-neutral-500">
              Buat surat baru atau lihat arsip surat yang sudah ada.
            </p>
          </div>
        </div>
      </Page.Header>

      <Page.Body>
        <Container>
          <div className="max-w-4xl mx-auto py-8">
            {/* Main Action Cards */}
            <div className="grid gap-6 md:grid-cols-3 mb-8">
              {/* Buat Surat - Isi Form */}
              <button
                onClick={() => router.push('/surat/create')}
                className="group relative flex flex-col items-center gap-4 p-8 rounded-2xl border-2 border-neutral-200 bg-white hover:border-brand-500 hover:shadow-xl hover:shadow-brand-500/10 transition-all duration-300 text-left"
              >
                <div className="w-20 h-20 rounded-2xl bg-gradient-to-br from-brand-50 to-brand-100 flex items-center justify-center group-hover:scale-110 transition-transform">
                  <FileText className="w-10 h-10 text-brand-600" />
                </div>
                <div className="text-center space-y-2">
                  <h3 className="text-xl font-bold text-neutral-900">Buat Surat Baru</h3>
                  <p className="text-sm text-neutral-500 leading-relaxed">
                    Buat surat pengajuan, permohonan, atau undangan.
                  </p>
                </div>
                <div className="flex items-center gap-2 text-brand-600 font-medium text-sm group-hover:gap-3 transition-all">
                  Mulai Buat Surat <ArrowRight className="w-4 h-4" />
                </div>
                <div className="absolute top-4 right-4">
                  <Badge variant="secondary" className="bg-brand-50 text-brand-700 text-[10px]">
                    Utama
                  </Badge>
                </div>
              </button>

              {/* Surat Peminjaman */}
              <button
                onClick={() => router.push('/surat/peminjaman')}
                className="group relative flex flex-col items-center gap-4 p-8 rounded-2xl border-2 border-neutral-200 bg-white hover:border-amber-500 hover:shadow-xl hover:shadow-amber-500/10 transition-all duration-300 text-left"
              >
                <div className="w-20 h-20 rounded-2xl bg-gradient-to-br from-amber-50 to-amber-100 flex items-center justify-center group-hover:scale-110 transition-transform">
                  <Package className="w-10 h-10 text-amber-600" />
                </div>
                <div className="text-center space-y-2">
                  <h3 className="text-xl font-bold text-neutral-900">Surat Peminjaman</h3>
                  <p className="text-sm text-neutral-500 leading-relaxed">
                    Buat surat peminjaman aset organisasi dengan pilih barang dan jadwal.
                  </p>
                </div>
                <div className="flex items-center gap-2 text-amber-600 font-medium text-sm group-hover:gap-3 transition-all">
                  Buat Peminjaman <ArrowRight className="w-4 h-4" />
                </div>
                <div className="absolute top-4 right-4">
                  <Badge variant="secondary" className="bg-amber-50 text-amber-700 text-[10px]">
                    Baru
                  </Badge>
                </div>
              </button>

              {/* Arsip Surat */}
              <button
                onClick={() => router.push('/arsip')}
                className="group relative flex flex-col items-center gap-4 p-8 rounded-2xl border-2 border-neutral-200 bg-white hover:border-green-500 hover:shadow-xl hover:shadow-green-500/10 transition-all duration-300 text-left"
              >
                <div className="w-20 h-20 rounded-2xl bg-gradient-to-br from-green-50 to-green-100 flex items-center justify-center group-hover:scale-110 transition-transform">
                  <Archive className="w-10 h-10 text-green-600" />
                </div>
                <div className="text-center space-y-2">
                  <h3 className="text-xl font-bold text-neutral-900">Arsip Surat</h3>
                  <p className="text-sm text-neutral-500 leading-relaxed">
                    Lihat daftar surat masuk, keluar, dan kelola arsip surat.
                  </p>
                </div>
                <div className="flex items-center gap-2 text-green-600 font-medium text-sm group-hover:gap-3 transition-all">
                  Lihat Arsip <ArrowRight className="w-4 h-4" />
                </div>
              </button>
            </div>

            {/* Quick Info */}
            <Card className="border-neutral-200 bg-neutral-50/50">
              <CardContent className="p-6">
                <h4 className="font-semibold text-neutral-900 mb-4">Panduan Cepat</h4>
                <div className="grid gap-4 sm:grid-cols-2">
                  <div className="flex gap-3">
                    <div className="w-8 h-8 rounded-lg bg-brand-100 flex items-center justify-center flex-shrink-0">
                      <FileText className="w-4 h-4 text-brand-600" />
                    </div>
                    <div>
                      <p className="font-medium text-sm text-neutral-900">Isi Form Surat</p>
                      <p className="text-xs text-neutral-500">
                        Buat surat dengan mengisi formulir langkah demi langkah. PDF akan digenerate otomatis.
                      </p>
                    </div>
                  </div>
                  <div className="flex gap-3">
                    <div className="w-8 h-8 rounded-lg bg-green-100 flex items-center justify-center flex-shrink-0">
                      <FileUp className="w-4 h-4 text-green-600" />
                    </div>
                    <div>
                      <p className="font-medium text-sm text-neutral-900">Upload Surat</p>
                      <p className="text-xs text-neutral-500">
                        Upload file PDF surat yang sudah jadi untuk didaftarkan ke sistem.
                      </p>
                    </div>
                  </div>
                  <div className="flex gap-3">
                    <div className="w-8 h-8 rounded-lg bg-blue-100 flex items-center justify-center flex-shrink-0">
                      <Archive className="w-4 h-4 text-blue-600" />
                    </div>
                    <div>
                      <p className="font-medium text-sm text-neutral-900">Arsip & Riwayat</p>
                      <p className="text-xs text-neutral-500">
                        Lihat semua surat masuk dan keluar, filter berdasarkan status dan organisasi.
                      </p>
                    </div>
                  </div>
                  <div className="flex gap-3">
                    <div className="w-8 h-8 rounded-lg bg-amber-100 flex items-center justify-center flex-shrink-0">
                      <span className="text-amber-600 font-bold text-xs">✓</span>
                    </div>
                    <div>
                      <p className="font-medium text-sm text-neutral-900">Approval</p>
                      <p className="text-xs text-neutral-500">
                        Setujui atau tolak surat masuk yang memerlukan persetujuan Anda.
                      </p>
                    </div>
                  </div>
                </div>
              </CardContent>
            </Card>
          </div>
        </Container>
      </Page.Body>
    </Page>
  )
}
