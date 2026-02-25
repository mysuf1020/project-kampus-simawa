'use client'

import { useMemo, useState } from 'react'
import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query'
import {
  Package,
  Plus,
  Pencil,
  Trash2,
  Box,
  CheckCircle2,
  Clock,
  Calendar,
  X,
  ArrowRightLeft,
  Search,
  ImagePlus,
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
import { useRBAC } from '@/lib/providers/rbac-provider'
import { ADMIN_ROLES } from '@/components/guards/role-guard'
import { RoleGuard } from '@/components/guards/role-guard'
import {
  listAssets,
  listAllAssets,
  createAsset,
  updateAsset,
  deleteAsset,
  borrowAsset,
  returnAsset,
  listBorrowings,
  uploadAssetImage,
  type Asset,
} from '@/lib/apis/asset'

type AssetFormData = { name: string; description: string; quantity: number; imageUrl: string }
const emptyForm: AssetFormData = { name: '', description: '', quantity: 1, imageUrl: '' }

type BorrowFormData = {
  assetId: number | null
  quantity: number
  borrowDate: string
  returnDate: string
  note: string
}
const emptyBorrowForm: BorrowFormData = {
  assetId: null,
  quantity: 1,
  borrowDate: '',
  returnDate: '',
  note: '',
}

export default function AssetManagementPage() {
  return (
    <RoleGuard allowedRoles={ADMIN_ROLES}>
      <AssetManagementPageContent />
    </RoleGuard>
  )
}

function AssetManagementPageContent() {
  const queryClient = useQueryClient()
  const { hasAnyRole } = useRBAC()
  const isAdmin = hasAnyRole(ADMIN_ROLES)

  const [orgId, setOrgId] = useState('')
  const [tab, setTab] = useState<'inventory' | 'borrow' | 'history'>('inventory')
  const [search, setSearch] = useState('')

  // Asset CRUD state
  const [showForm, setShowForm] = useState(false)
  const [editingId, setEditingId] = useState<number | null>(null)
  const [form, setForm] = useState<AssetFormData>(emptyForm)

  // Image upload state
  const [imageFile, setImageFile] = useState<File | null>(null)
  const [imagePreview, setImagePreview] = useState<string>('')
  const [uploading, setUploading] = useState(false)

  // Borrow form state
  const [borrowForm, setBorrowForm] = useState<BorrowFormData>(emptyBorrowForm)

  const { data: orgs } = useQuery({
    queryKey: ['orgs'],
    queryFn: listOrganizations,
  })

  const { data: assets, isLoading: assetsLoading } = useQuery({
    queryKey: ['assets', orgId],
    queryFn: () => listAssets(orgId),
    enabled: !!orgId,
  })

  const { data: borrowings, isLoading: borrowingsLoading } = useQuery({
    queryKey: ['borrowings', orgId],
    queryFn: () => listBorrowings(orgId),
    enabled: !!orgId,
  })

  // Manageable orgs (user can CRUD assets in these)
  const manageableOrgIds = useMemo(() => {
    if (!orgs) return new Set<string>()
    if (isAdmin) return new Set(orgs.map((o) => o.id))
    return new Set(orgs.filter((o) => o.can_manage).map((o) => o.id))
  }, [orgs, isAdmin])

  const canManageSelectedOrg = orgId ? manageableOrgIds.has(orgId) : false

  const invalidateAll = () => {
    queryClient.invalidateQueries({ queryKey: ['assets', orgId] })
    queryClient.invalidateQueries({ queryKey: ['borrowings', orgId] })
    queryClient.invalidateQueries({ queryKey: ['all-assets'] })
  }

  // Fetch ALL assets across all orgs (for default view + borrow tab)
  const { data: allAssets, isLoading: allAssetsLoading } = useQuery({
    queryKey: ['all-assets'],
    queryFn: listAllAssets,
  })

  const filteredAssets = useMemo(() => {
    const source = orgId ? assets : allAssets
    if (!source) return []
    if (!search.trim()) return source
    const q = search.toLowerCase()
    return source.filter(
      (a) =>
        a.name.toLowerCase().includes(q) ||
        a.description?.toLowerCase().includes(q),
    )
  }, [assets, allAssets, orgId, search])

  const isLoadingAssets = orgId ? assetsLoading : allAssetsLoading

  const allAvailableAssets = useMemo(
    () => allAssets?.filter((a) => a.status === 'AVAILABLE') ?? [],
    [allAssets],
  )

  const activeBorrowings = useMemo(
    () => borrowings?.filter((b) => b.status === 'BORROWED') ?? [],
    [borrowings],
  )

  // --- CRUD Mutations ---
  const createMut = useMutation({
    mutationFn: async () => {
      let imageUrl = form.imageUrl
      if (imageFile) {
        setUploading(true)
        try {
          const res = await uploadAssetImage(imageFile)
          imageUrl = res.url
        } finally {
          setUploading(false)
        }
      }
      return createAsset({ org_id: orgId, name: form.name, description: form.description, quantity: form.quantity, image_url: imageUrl || undefined })
    },
    onSuccess: () => {
      toast.success('Aset berhasil ditambahkan')
      setForm(emptyForm)
      setImageFile(null)
      setImagePreview('')
      setShowForm(false)
      invalidateAll()
    },
    onError: () => toast.error('Gagal menambahkan aset'),
  })

  const updateMut = useMutation({
    mutationFn: async () => {
      let imageUrl = form.imageUrl
      if (imageFile) {
        setUploading(true)
        try {
          const res = await uploadAssetImage(imageFile)
          imageUrl = res.url
        } finally {
          setUploading(false)
        }
      }
      return updateAsset(editingId!, { name: form.name, description: form.description, quantity: form.quantity, image_url: imageUrl || undefined })
    },
    onSuccess: () => {
      toast.success('Aset berhasil diperbarui')
      setForm(emptyForm)
      setImageFile(null)
      setImagePreview('')
      setEditingId(null)
      setShowForm(false)
      invalidateAll()
    },
    onError: () => toast.error('Gagal memperbarui aset'),
  })

  const deleteMut = useMutation({
    mutationFn: deleteAsset,
    onSuccess: () => {
      toast.success('Aset berhasil dihapus')
      invalidateAll()
    },
    onError: () => toast.error('Gagal menghapus aset'),
  })

  const handleSubmit = () => {
    if (!form.name.trim()) {
      toast.error('Nama aset wajib diisi')
      return
    }
    if (editingId) {
      updateMut.mutate()
    } else {
      createMut.mutate()
    }
  }

  const startEdit = (asset: Asset) => {
    setEditingId(asset.id)
    setForm({ name: asset.name, description: asset.description, quantity: asset.quantity, imageUrl: asset.image_url || '' })
    setImageFile(null)
    setImagePreview(asset.image_url || '')
    setShowForm(true)
  }

  const cancelForm = () => {
    setForm(emptyForm)
    setEditingId(null)
    setImageFile(null)
    setImagePreview('')
    setShowForm(false)
  }

  const handleImageChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0]
    if (!file) return
    if (file.size > 5 * 1024 * 1024) {
      toast.error('Ukuran gambar maksimal 5MB')
      return
    }
    setImageFile(file)
    setImagePreview(URL.createObjectURL(file))
  }

  // --- Borrow / Return Mutations ---
  const borrowMut = useMutation({
    mutationFn: () => {
      if (!borrowForm.assetId || !borrowForm.borrowDate || !borrowForm.returnDate) {
        throw new Error('Lengkapi semua field')
      }
      const selectedAsset = allAssets?.find((a) => a.id === borrowForm.assetId)
      return borrowAsset({
        asset_id: borrowForm.assetId,
        org_id: selectedAsset?.org_id ?? orgId,
        quantity: borrowForm.quantity,
        borrow_date: borrowForm.borrowDate,
        return_date: borrowForm.returnDate,
        note: borrowForm.note,
      })
    },
    onSuccess: () => {
      toast.success('Aset berhasil dipinjam')
      setBorrowForm(emptyBorrowForm)
      invalidateAll()
      queryClient.invalidateQueries({ queryKey: ['all-assets'] })
    },
    onError: (err: Error) => toast.error(err.message || 'Gagal meminjam aset'),
  })

  const returnMut = useMutation({
    mutationFn: returnAsset,
    onSuccess: () => {
      toast.success('Aset berhasil dikembalikan')
      invalidateAll()
    },
    onError: () => toast.error('Gagal mengembalikan aset'),
  })

  const tabs = [
    { key: 'inventory' as const, label: 'Inventaris', count: assets?.length },
    { key: 'borrow' as const, label: 'Pinjam / Kembalikan', count: activeBorrowings.length },
    { key: 'history' as const, label: 'Riwayat', count: borrowings?.length },
  ]

  return (
    <Page>
      <Page.Header
        breadcrumbs={[
          { href: '/dashboard', children: 'Dashboard' },
          { href: '/assets', children: 'Manajemen Aset' },
        ]}
      >
        <div className="flex flex-col gap-4 md:flex-row md:items-center md:justify-between">
          <div>
            <h1 className="text-2xl font-bold tracking-tight text-neutral-900">
              Manajemen Aset
            </h1>
            <p className="mt-1 text-sm text-neutral-500">
              Kelola inventaris aset organisasi, peminjaman, dan pengembalian.
            </p>
          </div>
        </div>
      </Page.Header>

      <Page.Body>
        <Container>
          <div className="max-w-4xl mx-auto space-y-6">
            {/* Org Picker / Filter */}
            <div className="space-y-2">
              <Label className="text-sm font-medium text-neutral-700">Organisasi</Label>
              <select
                className="w-full h-10 rounded-lg border border-neutral-200 bg-white px-3 text-sm outline-none focus:border-brand-500 focus:ring-2 focus:ring-brand-500/20 transition-all"
                value={orgId}
                onChange={(e) => {
                  setOrgId(e.target.value)
                  setShowForm(false)
                  setBorrowForm(emptyBorrowForm)
                }}
              >
                <option value="">Semua Organisasi</option>
                {(orgs ?? []).map((org) => (
                  <option key={org.id} value={org.id}>
                    {org.name}
                  </option>
                ))}
              </select>
            </div>

            {/* Tabs */}
            <div className="flex gap-1 border-b border-neutral-200">
              {tabs.map((t) => (
                <button
                  key={t.key}
                  onClick={() => setTab(t.key)}
                  className={`px-4 py-2.5 text-sm font-medium border-b-2 transition-colors ${tab === t.key
                    ? 'border-brand-500 text-brand-700'
                    : 'border-transparent text-neutral-500 hover:text-neutral-700'
                    }`}
                >
                  {t.label}
                  {(t.count ?? 0) > 0 && (
                    <Badge variant="secondary" className="ml-2 text-[10px]">
                      {t.count}
                    </Badge>
                  )}
                </button>
              ))}
            </div>

            {/* ==================== INVENTARIS TAB ==================== */}
            {tab === 'inventory' && (
              <div className="space-y-4">
                {/* Search + Add */}
                <div className="flex items-center gap-3">
                  <div className="relative flex-1">
                    <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-neutral-400" />
                    <Input
                      placeholder="Cari aset..."
                      value={search}
                      onChange={(e) => setSearch(e.target.value)}
                      className="pl-9"
                    />
                  </div>
                  {!showForm && canManageSelectedOrg && (
                    <Button
                      size="sm"
                      onClick={() => {
                        setForm(emptyForm)
                        setEditingId(null)
                        setShowForm(true)
                      }}
                      className="gap-2 bg-brand-600 hover:bg-brand-700 text-white shrink-0"
                    >
                      <Plus className="h-4 w-4" /> Tambah
                    </Button>
                  )}
                </div>

                {/* Add/Edit Form */}
                {showForm && (
                  <Card className="border-brand-200 shadow-sm">
                    <CardHeader className="pb-3">
                      <div className="flex items-center justify-between">
                        <CardTitle className="text-base">
                          {editingId ? 'Edit Aset' : 'Tambah Aset Baru'}
                        </CardTitle>
                        <Button variant="ghost" size="sm" onClick={cancelForm}>
                          <X className="h-4 w-4" />
                        </Button>
                      </div>
                    </CardHeader>
                    <CardContent className="space-y-4">
                      <div className="space-y-2">
                        <Label className="text-xs font-medium">
                          Nama Aset <span className="text-red-500">*</span>
                        </Label>
                        <Input
                          placeholder="Contoh: Sound System, Proyektor, Meja Lipat"
                          value={form.name}
                          onChange={(e) => setForm({ ...form, name: e.target.value })}
                        />
                      </div>
                      <div className="grid gap-4 grid-cols-2">
                        <div className="space-y-2">
                          <Label className="text-xs font-medium">Deskripsi</Label>
                          <Input
                            placeholder="Merk, kondisi, dll."
                            value={form.description}
                            onChange={(e) => setForm({ ...form, description: e.target.value })}
                          />
                        </div>
                        <div className="space-y-2">
                          <Label className="text-xs font-medium">Jumlah</Label>
                          <Input
                            type="number"
                            min={1}
                            value={form.quantity}
                            onChange={(e) => setForm({ ...form, quantity: parseInt(e.target.value) || 1 })}
                          />
                        </div>
                      </div>
                      <div className="space-y-2">
                        <Label className="text-xs font-medium">Gambar Aset</Label>
                        <div className="flex items-center gap-4">
                          {imagePreview ? (
                            <div className="relative h-20 w-20 rounded-lg border border-neutral-200 overflow-hidden flex-shrink-0">
                              <img src={imagePreview} alt="Preview" className="h-full w-full object-cover" />
                              <button
                                type="button"
                                className="absolute top-0.5 right-0.5 rounded-full bg-black/50 p-0.5 text-white hover:bg-black/70"
                                onClick={() => { setImageFile(null); setImagePreview(''); setForm({ ...form, imageUrl: '' }) }}
                              >
                                <X className="h-3 w-3" />
                              </button>
                            </div>
                          ) : (
                            <label className="flex h-20 w-20 cursor-pointer flex-col items-center justify-center rounded-lg border-2 border-dashed border-neutral-300 hover:border-brand-400 hover:bg-brand-50/50 transition-colors flex-shrink-0">
                              <ImagePlus className="h-5 w-5 text-neutral-400" />
                              <span className="text-[10px] text-neutral-400 mt-1">Upload</span>
                              <input type="file" accept="image/*" className="hidden" onChange={handleImageChange} />
                            </label>
                          )}
                          <p className="text-[11px] text-neutral-400">JPG, PNG, WebP. Maks 5MB.</p>
                        </div>
                      </div>
                      <div className="flex justify-end gap-2 pt-2">
                        <Button variant="outline" size="sm" onClick={cancelForm}>
                          Batal
                        </Button>
                        <Button
                          size="sm"
                          onClick={handleSubmit}
                          disabled={createMut.isPending || updateMut.isPending || uploading}
                          className="bg-brand-600 hover:bg-brand-700 text-white"
                        >
                          {(createMut.isPending || updateMut.isPending || uploading) && (
                            <Spinner className="mr-2 h-3.5 w-3.5 text-white" />
                          )}
                          {uploading ? 'Mengupload...' : editingId ? 'Simpan Perubahan' : 'Tambah'}
                        </Button>
                      </div>
                    </CardContent>
                  </Card>
                )}

                {/* Asset List */}
                <Card className="border-neutral-200 shadow-sm">
                  <CardHeader className="pb-3">
                    <div className="flex items-center justify-between">
                      <div>
                        <CardTitle className="text-base">Daftar Aset</CardTitle>
                        <CardDescription className="text-xs">
                          {filteredAssets.length} aset{search ? ' ditemukan' : ' terdaftar'}
                        </CardDescription>
                      </div>
                    </div>
                  </CardHeader>
                  <CardContent className="p-0">
                    {isLoadingAssets && (
                      <div className="flex items-center justify-center gap-2 py-12 text-sm text-neutral-500">
                        <Spinner size="sm" /> Memuat aset...
                      </div>
                    )}
                    {!isLoadingAssets && filteredAssets.length === 0 && (
                      <div className="text-center py-12 text-neutral-400">
                        <Box className="h-10 w-10 mx-auto mb-2 opacity-50" />
                        <p className="text-sm">
                          {search ? 'Tidak ditemukan aset yang cocok.' : 'Belum ada aset terdaftar.'}
                        </p>
                        {!search && (
                          <p className="text-xs mt-1">
                            Klik &quot;Tambah&quot; untuk menambahkan aset organisasi.
                          </p>
                        )}
                      </div>
                    )}
                    {filteredAssets.length > 0 && (
                      <div className="divide-y divide-neutral-100">
                        {filteredAssets.map((asset) => (
                          <div
                            key={asset.id}
                            className="flex items-center justify-between p-4 hover:bg-neutral-50/50 transition-colors"
                          >
                            <div className="flex items-center gap-3 flex-1 min-w-0">
                              {asset.image_url ? (
                                <div className="h-10 w-10 rounded-lg overflow-hidden flex-shrink-0 border border-neutral-200">
                                  <img src={asset.image_url} alt={asset.name} className="h-full w-full object-cover" />
                                </div>
                              ) : (
                                <div className="flex h-10 w-10 items-center justify-center rounded-lg bg-neutral-100 flex-shrink-0">
                                  <Package className="h-5 w-5 text-neutral-500" />
                                </div>
                              )}
                              <div className="flex-1 min-w-0">
                                <div className="flex items-center gap-2">
                                  <p className="text-sm font-medium text-neutral-900 truncate">
                                    {asset.name}
                                  </p>
                                  <Badge
                                    variant="secondary"
                                    className={
                                      asset.status === 'AVAILABLE'
                                        ? 'bg-green-100 text-green-700 text-[10px]'
                                        : 'bg-amber-100 text-amber-700 text-[10px]'
                                    }
                                  >
                                    {asset.status === 'AVAILABLE' ? 'Tersedia' : 'Dipinjam'}
                                  </Badge>
                                </div>
                                <div className="flex items-center gap-3 text-xs text-neutral-500 mt-0.5">
                                  {asset.description && (
                                    <span className="truncate">{asset.description}</span>
                                  )}
                                  <span>Qty: {asset.quantity}</span>
                                </div>
                              </div>
                            </div>
                            {manageableOrgIds.has(asset.org_id) && (
                              <div className="flex items-center gap-1.5">
                                <Button
                                  variant="ghost"
                                  size="sm"
                                  onClick={() => startEdit(asset)}
                                  className="h-8 w-8 p-0"
                                >
                                  <Pencil className="h-3.5 w-3.5 text-neutral-500" />
                                </Button>
                                <Button
                                  variant="ghost"
                                  size="sm"
                                  onClick={() => {
                                    if (confirm(`Hapus aset "${asset.name}"?`)) {
                                      deleteMut.mutate(asset.id)
                                    }
                                  }}
                                  disabled={deleteMut.isPending}
                                  className="h-8 w-8 p-0 text-red-500 hover:text-red-700"
                                >
                                  <Trash2 className="h-3.5 w-3.5" />
                                </Button>
                              </div>
                            )}
                          </div>
                        ))}
                      </div>
                    )}
                  </CardContent>
                </Card>
              </div>
            )}

            {/* ==================== BORROW / RETURN TAB ==================== */}
            {tab === 'borrow' && (
              <div className="grid gap-6 lg:grid-cols-2">
                {/* Borrow Form */}
                <Card className="border-neutral-200 shadow-sm">
                  <CardHeader className="pb-3">
                    <CardTitle className="text-base">Pinjam Aset</CardTitle>
                    <CardDescription className="text-xs">
                      Pilih aset dan isi detail peminjaman.
                    </CardDescription>
                  </CardHeader>
                  <CardContent className="space-y-4">
                    <div className="space-y-2">
                      <Label className="text-xs font-medium">
                        Pilih Aset <span className="text-red-500">*</span>
                      </Label>
                      <select
                        className="w-full h-10 rounded-lg border border-neutral-200 bg-white px-3 text-sm outline-none focus:border-brand-500 focus:ring-2 focus:ring-brand-500/20 transition-all"
                        value={borrowForm.assetId ?? ''}
                        onChange={(e) =>
                          setBorrowForm({ ...borrowForm, assetId: e.target.value ? Number(e.target.value) : null })
                        }
                      >
                        <option value="">-- Pilih aset --</option>
                        {allAvailableAssets.map((a) => {
                          const orgName = orgs?.find((o) => o.id === a.org_id)?.name
                          return (
                            <option key={a.id} value={a.id}>
                              {a.name} (Qty: {a.quantity}){orgName ? ` — ${orgName}` : ''}
                            </option>
                          )
                        })}
                      </select>
                      {allAvailableAssets.length === 0 && (
                        <p className="text-xs text-amber-600">
                          Tidak ada aset tersedia. Tambahkan aset di tab Inventaris.
                        </p>
                      )}
                    </div>
                    <div className="space-y-2">
                      <Label className="text-xs font-medium">Jumlah</Label>
                      <Input
                        type="number"
                        min={1}
                        max={
                          borrowForm.assetId
                            ? assets?.find((a) => a.id === borrowForm.assetId)?.quantity ?? 1
                            : 1
                        }
                        value={borrowForm.quantity}
                        onChange={(e) =>
                          setBorrowForm({ ...borrowForm, quantity: parseInt(e.target.value) || 1 })
                        }
                      />
                    </div>
                    <div className="grid gap-4 grid-cols-2">
                      <div className="space-y-2">
                        <Label className="text-xs font-medium">
                          Tanggal Pinjam <span className="text-red-500">*</span>
                        </Label>
                        <Input
                          type="date"
                          value={borrowForm.borrowDate}
                          onChange={(e) =>
                            setBorrowForm({ ...borrowForm, borrowDate: e.target.value })
                          }
                        />
                      </div>
                      <div className="space-y-2">
                        <Label className="text-xs font-medium">
                          Tanggal Kembali <span className="text-red-500">*</span>
                        </Label>
                        <Input
                          type="date"
                          value={borrowForm.returnDate}
                          onChange={(e) =>
                            setBorrowForm({ ...borrowForm, returnDate: e.target.value })
                          }
                        />
                      </div>
                    </div>
                    <div className="space-y-2">
                      <Label className="text-xs font-medium">Catatan</Label>
                      <TextArea
                        placeholder="Keperluan peminjaman..."
                        value={borrowForm.note}
                        onChange={(e) =>
                          setBorrowForm({ ...borrowForm, note: e.target.value })
                        }
                        rows={2}
                      />
                    </div>
                    <Button
                      className="w-full bg-brand-600 hover:bg-brand-700 text-white"
                      disabled={
                        !borrowForm.assetId ||
                        !borrowForm.borrowDate ||
                        !borrowForm.returnDate ||
                        borrowMut.isPending
                      }
                      onClick={() => borrowMut.mutate()}
                    >
                      {borrowMut.isPending ? (
                        <Spinner className="mr-2 h-4 w-4 text-white" />
                      ) : (
                        <ArrowRightLeft className="mr-2 h-4 w-4" />
                      )}
                      Pinjam Aset
                    </Button>
                  </CardContent>
                </Card>

                {/* Active Borrowings - Return */}
                <Card className="border-neutral-200 shadow-sm">
                  <CardHeader className="pb-3">
                    <CardTitle className="text-base">Sedang Dipinjam</CardTitle>
                    <CardDescription className="text-xs">
                      {activeBorrowings.length} aset sedang dipinjam
                    </CardDescription>
                  </CardHeader>
                  <CardContent className="p-0">
                    {activeBorrowings.length === 0 ? (
                      <div className="text-center py-10 text-neutral-400">
                        <CheckCircle2 className="h-8 w-8 mx-auto mb-2 opacity-50" />
                        <p className="text-sm">Tidak ada aset yang sedang dipinjam.</p>
                      </div>
                    ) : (
                      <div className="divide-y divide-neutral-100">
                        {activeBorrowings.map((b) => (
                          <div key={b.id} className="flex items-center justify-between p-4">
                            <div className="flex-1 min-w-0">
                              <p className="text-sm font-medium text-neutral-900">
                                {b.asset?.name ?? `Asset #${b.asset_id}`}
                              </p>
                              <div className="flex items-center gap-3 mt-1 text-xs text-neutral-500">
                                <span className="flex items-center gap-1">
                                  <Calendar className="h-3 w-3" />
                                  {b.borrow_date?.split('T')[0]} — {b.return_date?.split('T')[0]}
                                </span>
                                {b.quantity > 1 && <span>Qty: {b.quantity}</span>}
                              </div>
                              {b.note && (
                                <p className="text-xs text-neutral-400 mt-1">{b.note}</p>
                              )}
                            </div>
                            <Button
                              variant="outline"
                              size="sm"
                              onClick={() => returnMut.mutate(b.id)}
                              disabled={returnMut.isPending}
                              className="gap-1.5 text-green-700 border-green-200 hover:bg-green-50"
                            >
                              <CheckCircle2 className="h-3.5 w-3.5" />
                              Kembalikan
                            </Button>
                          </div>
                        ))}
                      </div>
                    )}
                  </CardContent>
                </Card>
              </div>
            )}

            {/* ==================== HISTORY TAB ==================== */}
            {tab === 'history' && (
              <Card className="border-neutral-200 shadow-sm">
                <CardHeader className="pb-3">
                  <CardTitle className="text-base">Riwayat Peminjaman</CardTitle>
                  <CardDescription className="text-xs">
                    Seluruh riwayat peminjaman dan pengembalian aset.
                  </CardDescription>
                </CardHeader>
                <CardContent className="p-0">
                  {borrowingsLoading && (
                    <div className="flex items-center justify-center gap-2 py-12 text-sm text-neutral-500">
                      <Spinner size="sm" /> Memuat riwayat...
                    </div>
                  )}
                  {!borrowingsLoading && (!borrowings || borrowings.length === 0) ? (
                    <div className="text-center py-12 text-neutral-400">
                      <Clock className="h-10 w-10 mx-auto mb-2 opacity-50" />
                      <p className="text-sm">Belum ada riwayat peminjaman.</p>
                    </div>
                  ) : (
                    <div className="divide-y divide-neutral-100">
                      {borrowings?.map((b) => (
                        <div key={b.id} className="flex items-center justify-between p-4">
                          <div className="flex-1 min-w-0">
                            <div className="flex items-center gap-2">
                              <p className="text-sm font-medium text-neutral-900">
                                {b.asset?.name ?? `Asset #${b.asset_id}`}
                              </p>
                              <Badge
                                variant="secondary"
                                className={
                                  b.status === 'BORROWED'
                                    ? 'bg-amber-100 text-amber-700 text-[10px]'
                                    : 'bg-green-100 text-green-700 text-[10px]'
                                }
                              >
                                {b.status === 'BORROWED' ? 'Dipinjam' : 'Dikembalikan'}
                              </Badge>
                            </div>
                            <div className="flex items-center gap-3 mt-1 text-xs text-neutral-500">
                              <span className="flex items-center gap-1">
                                <Calendar className="h-3 w-3" />
                                {b.borrow_date?.split('T')[0]} — {b.return_date?.split('T')[0]}
                              </span>
                              {b.quantity > 1 && <span>Qty: {b.quantity}</span>}
                            </div>
                            {b.note && (
                              <p className="text-xs text-neutral-400 mt-1">{b.note}</p>
                            )}
                          </div>
                          {b.status === 'BORROWED' && (
                            <Button
                              variant="outline"
                              size="sm"
                              onClick={() => returnMut.mutate(b.id)}
                              disabled={returnMut.isPending}
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
