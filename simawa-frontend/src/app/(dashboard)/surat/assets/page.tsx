'use client'

import { useEffect, useState } from 'react'
import { useRouter } from 'next/navigation'
import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query'
import {
  ArrowLeft,
  Package,
  Plus,
  Pencil,
  Trash2,
  Box,
  CheckCircle2,
  X,
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
  createAsset,
  updateAsset,
  deleteAsset,
  type Asset,
} from '@/lib/apis/asset'

type AssetFormData = {
  name: string
  description: string
  quantity: number
}

const emptyForm: AssetFormData = { name: '', description: '', quantity: 1 }

export default function AssetManagementPage() {
  const router = useRouter()
  const queryClient = useQueryClient()

  const [orgId, setOrgId] = useState('')
  const [showForm, setShowForm] = useState(false)
  const [editingId, setEditingId] = useState<number | null>(null)
  const [form, setForm] = useState<AssetFormData>(emptyForm)

  const { data: orgs } = useQuery({
    queryKey: ['orgs'],
    queryFn: listOrganizations,
  })

  const { data: assets, isLoading } = useQuery({
    queryKey: ['assets', orgId],
    queryFn: () => listAssets(orgId),
    enabled: !!orgId,
  })

  useEffect(() => {
    if (!orgId && orgs?.length) {
      setOrgId(orgs[0].id)
    }
  }, [orgId, orgs])

  const invalidate = () => queryClient.invalidateQueries({ queryKey: ['assets', orgId] })

  const createMut = useMutation({
    mutationFn: () =>
      createAsset({
        org_id: orgId,
        name: form.name,
        description: form.description,
        quantity: form.quantity,
      }),
    onSuccess: () => {
      toast.success('Aset berhasil ditambahkan')
      setForm(emptyForm)
      setShowForm(false)
      invalidate()
    },
    onError: () => toast.error('Gagal menambahkan aset'),
  })

  const updateMut = useMutation({
    mutationFn: () =>
      updateAsset(editingId!, {
        name: form.name,
        description: form.description,
        quantity: form.quantity,
      }),
    onSuccess: () => {
      toast.success('Aset berhasil diperbarui')
      setForm(emptyForm)
      setEditingId(null)
      setShowForm(false)
      invalidate()
    },
    onError: () => toast.error('Gagal memperbarui aset'),
  })

  const deleteMut = useMutation({
    mutationFn: deleteAsset,
    onSuccess: () => {
      toast.success('Aset berhasil dihapus')
      invalidate()
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
    setForm({
      name: asset.name,
      description: asset.description,
      quantity: asset.quantity,
    })
    setShowForm(true)
  }

  const cancelForm = () => {
    setForm(emptyForm)
    setEditingId(null)
    setShowForm(false)
  }

  return (
    <Page>
      <Page.Header
        breadcrumbs={[
          { href: '/dashboard', children: 'Dashboard' },
          { href: '/surat', children: 'Surat' },
          { href: '/surat/assets', children: 'Kelola Aset' },
        ]}
      >
        <div className="flex flex-col gap-4 md:flex-row md:items-center md:justify-between">
          <div className="flex items-center gap-3">
            <button
              onClick={() => router.back()}
              className="p-2 -ml-2 rounded-lg hover:bg-neutral-100 transition-colors"
            >
              <ArrowLeft className="w-5 h-5 text-neutral-600" />
            </button>
            <div>
              <h1 className="text-2xl font-bold tracking-tight text-neutral-900">
                Kelola Aset Organisasi
              </h1>
              <p className="mt-1 text-sm text-neutral-500">
                Tambah, edit, dan hapus aset yang bisa dipinjam.
              </p>
            </div>
          </div>
          {!showForm && (
            <Button
              size="sm"
              onClick={() => {
                setForm(emptyForm)
                setEditingId(null)
                setShowForm(true)
              }}
              className="gap-2 bg-brand-600 hover:bg-brand-700 text-white"
            >
              <Plus className="h-4 w-4" /> Tambah Aset
            </Button>
          )}
        </div>
      </Page.Header>

      <Page.Body>
        <Container>
          <div className="max-w-3xl mx-auto space-y-6">
            {/* Org Picker */}
            <div className="space-y-2">
              <Label className="text-sm font-medium text-neutral-700">Organisasi</Label>
              <select
                className="w-full h-10 rounded-lg border border-neutral-200 bg-white px-3 text-sm outline-none focus:border-brand-500 focus:ring-2 focus:ring-brand-500/20 transition-all"
                value={orgId}
                onChange={(e) => setOrgId(e.target.value)}
              >
                {(orgs ?? []).map((org) => (
                  <option key={org.id} value={org.id}>
                    {org.name}
                  </option>
                ))}
              </select>
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
                        onChange={(e) =>
                          setForm({ ...form, description: e.target.value })
                        }
                      />
                    </div>
                    <div className="space-y-2">
                      <Label className="text-xs font-medium">Jumlah</Label>
                      <Input
                        type="number"
                        min={1}
                        value={form.quantity}
                        onChange={(e) =>
                          setForm({
                            ...form,
                            quantity: parseInt(e.target.value) || 1,
                          })
                        }
                      />
                    </div>
                  </div>
                  <div className="flex justify-end gap-2 pt-2">
                    <Button variant="outline" size="sm" onClick={cancelForm}>
                      Batal
                    </Button>
                    <Button
                      size="sm"
                      onClick={handleSubmit}
                      disabled={createMut.isPending || updateMut.isPending}
                      className="bg-brand-600 hover:bg-brand-700 text-white"
                    >
                      {(createMut.isPending || updateMut.isPending) && (
                        <Spinner className="mr-2 h-3.5 w-3.5 text-white" />
                      )}
                      {editingId ? 'Simpan Perubahan' : 'Tambah'}
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
                      {assets?.length ?? 0} aset terdaftar
                    </CardDescription>
                  </div>
                </div>
              </CardHeader>
              <CardContent className="p-0">
                {isLoading && (
                  <div className="flex items-center justify-center gap-2 py-12 text-sm text-neutral-500">
                    <Spinner size="sm" /> Memuat aset...
                  </div>
                )}
                {!isLoading && (!assets || assets.length === 0) && (
                  <div className="text-center py-12 text-neutral-400">
                    <Box className="h-10 w-10 mx-auto mb-2 opacity-50" />
                    <p className="text-sm">Belum ada aset terdaftar.</p>
                    <p className="text-xs mt-1">
                      Klik &quot;Tambah Aset&quot; untuk menambahkan aset organisasi.
                    </p>
                  </div>
                )}
                {assets && assets.length > 0 && (
                  <div className="divide-y divide-neutral-100">
                    {assets.map((asset) => (
                      <div
                        key={asset.id}
                        className="flex items-center justify-between p-4 hover:bg-neutral-50/50 transition-colors"
                      >
                        <div className="flex items-center gap-3 flex-1 min-w-0">
                          <div className="flex h-10 w-10 items-center justify-center rounded-lg bg-neutral-100 flex-shrink-0">
                            <Package className="h-5 w-5 text-neutral-500" />
                          </div>
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
                                {asset.status === 'AVAILABLE'
                                  ? 'Tersedia'
                                  : 'Dipinjam'}
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
                              if (
                                confirm(
                                  `Hapus aset "${asset.name}"?`,
                                )
                              ) {
                                deleteMut.mutate(asset.id)
                              }
                            }}
                            disabled={deleteMut.isPending}
                            className="h-8 w-8 p-0 text-red-500 hover:text-red-700"
                          >
                            <Trash2 className="h-3.5 w-3.5" />
                          </Button>
                        </div>
                      </div>
                    ))}
                  </div>
                )}
              </CardContent>
            </Card>
          </div>
        </Container>
      </Page.Body>
    </Page>
  )
}
