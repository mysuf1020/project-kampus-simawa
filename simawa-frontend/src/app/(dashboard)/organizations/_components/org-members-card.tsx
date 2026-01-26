'use client'

import { FormEvent, useState, useCallback } from 'react'
import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query'
import { Loader2, Mail, Trash2, UserPlus, Users, Pencil, ShieldX } from 'lucide-react'
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
  Label,
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
  Spinner,
} from '@/components/ui'
import {
  addOrgMember,
  deleteOrgMember,
  listOrgMembers,
  updateOrgMember,
  type OrgMember,
} from '@/lib/apis/member'
import { mentionUser } from '@/lib/apis/notification'
import { searchUsers, type UserSearchItem } from '@/lib/apis/user'
import { useRBAC } from '@/lib/providers/rbac-provider'
import { ROLE_ADMIN, ROLE_BEM_ADMIN } from '@/components/guards/role-guard'

// Organization member role options - moved to top for reuse
const ORG_ROLE_OPTIONS = [
  { value: 'ADMIN', label: 'Admin' },
  { value: 'KETUA', label: 'Ketua' },
  { value: 'WAKIL_KETUA', label: 'Wakil Ketua' },
  { value: 'SEKRETARIS', label: 'Sekretaris' },
  { value: 'BENDAHARA', label: 'Bendahara' },
  { value: 'ANGGOTA', label: 'Anggota' },
]

type Props = {
  orgId?: string
  orgName?: string
}

