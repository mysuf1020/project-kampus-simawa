'use client'

import { useEffect, useMemo, useState } from 'react'
import { useQuery, useInfiniteQuery } from '@tanstack/react-query'
import {
  RefreshCcw,
  Mail,
  Send,
  Inbox,
  Clock,
  CheckCircle2,
  XCircle,
  FileText,
  Search,
  Filter,
  Calendar,
  Building2,
  User,
  Eye,
  Download,
  MoreHorizontal,
  ChevronRight,
  ArrowUpRight,
} from 'lucide-react'
import Link from 'next/link'

import {
  Badge,
  Button,
  Card,
  CardContent,
  CardHeader,
  CardTitle,
  Container,
  Input,
  Tabs,
  TabsContent,
  TabsList,
  TabsTrigger,
  Spinner,
} from '@/components/ui'
import { Page } from '@/components/commons'
import { listInboxSurat, listOutboxSurat, listArchiveSurat, downloadSurat, approveSurat, type Surat } from '@/lib/apis/surat'
import { listOrganizations } from '@/lib/apis/org'
import { SuratApprovalDialog } from '../surat/_components/approval-dialog'

type StatusType = 'PENDING' | 'APPROVED' | 'REJECTED' | 'DRAFT' | 'REVISION'

const statusConfig: Record<StatusType, { label: string; color: string; icon: React.ReactNode }> = {
  PENDING: {
    label: 'Menunggu',
    color: 'bg-amber-100 text-amber-700 border-amber-200',
    icon: <Clock className="w-3 h-3" />,
  },
  APPROVED: {
    label: 'Disetujui',
    color: 'bg-green-100 text-green-700 border-green-200',
    icon: <CheckCircle2 className="w-3 h-3" />,
  },
  REJECTED: {
    label: 'Ditolak',
    color: 'bg-red-100 text-red-700 border-red-200',
    icon: <XCircle className="w-3 h-3" />,
  },
  DRAFT: {
    label: 'Draft',
    color: 'bg-neutral-100 text-neutral-600 border-neutral-200',
    icon: <FileText className="w-3 h-3" />,
  },
  REVISION: {
    label: 'Revisi',
    color: 'bg-blue-100 text-blue-700 border-blue-200',
    icon: <RefreshCcw className="w-3 h-3" />,
  },
}

function StatusBadge({ status }: { status: string }) {
  const config = statusConfig[status as StatusType] || statusConfig.DRAFT
  return (
    <Badge variant="outline" className={`${config.color} gap-1 text-[10px] font-medium`}>
      {config.icon}
      {config.label}
    </Badge>
  )
}

function SuratCard({ surat, onView, onDownload }: { surat: Surat; onView?: () => void; onDownload?: () => void }) {
  const formattedDate = surat.created_at
    ? new Date(surat.created_at).toLocaleDateString('id-ID', {
        day: 'numeric',
        month: 'short',
        year: 'numeric',
      })
    : '-'

  return (
    <div className="group p-4 rounded-xl border border-neutral-200 bg-white hover:border-brand-200 hover:shadow-md transition-all">
      <div className="flex items-start justify-between gap-4">
        <div className="flex-1 min-w-0">
          <div className="flex items-center gap-2 mb-2">
            <StatusBadge status={surat.status} />
            {surat.number && (
              <span className="text-[10px] text-neutral-400 font-mono">{surat.number}</span>
            )}
          </div>
          <h4 className="font-semibold text-neutral-900 line-clamp-1 group-hover:text-brand-700 transition-colors">
            {surat.subject || 'Tanpa Perihal'}
          </h4>
          <div className="flex flex-wrap items-center gap-x-4 gap-y-1 mt-2 text-xs text-neutral-500">
            {surat.to_role && (
              <span className="flex items-center gap-1">
                <User className="w-3 h-3" />
                {surat.to_role}
              </span>
            )}
            {surat.to_name && (
              <span className="flex items-center gap-1">
                <span className="text-neutral-300">•</span>
                {surat.to_name}
              </span>
            )}
            <span className="flex items-center gap-1">
              <Calendar className="w-3 h-3" />
              {formattedDate}
            </span>
          </div>
        </div>
        <div className="flex items-center gap-1 opacity-0 group-hover:opacity-100 transition-opacity">
          {onView && (
            <Button variant="ghost" size="sm" onClick={onView} className="h-8 w-8 p-0">
              <Eye className="w-4 h-4 text-neutral-500" />
            </Button>
          )}
          {onDownload && (
            <Button variant="ghost" size="sm" onClick={onDownload} className="h-8 w-8 p-0">
              <Download className="w-4 h-4 text-neutral-500" />
            </Button>
          )}
        </div>
      </div>
    </div>
  )
}

