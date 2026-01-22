'use client'

import { useEffect, useMemo, useState } from 'react'
import { useQuery, useInfiniteQuery, useMutation, useQueryClient } from '@tanstack/react-query'
import { Search, RotateCw, Users as UsersIcon, Plus, Eye, Pencil, Trash2, X, UserPlus, Mail, Phone, GraduationCap, Building2 } from 'lucide-react'
import { toast } from 'sonner'

import {
  AutoComplete,
  Badge,
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
  Container,
  Input,
  Spinner,
  Button,
  InfiniteScrollLoader,
  Label,
  TextArea,
} from '@/components/ui'
import { Page } from '@/components/commons'
import {
  listUsers,
  listUserAssignments,
  createUser,
  updateUser,
  deleteUser,
  getUser,
  type UserRoleAssignment,
  type User,
  type CreateUserPayload,
  type UpdateUserPayload,
} from '@/lib/apis/user'
import { SkeletonTable } from '@/components/ui/skeleton/skeleton-table'
import { listOrganizations, type Organization } from '@/lib/apis/org'

type ViewMode = 'list' | 'create' | 'view' | 'edit'

export default function UsersPage() {
  const queryClient = useQueryClient()
  const [search, setSearch] = useState('')
  const [orgFilterId, setOrgFilterId] = useState('')
  const [page, setPage] = useState(1)
  const pageSize = 20
  
  const [viewMode, setViewMode] = useState<ViewMode>('list')
  const [selectedUserId, setSelectedUserId] = useState<string | null>(null)

  const orgsQuery = useQuery({
    queryKey: ['orgs'],
    queryFn: listOrganizations,
  })

  const orgOptions = useMemo(
    () =>
      (orgsQuery.data ?? []).map((o) => ({
        value: o.id,
        label: `${o.name} (${o.type || 'ORG'})`,
        org: o,
      })),
    [orgsQuery.data],
  )
  
  const handleViewUser = (userId: string) => {
    setSelectedUserId(userId)
    setViewMode('view')
  }
  
  const handleEditUser = (userId: string) => {
    setSelectedUserId(userId)
    setViewMode('edit')
  }
  
  const handleBackToList = () => {
    setViewMode('list')
    setSelectedUserId(null)
  }
  
  const [deleteModal, setDeleteModal] = useState<{ isOpen: boolean; userId: string | null; userName: string }>({
    isOpen: false,
    userId: null,
    userName: '',
  })
  
  const handleDeleteUser = (user: User) => {
    setDeleteModal({
      isOpen: true,
      userId: user.id,
      userName: user.first_name ? `${user.first_name} ${user.second_name || ''}` : user.username,
    })
  }

  // Desktop: useQuery with pagination
  const { data, isLoading, isError, error, refetch, isFetching } = useQuery({
    queryKey: ['users', search, orgFilterId, page],
    queryFn: () =>
      listUsers({
        page,
        size: pageSize,
        q: search,
        ...(orgFilterId ? { org_id: orgFilterId, role_prefix: 'ORG_' } : {}),
      }),
  })

  // Mobile: useInfiniteQuery for infinite scroll
  const usersInfiniteQuery = useInfiniteQuery({
    queryKey: ['users-infinite', search, orgFilterId],
    queryFn: ({ pageParam = 1 }) =>
      listUsers({
        page: pageParam,
        size: pageSize,
        q: search,
        ...(orgFilterId ? { org_id: orgFilterId, role_prefix: 'ORG_' } : {}),
      }),
    initialPageParam: 1,
    getNextPageParam: (lastPage, allPages) => {
      const totalItems = lastPage.total ?? 0
      const loadedItems = allPages.reduce((acc, p) => acc + (p.items?.length ?? 0), 0)
      if (loadedItems < totalItems) {
        return allPages.length + 1
      }
      return undefined
    },
  })

  const allInfiniteUsers = useMemo(
    () => usersInfiniteQuery.data?.pages.flatMap((p) => p.items ?? []) ?? [],
    [usersInfiniteQuery.data?.pages],
  )

  const items = data?.items ?? []
  const total = data?.total ?? 0
  const totalPages = Math.ceil(total / pageSize)

  const totalText = useMemo(() => {
    if (!data) return ''
    const start = (page - 1) * pageSize + 1
    const end = Math.min(page * pageSize, total)
    return `Menampilkan ${start}-${end} dari total ${total}`
  }, [data, page, pageSize, total])

  return (
    <Page>
      <Page.Header
        breadcrumbs={[
          { href: '/dashboard', children: 'Dashboard' },
          { href: '/users', children: 'Pengguna' },
        ]}
      >
        <div className="flex flex-col gap-4 md:flex-row md:items-center md:justify-between">
          <div>
            <h1 className="text-2xl font-bold tracking-tight text-neutral-900">
              Daftar Pengguna
            </h1>
            <p className="mt-1 text-sm text-neutral-500">
              Kelola data pengguna, hak akses, dan peran dalam sistem.
            </p>
          </div>
          <div className="flex gap-2">
            <Button variant="outline" size="sm" className="gap-2" onClick={() => refetch()}>
              {isFetching ? <Spinner size="xs" /> : <RotateCw className="h-3.5 w-3.5" />}
              Muat ulang
            </Button>
            <Button size="sm" className="gap-2 bg-brand-600 hover:bg-brand-700" onClick={() => setViewMode('create')}>
              <UserPlus className="h-3.5 w-3.5" />
              Tambah User
            </Button>
          </div>
        </div>
      </Page.Header>

      <Page.Body>
        <Container>
          <div className="grid gap-6">
            {/* Stats / Overview could go here if needed */}

            <Card className="border-neutral-200 shadow-sm">
              <CardHeader className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 pb-4">
                <div className="space-y-1">
                  <CardTitle className="text-sm sm:text-base font-semibold">
                    Pengguna Terdaftar
                  </CardTitle>
                  <CardDescription className="text-xs">
                    Semua pengguna yang memiliki akun di SIMAWA.
                  </CardDescription>
                </div>
                {data && (
                  <Badge variant="secondary" className="px-2.5 py-0.5">
                    {data.total} Total
                  </Badge>
                )}
              </CardHeader>

              <CardContent className="space-y-6">
                <div className="flex flex-col gap-4 md:flex-row md:items-center md:justify-between">
                  <div className="relative w-full md:w-72">
                    <Search className="absolute left-2.5 top-2.5 h-4 w-4 text-neutral-500" />
                    <Input
                      value={search}
                      onChange={(e) => setSearch(e.target.value)}
                      placeholder="Cari nama, email, atau NIM..."
                      className="pl-9 h-9 text-sm"
                    />
                  </div>

                  <div className="flex w-full flex-col gap-3 sm:flex-row sm:items-center md:w-auto">
                    <div className="w-full sm:w-64">
                      <AutoComplete
                        placeholder="Filter Organisasi"
                        value={orgFilterId}
                        options={orgOptions}
                        disabled={orgsQuery.isLoading}
                        isLoading={orgsQuery.isFetching}
                        onSelect={(value) => setOrgFilterId(value || '')}
                        closable
                        onRemove={() => setOrgFilterId('')}
                        customRender={(opt) => {
                          const org = (opt as { org?: Organization }).org
                          if (!org) return opt.label
                          return (
                            <div className="flex flex-col py-1">
                              <span className="text-sm font-medium text-neutral-900">
                                {org.name}
                              </span>
                              <span className="text-xs text-neutral-500">
                                {org.type || 'ORG'} • {org.slug ? `/${org.slug}` : '-'}
                              </span>
                            </div>
                          )
                        }}
                      />
                    </div>
                  </div>
                </div>

                {isLoading ? (
                  <div className="py-8">
                    <SkeletonTable />
                  </div>
                ) : isError ? (
                  <div className="rounded-lg border border-red-100 bg-red-50 p-4 text-center text-sm text-red-600">
                    <p className="font-semibold">Gagal memuat daftar pengguna.</p>
                    <p className="mt-1 text-xs">
                      {error?.message || 'Terjadi kesalahan saat menghubungi server.'}
                    </p>
                    <Button
                      variant="link"
                      size="sm"
                      onClick={() => refetch()}
                      className="mt-2 h-auto p-0 text-red-700"
                    >
                      Coba lagi
                    </Button>
                  </div>
                ) : items.length === 0 ? (
                  <div className="flex flex-col items-center justify-center py-12 text-center">
                    <div className="flex h-12 w-12 items-center justify-center rounded-full bg-neutral-100">
                      <UsersIcon className="h-6 w-6 text-neutral-400" />
                    </div>
                    <p className="mt-3 text-sm font-medium text-neutral-900">
                      Tidak ada pengguna ditemukan
                    </p>
                    <p className="mt-1 text-xs text-neutral-500">
                      Coba ubah kata kunci pencarian atau filter Anda.
                    </p>
                  </div>
                ) : (
                  <>
                    {/* Desktop View */}
                    <div className="hidden sm:block space-y-4">
                      <div className="rounded-lg border border-neutral-200 divide-y divide-neutral-100">
                        {items.map((user) => (
                          <UserRow 
                            key={user.id} 
                            user={user}
                            onView={handleViewUser}
                            onEdit={handleEditUser}
                            onDelete={() => handleDeleteUser(user)}
                          />
                        ))}
                      </div>
                      <div className="flex items-center justify-between border-t border-neutral-100 pt-4 mt-2">
                        <span className="text-xs text-neutral-500">{totalText}</span>
                        <div className="flex gap-2">
                          <Button
                            size="sm"
                            variant="outline"
                            className="h-8 text-xs"
                            disabled={page <= 1}
                            onClick={() => setPage((p) => Math.max(1, p - 1))}
                          >
                            Sebelumnya
                          </Button>
                          <Button
                            size="sm"
                            variant="outline"
                            className="h-8 text-xs"
                            onClick={() => setPage((p) => p + 1)}
                            disabled={page >= totalPages}
                          >
                            Berikutnya
                          </Button>
                        </div>
                      </div>
                    </div>
                    {/* Mobile View with Infinite Scroll */}
                    <div className="sm:hidden space-y-4">
                      <div className="rounded-lg border border-neutral-200 divide-y divide-neutral-100">
                        {allInfiniteUsers.map((user) => (
                          <UserRow 
                            key={user.id} 
                            user={user}
                            onView={handleViewUser}
                            onEdit={handleEditUser}
                            onDelete={() => handleDeleteUser(user)}
                          />
                        ))}
                      </div>
                      {usersInfiniteQuery.hasNextPage && (
                        <InfiniteScrollLoader
                          onLoadMore={() => usersInfiniteQuery.fetchNextPage()}
                          isLoading={usersInfiniteQuery.isFetchingNextPage}
                          hasMore={usersInfiniteQuery.hasNextPage}
                        />
                      )}
                    </div>
                  </>
                )}
              </CardContent>
            </Card>
          </div>
        </Container>
      </Page.Body>
      
      {/* Modals */}
      <CreateUserModal
        isOpen={viewMode === 'create'}
        onClose={handleBackToList}
        onSuccess={() => {
          refetch()
          queryClient.invalidateQueries({ queryKey: ['users'] })
        }}
      />
      
      <ViewUserModal
        userId={selectedUserId}
        isOpen={viewMode === 'view'}
        onClose={handleBackToList}
        onEdit={handleEditUser}
      />
      
      <EditUserModal
        userId={selectedUserId}
        isOpen={viewMode === 'edit'}
        onClose={handleBackToList}
        onSuccess={() => {
          refetch()
          queryClient.invalidateQueries({ queryKey: ['users'] })
        }}
      />
      
      <DeleteUserModal
        userId={deleteModal.userId}
        userName={deleteModal.userName}
        isOpen={deleteModal.isOpen}
        onClose={() => setDeleteModal({ isOpen: false, userId: null, userName: '' })}
        onSuccess={() => {
          refetch()
          queryClient.invalidateQueries({ queryKey: ['users'] })
        }}
      />
    </Page>
  )
}

