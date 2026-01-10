'use client'

import { useState, useCallback } from 'react'
import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query'
import { format } from 'date-fns'
import { id as localeID } from 'date-fns/locale'
import {
  Eye,
  FileText,
  Loader2,
  Plus,
  Save,
  Trash2,
  Upload,
  X,
  Calendar as CalendarIcon,
  LayoutTemplate,
  Building2,
  FileSignature,
} from 'lucide-react'
import { toast } from 'sonner'
import Image from 'next/image'

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
  Popover,
  PopoverContent,
  PopoverTrigger,
  TextArea,
} from '@/components/ui'
import { Calendar } from '@/components/ui/calendar'
import { cn } from '@/lib/utils'
import {
  createTemplate,
  listTemplates,
  deleteTemplate,
  previewSurat,
  type SuratTemplate,
  type CreateSuratPayload,
} from '@/lib/apis/surat'
import { listOrganizations } from '@/lib/apis/org'

type SignerItem = {
  role: string
  name: string
  nip: string
  signature_base64: string
}

type TemplateFormData = {
  // Header / Logo
  logoBase64: string
  logoFileName: string
  
  // Document Info
  documentNumber: string
  documentDate: Date | undefined
  dueDate: Date | undefined
  
  // Organization Info
  orgId: string
  orgName: string
  orgAddress: string
  orgPhone: string
  
  // Recipient
  recipientName: string
  recipientRole: string
  recipientAddress: string
  recipientCity: string
  
  // Content
  subject: string
  opening: string
  bodyContent: string
  closing: string
  
  // Signers
  signers: SignerItem[]
  
  // Footer
  tembusan: string
  notes: string
  terms: string
}

const initialFormData: TemplateFormData = {
  logoBase64: '',
  logoFileName: '',
  documentNumber: '',
  documentDate: undefined,
  dueDate: undefined,
  orgId: '',
  orgName: '',
  orgAddress: '',
  orgPhone: '',
  recipientName: '',
  recipientRole: '',
  recipientAddress: '',
  recipientCity: '',
  subject: '',
  opening: '',
  bodyContent: '',
  closing: '',
  signers: [{ role: '', name: '', nip: '', signature_base64: '' }],
  tembusan: '',
  notes: '',
  terms: '',
}

type Props = {
  onClose?: () => void
}

