'use client'

import { useMemo, useState } from 'react'
import { useQuery, useInfiniteQuery } from '@tanstack/react-query'
import { Search, RotateCw, Users as UsersIcon, Filter } from 'lucide-react'

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
} from '@/components/ui'
import { Page } from '@/components/commons'
import {
  listUsers,
  listUserAssignments,
  type UserRoleAssignment,
  type User,
} from '@/lib/apis/user'
import { SkeletonTable } from '@/components/ui/skeleton/skeleton-table'
import { listOrganizations, type Organization } from '@/lib/apis/org'

export default function UsersPage() {
  const [search, setSearch] = useState('')
  const [orgFilterId, setOrgFilterId] = useState('')
  const [page, setPage] = useState(1)
  const pageSize = 20

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

  // Desktop: useQuery with pagination
  const { data, isLoading, isError, refetch, isFetching } = useQuery({
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
    [usersInfiniteQuery.data?.pages]
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
      <Page.Header breadcrumbs={[{ href: '/dashboard', children: 'Dashboard' }, { href: '/users', children: 'Pengguna' }]}>
        <div className="flex flex-col gap-4 md:flex-row md:items-center md:justify-between">
          <div>
            <h1 className="text-2xl font-bold tracking-tight text-neutral-900">
              Daftar Pengguna
            </h1>
            <p className="mt-1 text-sm text-neutral-500">
              Kelola data pengguna, hak akses, dan peran dalam sistem.
            </p>
          </div>
          <Button variant="outline" size="sm" className="gap-2" onClick={() => refetch()}>
            {isFetching ? <Spinner size="xs" /> : <RotateCw className="h-3.5 w-3.5" />}
            Muat ulang
          </Button>
        </div>
      </Page.Header>
      
      <Page.Body>
        <Container>
          <div className="grid gap-6">
            {/* Stats / Overview could go here if needed */}
            
            <Card className="border-neutral-200 shadow-sm">
              <CardHeader className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 pb-4">
                <div className="space-y-1">
                  <CardTitle className="text-sm sm:text-base font-semibold">Pengguna Terdaftar</CardTitle>
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
                    Gagal memuat daftar pengguna. Silakan coba lagi.
                  </div>
                ) : items.length === 0 ? (
                  <div className="flex flex-col items-center justify-center py-12 text-center">
                    <div className="flex h-12 w-12 items-center justify-center rounded-full bg-neutral-100">
                      <UsersIcon className="h-6 w-6 text-neutral-400" />
                    </div>
                    <p className="mt-3 text-sm font-medium text-neutral-900">Tidak ada pengguna ditemukan</p>
                    <p className="mt-1 text-xs text-neutral-500">Coba ubah kata kunci pencarian atau filter Anda.</p>
                  </div>
                ) : (
                  <>
                    {/* Desktop View */}
                    <div className="hidden sm:block space-y-4">
                      <div className="rounded-lg border border-neutral-200 divide-y divide-neutral-100">
                        {items.map((user) => (
                          <UserRow key={user.id} user={user} />
                        ))}
                      </div>
                      <div className="flex items-center justify-between border-t border-neutral-100 pt-4 mt-2">
                        <span className="text-xs text-neutral-500">
                          {totalText}
                        </span>
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
                          <UserRow key={user.id} user={user} />
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
    </Page>
  )
}

type UserWithRoles = User

function UserRow({ user }: { user: UserWithRoles }) {
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
              {user.first_name ? `${user.first_name} ${user.second_name || ''}` : user.username}
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
      </div>
    </div>
  )
}
