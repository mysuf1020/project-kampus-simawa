'use client'

import { useState } from 'react'
import { useMutation, useQueryClient } from '@tanstack/react-query'
import { Plus } from 'lucide-react'
import { toast } from 'sonner'
import axios from 'axios'

import {
  Button,
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
  Input,
  Label,
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
  TextArea,
} from '@/components/ui'
import { createOrganization, CreateOrganizationInput } from '@/lib/apis/org'

const ORG_TYPES = [
  { value: 'UKM', label: 'UKM (Unit Kegiatan Mahasiswa)' },
  { value: 'HIMA', label: 'HIMA (Himpunan Mahasiswa)' },
  { value: 'BEM', label: 'BEM (Badan Eksekutif Mahasiswa)' },
  { value: 'DEMA', label: 'DEMA (Dewan Mahasiswa)' },
  { value: 'OTHER', label: 'Lainnya' },
]

export function CreateOrgDialog() {
  const queryClient = useQueryClient()
  const [open, setOpen] = useState(false)
  const [formData, setFormData] = useState<CreateOrganizationInput>({
    name: '',
    slug: '',
    type: 'UKM',
    description: '',
  })

  const { mutate: create, isPending } = useMutation({
    mutationFn: createOrganization,
    onSuccess: async (org) => {
      await queryClient.invalidateQueries({ queryKey: ['orgs'] })
      toast.success('Organisasi berhasil dibuat', {
        description: `${org?.name} telah ditambahkan.`,
      })
      setOpen(false)
      setFormData({ name: '', slug: '', type: 'UKM', description: '' })
    },
    onError: (err: unknown) => {
      const message = axios.isAxiosError(err)
        ? (err.response?.data as { message?: string } | undefined)?.message || err.message
        : err instanceof Error
          ? err.message
          : 'Gagal membuat organisasi'
      toast.error(message)
    },
  })

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault()
    if (!formData.name || !formData.slug || !formData.type) {
      toast.error('Nama, slug, dan tipe wajib diisi')
      return
    }
    create(formData)
  }

  const generateSlug = (name: string) => {
    return name
      .toLowerCase()
      .replace(/[^a-z0-9\s-]/g, '')
      .replace(/\s+/g, '-')
      .replace(/-+/g, '-')
      .trim()
  }

  return (
    <Dialog open={open} onOpenChange={setOpen}>
      <DialogTrigger asChild>
        <Button size="sm" className="gap-2">
          <Plus className="h-4 w-4" />
          Tambah Organisasi
        </Button>
      </DialogTrigger>
      <DialogContent className="sm:max-w-[500px]">
        <form onSubmit={handleSubmit}>
          <DialogHeader>
            <DialogTitle>Tambah Organisasi Baru</DialogTitle>
            <DialogDescription>
              Buat organisasi baru untuk dikelola di SIMAWA.
            </DialogDescription>
          </DialogHeader>
          <div className="grid gap-4 py-4">
            <div className="grid gap-2">
              <Label htmlFor="name">Nama Organisasi *</Label>
              <Input
                id="name"
                placeholder="Contoh: Himpunan Mahasiswa Teknik Informatika"
                value={formData.name}
                onChange={(e) => {
                  const name = e.target.value
                  setFormData((prev) => ({
                    ...prev,
                    name,
                    slug: prev.slug || generateSlug(name),
                  }))
                }}
              />
            </div>
            <div className="grid gap-2">
              <Label htmlFor="slug">Slug (URL) *</Label>
              <div className="flex items-center gap-2">
                <span className="text-sm text-neutral-500">/org/</span>
                <Input
                  id="slug"
                  placeholder="himtif"
                  value={formData.slug}
                  onChange={(e) =>
                    setFormData((prev) => ({ ...prev, slug: e.target.value.toLowerCase().replace(/[^a-z0-9-]/g, '') }))
                  }
                />
              </div>
            </div>
            <div className="grid gap-2">
              <Label htmlFor="type">Tipe Organisasi *</Label>
              <Select
                value={formData.type}
                onValueChange={(value) => setFormData((prev) => ({ ...prev, type: value }))}
              >
                <SelectTrigger>
                  <SelectValue placeholder="Pilih tipe" />
                </SelectTrigger>
                <SelectContent>
                  {ORG_TYPES.map((type) => (
                    <SelectItem key={type.value} value={type.value}>
                      {type.label}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>
            <div className="grid gap-2">
              <Label htmlFor="description">Deskripsi</Label>
              <TextArea
                id="description"
                placeholder="Deskripsi singkat tentang organisasi..."
                rows={3}
                value={formData.description}
                onChange={(e) => setFormData((prev) => ({ ...prev, description: e.target.value }))}
              />
            </div>
          </div>
          <DialogFooter>
            <Button type="button" variant="outline" onClick={() => setOpen(false)}>
              Batal
            </Button>
            <Button type="submit" disabled={isPending}>
              {isPending ? 'Menyimpan...' : 'Simpan'}
            </Button>
          </DialogFooter>
        </form>
      </DialogContent>
    </Dialog>
  )
}
