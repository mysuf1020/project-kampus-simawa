'use client'

import { useEffect, useMemo, useState } from 'react'
import { useRouter } from 'next/navigation'
import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query'
import {
  ArrowLeft,
  Package,
  Plus,
  Trash2,
  Calendar,
  SendHorizonal,
  CheckCircle2,
  Clock,
  Box,
} from 'lucide-react'
import { toast } from 'sonner'

import {
  Badge,
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
import {
  listAssets,
  borrowAsset,
  listBorrowings,
  returnAsset,
  type Asset,
  type AssetBorrowing,
} from '@/lib/apis/asset'
import { createSurat, submitSurat, type CreateSuratPayload } from '@/lib/apis/surat'

export default function SuratPeminjamanPage() {
  const router = useRouter()
  const queryClient = useQueryClient()

  const [orgId, setOrgId] = useState('')
  const [selectedAssets, setSelectedAssets] = useState<
    { assetId: number; quantity: number }[]
  >([])
  const [borrowDate, setBorrowDate] = useState('')
  const [returnDate, setReturnDate] = useState('')
  const [note, setNote] = useState('')
  const [subject, setSubject] = useState('')
  const [tab, setTab] = useState<'form' | 'history'>('form')

  const { data: orgs } = useQuery({
    queryKey: ['orgs'],
    queryFn: listOrganizations,
  })

  const { data: assets, isLoading: assetsLoading } = useQuery({
    queryKey: ['assets', orgId],
    queryFn: () => listAssets(orgId),
    enabled: !!orgId,
  })

  const { data: borrowings } = useQuery({
    queryKey: ['borrowings', orgId],
    queryFn: () => listBorrowings(orgId),
    enabled: !!orgId,
  })

  useEffect(() => {
    if (!orgId && orgs?.length) {
      setOrgId(orgs[0].id)
    }
  }, [orgId, orgs])

  const availableAssets = useMemo(
    () => assets?.filter((a) => a.status === 'AVAILABLE') ?? [],
    [assets],
  )

  const borrowMutation = useMutation({
    mutationFn: async () => {
      if (!orgId || selectedAssets.length === 0 || !borrowDate || !returnDate) {
        throw new Error('Lengkapi semua field')
      }

      // Create a surat peminjaman first
      const assetNames = selectedAssets
        .map((sa) => {
          const asset = assets?.find((a) => a.id === sa.assetId)
          return asset ? `${asset.name} (${sa.quantity}x)` : ''
        })
        .filter(Boolean)
        .join(', ')

      const suratPayload: CreateSuratPayload = {
        org_id: orgId,
        status: 'DRAFT',
        payload: {
          variant: 'PEMINJAMAN',
          created_at: new Date().toISOString(),
          meta: {
            number: '',
            subject: subject || `Peminjaman: ${assetNames}`,
            to_role: '',
            to_name: '',
            to_place: '',
            to_city: '',
            place_and_date: '',
            lampiran: '',
          },
          body_opening: '',
          body_content: [
            `Dengan ini mengajukan permohonan peminjaman aset: ${assetNames}.`,
            `Tanggal peminjaman: ${borrowDate} s/d ${returnDate}.`,
            note ? `Catatan: ${note}` : '',
          ].filter(Boolean),
          body_closing: '',
          footer: '',
          signs: [],
          tembusan: [],
        },
      }

      const surat = await createSurat(suratPayload)
      if (surat?.id) {
        await submitSurat(surat.id)
      }

      // Create borrowing records for each asset
      for (const sa of selectedAssets) {
        await borrowAsset({
          asset_id: sa.assetId,
          org_id: orgId,
          surat_id: surat?.id,
          quantity: sa.quantity,
          borrow_date: borrowDate,
          return_date: returnDate,
          note,
        })
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
      queryClient.invalidateQueries({ queryKey: ['assets', orgId] })
      queryClient.invalidateQueries({ queryKey: ['borrowings', orgId] })
    },
    onError: (err: Error) => {
      toast.error(err.message || 'Gagal membuat surat peminjaman')
    },
  })

  const returnMutation = useMutation({
    mutationFn: returnAsset,
    onSuccess: () => {
      toast.success('Aset berhasil dikembalikan')
      queryClient.invalidateQueries({ queryKey: ['assets', orgId] })
      queryClient.invalidateQueries({ queryKey: ['borrowings', orgId] })
    },
    onError: () => {
      toast.error('Gagal mengembalikan aset')
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
          { href: '/surat/peminjaman', children: 'Peminjaman' },
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
                Buat surat peminjaman aset organisasi.
              </p>
            </div>
          </div>
          <Button
            variant="outline"
            size="sm"
            onClick={() => router.push('/surat/assets')}
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
                {(orgs ?? []).map((org) => (
                  <option key={org.id} value={org.id}>
                    {org.name}
                  </option>
                ))}
              </select>
            </div>

            {/* Tabs */}
            <div className="flex gap-2 border-b border-neutral-200">
              <button
                onClick={() => setTab('form')}
                className={`px-4 py-2 text-sm font-medium border-b-2 transition-colors ${
                  tab === 'form'
                    ? 'border-brand-500 text-brand-700'
                    : 'border-transparent text-neutral-500 hover:text-neutral-700'
                }`}
              >
                Buat Peminjaman
              </button>
              <button
                onClick={() => setTab('history')}
                className={`px-4 py-2 text-sm font-medium border-b-2 transition-colors ${
                  tab === 'history'
                    ? 'border-brand-500 text-brand-700'
                    : 'border-transparent text-neutral-500 hover:text-neutral-700'
                }`}
              >
                Riwayat Peminjaman
                {borrowings?.length ? (
                  <Badge variant="secondary" className="ml-2 text-[10px]">
                    {borrowings.length}
                  </Badge>
                ) : null}
              </button>
            </div>

            {tab === 'form' && (
              <div className="grid gap-6 lg:grid-cols-2">
                {/* Left: Asset Selection */}
                <Card className="border-neutral-200 shadow-sm">
                  <CardHeader className="pb-3">
                    <CardTitle className="text-base">Pilih Aset</CardTitle>
                    <CardDescription className="text-xs">
                      Pilih aset yang ingin dipinjam dari organisasi.
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
                          onClick={() => router.push('/surat/assets')}
                          className="mt-2 text-brand-600"
                        >
                          Tambah aset baru
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

                    {/* Selected assets with quantity */}
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

                {/* Right: Form Details */}
                <div className="space-y-4">
                  <Card className="border-neutral-200 shadow-sm">
                    <CardHeader className="pb-3">
                      <CardTitle className="text-base">Detail Peminjaman</CardTitle>
                    </CardHeader>
                    <CardContent className="space-y-4">
                      <div className="space-y-2">
                        <Label className="text-xs font-medium text-neutral-700">
                          Perihal Surat
                        </Label>
                        <Input
                          placeholder="Contoh: Peminjaman Sound System untuk Seminar"
                          value={subject}
                          onChange={(e) => setSubject(e.target.value)}
                        />
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
                          Catatan
                        </Label>
                        <TextArea
                          placeholder="Catatan tambahan..."
                          value={note}
                          onChange={(e) => setNote(e.target.value)}
                          rows={3}
                        />
                      </div>
                    </CardContent>
                  </Card>

                  <Button
                    className="w-full bg-amber-600 hover:bg-amber-700 text-white"
                    disabled={
                      selectedAssets.length === 0 ||
                      !borrowDate ||
                      !returnDate ||
                      borrowMutation.isPending
                    }
                    onClick={() => borrowMutation.mutate()}
                  >
                    {borrowMutation.isPending ? (
                      <Spinner className="mr-2 h-4 w-4 text-white" />
                    ) : (
                      <SendHorizonal className="mr-2 h-4 w-4" />
                    )}
                    Kirim Surat Peminjaman
                  </Button>
                </div>
              </div>
            )}

            {tab === 'history' && (
              <Card className="border-neutral-200 shadow-sm">
                <CardContent className="p-0">
                  {!borrowings?.length ? (
                    <div className="text-center py-12 text-neutral-400">
                      <Clock className="h-10 w-10 mx-auto mb-2 opacity-50" />
                      <p className="text-sm">Belum ada riwayat peminjaman.</p>
                    </div>
                  ) : (
                    <div className="divide-y divide-neutral-100">
                      {borrowings.map((b) => (
                        <div
                          key={b.id}
                          className="flex items-center justify-between p-4"
                        >
                          <div className="flex-1 min-w-0">
                            <div className="flex items-center gap-2">
                              <p className="text-sm font-medium text-neutral-900">
                                {b.asset?.name ?? `Asset #${b.asset_id}`}
                              </p>
                              <Badge
                                variant={
                                  b.status === 'BORROWED' ? 'default' : 'secondary'
                                }
                                className={
                                  b.status === 'BORROWED'
                                    ? 'bg-amber-100 text-amber-700 text-[10px]'
                                    : 'bg-green-100 text-green-700 text-[10px]'
                                }
                              >
                                {b.status === 'BORROWED'
                                  ? 'Dipinjam'
                                  : 'Dikembalikan'}
                              </Badge>
                            </div>
                            <div className="flex items-center gap-3 mt-1 text-xs text-neutral-500">
                              <span className="flex items-center gap-1">
                                <Calendar className="h-3 w-3" />
                                {b.borrow_date?.split('T')[0]} — {b.return_date?.split('T')[0]}
                              </span>
                              {b.quantity > 1 && (
                                <span>Qty: {b.quantity}</span>
                              )}
                            </div>
                            {b.note && (
                              <p className="text-xs text-neutral-400 mt-1">
                                {b.note}
                              </p>
                            )}
                          </div>
                          {b.status === 'BORROWED' && (
                            <Button
                              variant="outline"
                              size="sm"
                              onClick={() => returnMutation.mutate(b.id)}
                              disabled={returnMutation.isPending}
                              className="gap-1.5 text-green-700 border-green-200 hover:bg-green-50"
                            >
                              <CheckCircle2 className="h-3.5 w-3.5" />
                              Kembalikan
                            </Button>
                          )}
                        </div>
                      ))}
                    </div>
                  )}
                </CardContent>
              </Card>
            )}
          </div>
        </Container>
      </Page.Body>
    </Page>
  )
}
