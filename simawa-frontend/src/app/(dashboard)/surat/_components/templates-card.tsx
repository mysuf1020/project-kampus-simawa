'use client'

import { FormEvent, useState } from 'react'
import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query'
import { FileText, Loader2, RefreshCw, Plus, Trash2, FileSignature } from 'lucide-react'
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
  Input,
  Label,
  Spinner,
} from '@/components/ui'
import {
  createTemplate,
  deleteTemplate,
  listTemplates,
  renderFromTemplate,
  type SuratTemplate,
} from '@/lib/apis/surat'

type Props = {
  orgId?: string
}

export function SuratTemplatesCard({ orgId }: Props) {
  const queryClient = useQueryClient()

  const {
    data: templates,
    isLoading,
    isError,
    isFetching,
    refetch,
  } = useQuery<SuratTemplate[]>({
    queryKey: ['surat-templates'],
    queryFn: listTemplates,
  })

  const { mutateAsync: create, isPending: isCreating } = useMutation({
    mutationFn: (payload: { name: string; variant: string; description?: string }) =>
      createTemplate(payload),
    onSuccess: async () => {
      await queryClient.invalidateQueries({ queryKey: ['surat-templates'] })
      toast.success('Template surat dibuat')
    },
    onError: () => {
      toast.error('Gagal membuat template surat')
    },
  })

  const { mutateAsync: remove, isPending: isDeleting } = useMutation({
    mutationFn: (id: number) => deleteTemplate(id),
    onSuccess: async () => {
      await queryClient.invalidateQueries({ queryKey: ['surat-templates'] })
      toast.success('Template dihapus')
    },
    onError: () => {
      toast.error('Gagal menghapus template')
    },
  })

  const { mutateAsync: render, isPending: isRendering } = useMutation({
    mutationFn: (template: SuratTemplate) =>
      renderFromTemplate({
        template_id: template.id,
        overrides: {},
        org_id: orgId,
        target_org_id: '',
        status: 'DRAFT',
      }),
  })

  const [name, setName] = useState('')
  const [variant, setVariant] = useState('non_academic')
  const [description, setDescription] = useState('')

  const variantOptions = [
    { value: 'non_academic', label: 'Non-Academic' },
    { value: 'academic', label: 'Academic' },
    { value: 'official', label: 'Official' },
    { value: 'internal', label: 'Internal' },
    { value: 'external', label: 'External' },
  ]

  const handleCreate = async (e: FormEvent) => {
    e.preventDefault()
    if (!name) {
      toast.error('Nama template wajib diisi')
      return
    }
    await create({ name, variant, description })
    setName('')
    setDescription('')
  }

  const handleRender = async (tpl: SuratTemplate) => {
    if (!orgId) {
      toast.error('Pilih organisasi dulu sebelum render dari template')
      return
    }
    try {
      const result = await render(tpl)
      const url = result?.data?.file_url || result?.data?.url || result?.url
      if (url && typeof window !== 'undefined') {
        window.open(url, '_blank', 'noopener,noreferrer')
      } else {
        toast.success('Berhasil render surat, tetapi URL tidak tersedia')
      }
    } catch (err) {
      console.error(err)
      toast.error('Gagal render surat dari template')
    }
  }

  return (
    <Card className="border-neutral-200 shadow-sm">
      <CardHeader className="flex flex-row items-center justify-between border-b border-neutral-100 bg-neutral-50/50 px-6 py-4">
        <div className="flex items-center gap-3">
          <div className="flex h-10 w-10 items-center justify-center rounded-lg bg-blue-50 text-blue-600">
            <FileText className="h-5 w-5" />
          </div>
          <div>
            <CardTitle className="text-base font-semibold text-neutral-900">Template Surat</CardTitle>
            <CardDescription className="text-xs text-neutral-500">
              Kelola template surat dan buat PDF dari template.
            </CardDescription>
          </div>
        </div>
        <Button
          variant="ghost"
          size="sm"
          className="h-8 text-xs font-medium text-neutral-600 hover:text-brand-600 hover:bg-brand-50"
          onClick={() => refetch()}
          disabled={isFetching}
        >
          {isFetching ? (
            <Loader2 className="mr-1.5 h-3.5 w-3.5 animate-spin" />
          ) : (
            <RefreshCw className="mr-1.5 h-3.5 w-3.5" />
          )}
          Refresh
        </Button>
      </CardHeader>
      
      <CardContent className="p-6 space-y-6">
        <form
          className="space-y-4 rounded-xl border border-neutral-200 bg-white p-4 shadow-sm"
          onSubmit={handleCreate}
        >
          <h4 className="text-sm font-medium text-neutral-900 flex items-center gap-2">
            <Plus className="h-4 w-4 text-brand-600" />
            Tambah Template Baru
          </h4>
          
          <div className="grid gap-4 sm:grid-cols-3">
            <div className="space-y-1.5">
              <Label className="text-xs font-medium text-neutral-600">Nama Template</Label>
              <Input
                value={name}
                onChange={(e) => setName(e.target.value)}
                placeholder="cth: template_undangan"
                className="h-9 text-sm"
              />
            </div>
            <div className="space-y-1.5">
              <Label className="text-xs font-medium text-neutral-600">Varian</Label>
              <AutoComplete
                value={variant}
                options={variantOptions}
                onSelect={(val) => setVariant(val || '')}
                placeholder="Pilih varian..."
                className="h-9 text-sm"
                onSearch={(val) => setVariant(val)}
              />
            </div>
            <div className="space-y-1.5">
              <Label className="text-xs font-medium text-neutral-600">Deskripsi</Label>
              <Input
                value={description}
                onChange={(e) => setDescription(e.target.value)}
                placeholder="Deskripsi singkat..."
                className="h-9 text-sm"
              />
            </div>
          </div>
          
          <div className="flex justify-end">
            <Button type="submit" size="sm" disabled={isCreating} className="bg-brand-600 hover:bg-brand-700 text-white h-8 text-xs">
              {isCreating ? (
                <Loader2 className="mr-1.5 h-3.5 w-3.5 animate-spin" />
              ) : (
                <FileSignature className="mr-1.5 h-3.5 w-3.5" />
              )}
              Simpan Template
            </Button>
          </div>
        </form>

        <div className="space-y-3">
          <h4 className="text-sm font-medium text-neutral-900">Daftar Template</h4>
          
          {isLoading ? (
            <div className="flex items-center justify-center py-8 text-xs text-neutral-500">
              <Spinner size="sm" className="mr-2 text-brand-600" /> Memuat template surat...
            </div>
          ) : isError ? (
            <div className="p-4 rounded-lg bg-red-50 text-red-600 text-xs text-center border border-red-100">
              Gagal memuat template surat.
            </div>
          ) : (!templates || templates.length === 0) ? (
            <div className="text-center py-8 text-sm text-neutral-500 bg-neutral-50 rounded-lg border border-neutral-100">
              Belum ada template tersimpan.
            </div>
          ) : (
            <div className="space-y-2">
              {templates.map((tpl) => (
                <div
                  key={tpl.id}
                  className="group flex items-center justify-between p-3 rounded-lg border border-neutral-100 bg-white hover:border-brand-200 hover:shadow-sm transition-all"
                >
                  <div className="space-y-0.5">
                    <div className="flex items-center gap-2">
                      <p className="font-semibold text-sm text-neutral-900">{tpl.name}</p>
                      <Badge variant="outline" className="text-[10px] h-5 px-1.5 font-normal bg-neutral-50 text-neutral-500 border-neutral-200">
                        #{tpl.id}
                      </Badge>
                    </div>
                    <p className="text-xs text-neutral-500">
                      {tpl.variant || 'Standard'} • {tpl.description || 'Tanpa deskripsi'}
                    </p>
                  </div>
                  
                  <div className="flex items-center gap-2 opacity-0 group-hover:opacity-100 transition-opacity">
                    <Button
                      size="sm"
                      variant="ghost"
                      className="h-8 px-2 text-xs text-brand-600 hover:text-brand-700 hover:bg-brand-50"
                      disabled={isRendering}
                      onClick={() => handleRender(tpl)}
                    >
                      {isRendering ? (
                        <Loader2 className="mr-1.5 h-3.5 w-3.5 animate-spin" />
                      ) : (
                        <FileText className="mr-1.5 h-3.5 w-3.5" />
                      )}
                      Render PDF
                    </Button>
                    <Button
                      size="icon"
                      variant="ghost"
                      className="h-8 w-8 text-neutral-400 hover:text-red-600 hover:bg-red-50"
                      disabled={isDeleting}
                      onClick={() => remove(tpl.id)}
                    >
                      <Trash2 className="h-4 w-4" />
                    </Button>
                  </div>
                </div>
              ))}
            </div>
          )}
        </div>
      </CardContent>
    </Card>
  )
}