type UserWithRoles = User

function UserRow({ user, onView, onEdit, onDelete }: { 
  user: UserWithRoles
  onView?: (id: string) => void
  onEdit?: (id: string) => void
  onDelete?: (id: string) => void
}) {
  const { data: roles, isLoading } = useQuery<UserRoleAssignment[]>({
    queryKey: ['user-roles', user.id],
    queryFn: () => listUserAssignments(user.id),
  })

  const roleLabels = useMemo(() => {
    if (!roles || roles.length === 0) return ['USER']
    const distinct = Array.from(new Set(roles.map((r) => r.role_code)))
    return distinct
  }, [roles])

  return (
    <div className="flex flex-col gap-3 p-4 hover:bg-neutral-50/50 sm:flex-row sm:items-center sm:justify-between transition-colors">
      <div className="flex items-start gap-3">
        <div className="flex h-9 w-9 shrink-0 items-center justify-center rounded-full bg-brand-50 text-brand-600 font-semibold text-sm">
          {user.first_name?.[0]?.toUpperCase() || user.username?.[0]?.toUpperCase()}
        </div>
        <div className="space-y-1">
          <div className="flex items-center gap-2">
            <p className="text-sm font-medium text-neutral-900 leading-none">
              {user.first_name
                ? `${user.first_name} ${user.second_name || ''}`
                : user.username}
            </p>
            {user.nim && (
              <span className="hidden sm:inline-flex rounded bg-neutral-100 px-1.5 py-0.5 text-[10px] font-medium text-neutral-600">
                {user.nim}
              </span>
            )}
          </div>

          <div className="flex flex-wrap items-center gap-x-2 gap-y-1 text-xs text-neutral-500">
            <span>{user.email}</span>
            {user.jurusan && (
              <>
                <span className="text-neutral-300">•</span>
                <span>{user.jurusan}</span>
              </>
            )}
          </div>
        </div>
      </div>

      <div className="flex items-center gap-2 pl-12 sm:pl-0">
        {isLoading ? (
          <div className="h-5 w-16 animate-pulse rounded bg-neutral-100" />
        ) : (
          <div className="flex flex-wrap gap-1">
            {roleLabels.map((code) => (
              <Badge
                key={code}
                variant="outline"
                className={`text-[10px] px-2 py-0.5 font-medium border-neutral-200 ${
                  code === 'ADMIN' || code.includes('_ADMIN')
                    ? 'bg-amber-50 text-amber-700 border-amber-200'
                    : 'bg-neutral-50 text-neutral-600'
                }`}
              >
                {code}
              </Badge>
            ))}
          </div>
        )}
        
        {/* Action Buttons */}
        <div className="flex items-center gap-1 ml-2">
          <button
            onClick={() => onView?.(user.id)}
            className="p-1.5 rounded-md hover:bg-neutral-100 text-neutral-400 hover:text-neutral-600 transition-colors"
            title="Lihat Detail"
          >
            <Eye className="h-4 w-4" />
          </button>
          <button
            onClick={() => onEdit?.(user.id)}
            className="p-1.5 rounded-md hover:bg-neutral-100 text-neutral-400 hover:text-blue-600 transition-colors"
            title="Edit"
          >
            <Pencil className="h-4 w-4" />
          </button>
          <button
            onClick={() => onDelete?.(user.id)}
            className="p-1.5 rounded-md hover:bg-red-50 text-neutral-400 hover:text-red-600 transition-colors"
            title="Hapus"
          >
            <Trash2 className="h-4 w-4" />
          </button>
        </div>
      </div>
    </div>
  )
}