export function TemplateBuilder({ onClose }: Props) {
  const queryClient = useQueryClient()
  const [form, setForm] = useState<TemplateFormData>(initialFormData)
  const [templateName, setTemplateName] = useState('')
  const [templateVariant, setTemplateVariant] = useState('non_academic')
  const [templateDescription, setTemplateDescription] = useState('')
  const [isPreviewLoading, setIsPreviewLoading] = useState(false)

  const variantOptions = [
    { value: 'non_academic', label: 'Non-Academic' },
    { value: 'academic', label: 'Academic' },
    { value: 'official', label: 'Official' },
    { value: 'internal', label: 'Internal' },
    { value: 'external', label: 'External' },
  ]

  const { data: orgs } = useQuery({
    queryKey: ['orgs'],
    queryFn: listOrganizations,
  })

  const { data: templates, isLoading: templatesLoading } = useQuery<SuratTemplate[]>({
    queryKey: ['surat-templates'],
    queryFn: listTemplates,
  })

  const createMutation = useMutation({
    mutationFn: (payload: Record<string, unknown>) => createTemplate(payload),
    onSuccess: async () => {
      await queryClient.invalidateQueries({ queryKey: ['surat-templates'] })
      toast.success('Template berhasil disimpan')
      setTemplateName('')
      setTemplateDescription('')
    },
    onError: () => {
      toast.error('Gagal menyimpan template')
    },
  })

  const deleteMutation = useMutation({
    mutationFn: (id: number) => deleteTemplate(id),
    onSuccess: async () => {
      await queryClient.invalidateQueries({ queryKey: ['surat-templates'] })
      toast.success('Template dihapus')
    },
    onError: () => {
      toast.error('Gagal menghapus template')
    },
  })

  const handleLogoUpload = useCallback((e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0]
    if (!file) return

    const reader = new FileReader()
    reader.onload = () => {
      const result = reader.result
      if (typeof result === 'string') {
        const base64 = result.includes(',') ? result.split(',')[1] : result
        setForm((prev) => ({
          ...prev,
          logoBase64: base64,
          logoFileName: file.name,
        }))
      }
    }
    reader.readAsDataURL(file)
  }, [])

  const handleSignatureUpload = useCallback((index: number, e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0]
    if (!file) return

    const reader = new FileReader()
    reader.onload = () => {
      const result = reader.result
      if (typeof result === 'string') {
        const base64 = result.includes(',') ? result.split(',')[1] : result
        setForm((prev) => {
          const newSigners = [...prev.signers]
          newSigners[index] = { ...newSigners[index], signature_base64: base64 }
          return { ...prev, signers: newSigners }
        })
      }
    }
    reader.readAsDataURL(file)
  }, [])

  const addSigner = () => {
    setForm((prev) => ({
      ...prev,
      signers: [...prev.signers, { role: '', name: '', nip: '', signature_base64: '' }],
    }))
  }

  const removeSigner = (index: number) => {
    setForm((prev) => ({
      ...prev,
      signers: prev.signers.filter((_, i) => i !== index),
    }))
  }

  const updateSigner = (index: number, field: keyof SignerItem, value: string) => {
    setForm((prev) => {
      const newSigners = [...prev.signers]
      newSigners[index] = { ...newSigners[index], [field]: value }
      return { ...prev, signers: newSigners }
    })
  }

  const buildPayload = (): CreateSuratPayload | null => {
    if (!form.orgId) {
      toast.error('Pilih organisasi terlebih dahulu')
      return null
    }

    const bodyParagraphs = form.bodyContent
      .split(/\n+/)
      .map((p) => p.trim())
      .filter(Boolean)

    const signs = form.signers
      .filter((s) => s.role || s.name || s.nip)
      .map((s) => ({
        role: s.role || '',
        name: s.name || '',
        nip: s.nip || '',
        stamp_base64: '',
        ttd_base64: s.signature_base64 || '',
        stamp_text: '',
      }))

    const header = {
      left_logo: form.logoBase64 || '',
      right_logo: '',
      org_name: form.orgName,
      org_unit: '',
      org_address: form.orgAddress,
      org_phone: form.orgPhone,
    }

    return {
      org_id: form.orgId,
      status: 'DRAFT',
      payload: {
        variant: 'non_academic',
        created_at: new Date().toISOString(),
        header,
        meta: {
          number: form.documentNumber || '',
          subject: form.subject || 'Draft surat',
          to_role: form.recipientRole || '',
          to_name: form.recipientName || '',
          to_place: form.recipientAddress || '',
          to_city: form.recipientCity || '',
          place_and_date: form.documentDate
            ? format(form.documentDate, 'dd MMMM yyyy', { locale: localeID })
            : '',
          lampiran: '',
        },
        body_opening: form.opening || '',
        body_content: bodyParagraphs,
        body_closing: form.closing || '',
        footer: form.notes || '',
        signs,
        tembusan: form.tembusan
          .split('\n')
          .map((t) => t.trim())
          .filter(Boolean),
      },
    }
  }

  const handlePreview = async () => {
    const payload = buildPayload()
    if (!payload) return

    setIsPreviewLoading(true)
    try {
      const blob = await previewSurat(payload)
      const url = URL.createObjectURL(blob)
      window.open(url, '_blank', 'noopener,noreferrer')
      setTimeout(() => URL.revokeObjectURL(url), 60_000)
    } catch {
      toast.error('Gagal membuat preview surat')
    } finally {
      setIsPreviewLoading(false)
    }
  }

  const handleSaveTemplate = async () => {
    if (!templateName.trim()) {
      toast.error('Nama template wajib diisi')
      return
    }

    const payload = buildPayload()
    if (!payload) return

    await createMutation.mutateAsync({
      name: templateName,
      variant: 'non_academic',
      description: templateDescription,
      payload_json: payload.payload,
      theme_json: {},
    })
  }

  return (
    <div className="flex flex-col lg:grid lg:grid-cols-[280px,1fr] gap-4 lg:gap-6">
      {/* Sidebar Templates */}
      <Card className="border-neutral-200 shadow-sm h-fit order-2 lg:order-1">
        <CardHeader className="p-4 border-b border-neutral-100">
          <div className="flex items-center gap-2">
            <LayoutTemplate className="h-4 w-4 text-brand-600" />
            <h3 className="font-semibold text-sm text-neutral-900">Template Tersimpan</h3>
          </div>
        </CardHeader>
        <CardContent className="p-4">
          {templatesLoading ? (
            <div className="flex items-center justify-center py-8 text-sm text-neutral-500">
              <Loader2 className="h-4 w-4 animate-spin mr-2" />
              Memuat...
            </div>
          ) : !templates?.length ? (
            <div className="text-center py-8 text-neutral-500 text-sm">
              <FileText className="h-8 w-8 mx-auto mb-2 text-neutral-300" />
              Belum ada template.
            </div>
          ) : (
            <div className="space-y-3">
              {templates.map((tpl) => (
                <div
                  key={tpl.id}
                  className="group relative p-3 rounded-xl border border-neutral-200 bg-white hover:border-brand-200 hover:shadow-sm transition-all"
                >
                  <div>
                    <p className="font-medium text-sm text-neutral-900 line-clamp-1">{tpl.name}</p>
                    <p className="text-[10px] text-neutral-500 line-clamp-2 mt-1">
                      {tpl.description || 'Tanpa deskripsi'}
                    </p>
                  </div>
                  <div className="absolute top-2 right-2 opacity-0 group-hover:opacity-100 transition-opacity">
                    <Button
                      size="icon"
                      variant="ghost"
                      className="h-6 w-6 text-red-500 hover:text-red-600 hover:bg-red-50"
                      onClick={(e) => {
                        e.stopPropagation()
                        deleteMutation.mutate(tpl.id)
                      }}
                      disabled={deleteMutation.isPending}
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

      {/* Main Builder Form */}
      <Card className="border-neutral-200 shadow-sm order-1 lg:order-2">
        <CardHeader className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 p-4 sm:p-6 border-b border-neutral-100 bg-neutral-50/50">
          <div>
            <CardTitle className="text-base sm:text-lg flex items-center gap-2">
              <FileSignature className="h-5 w-5 text-brand-600" />
              <span className="hidden sm:inline">Builder</span> Template Surat
            </CardTitle>
            <CardDescription className="text-xs sm:text-sm">
              Buat dan simpan struktur surat.
            </CardDescription>
          </div>
          <div className="flex gap-2 w-full sm:w-auto">
            <Button
              variant="outline"
              size="sm"
              onClick={handlePreview}
              disabled={isPreviewLoading}
              className="bg-white flex-1 sm:flex-none"
            >
              {isPreviewLoading ? (
                <Loader2 className="sm:mr-2 h-3.5 w-3.5 animate-spin" />
              ) : (
                <Eye className="sm:mr-2 h-3.5 w-3.5" />
              )}
              <span className="hidden sm:inline">Preview</span>
            </Button>
            <Popover>
              <PopoverTrigger asChild>
                <Button size="sm" className="bg-brand-600 hover:bg-brand-700 text-white flex-1 sm:flex-none">
                  <Save className="sm:mr-2 h-3.5 w-3.5" />
                  <span className="hidden sm:inline">Simpan</span>
                </Button>
              </PopoverTrigger>
              <PopoverContent className="w-80 p-4" align="end">
                <div className="space-y-4">
                  <h4 className="font-medium text-sm">Simpan Template</h4>
                  <div className="space-y-2">
                    <Label className="text-xs">Nama Template</Label>
                    <Input
                      placeholder="Contoh: Undangan Rapat"
                      value={templateName}
                      onChange={(e) => setTemplateName(e.target.value)}
                      className="h-8 text-sm"
                    />
                  </div>
                  <div className="space-y-2">
                    <Label className="text-xs">Varian</Label>
                    <AutoComplete
                      value={templateVariant}
                      options={variantOptions}
                      onSelect={(val) => setTemplateVariant(val || '')}
                      placeholder="Pilih varian..."
                      className="h-8 text-sm"
                      onSearch={(val) => setTemplateVariant(val)}
                    />
                  </div>
                  <div className="space-y-2">
                    <Label className="text-xs">Deskripsi</Label>
                    <TextArea
                      placeholder="Keterangan singkat..."
                      value={templateDescription}
                      onChange={(e) => setTemplateDescription(e.target.value)}
                      className="h-16 text-sm resize-none"
                    />
                  </div>
                  <Button 
                    size="sm" 
                    className="w-full bg-brand-600 hover:bg-brand-700 text-white"
                    onClick={handleSaveTemplate}
                    disabled={createMutation.isPending}
                  >
                    {createMutation.isPending ? (
                      <Loader2 className="mr-2 h-3.5 w-3.5 animate-spin" />
                    ) : (
                      <Save className="mr-2 h-3.5 w-3.5" />
                    )}
                    Simpan
                  </Button>
                </div>
              </PopoverContent>
            </Popover>
          </div>
        </CardHeader>

        <CardContent className="p-6 space-y-8">
          {/* Section: Organisasi */}
          <section className="space-y-4">
            <h4 className="text-sm font-semibold text-neutral-900 flex items-center gap-2 pb-2 border-b border-neutral-100">
              <Building2 className="h-4 w-4 text-brand-500" />
              Identitas Organisasi & Kop Surat
            </h4>
            
            <div className="grid gap-6 md:grid-cols-[120px,1fr]">
              <div className="space-y-2">
                <Label className="text-xs font-medium text-neutral-600">Logo Kiri</Label>
                <div className="relative group">
                  <input
                    type="file"
                    accept=".png,.jpg,.jpeg"
                    onChange={handleLogoUpload}
                    className="hidden"
                    id="logo-upload"
                  />
                  <label
                    htmlFor="logo-upload"
                    className={cn(
                      'flex flex-col items-center justify-center w-full h-24 border-2 border-dashed rounded-lg cursor-pointer transition-all',
                      form.logoBase64
                        ? 'border-brand-200 bg-brand-50/30'
                        : 'border-neutral-200 bg-neutral-50 hover:bg-neutral-100 hover:border-neutral-300'
                    )}
                  >
                    {form.logoBase64 ? (
                      <div className="relative w-full h-full p-2">
                        <Image
                          src={`data:image/png;base64,${form.logoBase64}`}
                          alt="Logo"
                          fill
                          className="object-contain"
                        />
                        <div className="absolute inset-0 bg-black/40 opacity-0 group-hover:opacity-100 transition-opacity rounded-md flex items-center justify-center">
                          <p className="text-white text-[10px] font-medium">Ganti</p>
                        </div>
                      </div>
                    ) : (
                      <div className="flex flex-col items-center text-center p-2">
                        <Upload className="h-4 w-4 text-neutral-400 mb-1" />
                        <span className="text-[10px] text-neutral-500 font-medium">Upload</span>
                        <span className="text-[8px] text-neutral-400">Max 2MB</span>
                      </div>
                    )}
                  </label>
                  {form.logoBase64 && (
                    <button
                      onClick={(e) => {
                        e.preventDefault()
                        setForm((prev) => ({ ...prev, logoBase64: '', logoFileName: '' }))
                      }}
                      className="absolute -top-1.5 -right-1.5 p-0.5 bg-red-500 text-white rounded-full shadow-md hover:bg-red-600 transition-colors opacity-0 group-hover:opacity-100"
                    >
                      <X className="h-2.5 w-2.5" />
                    </button>
                  )}
                </div>
              </div>

              <div className="space-y-4">
                <div className="grid gap-4 sm:grid-cols-2">
                  <div className="space-y-2">
                    <Label className="text-xs">Pilih Organisasi *</Label>
                    <select
                      className="w-full h-9 rounded-md border border-neutral-200 bg-white px-3 text-sm outline-none focus:ring-2 focus:ring-brand-500/20 focus:border-brand-500 transition-all"
                      value={form.orgId}
                      onChange={(e) => {
                        const org = orgs?.find((o) => o.id === e.target.value)
                        setForm((prev) => ({
                          ...prev,
                          orgId: e.target.value,
                          orgName: org?.name || '',
                        }))
                      }}
                    >
                      <option value="">-- Pilih --</option>
                      {(orgs ?? []).map((org) => (
                        <option key={org.id} value={org.id}>
                          {org.name}
                        </option>
                      ))}
                    </select>
                  </div>
                  <div className="space-y-2">
                    <Label className="text-xs">Nama Organisasi (di Kop)</Label>
                    <Input
                      className="h-9"
                      placeholder="Badan Eksekutif Mahasiswa"
                      value={form.orgName}
                      onChange={(e) => setForm((prev) => ({ ...prev, orgName: e.target.value }))}
                    />
                  </div>
                </div>

                <div className="grid gap-4 sm:grid-cols-2">
                  <div className="space-y-2">
                    <Label className="text-xs">Alamat</Label>
                    <Input
                      className="h-9"
                      placeholder="Jl. Jenderal Sudirman..."
                      value={form.orgAddress}
                      onChange={(e) => setForm((prev) => ({ ...prev, orgAddress: e.target.value }))}
                    />
                  </div>
                  <div className="space-y-2">
                    <Label className="text-xs">Kontak / Telepon</Label>
                    <Input
                      className="h-9"
                      placeholder="(021) 555-1234"
                      value={form.orgPhone}
                      onChange={(e) => setForm((prev) => ({ ...prev, orgPhone: e.target.value }))}
                    />
                  </div>
                </div>
              </div>
            </div>
          </section>

          {/* Section: Detail Surat */}
          <section className="space-y-4">
            <h4 className="text-sm font-semibold text-neutral-900 flex items-center gap-2 pb-2 border-b border-neutral-100">
              <FileText className="h-4 w-4 text-brand-500" />
              Detail & Tujuan Surat
            </h4>

            <div className="grid gap-6 md:grid-cols-2">
              <div className="space-y-4">
                <div className="space-y-2">
                  <Label className="text-xs">Nomor Surat</Label>
                  <Input
                    className="h-9"
                    placeholder="001/BEM/XII/2025"
                    value={form.documentNumber}
                    onChange={(e) => setForm((prev) => ({ ...prev, documentNumber: e.target.value }))}
                  />
                </div>
                <div className="space-y-2">
                  <Label className="text-xs">Tanggal Surat</Label>
                  <Popover>
                    <PopoverTrigger asChild>
                      <Button
                        variant="outline"
                        className={cn(
                          'w-full justify-start text-left font-normal h-9 bg-white border-neutral-200',
                          !form.documentDate && 'text-neutral-500'
                        )}
                      >
                        <CalendarIcon className="mr-2 h-4 w-4" />
                        {form.documentDate
                          ? format(form.documentDate, 'dd MMMM yyyy', { locale: localeID })
                          : 'Pilih tanggal'}
                      </Button>
                    </PopoverTrigger>
                    <PopoverContent className="w-auto p-0" align="start">
                      <Calendar
                        mode="single"
                        selected={form.documentDate}
                        onSelect={(date) => setForm((prev) => ({ ...prev, documentDate: date }))}
                        initialFocus
                      />
                    </PopoverContent>
                  </Popover>
                </div>
              </div>

              <div className="space-y-4 bg-neutral-50 p-4 rounded-xl border border-neutral-100">
                <div className="grid gap-4 sm:grid-cols-2">
                  <div className="space-y-2">
                    <Label className="text-xs">Jabatan Penerima</Label>
                    <Input
                      className="h-9 bg-white"
                      placeholder="Rektor"
                      value={form.recipientRole}
                      onChange={(e) => setForm((prev) => ({ ...prev, recipientRole: e.target.value }))}
                    />
                  </div>
                  <div className="space-y-2">
                    <Label className="text-xs">Nama Penerima</Label>
                    <Input
                      className="h-9 bg-white"
                      placeholder="Bapak/Ibu..."
                      value={form.recipientName}
                      onChange={(e) => setForm((prev) => ({ ...prev, recipientName: e.target.value }))}
                    />
                  </div>
                </div>
                <div className="grid gap-4 sm:grid-cols-2">
                  <div className="space-y-2">
                    <Label className="text-xs">Di Tempat / Unit</Label>
                    <Input
                      className="h-9 bg-white"
                      placeholder="Gedung Rektorat"
                      value={form.recipientAddress}
                      onChange={(e) => setForm((prev) => ({ ...prev, recipientAddress: e.target.value }))}
                    />
                  </div>
                  <div className="space-y-2">
                    <Label className="text-xs">Kota</Label>
                    <Input
                      className="h-9 bg-white"
                      placeholder="Tangerang"
                      value={form.recipientCity}
                      onChange={(e) => setForm((prev) => ({ ...prev, recipientCity: e.target.value }))}
                    />
                  </div>
                </div>
              </div>
            </div>
          </section>

          {/* Section: Isi Surat */}
          <section className="space-y-4">
            <h4 className="text-sm font-semibold text-neutral-900 flex items-center gap-2 pb-2 border-b border-neutral-100">
              <LayoutTemplate className="h-4 w-4 text-brand-500" />
              Konten Surat
            </h4>

            <div className="space-y-4">
              <div className="space-y-2">
                <Label className="text-xs">Perihal / Subject</Label>
                <Input
                  className="h-9"
                  placeholder="Undangan Rapat Koordinasi"
                  value={form.subject}
                  onChange={(e) => setForm((prev) => ({ ...prev, subject: e.target.value }))}
                />
              </div>
              
              <div className="space-y-2">
                <Label className="text-xs">Paragraf Pembuka</Label>
                <TextArea
                  className="min-h-[80px]"
                  placeholder="Dengan hormat, sehubungan dengan..."
                  value={form.opening}
                  onChange={(e) => setForm((prev) => ({ ...prev, opening: e.target.value }))}
                />
              </div>

              <div className="space-y-2">
                <Label className="text-xs">Isi Utama (Body)</Label>
                <TextArea
                  className="min-h-[150px]"
                  placeholder="Isi surat secara lengkap. Tekan enter untuk paragraf baru."
                  value={form.bodyContent}
                  onChange={(e) => setForm((prev) => ({ ...prev, bodyContent: e.target.value }))}
                />
              </div>

              <div className="space-y-2">
                <Label className="text-xs">Paragraf Penutup</Label>
                <TextArea
                  className="min-h-[80px]"
                  placeholder="Demikian surat ini kami sampaikan..."
                  value={form.closing}
                  onChange={(e) => setForm((prev) => ({ ...prev, closing: e.target.value }))}
                />
              </div>
            </div>
          </section>

          {/* Section: Signers */}
          <section className="space-y-4">
            <div className="flex items-center justify-between pb-2 border-b border-neutral-100">
              <h4 className="text-sm font-semibold text-neutral-900 flex items-center gap-2">
                <FileSignature className="h-4 w-4 text-brand-500" />
                Penandatangan
              </h4>
              <Button size="sm" variant="outline" onClick={addSigner} className="h-7 text-xs gap-1">
                <Plus className="h-3.5 w-3.5" /> Tambah
              </Button>
            </div>

            <div className="grid gap-4 md:grid-cols-2">
              {form.signers.map((signer, index) => (
                <div key={index} className="p-4 rounded-xl border border-neutral-200 bg-white space-y-4 hover:border-brand-200 transition-colors">
                  <div className="flex items-center justify-between">
                    <Badge variant="secondary" className="bg-neutral-100 text-neutral-600">
                      Pihak #{index + 1}
                    </Badge>
                    {form.signers.length > 1 && (
                      <Button
                        size="icon"
                        variant="ghost"
                        className="h-6 w-6 text-neutral-400 hover:text-red-500"
                        onClick={() => removeSigner(index)}
                      >
                        <X className="h-3.5 w-3.5" />
                      </Button>
                    )}
                  </div>

                  <div className="grid gap-3">
                    <div className="space-y-1">
                      <Label className="text-[10px]">Jabatan</Label>
                      <Input
                        className="h-8 text-xs"
                        placeholder="Ketua Pelaksana"
                        value={signer.role}
                        onChange={(e) => updateSigner(index, 'role', e.target.value)}
                      />
                    </div>
                    <div className="space-y-1">
                      <Label className="text-[10px]">Nama Lengkap</Label>
                      <Input
                        className="h-8 text-xs"
                        placeholder="Nama..."
                        value={signer.name}
                        onChange={(e) => updateSigner(index, 'name', e.target.value)}
                      />
                    </div>
                    <div className="space-y-1">
                      <Label className="text-[10px]">NIP / NIM (Opsional)</Label>
                      <Input
                        className="h-8 text-xs"
                        placeholder="Nomor identitas"
                        value={signer.nip}
                        onChange={(e) => updateSigner(index, 'nip', e.target.value)}
                      />
                    </div>
                  </div>

                  {/* Signature Upload Preview */}
                  <div className="pt-2 border-t border-neutral-100">
                    <div className="flex items-center gap-3">
                      <div className="relative w-16 h-10 border border-dashed rounded bg-neutral-50 flex items-center justify-center overflow-hidden">
                        {signer.signature_base64 ? (
                          <Image
                            src={`data:image/png;base64,${signer.signature_base64}`}
                            alt="Signature"
                            fill
                            className="object-contain p-1"
                          />
                        ) : (
                          <span className="text-[8px] text-neutral-400">No Image</span>
                        )}
                      </div>
                      <div className="flex-1">
                        <Label 
                          htmlFor={`sig-${index}`} 
                          className="cursor-pointer text-xs text-brand-600 font-medium hover:underline"
                        >
                          Upload Tanda Tangan
                        </Label>
                        <input
                          id={`sig-${index}`}
                          type="file"
                          className="hidden"
                          accept=".png,.jpg"
                          onChange={(e) => handleSignatureUpload(index, e)}
                        />
                        {signer.signature_base64 && (
                          <p 
                            className="text-[10px] text-red-500 cursor-pointer hover:underline mt-0.5"
                            onClick={() => updateSigner(index, 'signature_base64', '')}
                          >
                            Hapus gambar
                          </p>
                        )}
                      </div>
                    </div>
                  </div>
                </div>
              ))}
            </div>
          </section>

          {/* Footer Info */}
          <section className="space-y-4 pt-2">
            <div className="grid gap-6 md:grid-cols-2">
              <div className="space-y-2">
                <Label className="text-xs">Tembusan (Opsional)</Label>
                <TextArea
                  rows={3}
                  placeholder={'Rektor\nWakil Rektor\nArsip'}
                  value={form.tembusan}
                  onChange={(e) => setForm((prev) => ({ ...prev, tembusan: e.target.value }))}
                />
              </div>
              <div className="space-y-2">
                <Label className="text-xs">Catatan Kaki (Footer Note)</Label>
                <TextArea
                  rows={3}
                  placeholder="Dokumen ini dicetak otomatis oleh sistem..."
                  value={form.notes}
                  onChange={(e) => setForm((prev) => ({ ...prev, notes: e.target.value }))}
                />
              </div>
            </div>
          </section>
        </CardContent>
      </Card>
    </div>
  )
}