function SuratDetailCard({ surat, orgs, onApprove }: { surat: Surat; orgs?: { id: string; name: string }[]; onApprove?: () => void }) {
  const [approvalAction, setApprovalAction] = useState<'approve' | 'reject' | 'revise' | null>(null)
  const orgName = orgs?.find((o) => o.id === surat.org_id)?.name || 'Organisasi'
  const targetOrgName = surat.target_org_id ? orgs?.find((o) => o.id === surat.target_org_id)?.name : null

  const formattedDate = surat.created_at
    ? new Date(surat.created_at).toLocaleDateString('id-ID', {
        weekday: 'long',
        day: 'numeric',
        month: 'long',
        year: 'numeric',
      })
    : '-'

  const handleDownload = async () => {
    try {
      const res = await downloadSurat(surat.id)
      if (res?.url) {
        window.open(res.url, '_blank')
      }
    } catch (err) {
      console.error('Download failed:', err)
    }
  }

  return (
    <>
      <Card className="border-neutral-200 overflow-hidden hover:shadow-lg transition-shadow">
        <div className="h-1 bg-gradient-to-r from-brand-500 to-brand-600" />
        <CardContent className="p-5">
          <div className="flex items-start justify-between gap-4 mb-4">
            <div className="flex-1 min-w-0">
              <div className="flex items-center gap-2 mb-2">
                <StatusBadge status={surat.status} />
                {surat.variant && (
                  <Badge variant="outline" className="text-[10px] bg-neutral-50">
                    {surat.variant}
                  </Badge>
                )}
              </div>
              <h3 className="text-lg font-bold text-neutral-900 line-clamp-2">
                {surat.subject || 'Tanpa Perihal'}
              </h3>
            </div>
          </div>

          <div className="space-y-3 text-sm">
            {surat.number && (
              <div className="flex items-center gap-3">
                <span className="text-neutral-400 w-20 flex-shrink-0">Nomor</span>
                <span className="font-mono text-neutral-700">{surat.number}</span>
              </div>
            )}
            <div className="flex items-center gap-3">
              <span className="text-neutral-400 w-20 flex-shrink-0">Dari</span>
              <span className="font-medium text-neutral-700 flex items-center gap-1.5">
                <Building2 className="w-3.5 h-3.5 text-neutral-400" />
                {orgName}
              </span>
            </div>
            {targetOrgName && (
              <div className="flex items-center gap-3">
                <span className="text-neutral-400 w-20 flex-shrink-0">Tujuan</span>
                <span className="font-medium text-neutral-700 flex items-center gap-1.5">
                  <Building2 className="w-3.5 h-3.5 text-brand-400" />
                  {targetOrgName}
                </span>
              </div>
            )}
            {(surat.to_role || surat.to_name) && (
              <div className="flex items-center gap-3">
                <span className="text-neutral-400 w-20 flex-shrink-0">Kepada</span>
                <span className="text-neutral-700">
                  {surat.to_role}
                  {surat.to_name && ` - ${surat.to_name}`}
                </span>
              </div>
            )}
            <div className="flex items-center gap-3">
              <span className="text-neutral-400 w-20 flex-shrink-0">Tanggal</span>
              <span className="text-neutral-700">{formattedDate}</span>
            </div>
            {surat.approval_note && (
              <div className="mt-3 p-3 rounded-lg bg-neutral-50 border border-neutral-100">
                <p className="text-xs text-neutral-500 mb-1">Catatan:</p>
                <p className="text-sm text-neutral-700">{surat.approval_note}</p>
              </div>
            )}
          </div>

          <div className="flex items-center gap-2 mt-5 pt-4 border-t border-neutral-100">
            <Button
              variant="outline"
              size="sm"
              onClick={handleDownload}
              className="gap-2"
            >
              <Download className="w-4 h-4" />
              Download
            </Button>
            {surat.status === 'PENDING' && (
              <>
                <Button
                  size="sm"
                  onClick={() => setApprovalAction('approve')}
                  className="flex-1 bg-green-600 hover:bg-green-700 text-white gap-1.5 text-xs"
                >
                  <CheckCircle2 className="w-3.5 h-3.5" />
                  Setujui
                </Button>
                <Button
                  size="sm"
                  variant="outline"
                  onClick={() => setApprovalAction('reject')}
                  className="flex-1 border-red-200 text-red-600 hover:bg-red-50 hover:text-red-700 gap-1.5 text-xs"
                >
                  <XCircle className="w-3.5 h-3.5" />
                  Tolak
                </Button>
                <Button
                  size="sm"
                  variant="outline"
                  onClick={() => setApprovalAction('revise')}
                  className="flex-1 border-blue-200 text-blue-600 hover:bg-blue-50 hover:text-blue-700 gap-1.5 text-xs"
                >
                  <RefreshCcw className="w-3.5 h-3.5" />
                  Revisi
                </Button>
              </>
            )}
          </div>
        </CardContent>
      </Card>

      {approvalAction && (
        <SuratApprovalDialog
          suratId={surat.id}
          open={!!approvalAction}
          onOpenChange={(open) => {
            if (!open) {
              setApprovalAction(null)
              onApprove?.()
            }
          }}
          action={approvalAction}
        />
      )}
    </>
  )
}

