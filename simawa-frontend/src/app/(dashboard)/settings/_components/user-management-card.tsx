'use client'

import { FormEvent, useState } from 'react'
import { useMutation, useQuery } from '@tanstack/react-query'
import Link from 'next/link'
import { Loader2, UserPlus, Shield, User, Building2 } from 'lucide-react'
import { toast } from 'sonner'

import {
  AutoComplete,
  Badge,
  Button,
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
  Input,
  Label,
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
  Switch,
} from '@/components/ui'
import {
  assignUserRoles,
  createUser,
  searchUsers,
  type CreateUserPayload,
  type UserSearchItem,
} from '@/lib/apis/user'
import { listOrganizations } from '@/lib/apis/org'
import { useRBAC } from '@/lib/providers/rbac-provider'

export function UserCreateCard() {
  const { user } = useRBAC()
  const isAdmin = user?.roles?.includes('ADMIN')

  const [createPayload, setCreatePayload] = useState<CreateUserPayload>({
    username: '',
    first_name: '',
    email: '',
    jurusan: '',
    nim: '',
    organisasi: false,
    ukm: '',
    hmj: '',
    phone: '',
    alamat: '',
    tanggal_lahir: '',
    password: '',
  } as CreateUserPayload)

  const [selectedOrgId, setSelectedOrgId] = useState('')

  const { data: organizations } = useQuery({
    queryKey: ['organizations', 'all'],
    queryFn: listOrganizations,
  })

  const { mutateAsync: create, isPending: isCreating } = useMutation({
    mutationFn: createUser,
  })

  const handleCreate = async (e: FormEvent) => {
    e.preventDefault()
    const {
      username,
      first_name,
      jurusan,
      nim,
      email,
      phone,
      alamat,
      tanggal_lahir,
      password,
      organisasi,
      ukm,
      hmj,
    } = createPayload

    if (
      !username ||
      !first_name ||
      !jurusan ||
      !nim ||
      !email ||
      !phone ||
      !alamat ||
      !tanggal_lahir ||
      !password
    ) {
      toast.error('Semua field wajib diisi (termasuk phone, alamat, tanggal lahir)')
      return
    }
    const emailLower = email.toLowerCase().trim()
    if (!emailLower.endsWith('@raharja.info')) {
      toast.error('Email wajib menggunakan domain @raharja.info')
      return
    }
    if (!/^\d{8}$/.test(tanggal_lahir)) {
      toast.error('Tanggal lahir harus dalam format yyyyMMdd (contoh: 20000101)')
      return
    }
    if (organisasi && !ukm?.trim() && !hmj?.trim()) {
      toast.error('Jika akun organisasi, pilih organisasi (UKM/HMJ) terlebih dahulu')
      return
    }

    try {
      await create(createPayload)
      toast.success('Pengguna berhasil dibuat')
      setCreatePayload({
        username: '',
        first_name: '',
        email: '',
        jurusan: '',
        nim: '',
        organisasi: false,
        ukm: '',
        hmj: '',
        phone: '',
        alamat: '',
        tanggal_lahir: '',
        password: '',
      } as CreateUserPayload)
      setSelectedOrgId('')
    } catch (err) {
      console.error(err)
      toast.error('Gagal membuat pengguna')
    }
  }

  return (
    <Card className="border-neutral-200 shadow-sm">
      <CardHeader>
        <CardTitle className="flex items-center gap-2 text-lg">
          <UserPlus className="h-5 w-5 text-brand-600" />
          Buat Akun Baru
        </CardTitle>
        <CardDescription>Khusus admin untuk mendaftarkan pengguna baru secara manual.</CardDescription>
      </CardHeader>
      <CardContent className="space-y-6">
        {!isAdmin && (
          <div className="rounded-lg bg-amber-50 p-3 text-sm text-amber-800 border border-amber-100">
            Hanya admin yang dapat membuat akun baru.
          </div>
        )}

        <form
          className="space-y-5"
          onSubmit={handleCreate}
        >
          <div className="grid gap-5 sm:grid-cols-2">
            <div className="space-y-2">
              <Label>Username</Label>
              <Input
                placeholder="johndoe"
                value={createPayload.username}
                onChange={(e) =>
                  setCreatePayload((prev) => ({ ...prev, username: e.target.value }))
                }
              />
            </div>
            <div className="space-y-2">
              <Label>Nama Depan</Label>
              <Input
                placeholder="John"
                value={createPayload.first_name}
                onChange={(e) =>
                  setCreatePayload((prev) => ({ ...prev, first_name: e.target.value }))
                }
              />
            </div>
          </div>

          <div className="grid gap-5 sm:grid-cols-2">
            <div className="space-y-2">
              <Label>Jurusan</Label>
              <Input
                placeholder="Sistem Informasi"
                value={createPayload.jurusan ?? ''}
                onChange={(e) =>
                  setCreatePayload((prev) => ({ ...prev, jurusan: e.target.value }))
                }
              />
            </div>
            <div className="space-y-2">
              <Label>NIM</Label>
              <Input
                placeholder="1921xxxx"
                value={createPayload.nim ?? ''}
                onChange={(e) =>
                  setCreatePayload((prev) => ({ ...prev, nim: e.target.value }))
                }
              />
            </div>
          </div>

          <div className="rounded-xl border border-neutral-200 bg-neutral-50/50 p-4 space-y-4">
            <div className="flex items-center justify-between gap-3">
              <div className="space-y-0.5">
                <Label className="text-sm font-semibold text-neutral-900">Akun Organisasi?</Label>
                <p className="text-xs text-neutral-500">
                  Aktifkan jika user ini adalah akun sistem untuk UKM/HMJ (bukan perorangan).
                </p>
              </div>
              <Switch
                checked={Boolean(createPayload.organisasi)}
                onCheckedChange={(checked) => {
                  setCreatePayload((prev) => ({
                    ...prev,
                    organisasi: checked,
                    ...(checked ? {} : { ukm: '', hmj: '' }),
                  }))
                  if (!checked) {
                    setSelectedOrgId('')
                  }
                }}
              />
            </div>

            {createPayload.organisasi && (
              <div className="pt-2 animate-in slide-in-from-top-2 fade-in duration-200">
                <div className="space-y-2">
                  <Label>Pilih Organisasi (UKM/HMJ)</Label>
                  <Select
                    value={selectedOrgId}
                    onValueChange={(value) => {
                      setSelectedOrgId(value)
                      const org = organizations?.find((o) => o.id === value)
                      if (!org) return
                      const type = org.type?.toUpperCase()
                      const name = org.name
                      let ukm = ''
                      let hmj = ''
                      if (type === 'HMJ') {
                        hmj = name
                      } else {
                        ukm = name
                      }
                      setCreatePayload((prev) => ({
                        ...prev,
                        organisasi: true,
                        ukm,
                        hmj,
                      }))
                    }}
                    disabled={!organizations || organizations.length === 0}
                  >
                    <SelectTrigger className="bg-white">
                      <SelectValue placeholder="Pilih dari daftar..." />
                    </SelectTrigger>
                    <SelectContent>
                      {(organizations ?? [])
                        .filter((org) =>
                          ['UKM', 'HMJ', 'BEM', 'DEMA'].includes(
                            (org.type ?? '').toUpperCase(),
                          ),
                        )
                        .map((org) => (
                          <SelectItem key={org.id} value={org.id}>
                            {org.name} {org.type ? `(${org.type})` : ''}
                          </SelectItem>
                        ))}
                    </SelectContent>
                  </Select>
                  <p className="text-[10px] text-neutral-500">
                    Nama UKM/HMJ akan otomatis terisi berdasarkan pilihan di atas.
                  </p>
                </div>
              </div>
            )}
          </div>

          <div className="grid gap-5 sm:grid-cols-2">
            <div className="space-y-2">
              <Label>No. Telepon / WA</Label>
              <Input
                placeholder="08xxxxxxxxxx"
                value={createPayload.phone}
                onChange={(e) =>
                  setCreatePayload((prev) => ({ ...prev, phone: e.target.value }))
                }
              />
            </div>
            <div className="space-y-2">
              <Label>Alamat Lengkap</Label>
              <Input
                placeholder="Jl. Jendral Sudirman..."
                value={createPayload.alamat}
                onChange={(e) =>
                  setCreatePayload((prev) => ({ ...prev, alamat: e.target.value }))
                }
              />
            </div>
          </div>

          <div className="grid gap-5 sm:grid-cols-2">
            <div className="space-y-2">
              <Label>Email Kampus</Label>
              <div className="relative">
                <Input
                  type="email"
                  placeholder="nama@raharja.info"
                  value={createPayload.email}
                  onChange={(e) =>
                    setCreatePayload((prev) => ({ ...prev, email: e.target.value }))
                  }
                />
              </div>
            </div>
            <div className="space-y-2">
              <Label>Password</Label>
              <Input
                type="password"
                placeholder="Minimal 6 karakter"
                value={createPayload.password}
                onChange={(e) =>
                  setCreatePayload((prev) => ({ ...prev, password: e.target.value }))
                }
              />
            </div>
          </div>

          <div className="space-y-2">
            <Label>Tanggal Lahir</Label>
            <Input
              placeholder="Format: yyyyMMdd (Contoh: 20000101)"
              value={createPayload.tanggal_lahir}
              onChange={(e) =>
                setCreatePayload((prev) => ({ ...prev, tanggal_lahir: e.target.value }))
              }
            />
          </div>

          <Button type="submit" className="w-full bg-brand-600 hover:bg-brand-700 text-white" disabled={isCreating}>
            {isCreating ? (
              <Loader2 className="mr-2 h-4 w-4 animate-spin" />
            ) : (
              <UserPlus className="mr-2 h-4 w-4" />
            )}
            Buat Pengguna Baru
          </Button>
        </form>
      </CardContent>
    </Card>
  )
}