export function OrgMembersCard({ orgId, orgName }: Props) {
  const queryClient = useQueryClient()
  const { hasAnyRole } = useRBAC()
  const canManageRoles = hasAnyRole([ROLE_ADMIN, ROLE_BEM_ADMIN])

  const { data, isLoading, isError, refetch } = useQuery<OrgMember[]>({
    queryKey: ['org-members', orgId],
    queryFn: () => listOrgMembers(orgId as string),
    enabled: Boolean(orgId),
  })

  const { mutateAsync: addOrUpdate, isPending: isSaving } = useMutation({
    mutationFn: async ({
      action,
      userId,
      role,
    }: {
      action: 'add' | 'update'
      userId: string
      role: string
    }) => {
      if (!orgId) return false
      if (action === 'add') {
        return addOrgMember(orgId, userId, role)
      }
      return updateOrgMember(orgId, userId, role)
    },
    onSuccess: async () => {
      await queryClient.invalidateQueries({ queryKey: ['org-members', orgId] })
      toast.success('Data anggota organisasi tersimpan')
    },
    onError: () => {
      toast.error('Gagal menyimpan anggota organisasi')
    },
  })

  const { mutateAsync: removeMember, isPending: isDeleting } = useMutation({
    mutationFn: async (userId: string) => {
      if (!orgId) return false
      return deleteOrgMember(orgId, userId)
    },
    onSuccess: async () => {
      await queryClient.invalidateQueries({ queryKey: ['org-members', orgId] })
      toast.success('Anggota organisasi dihapus')
    },
    onError: () => {
      toast.error('Gagal menghapus anggota organisasi')
    },
  })

  const { mutateAsync: sendMention, isPending: isMentioning } = useMutation({
    mutationFn: async (member: OrgMember) =>
      mentionUser({
        user_id: member.user_id,
        title: 'Notifikasi dari SIMAWA',
        body: `Anda terdaftar sebagai anggota ${orgName || member.org_id}.`,
        data: { org_id: member.org_id },
      }),
    onSuccess: () => {
      toast.success('Notifikasi berhasil dikirim')
    },
    onError: () => {
      toast.error('Gagal mengirim notifikasi')
    },
  })

  const [userIdInput, setUserIdInput] = useState('')
  const [roleInput, setRoleInput] = useState('')
  const [userSearch, setUserSearch] = useState('')
  const [selectedUser, setSelectedUser] = useState<UserSearchItem | null>(null)

  const userSearchQuery = useQuery({
    queryKey: ['user-search', userSearch],
    queryFn: () => searchUsers({ q: userSearch, size: 10 }),
    enabled: Boolean(orgId) && userSearch.trim().length > 0,
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

  const handleSubmit = async (e: FormEvent, action: 'add' | 'update') => {
    e.preventDefault()
    if (!userIdInput || !roleInput) {
      toast.error('ID pengguna dan peran wajib diisi')
      return
    }
    await addOrUpdate({ action, userId: userIdInput, role: roleInput })
    setUserIdInput('')
    setRoleInput('')
    setUserSearch('')
    setSelectedUser(null)
  }

  return (
    <Card className="border-neutral-200 shadow-sm">
      <CardHeader className="flex flex-row items-center justify-between border-b border-neutral-100 bg-neutral-50/50 px-6 py-4">
        <div className="flex items-center gap-3">
          <div className="flex h-10 w-10 items-center justify-center rounded-lg bg-blue-50 text-blue-600">
            <Users className="h-5 w-5" />
          </div>
          <div>
            <CardTitle className="text-base font-semibold text-neutral-900">
              Anggota Organisasi
            </CardTitle>
            <CardDescription className="text-xs text-neutral-500">
              Kelola anggota dan hak akses organisasi.
            </CardDescription>
          </div>
        </div>
        <Badge
          variant="secondary"
          className="bg-white text-neutral-700 border-neutral-200"
        >
          {data?.length ?? 0} Anggota
        </Badge>
      </CardHeader>

      <CardContent className="p-6 space-y-6">
        {!orgId ? (
          <div className="flex items-center justify-center py-12 text-center text-sm text-neutral-500 bg-neutral-50 rounded-xl border border-dashed border-neutral-200">
            <p>Pilih organisasi terlebih dahulu untuk mengelola anggota.</p>
          </div>
        ) : (
          <>
            <form
              className="rounded-xl border border-neutral-200 bg-white p-4 space-y-4 shadow-sm"
              onSubmit={(e) => handleSubmit(e, 'add')}
            >
              <h4 className="text-sm font-medium text-neutral-900 flex items-center gap-2">
                <UserPlus className="h-4 w-4 text-brand-600" />
                Tambah Anggota Baru
              </h4>

              <div className="grid gap-4 sm:grid-cols-2">
                <div className="space-y-2">
                  <Label className="text-xs">Cari Pengguna</Label>
                  <AutoComplete
                    placeholder="Nama / Email / NIM..."
                    value={userIdInput}
                    options={userOptions}
                    isLoading={userSearchQuery.isFetching}
                    disabled={!orgId}
                    onSearch={(txt) => setUserSearch(txt)}
                    onSelect={(value, option) => {
                      setUserIdInput(value || '')
                      const picked = (option as { user?: UserSearchItem } | undefined)
                        ?.user
                      setSelectedUser(picked ?? null)
                    }}
                    customRender={(opt) => {
                      const u = (opt as { user?: UserSearchItem }).user
                      if (!u) return opt.label
                      return (
                        <div className="flex flex-col py-1">
                          <span className="text-sm font-medium text-neutral-900">
                            {u.username}
                          </span>
                          <span className="text-xs text-neutral-500">
                            {u.email}
                            {u.nim ? ` • NIM: ${u.nim}` : ''}
                          </span>
                        </div>
                      )
                    }}
                  />
                </div>
                <div className="space-y-2">
                  <Label className="text-xs">Peran / Role</Label>
                  <Select value={roleInput} onValueChange={setRoleInput}>
                    <SelectTrigger className="h-9">
                      <SelectValue placeholder="Pilih role">
                        {roleInput ? ORG_ROLE_OPTIONS.find(r => r.value === roleInput)?.label : 'Pilih role'}
                      </SelectValue>
                    </SelectTrigger>
                    <SelectContent>
                      {ORG_ROLE_OPTIONS.map((role) => (
                        <SelectItem key={role.value} value={role.value}>
                          {role.label}
                        </SelectItem>
                      ))}
                    </SelectContent>
                  </Select>
                </div>
              </div>

              <div className="flex gap-2 justify-end pt-2">
                <Button
                  type="button"
                  size="sm"
                  variant="outline"
                  disabled={isSaving}
                  onClick={(e) => handleSubmit(e as unknown as FormEvent, 'update')}
                  className="text-xs h-8"
                >
                  Update Role
                </Button>
                <Button
                  type="submit"
                  size="sm"
                  disabled={isSaving}
                  className="bg-brand-600 hover:bg-brand-700 text-white text-xs h-8 gap-1.5"
                >
                  {isSaving ? (
                    <Loader2 className="h-3.5 w-3.5 animate-spin" />
                  ) : (
                    <UserPlus className="h-3.5 w-3.5" />
                  )}
                  Tambah Anggota
                </Button>
              </div>
            </form>

            <div className="space-y-3">
              <h4 className="text-sm font-medium text-neutral-900">Daftar Anggota</h4>

              {isLoading ? (
                <div className="flex items-center justify-center py-8 text-xs text-neutral-500">
                  <Spinner size="sm" className="mr-2" /> Memuat daftar anggota...
                </div>
              ) : isError ? (
                <div className="p-4 rounded-lg bg-red-50 text-red-600 text-xs text-center border border-red-100">
                  Gagal memuat anggota organisasi.
                </div>
              ) : !data || data.length === 0 ? (
                <div className="text-center py-8 text-sm text-neutral-500 bg-neutral-50 rounded-lg border border-neutral-100">
                  Belum ada anggota terdaftar.
                </div>
              ) : (
                <div className="space-y-2">
                  {data.map((member) => (
                    <div
                      key={member.user_id}
                      className="group flex items-center justify-between rounded-lg border border-neutral-100 bg-white p-3 hover:border-brand-200 hover:shadow-sm transition-all"
                    >
                      <div className="flex items-center gap-3">
                        <div className="h-9 w-9 rounded-full bg-brand-50 flex items-center justify-center text-brand-600 text-xs font-bold border border-brand-100">
                          {(
                            member.user?.first_name ||
                            member.user?.username ||
                            member.user_id
                          )
                            .slice(0, 2)
                            .toUpperCase()}
                        </div>
                        <div>
                          <p className="text-sm font-medium text-neutral-900">
                            {member.user ? (
                              <>
                                {member.user.first_name} {member.user.second_name}
                                <span className="text-neutral-400 font-normal ml-1">
                                  (@{member.user.username})
                                </span>
                              </>
                            ) : (
                              member.user_id
                            )}
                          </p>
                          <div className="flex items-center gap-2 mt-0.5">
                            <MemberRoleSelect
                              member={member}
                              onUpdate={async (newRole: string) => {
                                await addOrUpdate({ action: 'update', userId: member.user_id, role: newRole })
                              }}
                              isSaving={isSaving}
                            />
                            {member.user?.email && (
                              <span className="text-xs text-neutral-400">
                                • {member.user.email}
                              </span>
                            )}
                          </div>
                        </div>
                      </div>

                      <div className="flex items-center gap-1 opacity-0 group-hover:opacity-100 transition-opacity">
                        <Button
                          size="icon"
                          variant="ghost"
                          className="h-8 w-8 text-neutral-500 hover:text-brand-600 hover:bg-brand-50"
                          disabled={isMentioning}
                          onClick={() => sendMention(member)}
                          title="Kirim Notifikasi"
                        >
                          {isMentioning ? (
                            <Loader2 className="h-4 w-4 animate-spin" />
                          ) : (
                            <Mail className="h-4 w-4" />
                          )}
                        </Button>
                        <Button
                          size="icon"
                          variant="ghost"
                          className="h-8 w-8 text-neutral-500 hover:text-red-600 hover:bg-red-50"
                          disabled={isDeleting}
                          onClick={() => removeMember(member.user_id)}
                          title="Hapus Anggota"
                        >
                          <Trash2 className="h-4 w-4" />
                        </Button>
                      </div>
                    </div>
                  ))}
                </div>
              )}
            </div>
          </>
        )}
      </CardContent>
    </Card>
  )
}

function MemberRoleSelect({
  member,
  onUpdate,
  isSaving,
}: {
  member: OrgMember
  onUpdate: (newRole: string) => Promise<void>
  isSaving: boolean
}) {
  const [isEditing, setIsEditing] = useState(false)
  const [selectedRole, setSelectedRole] = useState(member.role)

  const handleRoleChange = async (newRole: string) => {
    if (newRole === member.role) {
      setIsEditing(false)
      return
    }
    setSelectedRole(newRole)
    await onUpdate(newRole)
    setIsEditing(false)
  }

  if (!isEditing) {
    return (
      <button
        type="button"
        onClick={() => setIsEditing(true)}
        className="inline-flex items-center gap-1 text-[10px] font-normal bg-neutral-100 text-neutral-600 border border-neutral-200 px-1.5 py-0 h-5 rounded-md hover:bg-neutral-200 transition-colors"
        title="Klik untuk ubah role"
      >
        {ORG_ROLE_OPTIONS.find((r) => r.value === member.role)?.label || member.role}
        <Pencil className="h-2.5 w-2.5 opacity-50" />
      </button>
    )
  }

  return (
    <Select value={selectedRole} onValueChange={handleRoleChange} disabled={isSaving}>
      <SelectTrigger className="h-5 text-[10px] w-auto min-w-[100px] px-2 py-0">
        <SelectValue />
      </SelectTrigger>
      <SelectContent>
        {ORG_ROLE_OPTIONS.map((role) => (
          <SelectItem key={role.value} value={role.value} className="text-xs">
            {role.label}
          </SelectItem>
        ))}
      </SelectContent>
    </Select>
  )
}