export default function ArsipPage() {
  const [orgId, setOrgId] = useState('')
  const [activeTab, setActiveTab] = useState('inbox')
  const [searchQuery, setSearchQuery] = useState('')
  const [statusFilter, setStatusFilter] = useState('')

  const { data: orgs } = useQuery({ queryKey: ['orgs'], queryFn: listOrganizations })

  useEffect(() => {
    if (!orgId && orgs?.length) setOrgId(orgs[0].id)
  }, [orgId, orgs])

  const inboxQuery = useQuery({
    queryKey: ['surat-inbox'],
    queryFn: () => listInboxSurat(),
  })

  const outboxQuery = useQuery({
    queryKey: ['surat-outbox', orgId],
    queryFn: () => listOutboxSurat(orgId, { page: '1', size: '50' }),
    enabled: Boolean(orgId),
  })

  const archiveQuery = useQuery({
    queryKey: ['surat-archive'],
    queryFn: () => listArchiveSurat({ page: '1', size: '50' }),
  })

  const filterSurat = (items: Surat[] | undefined) => {
    if (!items) return []
    return items.filter((item) => {
      const matchesSearch =
        !searchQuery ||
        item.subject?.toLowerCase().includes(searchQuery.toLowerCase()) ||
        item.number?.toLowerCase().includes(searchQuery.toLowerCase()) ||
        item.to_role?.toLowerCase().includes(searchQuery.toLowerCase())
      const matchesStatus = !statusFilter || item.status === statusFilter
      return matchesSearch && matchesStatus
    })
  }

  const filteredInbox = filterSurat(inboxQuery.data)
  const filteredOutbox = filterSurat(outboxQuery.data)
  const filteredArchive = filterSurat(archiveQuery.data)

  const pendingCount = (inboxQuery.data || []).filter((s) => s.status === 'PENDING').length
  const approvedCount = (archiveQuery.data || []).filter((s) => s.status === 'APPROVED').length

  const refetchAll = () => {
    inboxQuery.refetch()
    outboxQuery.refetch()
    archiveQuery.refetch()
  }

  return (
    <Page>
      <Page.Header
        breadcrumbs={[
          { href: '/dashboard', children: 'Dashboard' },
          { href: '/arsip', children: 'Arsip Surat' },
        ]}
      >
        <div className="flex flex-col gap-4 md:flex-row md:items-center md:justify-between">
          <div>
            <h1 className="text-2xl font-bold tracking-tight text-neutral-900">
              Arsip Surat
            </h1>
            <p className="mt-1 text-sm text-neutral-500">
              Kelola surat masuk, riwayat surat keluar, dan arsip dokumen.
            </p>
          </div>
          <div className="flex items-center gap-2">
            <Link href="/surat/create">
              <Button size="sm" className="bg-brand-600 hover:bg-brand-700 text-white gap-2">
                <FileText className="h-4 w-4" /> Buat Surat
              </Button>
            </Link>
            <Button variant="outline" size="sm" onClick={refetchAll} className="gap-2">
              <RefreshCcw className="h-3.5 w-3.5" />
            </Button>
          </div>
        </div>
      </Page.Header>

      <Page.Body>
        <Container>
          {/* Stats Cards */}
          <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-4 mb-6">
            <Card className="border-neutral-200">
              <CardContent className="p-4 flex items-center gap-4">
                <div className="w-12 h-12 rounded-xl bg-amber-100 flex items-center justify-center">
                  <Clock className="w-6 h-6 text-amber-600" />
                </div>
                <div>
                  <p className="text-2xl font-bold text-neutral-900">{pendingCount}</p>
                  <p className="text-xs text-neutral-500">Menunggu Persetujuan</p>
                </div>
              </CardContent>
            </Card>
            <Card className="border-neutral-200">
              <CardContent className="p-4 flex items-center gap-4">
                <div className="w-12 h-12 rounded-xl bg-green-100 flex items-center justify-center">
                  <CheckCircle2 className="w-6 h-6 text-green-600" />
                </div>
                <div>
                  <p className="text-2xl font-bold text-neutral-900">{approvedCount}</p>
                  <p className="text-xs text-neutral-500">Surat Disetujui</p>
                </div>
              </CardContent>
            </Card>
            <Card className="border-neutral-200">
              <CardContent className="p-4 flex items-center gap-4">
                <div className="w-12 h-12 rounded-xl bg-blue-100 flex items-center justify-center">
                  <Inbox className="w-6 h-6 text-blue-600" />
                </div>
                <div>
                  <p className="text-2xl font-bold text-neutral-900">{inboxQuery.data?.length || 0}</p>
                  <p className="text-xs text-neutral-500">Total Surat Masuk</p>
                </div>
              </CardContent>
            </Card>
            <Card className="border-neutral-200">
              <CardContent className="p-4 flex items-center gap-4">
                <div className="w-12 h-12 rounded-xl bg-brand-100 flex items-center justify-center">
                  <Send className="w-6 h-6 text-brand-600" />
                </div>
                <div>
                  <p className="text-2xl font-bold text-neutral-900">{outboxQuery.data?.length || 0}</p>
                  <p className="text-xs text-neutral-500">Total Surat Keluar</p>
                </div>
              </CardContent>
            </Card>
          </div>

          {/* Filters */}
          <Card className="border-neutral-200 mb-6">
            <CardContent className="p-4">
              <div className="flex flex-col sm:flex-row gap-4">
                <div className="flex-1 relative">
                  <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-neutral-400" />
                  <Input
                    placeholder="Cari berdasarkan perihal, nomor, atau penerima..."
                    value={searchQuery}
                    onChange={(e) => setSearchQuery(e.target.value)}
                    className="pl-10"
                  />
                </div>
                <div className="flex gap-2">
                  <select
                    value={orgId}
                    onChange={(e) => setOrgId(e.target.value)}
                    className="px-3 py-2 rounded-lg border border-neutral-200 text-sm bg-white focus:border-brand-500 focus:ring-2 focus:ring-brand-500/20 outline-none"
                  >
                    {(orgs || []).map((org) => (
                      <option key={org.id} value={org.id}>
                        {org.name}
                      </option>
                    ))}
                  </select>
                  <select
                    value={statusFilter}
                    onChange={(e) => setStatusFilter(e.target.value)}
                    className="px-3 py-2 rounded-lg border border-neutral-200 text-sm bg-white focus:border-brand-500 focus:ring-2 focus:ring-brand-500/20 outline-none"
                  >
                    <option value="">Semua Status</option>
                    <option value="PENDING">Menunggu</option>
                    <option value="APPROVED">Disetujui</option>
                    <option value="REJECTED">Ditolak</option>
                    <option value="DRAFT">Draft</option>
                    <option value="REVISION">Revisi</option>
                  </select>
                </div>
              </div>
            </CardContent>
          </Card>

          {/* Tabs */}
          <Tabs value={activeTab} onValueChange={setActiveTab} className="space-y-6">
            <TabsList className="w-full flex-wrap h-auto gap-1 p-1 bg-neutral-100/50 border border-neutral-200">
              <TabsTrigger
                value="inbox"
                className="flex-1 min-w-[100px] gap-2 text-sm data-[state=active]:bg-white data-[state=active]:shadow-sm"
              >
                <Inbox className="w-4 h-4" />
                Surat Masuk
                {pendingCount > 0 && (
                  <Badge className="bg-amber-100 text-amber-700 border-none text-[10px]">
                    {pendingCount}
                  </Badge>
                )}
              </TabsTrigger>
              <TabsTrigger
                value="outbox"
                className="flex-1 min-w-[100px] gap-2 text-sm data-[state=active]:bg-white data-[state=active]:shadow-sm"
              >
                <Send className="w-4 h-4" />
                Surat Keluar
              </TabsTrigger>
              <TabsTrigger
                value="archive"
                className="flex-1 min-w-[100px] gap-2 text-sm data-[state=active]:bg-white data-[state=active]:shadow-sm"
              >
                <FileText className="w-4 h-4" />
                Semua Arsip
              </TabsTrigger>
            </TabsList>

            <TabsContent value="inbox" className="animate-in fade-in-50 duration-300">
              {inboxQuery.isLoading ? (
                <div className="flex items-center justify-center py-12">
                  <Spinner size="lg" />
                </div>
              ) : filteredInbox.length === 0 ? (
                <Card className="border-dashed border-neutral-300 bg-neutral-50/50">
                  <CardContent className="py-12 text-center">
                    <Inbox className="w-12 h-12 mx-auto text-neutral-300 mb-4" />
                    <p className="text-neutral-500">Tidak ada surat masuk</p>
                  </CardContent>
                </Card>
              ) : (
                <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-3">
                  {filteredInbox.map((surat) => (
                    <SuratDetailCard
                      key={surat.id}
                      surat={surat}
                      orgs={orgs}
                      onApprove={refetchAll}
                    />
                  ))}
                </div>
              )}
            </TabsContent>

            <TabsContent value="outbox" className="animate-in fade-in-50 duration-300">
              {outboxQuery.isLoading ? (
                <div className="flex items-center justify-center py-12">
                  <Spinner size="lg" />
                </div>
              ) : filteredOutbox.length === 0 ? (
                <Card className="border-dashed border-neutral-300 bg-neutral-50/50">
                  <CardContent className="py-12 text-center">
                    <Send className="w-12 h-12 mx-auto text-neutral-300 mb-4" />
                    <p className="text-neutral-500">Tidak ada surat keluar</p>
                  </CardContent>
                </Card>
              ) : (
                <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-3">
                  {filteredOutbox.map((surat) => (
                    <SuratDetailCard
                      key={surat.id}
                      surat={surat}
                      orgs={orgs}
                      onApprove={refetchAll}
                    />
                  ))}
                </div>
              )}
            </TabsContent>

            <TabsContent value="archive" className="animate-in fade-in-50 duration-300">
              {archiveQuery.isLoading ? (
                <div className="flex items-center justify-center py-12">
                  <Spinner size="lg" />
                </div>
              ) : filteredArchive.length === 0 ? (
                <Card className="border-dashed border-neutral-300 bg-neutral-50/50">
                  <CardContent className="py-12 text-center">
                    <FileText className="w-12 h-12 mx-auto text-neutral-300 mb-4" />
                    <p className="text-neutral-500">Tidak ada arsip surat</p>
                  </CardContent>
                </Card>
              ) : (
                <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-3">
                  {filteredArchive.map((surat) => (
                    <SuratDetailCard
                      key={surat.id}
                      surat={surat}
                      orgs={orgs}
                      onApprove={refetchAll}
                    />
                  ))}
                </div>
              )}
            </TabsContent>
          </Tabs>
        </Container>
      </Page.Body>
    </Page>
  )
}