// Create User Modal
function CreateUserModal({ 
  isOpen, 
  onClose, 
  onSuccess 
}: { 
  isOpen: boolean
  onClose: () => void
  onSuccess: () => void
}) {
  const [form, setForm] = useState<CreateUserPayload>({
    username: '',
    first_name: '',
    second_name: '',
    email: '',
    nim: '',
    jurusan: '',
    phone: '',
    alamat: '',
    tanggal_lahir: '',
    password: '',
  })
  const [errors, setErrors] = useState<Record<string, string>>({})

  const createMutation = useMutation({
    mutationFn: () => createUser(form),
    onSuccess: () => {
      toast.success('User berhasil dibuat')
      onSuccess()
      onClose()
      setForm({
        username: '',
        first_name: '',
        second_name: '',
        email: '',
        nim: '',
        jurusan: '',
        phone: '',
        alamat: '',
        tanggal_lahir: '',
        password: '',
      })
    },
    onError: (err: Error) => {
      toast.error(err.message || 'Gagal membuat user')
    },
  })

  const validate = () => {
    const newErrors: Record<string, string> = {}
    if (!form.username) newErrors.username = 'Username wajib diisi'
    if (!form.first_name) newErrors.first_name = 'Nama depan wajib diisi'
    if (!form.email) newErrors.email = 'Email wajib diisi'
    if (!form.password || form.password.length < 6) newErrors.password = 'Password minimal 6 karakter'
    setErrors(newErrors)
    return Object.keys(newErrors).length === 0
  }

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault()
    if (validate()) {
      createMutation.mutate()
    }
  }

  if (!isOpen) return null

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/50 p-4">
      <div className="bg-white rounded-2xl shadow-xl w-full max-w-lg max-h-[90vh] overflow-y-auto">
        <div className="sticky top-0 bg-white border-b border-neutral-200 px-6 py-4 flex items-center justify-between">
          <h2 className="text-lg font-bold text-neutral-900">Tambah User Baru</h2>
          <button onClick={onClose} className="p-2 hover:bg-neutral-100 rounded-lg">
            <X className="h-5 w-5 text-neutral-500" />
          </button>
        </div>
        
        <form onSubmit={handleSubmit} className="p-6 space-y-4">
          <div className="grid gap-4 sm:grid-cols-2">
            <div className="space-y-2">
              <Label>Username <span className="text-red-500">*</span></Label>
              <Input
                placeholder="johndoe"
                value={form.username}
                onChange={(e) => setForm({ ...form, username: e.target.value })}
                className={errors.username ? 'border-red-500' : ''}
              />
              {errors.username && <p className="text-xs text-red-600">{errors.username}</p>}
            </div>
            <div className="space-y-2">
              <Label>Email <span className="text-red-500">*</span></Label>
              <Input
                type="email"
                placeholder="john@example.com"
                value={form.email}
                onChange={(e) => setForm({ ...form, email: e.target.value })}
                className={errors.email ? 'border-red-500' : ''}
              />
              {errors.email && <p className="text-xs text-red-600">{errors.email}</p>}
            </div>
          </div>

          <div className="grid gap-4 sm:grid-cols-2">
            <div className="space-y-2">
              <Label>Nama Depan <span className="text-red-500">*</span></Label>
              <Input
                placeholder="John"
                value={form.first_name}
                onChange={(e) => setForm({ ...form, first_name: e.target.value })}
                className={errors.first_name ? 'border-red-500' : ''}
              />
              {errors.first_name && <p className="text-xs text-red-600">{errors.first_name}</p>}
            </div>
            <div className="space-y-2">
              <Label>Nama Belakang</Label>
              <Input
                placeholder="Doe"
                value={form.second_name}
                onChange={(e) => setForm({ ...form, second_name: e.target.value })}
              />
            </div>
          </div>

          <div className="grid gap-4 sm:grid-cols-2">
            <div className="space-y-2">
              <Label>NIM</Label>
              <Input
                placeholder="2012345678"
                value={form.nim}
                onChange={(e) => setForm({ ...form, nim: e.target.value })}
              />
            </div>
            <div className="space-y-2">
              <Label>Jurusan</Label>
              <Input
                placeholder="Teknik Informatika"
                value={form.jurusan}
                onChange={(e) => setForm({ ...form, jurusan: e.target.value })}
              />
            </div>
          </div>

          <div className="grid gap-4 sm:grid-cols-2">
            <div className="space-y-2">
              <Label>No. Telepon</Label>
              <Input
                placeholder="08123456789"
                value={form.phone}
                onChange={(e) => setForm({ ...form, phone: e.target.value })}
              />
            </div>
            <div className="space-y-2">
              <Label>Tanggal Lahir</Label>
              <Input
                type="date"
                value={form.tanggal_lahir}
                onChange={(e) => setForm({ ...form, tanggal_lahir: e.target.value })}
              />
            </div>
          </div>

          <div className="space-y-2">
            <Label>Alamat</Label>
            <Input
              placeholder="Jl. Contoh No. 123"
              value={form.alamat}
              onChange={(e) => setForm({ ...form, alamat: e.target.value })}
            />
          </div>

          <div className="space-y-2">
            <Label>Password <span className="text-red-500">*</span></Label>
            <Input
              type="password"
              placeholder="Minimal 6 karakter"
              value={form.password}
              onChange={(e) => setForm({ ...form, password: e.target.value })}
              className={errors.password ? 'border-red-500' : ''}
            />
            {errors.password && <p className="text-xs text-red-600">{errors.password}</p>}
          </div>

          <div className="flex justify-end gap-3 pt-4 border-t">
            <Button type="button" variant="outline" onClick={onClose}>
              Batal
            </Button>
            <Button type="submit" disabled={createMutation.isPending} className="bg-brand-600 hover:bg-brand-700">
              {createMutation.isPending ? <Spinner className="h-4 w-4 mr-2" /> : null}
              Simpan
            </Button>
          </div>
        </form>
      </div>
    </div>
  )
}

