'use client'

import Link from 'next/link'
import {
  FileText,
  FolderKanban,
  Building2,
  ScrollText,
  Archive,
  Users,
  ArrowRight,
} from 'lucide-react'
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui'

const actions = [
  {
    label: 'Buat Surat',
    description: 'Buat surat baru via form atau upload',
    href: '/surat/create',
    icon: FileText,
    color: 'bg-brand-50 text-brand-600 border-brand-100',
  },
  {
    label: 'Aktivitas',
    description: 'Kelola kegiatan organisasi',
    href: '/activities',
    icon: FolderKanban,
    color: 'bg-green-50 text-green-600 border-green-100',
  },
  {
    label: 'Arsip Surat',
    description: 'Lihat inbox & outbox surat',
    href: '/arsip',
    icon: Archive,
    color: 'bg-blue-50 text-blue-600 border-blue-100',
  },
  {
    label: 'LPJ',
    description: 'Submit & kelola laporan',
    href: '/lpj',
    icon: ScrollText,
    color: 'bg-amber-50 text-amber-600 border-amber-100',
  },
  {
    label: 'Organisasi',
    description: 'Kelola profil organisasi',
    href: '/organizations',
    icon: Building2,
    color: 'bg-purple-50 text-purple-600 border-purple-100',
  },
  {
    label: 'Pengguna',
    description: 'Manajemen user & role',
    href: '/users',
    icon: Users,
    color: 'bg-rose-50 text-rose-600 border-rose-100',
  },
]

export function QuickActions() {
  return (
    <Card className="border-neutral-200 shadow-sm">
      <CardHeader className="pb-3 border-b border-neutral-100 bg-neutral-50/50">
        <CardTitle className="text-base font-semibold text-neutral-900">
          Aksi Cepat
        </CardTitle>
        <CardDescription className="text-xs text-neutral-500">
          Akses fitur utama dengan cepat.
        </CardDescription>
      </CardHeader>
      <CardContent className="pt-4">
        <div className="grid grid-cols-2 sm:grid-cols-3 gap-3">
          {actions.map((action) => {
            const Icon = action.icon
            return (
              <Link
                key={action.href}
                href={action.href}
                className="group flex flex-col gap-2 rounded-xl border border-neutral-200 p-3 hover:border-neutral-300 hover:shadow-md transition-all duration-200"
              >
                <div
                  className={`h-9 w-9 rounded-lg border flex items-center justify-center ${action.color}`}
                >
                  <Icon className="h-4.5 w-4.5" />
                </div>
                <div>
                  <p className="text-sm font-medium text-neutral-900 group-hover:text-brand-700 transition-colors flex items-center gap-1">
                    {action.label}
                    <ArrowRight className="h-3 w-3 opacity-0 -translate-x-1 group-hover:opacity-100 group-hover:translate-x-0 transition-all" />
                  </p>
                  <p className="text-[11px] text-neutral-500 line-clamp-1 mt-0.5">
                    {action.description}
                  </p>
                </div>
              </Link>
            )
          })}
        </div>
      </CardContent>
    </Card>
  )
}
