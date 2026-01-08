'use client'

import Link from 'next/link'
import { useMemo } from 'react'
import { useQuery } from '@tanstack/react-query'

import {
  Badge,
  Button,
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
  Text,
} from '@/components/ui'
import { listOrganizations } from '@/lib/apis/org'

function orgRoleCodeFromSlug(slug?: string) {
  const raw = (slug ?? '').trim().toLowerCase()
  if (!raw) return 'ORG_UNKNOWN'

  const normalized = raw.replaceAll('-', '_')
  let out = 'ORG_'
  for (const ch of normalized) {
    const isLetter = ch >= 'a' && ch <= 'z'
    const isDigit = ch >= '0' && ch <= '9'
    if (ch === '_') out += '_'
    else if (isLetter) out += ch.toUpperCase()
    else if (isDigit) out += ch
    else out += '_'
  }
  out = out.replaceAll(/_+$/g, '').replaceAll(/__+/g, '_')
  return out
}

function Yes() {
  return <span className="font-semibold text-green-700">✓</span>
}

function No() {
  return <span className="text-neutral-300">—</span>
}

export function RoleGuideCard() {
  const orgsQuery = useQuery({
    queryKey: ['orgs', 'role-guide'],
    queryFn: listOrganizations,
  })

  const orgRoleItems = useMemo(() => {
    const items = (orgsQuery.data ?? [])
      .filter((o) => Boolean(o.slug))
      .map((o) => ({
        id: o.id,
        name: o.name,
        type: o.type,
        slug: o.slug as string,
        roleCode: orgRoleCodeFromSlug(o.slug),
      }))
    items.sort((a, b) => a.name.localeCompare(b.name))
    return items
  }, [orgsQuery.data])

  return (
    <Card className="border-neutral-200 shadow-sm">
      <CardHeader>
        <CardTitle className="text-lg">Panduan Akses & Peran</CardTitle>
        <CardDescription>
          Ringkasan peran yang dipakai di SIMAWA dan cara memberi akses yang tepat.
        </CardDescription>
      </CardHeader>
      <CardContent className="space-y-6 text-sm text-neutral-700">
        <div className="space-y-3">
          <h4 className="font-medium text-neutral-900 flex items-center gap-2">
            <div className="h-1.5 w-1.5 rounded-full bg-brand-500" />
            Daftar Peran (Dashboard)
          </h4>
          <ul className="space-y-2 text-sm text-neutral-600 pl-1">
            <li className="flex gap-2 items-start">
              <Badge variant="outline" className="mt-0.5 bg-neutral-50 text-neutral-600 border-neutral-200">USER</Badge>
              <span>Akses dasar (tanpa fitur kelola).</span>
            </li>
            <li className="flex gap-2 items-start">
              <Badge variant="outline" className="mt-0.5 bg-amber-50 text-amber-700 border-amber-200">ADMIN</Badge>
              <span>Admin utama (akses penuh ke semua organisasi & menu admin).</span>
            </li>
            <li className="flex gap-2 items-start">
              <Badge variant="outline" className="mt-0.5 bg-blue-50 text-blue-700 border-blue-200">BEM_ADMIN</Badge>
              <span>Admin untuk organisasi tipe BEM.</span>
            </li>
            <li className="flex gap-2 items-start">
              <Badge variant="outline" className="mt-0.5 bg-blue-50 text-blue-700 border-blue-200">DEMA_ADMIN</Badge>
              <span>Admin untuk organisasi tipe DEMA.</span>
            </li>
            <li className="flex gap-2 items-start">
              <Badge variant="outline" className="mt-0.5 bg-brand-50 text-brand-700 border-brand-200">ORG_*</Badge>
              <span>Admin spesifik organisasi (contoh: <span className="font-medium">ORG_ABSTER</span>). Dibuat otomatis saat user dijadikan admin di menu Organisasi.</span>
            </li>
          </ul>
        </div>

        <div className="space-y-3">
          <h4 className="font-medium text-neutral-900 flex items-center gap-2">
            <div className="h-1.5 w-1.5 rounded-full bg-brand-500" />
            Matriks Hak Akses
          </h4>
          <div className="overflow-x-auto rounded-xl border border-neutral-200">
            <table className="min-w-[760px] w-full border-collapse bg-white text-xs">
              <thead className="bg-neutral-50/50 text-neutral-500 font-medium">
                <tr>
                  <th className="border-b border-neutral-100 px-4 py-3 text-left">Fitur</th>
                  <th className="border-b border-neutral-100 px-4 py-3 text-center">USER</th>
                  <th className="border-b border-neutral-100 px-4 py-3 text-center">ORG_*</th>
                  <th className="border-b border-neutral-100 px-4 py-3 text-center">BEM/DEMA</th>
                  <th className="border-b border-neutral-100 px-4 py-3 text-center">ADMIN</th>
                </tr>
              </thead>
              <tbody className="text-neutral-600 divide-y divide-neutral-100">
                <tr>
                  <td className="px-4 py-3 font-medium text-neutral-900">Kelola Profil Organisasi</td>
                  <td className="px-4 py-3 text-center"><No /></td>
                  <td className="px-4 py-3 text-center"><Yes /></td>
                  <td className="px-4 py-3 text-center"><Yes /></td>
                  <td className="px-4 py-3 text-center"><Yes /></td>
                </tr>
                <tr>
                  <td className="px-4 py-3 font-medium text-neutral-900">Kelola Anggota</td>
                  <td className="px-4 py-3 text-center"><No /></td>
                  <td className="px-4 py-3 text-center"><Yes /></td>
                  <td className="px-4 py-3 text-center"><Yes /></td>
                  <td className="px-4 py-3 text-center"><Yes /></td>
                </tr>
                <tr>
                  <td className="px-4 py-3 font-medium text-neutral-900">Proses Pendaftaran</td>
                  <td className="px-4 py-3 text-center"><No /></td>
                  <td className="px-4 py-3 text-center"><Yes /></td>
                  <td className="px-4 py-3 text-center"><Yes /></td>
                  <td className="px-4 py-3 text-center"><Yes /></td>
                </tr>
                <tr>
                  <td className="px-4 py-3 font-medium text-neutral-900">Direktori User</td>
                  <td className="px-4 py-3 text-center"><No /></td>
                  <td className="px-4 py-3 text-center"><No /></td>
                  <td className="px-4 py-3 text-center"><Yes /></td>
                  <td className="px-4 py-3 text-center"><Yes /></td>
                </tr>
                <tr>
                  <td className="px-4 py-3 font-medium text-neutral-900">Laporan / LPJ</td>
                  <td className="px-4 py-3 text-center"><No /></td>
                  <td className="px-4 py-3 text-center"><No /></td>
                  <td className="px-4 py-3 text-center"><Yes /></td>
                  <td className="px-4 py-3 text-center"><Yes /></td>
                </tr>
              </tbody>
            </table>
          </div>
        </div>

        <div className="space-y-3">
          <h4 className="font-medium text-neutral-900 flex items-center gap-2">
            <div className="h-1.5 w-1.5 rounded-full bg-brand-500" />
            Role Organisasi Aktif
          </h4>
          {orgsQuery.isLoading ? (
            <div className="text-sm text-neutral-500 italic">Memuat daftar...</div>
          ) : orgRoleItems.length === 0 ? (
            <div className="text-sm text-neutral-500 italic">
              Belum ada organisasi dengan slug yang valid.
            </div>
          ) : (
            <div className="grid gap-3 sm:grid-cols-2">
              {orgRoleItems.map((o) => (
                <div
                  key={o.id}
                  className="flex items-center justify-between rounded-xl border border-neutral-200 bg-white p-3 hover:border-brand-200 transition-colors"
                >
                  <div className="min-w-0">
                    <p className="truncate text-sm font-medium text-neutral-900">
                      {o.name}
                    </p>
                    <p className="text-[10px] text-neutral-500 font-mono mt-0.5">/{o.slug}</p>
                  </div>
                  <Badge
                    variant="secondary"
                    className="shrink-0 bg-neutral-100 text-neutral-600 border-neutral-200 font-mono text-[10px]"
                  >
                    {o.roleCode}
                  </Badge>
                </div>
              ))}
            </div>
          )}
        </div>

        <div className="rounded-xl border border-blue-100 bg-blue-50/50 p-4">
          <h4 className="font-medium text-blue-900 mb-2">Tips Pemberian Akses</h4>
          <ul className="list-disc space-y-1 pl-4 text-xs text-blue-800/80">
            <li>
              <span className="font-semibold text-blue-900">Kelola Satu Organisasi:</span> Buka menu <span className="font-medium">Organisasi</span>, pilih tab Anggota, lalu tambahkan user sebagai ADMIN di sana.
            </li>
            <li>
              <span className="font-semibold text-blue-900">Admin Global:</span> Gunakan form di atas untuk memberikan role <span className="font-medium">ADMIN</span>.
            </li>
          </ul>
          
          <div className="flex gap-2 mt-4">
            <Link href="/organizations">
              <Button size="sm" variant="outline" className="bg-white border-blue-200 text-blue-700 hover:bg-blue-50">
                Ke Organisasi
              </Button>
            </Link>
            <Link href="/users">
              <Button size="sm" variant="outline" className="bg-white border-blue-200 text-blue-700 hover:bg-blue-50">
                Ke Users
              </Button>
            </Link>
          </div>
        </div>
      </CardContent>
    </Card>
  )
}