// View User Modal
function ViewUserModal({ 
  userId, 
  isOpen, 
  onClose,
  onEdit
}: { 
  userId: string | null
  isOpen: boolean
  onClose: () => void
  onEdit: (id: string) => void
}) {
  const { data: user, isLoading } = useQuery({
    queryKey: ['user', userId],
    queryFn: () => getUser(userId!),
    enabled: !!userId && isOpen,
  })

  const { data: roles } = useQuery<UserRoleAssignment[]>({
    queryKey: ['user-roles', userId],
    queryFn: () => listUserAssignments(userId!),
    enabled: !!userId && isOpen,
  })

  if (!isOpen) return null

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/50 p-4">
      <div className="bg-white rounded-2xl shadow-xl w-full max-w-lg">
        <div className="border-b border-neutral-200 px-6 py-4 flex items-center justify-between">
          <h2 className="text-lg font-bold text-neutral-900">Detail User</h2>
          <button onClick={onClose} className="p-2 hover:bg-neutral-100 rounded-lg">
            <X className="h-5 w-5 text-neutral-500" />
          </button>
        </div>
        
        {isLoading ? (
          <div className="p-12 flex justify-center">
            <Spinner size="lg" />
          </div>
        ) : user ? (
          <div className="p-6 space-y-6">
            <div className="flex items-center gap-4">
              <div className="w-16 h-16 rounded-full bg-brand-100 flex items-center justify-center text-brand-600 text-2xl font-bold">
                {user.first_name?.[0]?.toUpperCase() || user.username?.[0]?.toUpperCase()}
              </div>
              <div>
                <h3 className="text-xl font-bold text-neutral-900">
                  {user.first_name} {user.second_name || ''}
                </h3>
                <p className="text-neutral-500">@{user.username}</p>
              </div>
            </div>

            <div className="grid gap-4 sm:grid-cols-2">
              <div className="flex items-center gap-3 p-3 bg-neutral-50 rounded-lg">
                <Mail className="h-5 w-5 text-neutral-400" />
                <div>
                  <p className="text-xs text-neutral-500">Email</p>
                  <p className="text-sm font-medium">{user.email}</p>
                </div>
              </div>
              {user.phone && (
                <div className="flex items-center gap-3 p-3 bg-neutral-50 rounded-lg">
                  <Phone className="h-5 w-5 text-neutral-400" />
                  <div>
                    <p className="text-xs text-neutral-500">Telepon</p>
                    <p className="text-sm font-medium">{user.phone}</p>
                  </div>
                </div>
              )}
              {user.nim && (
                <div className="flex items-center gap-3 p-3 bg-neutral-50 rounded-lg">
                  <GraduationCap className="h-5 w-5 text-neutral-400" />
                  <div>
                    <p className="text-xs text-neutral-500">NIM</p>
                    <p className="text-sm font-medium">{user.nim}</p>
                  </div>
                </div>
              )}
              {user.jurusan && (
                <div className="flex items-center gap-3 p-3 bg-neutral-50 rounded-lg">
                  <Building2 className="h-5 w-5 text-neutral-400" />
                  <div>
                    <p className="text-xs text-neutral-500">Jurusan</p>
                    <p className="text-sm font-medium">{user.jurusan}</p>
                  </div>
                </div>
              )}
            </div>

            {roles && roles.length > 0 && (
              <div>
                <p className="text-sm font-medium text-neutral-700 mb-2">Roles</p>
                <div className="flex flex-wrap gap-2">
                  {roles.map((r) => (
                    <Badge key={r.id} variant="secondary" className="text-xs">
                      {r.role_code}
                    </Badge>
                  ))}
                </div>
              </div>
            )}

            <div className="flex justify-end gap-3 pt-4 border-t">
              <Button variant="outline" onClick={onClose}>
                Tutup
              </Button>
              <Button onClick={() => { onClose(); onEdit(userId!); }} className="bg-brand-600 hover:bg-brand-700">
                <Pencil className="h-4 w-4 mr-2" />
                Edit
              </Button>
            </div>
          </div>
        ) : (
          <div className="p-12 text-center text-neutral-500">User tidak ditemukan</div>
        )}
      </div>
    </div>
  )
}

