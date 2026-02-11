'use client'

import { useQuery } from '@tanstack/react-query'
import { Users, Crown, User, Briefcase, Wallet, FileText } from 'lucide-react'

import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
  Spinner,
} from '@/components/ui'
import { listOrgMembers, type OrgMember } from '@/lib/apis/member'

type Props = {
  orgId?: string
  orgName?: string
}

// Role hierarchy for organization chart
const ROLE_HIERARCHY = [
  { role: 'KETUA', label: 'Ketua', icon: Crown, color: 'bg-amber-500', level: 1 },
  { role: 'WAKIL_KETUA', label: 'Wakil Ketua', icon: User, color: 'bg-amber-400', level: 2 },
  { role: 'SEKRETARIS', label: 'Sekretaris', icon: FileText, color: 'bg-blue-500', level: 3 },
  { role: 'BENDAHARA', label: 'Bendahara', icon: Wallet, color: 'bg-green-500', level: 3 },
  { role: 'ADMIN', label: 'Admin', icon: Briefcase, color: 'bg-purple-500', level: 3 },
  { role: 'ANGGOTA', label: 'Anggota', icon: Users, color: 'bg-neutral-400', level: 4 },
]

function getRoleConfig(role: string) {
  return ROLE_HIERARCHY.find((r) => r.role === role) || {
    role,
    label: role,
    icon: User,
    color: 'bg-neutral-400',
    level: 4,
  }
}

function MemberNode({ member }: { member: OrgMember }) {
  const config = getRoleConfig(member.role)
  const Icon = config.icon

  return (
    <div className="flex flex-col items-center">
      <div
        className={`w-16 h-16 rounded-full ${config.color} flex items-center justify-center text-white shadow-lg`}
      >
        {member.user?.first_name ? (
          <span className="text-lg font-bold">
            {member.user.first_name.charAt(0)}
            {member.user.second_name?.charAt(0) || ''}
          </span>
        ) : (
          <Icon className="h-6 w-6" />
        )}
      </div>
      <div className="mt-2 text-center">
        <p className="text-sm font-semibold text-neutral-900 max-w-[120px] truncate">
          {member.user
            ? `${member.user.first_name} ${member.user.second_name || ''}`
            : 'Unknown'}
        </p>
        <p className="text-xs text-neutral-500">{config.label}</p>
        {member.user?.nim && (
          <p className="text-[10px] text-neutral-400">NIM: {member.user.nim}</p>
        )}
      </div>
    </div>
  )
}

export function OrgChartCard({ orgId, orgName }: Props) {
  const { data, isLoading, isError } = useQuery<OrgMember[]>({
    queryKey: ['org-members', orgId],
    queryFn: () => listOrgMembers(orgId as string),
    enabled: Boolean(orgId),
  })

  // Group members by role level
  const groupedMembers = data?.reduce(
    (acc, member) => {
      const config = getRoleConfig(member.role)
      if (!acc[config.level]) {
        acc[config.level] = []
      }
      acc[config.level].push(member)
      return acc
    },
    {} as Record<number, OrgMember[]>
  )

  // Sort members within each level by role order
  const sortedLevels = groupedMembers
    ? Object.entries(groupedMembers)
        .sort(([a], [b]) => Number(a) - Number(b))
        .map(([level, members]) => ({
          level: Number(level),
          members: members.sort((a, b) => {
            const aIndex = ROLE_HIERARCHY.findIndex((r) => r.role === a.role)
            const bIndex = ROLE_HIERARCHY.findIndex((r) => r.role === b.role)
            return aIndex - bIndex
          }),
        }))
    : []

  return (
    <Card className="border-neutral-200 shadow-sm">
      <CardHeader className="flex flex-row items-center justify-between border-b border-neutral-100 bg-neutral-50/50 px-6 py-4">
        <div className="flex items-center gap-3">
          <div className="flex h-10 w-10 items-center justify-center rounded-lg bg-indigo-50 text-indigo-600">
            <Users className="h-5 w-5" />
          </div>
          <div>
            <CardTitle className="text-base font-semibold text-neutral-900">
              Struktur Organisasi
            </CardTitle>
            <CardDescription className="text-xs text-neutral-500">
              Bagan struktur kepengurusan {orgName || 'organisasi'}.
            </CardDescription>
          </div>
        </div>
      </CardHeader>

      <CardContent className="p-6">
        {!orgId ? (
          <div className="flex items-center justify-center py-12 text-center text-sm text-neutral-500 bg-neutral-50 rounded-xl border border-dashed border-neutral-200">
            <p>Pilih organisasi terlebih dahulu untuk melihat struktur.</p>
          </div>
        ) : isLoading ? (
          <div className="flex items-center justify-center py-12 text-xs text-neutral-500">
            <Spinner size="sm" className="mr-2" /> Memuat struktur organisasi...
          </div>
        ) : isError ? (
          <div className="p-4 rounded-lg bg-red-50 text-red-600 text-xs text-center border border-red-100">
            Gagal memuat struktur organisasi.
          </div>
        ) : !data || data.length === 0 ? (
          <div className="text-center py-12 text-sm text-neutral-500 bg-neutral-50 rounded-lg border border-neutral-100">
            Belum ada anggota terdaftar.
          </div>
        ) : (
          <div className="flex flex-col items-center py-4">
            {sortedLevels.map(({ level, members }, idx) => (
              <div key={level} className="flex flex-col items-center w-full">
                {/* Vertical connector line between levels */}
                {idx > 0 && (
                  <div className="w-px h-8 bg-neutral-200" />
                )}

                {/* Members at this level */}
                <div className="flex flex-wrap justify-center gap-6">
                  {members.map((member) => (
                    <MemberNode key={member.user_id} member={member} />
                  ))}
                </div>
              </div>
            ))}

            {/* Legend */}
            <div className="mt-8 pt-6 border-t border-neutral-100">
              <p className="text-xs text-neutral-500 mb-3 font-medium">Keterangan:</p>
              <div className="flex flex-wrap gap-3">
                {ROLE_HIERARCHY.map((role) => {
                  const Icon = role.icon
                  return (
                    <div key={role.role} className="flex items-center gap-1.5">
                      <div
                        className={`w-4 h-4 rounded-full ${role.color} flex items-center justify-center`}
                      >
                        <Icon className="h-2.5 w-2.5 text-white" />
                      </div>
                      <span className="text-xs text-neutral-600">{role.label}</span>
                    </div>
                  )
                })}
              </div>
            </div>
          </div>
        )}
      </CardContent>
    </Card>
  )
}