export function RoleManagementCard() {
  const { user } = useRBAC()
  const isAdmin = user?.roles?.includes('ADMIN')

  const [rolesUserId, setRolesUserId] = useState('')
  const [selectedUser, setSelectedUser] = useState<UserSearchItem | null>(null)
  const [userSearch, setUserSearch] = useState('')
  const [selectedRoles, setSelectedRoles] = useState<string[]>([])

  const { mutateAsync: assignRolesMutation, isPending: isAssigning } = useMutation({
    mutationFn: ({ id, roles }: { id: string; roles: string[] }) =>
      assignUserRoles(id, roles),
  })

  const userSearchQuery = useQuery({
    queryKey: ['user-search', userSearch],
    queryFn: () => searchUsers({ q: userSearch, size: 10 }),
    enabled: Boolean(isAdmin) && userSearch.trim().length > 0,
  })

  const userOptions = [
    ...(selectedUser
      ? [
        {
          value: selectedUser.id,
          label: `${selectedUser.username} • ${selectedUser.email}`,
          user: selectedUser,
        },
      ]
      : []),
    ...(userSearchQuery.data ?? [])
      .filter((u) => u.id !== selectedUser?.id)
      .map((u) => ({
        value: u.id,
        label: `${u.username} • ${u.email}`,
        user: u,
      })),
  ]

  const ROLE_OPTIONS = [
    { value: 'USER', label: 'USER' },
    { value: 'ADMIN', label: 'ADMIN' },
    { value: 'BEM_ADMIN', label: 'BEM_ADMIN' },
    { value: 'DEMA_ADMIN', label: 'DEMA_ADMIN' },
  ] as const

  const handleAssignRoles = async (e: FormEvent) => {
    e.preventDefault()
    if (!rolesUserId || selectedRoles.length === 0) {
      toast.error('ID pengguna dan peran wajib diisi')
      return
    }
    const roles = selectedRoles
    if (roles.length === 0) {
      toast.error('Minimal satu peran')
      return
    }
    try {
      await assignRolesMutation({ id: rolesUserId, roles })
      toast.success('Peran berhasil disimpan')
      // Reset form
      setRolesUserId('')
      setSelectedUser(null)
      setSelectedRoles([])
      setUserSearch('')
    } catch (err) {
      console.error(err)
      toast.error('Gagal menyimpan peran')
    }
  }

  return (
    <Card className="border-neutral-200 shadow-sm">
      <CardHeader>
        <CardTitle className="flex items-center gap-2 text-lg">
          <Shield className="h-5 w-5 text-brand-600" />
          Kelola Akses Global
        </CardTitle>
        <CardDescription>Atur peran sistem (ADMIN, USER, dll) untuk pengguna.</CardDescription>
      </CardHeader>
      <CardContent className="space-y-6">
        {!isAdmin && (
          <div className="rounded-lg bg-amber-50 p-3 text-sm text-amber-800 border border-amber-100">
            Hanya admin yang dapat mengubah peran pengguna.
          </div>
        )}

        <form
          className="space-y-5"
          onSubmit={handleAssignRoles}
        >
          <div className="grid gap-5 sm:grid-cols-2">
            <div className="space-y-2">
              <Label>Cari Pengguna</Label>
              <AutoComplete
                placeholder="Nama, Email, atau NIM..."
                value={rolesUserId}
                options={userOptions}
                isLoading={userSearchQuery.isFetching}
                disabled={!isAdmin}
                onSearch={(txt) => setUserSearch(txt)}
                onSelect={(value, option) => {
                  setRolesUserId(value || '')
                  const picked = (option as { user?: UserSearchItem } | undefined)?.user
                  setSelectedUser(picked ?? null)
                }}
                customRender={(opt) => {
                  const u = (opt as { user?: UserSearchItem }).user
                  if (!u) return opt.label
                  return (
                    <div className="flex items-center gap-2 py-1">
                      <div className="h-8 w-8 rounded-full bg-brand-50 flex items-center justify-center text-brand-600 text-xs font-semibold shrink-0">
                        {u.username.slice(0, 2).toUpperCase()}
                      </div>
                      <div className="flex flex-col min-w-0">
                        <span className="text-sm font-medium text-neutral-900 truncate">
                          {u.username}
                        </span>
                        <span className="text-xs text-neutral-500 truncate">
                          {u.email}
                        </span>
                      </div>
                    </div>
                  )
                }}
              />
            </div>

            <div className="space-y-2">
              <Label>Role yang Diberikan</Label>
              <AutoComplete
                placeholder="Pilih role..."
                value=""
                options={ROLE_OPTIONS.filter((r) => !selectedRoles.includes(r.value))}
                disabled={!isAdmin}
                onSelect={(value) => {
                  if (!value) return
                  setSelectedRoles((prev) => [...prev, value])
                }}
              />

              <div className="min-h-[32px] flex flex-wrap gap-2 pt-1">
                {selectedRoles.length === 0 && (
                  <span className="text-xs text-neutral-400 italic">Belum ada role dipilih</span>
                )}
                {selectedRoles.map((r) => (
                  <Badge
                    key={r}
                    variant="secondary"
                    className="cursor-pointer hover:bg-red-50 hover:text-red-600 hover:border-red-200 transition-colors pr-1.5"
                    onClick={() =>
                      setSelectedRoles((prev) => prev.filter((x) => x !== r))
                    }
                    title="Klik untuk hapus"
                  >
                    {r} <span className="ml-1 opacity-50">×</span>
                  </Badge>
                ))}
              </div>
            </div>
          </div>

          <Button type="submit" size="sm" className="bg-brand-600 hover:bg-brand-700 text-white w-full sm:w-auto" disabled={!isAdmin || isAssigning}>
            {isAssigning ? (
              <Loader2 className="mr-2 h-4 w-4 animate-spin" />
            ) : (
              <Shield className="mr-2 h-4 w-4" />
            )}
            Simpan Perubahan Role
          </Button>
        </form>

        <div className="rounded-xl border border-blue-100 bg-blue-50/50 p-4">
          <h4 className="flex items-center gap-2 font-medium text-blue-900 text-sm mb-2">
            <Building2 className="h-4 w-4" />
            Admin Organisasi Spesifik
          </h4>
          <p className="text-xs text-blue-800/80 mb-3 leading-relaxed">
            Untuk menjadikan user sebagai admin di organisasi tertentu (misal: hanya BEM atau UKM tertentu), jangan gunakan menu ini.
            Gunakan menu <Link href="/organizations" className="font-semibold underline underline-offset-2 hover:text-blue-900">Organisasi</Link>, pilih organisasi, lalu masuk ke tab <strong>Anggota</strong>.
          </p>
          <Link href="/organizations">
            <Button size="sm" variant="outline" className="h-8 bg-white border-blue-200 text-blue-700 hover:bg-blue-50 text-xs">
              Ke Menu Organisasi
            </Button>
          </Link>
        </div>
      </CardContent>
    </Card>
  )
}