// Edit User Modal
function EditUserModal({ 
  userId, 
  isOpen, 
  onClose,
  onSuccess
}: { 
  userId: string | null
  isOpen: boolean
  onClose: () => void
  onSuccess: () => void
}) {
  const { data: user, isLoading } = useQuery({
    queryKey: ['user', userId],
    queryFn: () => getUser(userId!),
    enabled: !!userId && isOpen,
  })

  const [form, setForm] = useState<UpdateUserPayload>({})
  
  // Populate form when user data loads
  useEffect(() => {
    if (user) {
      setForm({
        firstname: user.first_name || '',
        secondname: user.second_name || '',
        jurusan: user.jurusan || '',
        phone: user.phone || '',
        alamat: user.alamat || '',
      })
    }
  }, [user])

  const updateMutation = useMutation({
    mutationFn: () => updateUser(userId!, form),
    onSuccess: () => {
      toast.success('User berhasil diupdate')
      onSuccess()
      onClose()
    },
    onError: (err: Error) => {
      toast.error(err.message || 'Gagal mengupdate user')
    },
  })

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault()
    updateMutation.mutate()
  }

  if (!isOpen) return null

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/50 p-4">
      <div className="bg-white rounded-2xl shadow-xl w-full max-w-lg max-h-[90vh] overflow-y-auto">
        <div className="sticky top-0 bg-white border-b border-neutral-200 px-6 py-4 flex items-center justify-between">
          <h2 className="text-lg font-bold text-neutral-900">Edit User</h2>
          <button onClick={onClose} className="p-2 hover:bg-neutral-100 rounded-lg">
            <X className="h-5 w-5 text-neutral-500" />
          </button>
        </div>
        
        {isLoading ? (
          <div className="p-12 flex justify-center">
            <Spinner size="lg" />
          </div>
        ) : user ? (
          <form onSubmit={handleSubmit} className="p-6 space-y-4">
            <div className="flex items-center gap-4 p-4 bg-neutral-50 rounded-lg mb-4">
              <div className="w-12 h-12 rounded-full bg-brand-100 flex items-center justify-center text-brand-600 text-xl font-bold">
                {user.first_name?.[0]?.toUpperCase() || user.username?.[0]?.toUpperCase()}
              </div>
              <div>
                <p className="font-medium text-neutral-900">@{user.username}</p>
                <p className="text-sm text-neutral-500">{user.email}</p>
              </div>
            </div>

            <div className="grid gap-4 sm:grid-cols-2">
              <div className="space-y-2">
                <Label>Nama Depan</Label>
                <Input
                  placeholder="John"
                  value={form.firstname || ''}
                  onChange={(e) => setForm({ ...form, firstname: e.target.value })}
                />
              </div>
              <div className="space-y-2">
                <Label>Nama Belakang</Label>
                <Input
                  placeholder="Doe"
                  value={form.secondname || ''}
                  onChange={(e) => setForm({ ...form, secondname: e.target.value })}
                />
              </div>
            </div>

            <div className="space-y-2">
              <Label>Jurusan</Label>
              <Input
                placeholder="Teknik Informatika"
                value={form.jurusan || ''}
                onChange={(e) => setForm({ ...form, jurusan: e.target.value })}
              />
            </div>

            <div className="grid gap-4 sm:grid-cols-2">
              <div className="space-y-2">
                <Label>No. Telepon</Label>
                <Input
                  placeholder="08123456789"
                  value={form.phone || ''}
                  onChange={(e) => setForm({ ...form, phone: e.target.value })}
                />
              </div>
              <div className="space-y-2">
                <Label>Tanggal Lahir</Label>
                <Input
                  type="date"
                  value={form.tanggal_lahir || ''}
                  onChange={(e) => setForm({ ...form, tanggal_lahir: e.target.value })}
                />
              </div>
            </div>

            <div className="space-y-2">
              <Label>Alamat</Label>
              <Input
                placeholder="Jl. Contoh No. 123"
                value={form.alamat || ''}
                onChange={(e) => setForm({ ...form, alamat: e.target.value })}
              />
            </div>

            <div className="space-y-2">
              <Label>Password Baru (kosongkan jika tidak ingin mengubah)</Label>
              <Input
                type="password"
                placeholder="••••••••"
                value={form.password || ''}
                onChange={(e) => setForm({ ...form, password: e.target.value })}
              />
            </div>

            <div className="flex justify-end gap-3 pt-4 border-t">
              <Button type="button" variant="outline" onClick={onClose}>
                Batal
              </Button>
              <Button type="submit" disabled={updateMutation.isPending} className="bg-brand-600 hover:bg-brand-700">
                {updateMutation.isPending ? <Spinner className="h-4 w-4 mr-2" /> : null}
                Simpan Perubahan
              </Button>
            </div>
          </form>
        ) : (
          <div className="p-12 text-center text-neutral-500">User tidak ditemukan</div>
        )}
      </div>
    </div>
  )
}

