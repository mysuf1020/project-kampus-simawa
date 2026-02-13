'use client'

import { useEffect, useMemo, useState } from 'react'
import { useRouter } from 'next/navigation'
import { useMutation, useQuery } from '@tanstack/react-query'
import {
  ArrowLeft,
  Package,
  Plus,
  Trash2,
  SendHorizonal,
  Box,
} from 'lucide-react'
import { toast } from 'sonner'

import {
  Button,
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
  Container,
  Input,
  Label,
  Spinner,
  TextArea,
} from '@/components/ui'
import { Page } from '@/components/commons'
import { listOrganizations } from '@/lib/apis/org'
import { useRBAC } from '@/lib/providers/rbac-provider'
import { ADMIN_ROLES } from '@/components/guards/role-guard'
import { listAssets } from '@/lib/apis/asset'
import { createSurat, submitSurat, type CreateSuratPayload } from '@/lib/apis/surat'

export default function SuratPeminjamanPage() {
  const router = useRouter()
  const { hasAnyRole } = useRBAC()
  const isAdmin = hasAnyRole(ADMIN_ROLES)

  const [orgId, setOrgId] = useState('')
  const [selectedAssets, setSelectedAssets] = useState<
    { assetId: number; quantity: number }[]
  >([])
  const [borrowDate, setBorrowDate] = useState('')
  const [returnDate, setReturnDate] = useState('')
  const [note, setNote] = useState('')
  const [subject, setSubject] = useState('')
  const [toRole, setToRole] = useState('')
  const [toName, setToName] = useState('')

  const { data: orgs } = useQuery({
    queryKey: ['orgs'],
    queryFn: listOrganizations,
  })

  const { data: assets, isLoading: assetsLoading } = useQuery({
    queryKey: ['assets', orgId],
    queryFn: () => listAssets(orgId),
    enabled: !!orgId,
  })

  const filteredOrgs = useMemo(
    () => (!orgs ? [] : isAdmin ? orgs : orgs.filter((o) => o.can_manage)),
    [orgs, isAdmin],
  )

  useEffect(() => {
    if (!orgId && filteredOrgs.length) {
      setOrgId(filteredOrgs[0].id)
    }
  }, [orgId, filteredOrgs])

  const availableAssets = useMemo(
    () => assets?.filter((a) => a.status === 'AVAILABLE') ?? [],
    [assets],
  )

  const suratMutation = useMutation({
    mutationFn: async () => {
      if (!orgId || !borrowDate || !returnDate) {
        throw new Error('Lengkapi semua field wajib')
      }

      const assetNames = selectedAssets
        .map((sa) => {
          const asset = assets?.find((a) => a.id === sa.assetId)
          return asset ? `${asset.name} (${sa.quantity}x)` : ''
        })
        .filter(Boolean)
        .join(', ')

      const itemList = assetNames || 'sesuai lampiran'

      const suratPayload: CreateSuratPayload = {
        org_id: orgId,
        status: 'DRAFT',
        payload: {
          variant: 'PEMINJAMAN',
          created_at: new Date().toISOString(),
          meta: {
            number: '',
            subject: subject || `Permohonan Peminjaman Aset`,
            to_role: toRole,
            to_name: toName,
            to_place: '',
            to_city: '',
            place_and_date: '',
            lampiran: '',
          },
          body_opening: `Dengan hormat,\n\nDengan ini kami mengajukan permohonan peminjaman aset sebagai berikut:`,
          body_content: [
            `Aset yang dipinjam: ${itemList}.`,
            `Tanggal peminjaman: ${borrowDate} s/d ${returnDate}.`,
            note ? `Keterangan: ${note}` : '',
          ].filter(Boolean),
          body_closing:
            'Demikian surat permohonan ini kami sampaikan. Atas perhatian dan kerjasamanya, kami ucapkan terima kasih.',
          footer: '',
          signs: [],
          tembusan: [],
        },
      }

      const surat = await createSurat(suratPayload)
      if (surat?.id) {
        await submitSurat(surat.id)
      }
      return surat
    },
    onSuccess: () => {
      toast.success('Surat peminjaman berhasil dibuat dan dikirim')
      setSelectedAssets([])
      setBorrowDate('')
      setReturnDate('')
      setNote('')
      setSubject('')
      setToRole('')
      setToName('')
    },
    onError: (err: Error) => {
      toast.error(err.message || 'Gagal membuat surat peminjaman')
    },
  })

  const addAsset = (assetId: number) => {
    if (selectedAssets.find((sa) => sa.assetId === assetId)) return
    setSelectedAssets((prev) => [...prev, { assetId, quantity: 1 }])
  }

  const removeAsset = (assetId: number) => {
    setSelectedAssets((prev) => prev.filter((sa) => sa.assetId !== assetId))
  }

  const updateQuantity = (assetId: number, quantity: number) => {
    setSelectedAssets((prev) =>
      prev.map((sa) => (sa.assetId === assetId ? { ...sa, quantity: Math.max(1, quantity) } : sa)),
    )
  }

  return (
    <Page>
      <Page.Header
        breadcrumbs={[
          { href: '/dashboard', children: 'Dashboard' },
          { href: '/surat', children: 'Surat' },
          { href: '/surat/peminjaman', children: 'Surat Peminjaman' },
        ]}
      >
        <div className="flex flex-col gap-4 md:flex-row md:items-center md:justify-between">
          <div className="flex items-center gap-3">
            <button
              onClick={() => router.push('/surat')}
              className="p-2 -ml-2 rounded-lg hover:bg-neutral-100 transition-colors"
            >
              <ArrowLeft className="w-5 h-5 text-neutral-600" />
            </button>
            <div>
              <h1 className="text-2xl font-bold tracking-tight text-neutral-900">
                Surat Peminjaman
              </h1>
              <p className="mt-1 text-sm text-neutral-500">
                Buat surat resmi permohonan peminjaman aset.
              </p>
            </div>
          </div>
          <Button
            variant="outline"
            size="sm"
            onClick={() => router.push('/assets')}
            className="gap-2"
          >
            <Package className="h-4 w-4" /> Kelola Aset
          </Button>
        </div>
      </Page.Header>

      <Page.Body>
        <Container>
          <div className="max-w-4xl mx-auto space-y-6">
            {/* Org Picker */}
            <div className="space-y-2">
              <Label className="text-sm font-medium text-neutral-700">
                Organisasi <span className="text-red-500">*</span>
              </Label>
              <select
                className="w-full h-10 rounded-lg border border-neutral-200 bg-white px-3 text-sm outline-none focus:border-brand-500 focus:ring-2 focus:ring-brand-500/20 transition-all"
                value={orgId}
                onChange={(e) => {
                  setOrgId(e.target.value)
                  setSelectedAssets([])
                }}
              >
                {filteredOrgs.map((org) => (
                  <option key={org.id} value={org.id}>
                    {org.name}
                  </option>
                ))}
              </select>
            </div>

            <div className="grid gap-6 lg:grid-cols-2">
              {/* Left: Asset Reference (optional) */}
              <Card className="border-neutral-200 shadow-sm">
                <CardHeader className="pb-3">
                  <CardTitle className="text-base">Referensi Aset</CardTitle>
                  <CardDescription className="text-xs">
                    Opsional — pilih aset yang akan dicantumkan di surat.
                  </CardDescription>
                </CardHeader>
                <CardContent className="space-y-3">
                  {assetsLoading && (
                    <div className="flex items-center gap-2 text-sm text-neutral-500">
                      <Spinner size="sm" /> Memuat aset...
                    </div>
                  )}
                  {!assetsLoading && availableAssets.length === 0 && (
                    <div className="text-center py-8 text-neutral-400">
                      <Box className="h-10 w-10 mx-auto mb-2 opacity-50" />
                      <p className="text-sm">Tidak ada aset tersedia.</p>
                      <Button
                        variant="link"
                        size="sm"
                        onClick={() => router.push('/assets')}
                        className="mt-2 text-brand-600"
                      >
                        Kelola aset di halaman Manajemen Aset
                      </Button>
                    </div>
                  )}
                  {availableAssets.map((asset) => {
                    const isSelected = selectedAssets.some(
                      (sa) => sa.assetId === asset.id,
                    )
                    return (
                      <div
                        key={asset.id}
                        className={`flex items-center justify-between p-3 rounded-lg border transition-colors ${
                          isSelected
                            ? 'border-brand-300 bg-brand-50/50'
                            : 'border-neutral-200 hover:border-neutral-300'
                        }`}
                      >
                        <div className="flex-1 min-w-0">
                          <p className="text-sm font-medium text-neutral-900 truncate">
                            {asset.name}
                          </p>
                          {asset.description && (
                            <p className="text-xs text-neutral-500 truncate">
                              {asset.description}
                            </p>
                          )}
                          <p className="text-[10px] text-neutral-400 mt-0.5">
                            Stok: {asset.quantity}
                          </p>
                        </div>
                        {isSelected ? (
                          <Button
                            variant="ghost"
                            size="sm"
                            onClick={() => removeAsset(asset.id)}
                            className="text-red-500 hover:text-red-700 h-8"
                          >
                            <Trash2 className="h-3.5 w-3.5" />
                          </Button>
                        ) : (
                          <Button
                            variant="outline"
                            size="sm"
                            onClick={() => addAsset(asset.id)}
                            className="h-8"
                          >
                            <Plus className="h-3.5 w-3.5 mr-1" /> Pilih
                          </Button>
                        )}
                      </div>
                    )
                  })}

                  {selectedAssets.length > 0 && (
                    <div className="pt-3 border-t border-neutral-100 space-y-2">
                      <p className="text-xs font-medium text-neutral-700">
                        Aset Dipilih ({selectedAssets.length})
                      </p>
                      {selectedAssets.map((sa) => {
                        const asset = assets?.find((a) => a.id === sa.assetId)
                        return (
                          <div
                            key={sa.assetId}
                            className="flex items-center gap-2 text-sm"
                          >
                            <span className="flex-1 truncate text-neutral-700">
                              {asset?.name}
                            </span>
                            <Input
                              type="number"
                              min={1}
                              max={asset?.quantity ?? 1}
                              value={sa.quantity}
                              onChange={(e) =>
                                updateQuantity(
                                  sa.assetId,
                                  parseInt(e.target.value) || 1,
                                )
                              }
                              className="w-16 h-7 text-xs text-center"
                            />
                          </div>
                        )
                      })}
                    </div>
                  )}
                </CardContent>
              </Card>

              {/* Right: Surat Details */}
              <div className="space-y-4">
                <Card className="border-neutral-200 shadow-sm">
                  <CardHeader className="pb-3">
                    <CardTitle className="text-base">Detail Surat</CardTitle>
                  </CardHeader>
                  <CardContent className="space-y-4">
                    <div className="space-y-2">
                      <Label className="text-xs font-medium text-neutral-700">
                        Perihal Surat
                      </Label>
                      <Input
                        placeholder="Contoh: Permohonan Peminjaman Sound System"
                        value={subject}
                        onChange={(e) => setSubject(e.target.value)}
                      />
                    </div>
                    <div className="grid gap-4 grid-cols-2">
                      <div className="space-y-2">
                        <Label className="text-xs font-medium text-neutral-700">
                          Ditujukan kepada (Jabatan)
                        </Label>
                        <Input
                          placeholder="Contoh: Ketua BEM"
                          value={toRole}
                          onChange={(e) => setToRole(e.target.value)}
                        />
                      </div>
                      <div className="space-y-2">
                        <Label className="text-xs font-medium text-neutral-700">
                          Nama Penerima
                        </Label>
                        <Input
                          placeholder="Contoh: Budi Santoso"
                          value={toName}
                          onChange={(e) => setToName(e.target.value)}
                        />
                      </div>
                    </div>
                    <div className="grid gap-4 grid-cols-2">
                      <div className="space-y-2">
                        <Label className="text-xs font-medium text-neutral-700">
                          Tanggal Pinjam <span className="text-red-500">*</span>
                        </Label>
                        <Input
                          type="date"
                          value={borrowDate}
                          onChange={(e) => setBorrowDate(e.target.value)}
                        />
                      </div>
                      <div className="space-y-2">
                        <Label className="text-xs font-medium text-neutral-700">
                          Tanggal Kembali <span className="text-red-500">*</span>
                        </Label>
                        <Input
                          type="date"
                          value={returnDate}
                          onChange={(e) => setReturnDate(e.target.value)}
                        />
                      </div>
                    </div>
                    <div className="space-y-2">
                      <Label className="text-xs font-medium text-neutral-700">
                        Keterangan Tambahan
                      </Label>
                      <TextArea
                        placeholder="Keperluan peminjaman, catatan khusus, dll."
                        value={note}
                        onChange={(e) => setNote(e.target.value)}
                        rows={3}
                      />
                    </div>
                  </CardContent>
                </Card>

                <Button
                  className="w-full bg-amber-600 hover:bg-amber-700 text-white"
                  disabled={!borrowDate || !returnDate || suratMutation.isPending}
                  onClick={() => suratMutation.mutate()}
                >
                  {suratMutation.isPending ? (
                    <Spinner className="mr-2 h-4 w-4 text-white" />
                  ) : (
                    <SendHorizonal className="mr-2 h-4 w-4" />
                  )}
                  Kirim Surat Peminjaman
                </Button>
              </div>
            </div>
          </div>
        </Container>
      </Page.Body>
    </Page>
  )
}