// Delete Confirmation Modal
function DeleteUserModal({
  userId,
  userName,
  isOpen,
  onClose,
  onSuccess,
}: {
  userId: string | null
  userName: string
  isOpen: boolean
  onClose: () => void
  onSuccess: () => void
}) {
  const deleteMutation = useMutation({
    mutationFn: () => deleteUser(userId!),
    onSuccess: () => {
      toast.success('User berhasil dihapus')
      onSuccess()
      onClose()
    },
    onError: (err: Error) => {
      toast.error(err.message || 'Gagal menghapus user')
    },
  })

  if (!isOpen || !userId) return null

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/50 p-4">
      <div className="bg-white rounded-2xl shadow-xl w-full max-w-md p-6">
        <div className="text-center">
          <div className="w-16 h-16 mx-auto bg-red-100 rounded-full flex items-center justify-center mb-4">
            <Trash2 className="h-8 w-8 text-red-600" />
          </div>
          <h3 className="text-lg font-bold text-neutral-900 mb-2">Hapus User?</h3>
          <p className="text-neutral-500 text-sm">
            Anda yakin ingin menghapus user <strong>{userName}</strong>? Tindakan ini tidak dapat dibatalkan.
          </p>
        </div>
        <div className="flex justify-center gap-3 mt-6">
          <Button variant="outline" onClick={onClose}>
            Batal
          </Button>
          <Button 
            onClick={() => deleteMutation.mutate()} 
            disabled={deleteMutation.isPending}
            className="bg-red-600 hover:bg-red-700 text-white"
          >
            {deleteMutation.isPending ? <Spinner className="h-4 w-4 mr-2" /> : null}
            Hapus
          </Button>
        </div>
      </div>
    </div>
  )
}
