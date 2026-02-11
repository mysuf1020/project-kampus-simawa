'use client'

import { useEffect, useMemo, useState, Suspense } from 'react'
import { useRouter, useSearchParams } from 'next/navigation'
import { useMutation, useQuery } from '@tanstack/react-query'
import { Eye, SendHorizonal, Plus, X, Upload, FileText, ArrowLeft, FileUp } from 'lucide-react'
import { toast } from 'sonner'

import {
  Badge,
  Button,
  Card,
  CardContent,
  Container,
  Flex,
  Input,
  InputFile,
  Label,
  Switch,
  Text,
  TextArea,
  Title,
  Spinner,
} from '@/components/ui'
import { Page } from '@/components/commons'
import { listOrganizations } from '@/lib/apis/org'
import {
  createSurat,
  previewSurat,
  submitSurat,
  downloadSurat,
  uploadSurat,
  type CreateSuratPayload,
  type UploadSuratPayload,
} from '@/lib/apis/surat'
// Tidak lagi embed PDF, preview dibuka di tab baru lewat endpoint /v1/surat/preview
import {
  useSuratCreateState,
  type SuratCreateForm,
  SURAT_VARIANTS,
  type SuratVariant,
} from '@/features/surat/surat-create.atoms'

function buildPayload(form: SuratCreateForm): CreateSuratPayload | null {
  if (!form.orgId) return null

  const bodyParagraphs = form.body
    .split(/\n+/)
    .map((p) => p.trim())
    .filter(Boolean)

  const signs =
    form.signers
      ?.filter((s) => s.role || s.name || s.nip)
      .map((s) => ({
        role: s.role || '',
        name: s.name || '',
        nip: s.nip || '',
        stamp_base64: '',
        ttd_base64: '',
        stamp_text: '',
      })) ?? []

  const orgName = form.headerOrgName.trim()
  const orgUnit = form.headerOrgUnit.trim()
  const orgAddress = form.headerAddress.trim()
  const orgPhone = form.headerPhone.trim()
  const leftLogo = form.headerLeftLogo?.trim()
  const rightLogo = form.headerRightLogo?.trim()
  const hasHeader =
    Boolean(form.useCustomHeader) &&
    Boolean(orgName || orgUnit || orgAddress || orgPhone || leftLogo || rightLogo)

  const header = hasHeader
    ? {
        title: [] as string[],
        left_logo: leftLogo || '',
        right_logo: rightLogo || '',
        org_name: orgName,
        org_unit: orgUnit,
        org_address: orgAddress,
        org_phone: orgPhone,
      }
    : undefined

  return {
    org_id: form.orgId,
    target_org_id: form.targetOrgId || undefined,
    status: 'DRAFT',
    payload: {
      variant: form.variant || 'PEMINJAMAN',
      created_at: new Date().toISOString(),
      ...(header ? { header } : {}),
      meta: {
        number: form.number || '',
        subject: form.subject || 'Draft surat',
        to_role: form.toRole || '',
        to_name: form.toName || '',
        to_place: form.toPlace || '',
        to_city: form.toCity || '',
        place_and_date: form.placeAndDate || '',
        lampiran: form.lampiran || '',
      },
      body_opening: form.opening || '',
      body_content: bodyParagraphs,
      body_closing: form.closing || '',
      footer: '',
      signs,
      tembusan:
        form.tembusan
          ?.split('\n')
          .map((t) => t.trim())
          .filter(Boolean) ?? [],
    },
  }
}

type CreateMode = 'select' | 'form' | 'upload'

function StepIndicator({ step }: { step: number }) {
  const steps = ['Info surat', 'Isi & penerima', 'Tanda tangan & kirim']
  return (
    <Flex gap="2" className="flex-wrap items-center">
      {steps.map((label, idx) => (
        <Flex key={label} gap="1" className="items-center">
          <Badge
            variant={idx === step ? 'default' : 'outline'}
            className={
              idx === step ? 'bg-green-500 text-white' : 'border-green-200 text-green-700'
            }
          >
            {idx + 1}
          </Badge>
          <Text
            level="xs"
            className={idx === step ? 'text-green-700' : 'text-neutral-500'}
          >
            {label}
          </Text>
          {idx < steps.length - 1 && (
            <div className="mx-1 h-px w-6 bg-gradient-to-r from-green-200 to-transparent" />
          )}
        </Flex>
      ))}
    </Flex>
  )
}

function ModeSelector({ onSelect }: { onSelect: (mode: CreateMode) => void }) {
  return (
    <div className="grid gap-6 md:grid-cols-2 max-w-3xl mx-auto">
      <button
        onClick={() => onSelect('form')}
        className="group relative flex flex-col items-center gap-4 p-8 rounded-2xl border-2 border-neutral-200 bg-white hover:border-brand-500 hover:shadow-lg hover:shadow-brand-500/10 transition-all duration-300"
      >
        <div className="w-16 h-16 rounded-2xl bg-brand-50 flex items-center justify-center group-hover:bg-brand-100 group-hover:scale-110 transition-all">
          <FileText className="w-8 h-8 text-brand-600" />
        </div>
        <div className="text-center space-y-2">
          <h3 className="text-lg font-semibold text-neutral-900">Isi Form Surat</h3>
          <p className="text-sm text-neutral-500">
            Buat surat baru dengan mengisi formulir langkah demi langkah. Sistem akan generate PDF secara otomatis.
          </p>
        </div>
        <div className="absolute top-3 right-3">
          <Badge variant="secondary" className="bg-brand-50 text-brand-700 text-[10px]">
            Rekomendasi
          </Badge>
        </div>
      </button>

      <button
        onClick={() => onSelect('upload')}
        className="group flex flex-col items-center gap-4 p-8 rounded-2xl border-2 border-neutral-200 bg-white hover:border-green-500 hover:shadow-lg hover:shadow-green-500/10 transition-all duration-300"
      >
        <div className="w-16 h-16 rounded-2xl bg-green-50 flex items-center justify-center group-hover:bg-green-100 group-hover:scale-110 transition-all">
          <FileUp className="w-8 h-8 text-green-600" />
        </div>
        <div className="text-center space-y-2">
          <h3 className="text-lg font-semibold text-neutral-900">Upload Surat</h3>
          <p className="text-sm text-neutral-500">
            Upload file surat yang sudah jadi dalam format PDF. Cocok untuk surat yang sudah dibuat sebelumnya.
          </p>
        </div>
      </button>
    </div>
  )
}

function SuratCreatePageInner() {
  const router = useRouter()
  const searchParams = useSearchParams()
  const callback = searchParams.get('callback') || '/surat'

  const [mode, setMode] = useState<CreateMode>('select')
  const [uploadForm, setUploadForm] = useState({
    orgId: '',
    targetOrgId: '',
    variant: 'PEMINJAMAN' as SuratVariant,
    subject: '',
    number: '',
    toRole: '',
    toName: '',
    file: null as File | null,
  })

  const { data: orgs } = useQuery({ queryKey: ['orgs'], queryFn: listOrganizations })

  const { step, form, setForm, errors, goNext, goPrev, reset } = useSuratCreateState()

  const createMutation = useMutation({
    mutationFn: async (payload: CreateSuratPayload) => {
      const surat = await createSurat(payload)
      if (surat?.id) {
        await submitSurat(surat.id)
        try {
          const res = await downloadSurat(surat.id)
          const url = res?.url
          if (url && typeof window !== 'undefined') {
            window.open(url, '_blank', 'noopener,noreferrer')
          }
        } catch {
          // download optional; abaikan jika gagal
        }
      }
      return surat
    },
    onSuccess: () => {
      toast.success('Surat berhasil dibuat dan dikirim')
      reset()
      router.push(callback)
    },
    onError: () => {
      toast.error('Gagal membuat surat')
    },
  })

  const uploadMutation = useMutation({
    mutationFn: async (payload: UploadSuratPayload) => {
      const surat = await uploadSurat(payload)
      if (surat?.id) {
        await submitSurat(surat.id)
      }
      return surat
    },
    onSuccess: () => {
      toast.success('Surat berhasil diupload dan dikirim')
      setUploadForm({ orgId: '', targetOrgId: '', variant: 'PEMINJAMAN', subject: '', number: '', toRole: '', toName: '', file: null })
      router.push(callback)
    },
    onError: () => {
      toast.error('Gagal mengupload surat')
    },
  })

  useEffect(() => {
    if (!form.orgId && orgs?.length) {
      setForm({ ...form, orgId: orgs[0].id })
    }
    if (!uploadForm.orgId && orgs?.length) {
      setUploadForm((prev) => ({ ...prev, orgId: orgs[0].id }))
    }
  }, [form, orgs, setForm, uploadForm.orgId])

  const hasSigner = form.signers?.some((s) => s.role || s.name || s.nip) ?? false

  const hasContent =
    form.subject || form.opening || form.body || form.closing || hasSigner

  const currentOrgName = useMemo(
    () => orgs?.find((o) => o.id === form.orgId)?.name ?? '',
    [orgs, form.orgId],
  )

  const handlePreview = async () => {
    const payload = buildPayload(form)
    if (!payload) {
      toast.error('Organisasi masih kosong')
      return
    }
    try {
      const blob = await previewSurat(payload)
      const url = URL.createObjectURL(blob)
      window.open(url, '_blank', 'noopener,noreferrer')
      setTimeout(() => URL.revokeObjectURL(url), 60_000)
    } catch {
      toast.error('Gagal membuat preview surat')
    }
  }

  const handleSubmit = async () => {
    const payload = buildPayload(form)
    if (!payload) {
      toast.error('Organisasi masih kosong')
      return
    }
    await createMutation.mutateAsync(payload)
  }

  const handleUploadSubmit = async () => {
    if (!uploadForm.orgId) {
      toast.error('Pilih organisasi terlebih dahulu')
      return
    }
    if (!uploadForm.subject) {
      toast.error('Perihal surat wajib diisi')
      return
    }
    if (!uploadForm.file) {
      toast.error('Pilih file PDF untuk diupload')
      return
    }
    await uploadMutation.mutateAsync({
      org_id: uploadForm.orgId,
      target_org_id: uploadForm.targetOrgId || undefined,
      subject: uploadForm.subject,
      number: uploadForm.number || undefined,
      to_role: uploadForm.toRole || undefined,
      to_name: uploadForm.toName || undefined,
      variant: uploadForm.variant,
      file: uploadForm.file,
    })
  }

  // Mode selection screen
  if (mode === 'select') {
    return (
      <Page>
        <Page.Header
          breadcrumbs={[
            { href: '/dashboard', children: 'Dashboard' },
            { href: '/surat', children: 'Surat' },
            { href: '/surat/create', children: 'Buat Surat' },
          ]}
        >
          <div className="flex flex-col gap-4">
            <div>
              <h1 className="text-2xl font-bold tracking-tight text-neutral-900">
                Buat Surat Baru
              </h1>
              <p className="mt-1 text-sm text-neutral-500">
                Pilih metode pembuatan surat yang sesuai dengan kebutuhan Anda.
              </p>
            </div>
          </div>
        </Page.Header>

        <Page.Body>
          <Container>
            <div className="py-12">
              <ModeSelector onSelect={setMode} />
            </div>
          </Container>
        </Page.Body>
      </Page>
    )
  }

  // Upload mode screen
  if (mode === 'upload') {
    return (
      <div className="min-h-screen bg-neutral-50/50">
        {/* Compact Header - same as form mode */}
        <div className="sticky top-0 z-10 bg-white border-b border-neutral-200 shadow-sm">
          <Container>
            <div className="flex items-center justify-between py-3">
              <div className="flex items-center gap-3">
                <button
                  onClick={() => setMode('select')}
                  className="p-2 -ml-2 rounded-lg hover:bg-neutral-100 transition-colors"
                >
                  <ArrowLeft className="w-5 h-5 text-neutral-600" />
                </button>
                <div>
                  <h1 className="text-lg font-bold text-neutral-900">Upload Surat</h1>
                  <p className="text-xs text-neutral-500">Upload file PDF yang sudah jadi</p>
                </div>
              </div>
            </div>
          </Container>
        </div>

        {/* Main Content */}
        <Container className="py-6">
          <div className="max-w-2xl mx-auto">
            <Card className="border-neutral-200 shadow-sm">
              <CardContent className="space-y-6 p-6">
                  <div className="grid gap-4 md:grid-cols-2">
                    <div className="space-y-2">
                      <Label className="text-sm font-medium text-neutral-700">
                        Organisasi Pengirim <span className="text-red-500">*</span>
                      </Label>
                      <select
                        className="w-full h-10 rounded-lg border border-neutral-200 bg-white px-3 text-sm outline-none focus:border-brand-500 focus:ring-2 focus:ring-brand-500/20 transition-all"
                        value={uploadForm.orgId}
                        onChange={(e) => setUploadForm({ ...uploadForm, orgId: e.target.value })}
                      >
                        {(orgs ?? []).map((org) => (
                          <option key={org.id} value={org.id}>
                            {org.name}
                          </option>
                        ))}
                      </select>
                    </div>
                    <div className="space-y-2">
                      <Label className="text-sm font-medium text-neutral-700">
                        Organisasi Tujuan
                      </Label>
                      <select
                        className="w-full h-10 rounded-lg border border-neutral-200 bg-white px-3 text-sm outline-none focus:border-brand-500 focus:ring-2 focus:ring-brand-500/20 transition-all"
                        value={uploadForm.targetOrgId}
                        onChange={(e) => setUploadForm({ ...uploadForm, targetOrgId: e.target.value })}
                      >
                        <option value="">— Tidak ditentukan —</option>
                        {(orgs ?? []).filter((o) => o.id !== uploadForm.orgId).map((org) => (
                          <option key={org.id} value={org.id}>
                            {org.name}
                          </option>
                        ))}
                      </select>
                      <p className="text-[11px] text-neutral-400">Kosongkan jika surat bersifat umum</p>
                    </div>
                  </div>

                  <div className="grid gap-4 md:grid-cols-2">
                    <div className="space-y-2">
                      <Label className="text-sm font-medium text-neutral-700">
                        Jenis Surat <span className="text-red-500">*</span>
                      </Label>
                      <select
                        className="w-full h-10 rounded-lg border border-neutral-200 bg-white px-3 text-sm outline-none focus:border-brand-500 focus:ring-2 focus:ring-brand-500/20 transition-all"
                        value={uploadForm.variant}
                        onChange={(e) => setUploadForm({ ...uploadForm, variant: e.target.value as SuratVariant })}
                      >
                        {SURAT_VARIANTS.map((v) => (
                          <option key={v.value} value={v.value}>
                            {v.label}
                          </option>
                        ))}
                      </select>
                    </div>
                    <div className="space-y-2">
                      <Label className="text-sm font-medium text-neutral-700">
                        Perihal Surat <span className="text-red-500">*</span>
                      </Label>
                      <Input
                        placeholder="Contoh: Undangan Rapat Koordinasi"
                        value={uploadForm.subject}
                        onChange={(e) => setUploadForm({ ...uploadForm, subject: e.target.value })}
                      />
                    </div>
                  </div>

                  <div className="space-y-2">
                    <Label className="text-sm font-medium text-neutral-700">
                      Nomor Surat
                    </Label>
                    <Input
                      placeholder="001/BEM/XII/2025"
                      value={uploadForm.number}
                      onChange={(e) => setUploadForm({ ...uploadForm, number: e.target.value })}
                    />
                  </div>

                  <div className="grid gap-4 md:grid-cols-2">
                    <div className="space-y-2">
                      <Label className="text-sm font-medium text-neutral-700">
                        Jabatan Penerima
                      </Label>
                      <Input
                        placeholder="Contoh: Rektor"
                        value={uploadForm.toRole}
                        onChange={(e) => setUploadForm({ ...uploadForm, toRole: e.target.value })}
                      />
                    </div>
                    <div className="space-y-2">
                      <Label className="text-sm font-medium text-neutral-700">
                        Nama Penerima
                      </Label>
                      <Input
                        placeholder="Bapak/Ibu Nama Lengkap"
                        value={uploadForm.toName}
                        onChange={(e) => setUploadForm({ ...uploadForm, toName: e.target.value })}
                      />
                    </div>
                  </div>

                  <div className="space-y-2">
                    <Label className="text-sm font-medium text-neutral-700">
                      File Surat (PDF) <span className="text-red-500">*</span>
                    </Label>
                    <div className="border-2 border-dashed border-neutral-200 rounded-xl p-6 hover:border-brand-300 transition-colors">
                      <input
                        type="file"
                        accept=".pdf"
                        onChange={(e) => {
                          const file = e.target.files?.[0] || null
                          setUploadForm({ ...uploadForm, file })
                        }}
                        className="hidden"
                        id="surat-file-upload"
                      />
                      <label
                        htmlFor="surat-file-upload"
                        className="flex flex-col items-center gap-3 cursor-pointer"
                      >
                        {uploadForm.file ? (
                          <>
                            <div className="w-12 h-12 rounded-xl bg-green-100 flex items-center justify-center">
                              <FileText className="w-6 h-6 text-green-600" />
                            </div>
                            <div className="text-center">
                              <p className="font-medium text-neutral-900">{uploadForm.file.name}</p>
                              <p className="text-xs text-neutral-500 mt-1">
                                {(uploadForm.file.size / 1024 / 1024).toFixed(2)} MB
                              </p>
                            </div>
                            <Button
                              type="button"
                              variant="outline"
                              size="sm"
                              onClick={(e) => {
                                e.preventDefault()
                                setUploadForm({ ...uploadForm, file: null })
                              }}
                            >
                              Ganti File
                            </Button>
                          </>
                        ) : (
                          <>
                            <div className="w-12 h-12 rounded-xl bg-neutral-100 flex items-center justify-center">
                              <Upload className="w-6 h-6 text-neutral-400" />
                            </div>
                            <div className="text-center">
                              <p className="font-medium text-neutral-700">Klik untuk upload</p>
                              <p className="text-xs text-neutral-500 mt-1">
                                Format: PDF (Maks. 10MB)
                              </p>
                            </div>
                          </>
                        )}
                      </label>
                    </div>
                  </div>

                  <div className="flex items-center justify-between pt-4 border-t border-neutral-100">
                    <Button
                      type="button"
                      variant="ghost"
                      onClick={() => setMode('select')}
                      className="text-neutral-600"
                    >
                      <ArrowLeft className="mr-2 h-4 w-4" /> Kembali
                    </Button>
                    <Button
                      type="button"
                      onClick={handleUploadSubmit}
                      disabled={!uploadForm.file || !uploadForm.subject || uploadMutation.isPending}
                      className="bg-green-600 hover:bg-green-700 text-white min-w-[140px]"
                    >
                      {uploadMutation.isPending ? (
                        <Spinner className="mr-2 h-4 w-4 text-white" />
                      ) : (
                        <SendHorizonal className="mr-2 h-4 w-4" />
                      )}
                      Kirim Surat
                    </Button>
                  </div>
                </CardContent>
              </Card>
            </div>
          </Container>
        </div>
    )
  }

  // Form mode (existing form)
  return (
    <div className="min-h-screen bg-neutral-50/50">
      {/* Compact Header */}
      <div className="sticky top-0 z-10 bg-white border-b border-neutral-200 shadow-sm">
        <Container>
          <div className="flex items-center justify-between py-3">
            <div className="flex items-center gap-3">
              <button
                onClick={() => setMode('select')}
                className="p-2 -ml-2 rounded-lg hover:bg-neutral-100 transition-colors"
              >
                <ArrowLeft className="w-5 h-5 text-neutral-600" />
              </button>
              <div>
                <h1 className="text-lg font-bold text-neutral-900">Buat Surat</h1>
                <div className="flex items-center gap-2 mt-0.5">
                  <StepIndicator step={step} />
                </div>
              </div>
            </div>
            <div className="flex items-center gap-2">
              <Button
                type="button"
                variant="outline"
                size="sm"
                onClick={handlePreview}
                disabled={!hasContent}
                className="hidden sm:flex gap-2"
              >
                <Eye className="h-4 w-4" /> Preview
              </Button>
            </div>
          </div>
        </Container>
      </div>

      {/* Main Content */}
      <Container className="py-6">
        <div className="max-w-3xl mx-auto">
          <Card className="border-neutral-200 shadow-sm">
            <CardContent className="p-6">
              {/* Organization Info - Compact */}
              <div className="flex items-center gap-3 mb-6 pb-4 border-b border-neutral-100">
                <div className="w-10 h-10 rounded-lg bg-brand-100 flex items-center justify-center">
                  <FileText className="w-5 h-5 text-brand-600" />
                </div>
                <div className="flex-1 min-w-0">
                  <p className="text-sm font-medium text-neutral-900">
                    {currentOrgName || 'Pilih Organisasi'}
                  </p>
                  <p className="text-xs text-neutral-500 truncate">
                    {form.subject || 'Perihal belum diisi'}
                  </p>
                </div>
              </div>

              {/* Form Fields */}
              <div className="space-y-6">
                <div className="grid gap-4 sm:grid-cols-2">
                  <div className="space-y-2">
                    <Label className="text-sm font-medium text-neutral-700">
                      Organisasi Pengirim <span className="text-red-500">*</span>
                    </Label>
                    <select
                      className="w-full h-10 rounded-lg border border-neutral-200 bg-white px-3 text-sm outline-none focus:border-brand-500 focus:ring-2 focus:ring-brand-500/20 transition-all"
                      value={form.orgId}
                      onChange={(e) => setForm({ ...form, orgId: e.target.value })}
                    >
                      {(orgs ?? []).map((org) => (
                        <option key={org.id} value={org.id}>
                          {org.name}
                        </option>
                      ))}
                    </select>
                    {errors.orgId && (
                      <p className="text-xs text-red-600">{errors.orgId}</p>
                    )}
                  </div>
                  <div className="space-y-2">
                    <Label className="text-sm font-medium text-neutral-700">
                      Organisasi Tujuan
                    </Label>
                    <select
                      className="w-full h-10 rounded-lg border border-neutral-200 bg-white px-3 text-sm outline-none focus:border-brand-500 focus:ring-2 focus:ring-brand-500/20 transition-all"
                      value={form.targetOrgId}
                      onChange={(e) => setForm({ ...form, targetOrgId: e.target.value })}
                    >
                      <option value="">— Tidak ditentukan —</option>
                      {(orgs ?? []).filter((o) => o.id !== form.orgId).map((org) => (
                        <option key={org.id} value={org.id}>
                          {org.name}
                        </option>
                      ))}
                    </select>
                    <p className="text-[11px] text-neutral-400">Kosongkan jika surat bersifat umum</p>
                  </div>
                </div>
                <div className="grid gap-4 sm:grid-cols-3">
                  <div className="space-y-2">
                    <Label className="text-sm font-medium text-neutral-700">
                      Jenis Surat <span className="text-red-500">*</span>
                    </Label>
                    <select
                      className="w-full h-10 rounded-lg border border-neutral-200 bg-white px-3 text-sm outline-none focus:border-brand-500 focus:ring-2 focus:ring-brand-500/20 transition-all"
                      value={form.variant}
                      onChange={(e) => setForm({ ...form, variant: e.target.value as SuratVariant })}
                    >
                      {SURAT_VARIANTS.map((v) => (
                        <option key={v.value} value={v.value}>
                          {v.label}
                        </option>
                      ))}
                    </select>
                  </div>
                  <div className="space-y-2">
                    <Label className="text-sm font-medium text-neutral-700">
                      Tempat & Tanggal <span className="text-red-500">*</span>
                    </Label>
                    <Input
                      placeholder="Tangerang, 07 Desember 2025"
                      value={form.placeAndDate}
                      onChange={(e) => setForm({ ...form, placeAndDate: e.target.value })}
                      className={errors.placeAndDate ? 'border-red-500' : ''}
                    />
                    {errors.placeAndDate && (
                      <p className="text-xs text-red-600">{errors.placeAndDate}</p>
                    )}
                  </div>
                </div>

                {step === 0 && (
                  <div className="space-y-6 animate-in fade-in-50 duration-300">
                    {/* Kop Surat Toggle */}
                    <div className="flex items-center justify-between p-4 rounded-lg bg-neutral-50 border border-neutral-100">
                      <div>
                        <p className="text-sm font-medium text-neutral-900">Kop Surat Custom</p>
                        <p className="text-xs text-neutral-500">Aktifkan jika ingin menggunakan kop surat khusus untuk surat ini.</p>
                      </div>
                      <Switch
                        checked={Boolean(form.useCustomHeader)}
                        onCheckedChange={(checked) => setForm({ ...form, useCustomHeader: checked })}
                      />
                    </div>

                    {form.useCustomHeader && (
                      <div className="space-y-4 p-4 rounded-lg border border-neutral-200 bg-white">
                        <div className="grid gap-4 sm:grid-cols-2">
                          <div className="space-y-2">
                            <Label className="text-xs">Nama Instansi</Label>
                            <Input
                              placeholder="Universitas Raharja"
                              value={form.headerOrgName}
                              onChange={(e) => setForm({ ...form, headerOrgName: e.target.value })}
                            />
                          </div>
                          <div className="space-y-2">
                            <Label className="text-xs">Unit / Organisasi</Label>
                            <Input
                              placeholder="Badan Eksekutif Mahasiswa"
                              value={form.headerOrgUnit}
                              onChange={(e) => setForm({ ...form, headerOrgUnit: e.target.value })}
                            />
                          </div>
                        </div>
                        <div className="grid gap-4 sm:grid-cols-2">
                          <div className="space-y-2">
                            <Label className="text-xs">Alamat</Label>
                            <Input
                              placeholder="Jln. Jenderal Sudirman No. 40..."
                              value={form.headerAddress}
                              onChange={(e) => setForm({ ...form, headerAddress: e.target.value })}
                            />
                          </div>
                          <div className="space-y-2">
                            <Label className="text-xs">Telepon</Label>
                            <Input
                              placeholder="(021) 55123456"
                              value={form.headerPhone}
                              onChange={(e) => setForm({ ...form, headerPhone: e.target.value })}
                            />
                          </div>
                        </div>
                        <div className="grid gap-4 sm:grid-cols-2">
                          <InputFile
                            mode="edit"
                            acceptedFormats={['.png', '.jpg', '.jpeg']}
                            helperText="Logo Kiri (Max 2MB)"
                            onChange={(file) => {
                              if (!file) {
                                setForm({ ...form, headerLeftLogo: '' })
                                return
                              }
                              const reader = new FileReader()
                              reader.onload = () => {
                                const result = reader.result
                                if (typeof result === 'string') {
                                  const base64 = result.includes(',') ? result.split(',')[1] : result
                                  setForm({ ...form, headerLeftLogo: base64 })
                                }
                              }
                              reader.readAsDataURL(file)
                            }}
                            onClear={() => setForm({ ...form, headerLeftLogo: '' })}
                          />
                          <InputFile
                            mode="edit"
                            acceptedFormats={['.png', '.jpg', '.jpeg']}
                            helperText="Logo Kanan (Max 2MB)"
                            onChange={(file) => {
                              if (!file) {
                                setForm({ ...form, headerRightLogo: '' })
                                return
                              }
                              const reader = new FileReader()
                              reader.onload = () => {
                                const result = reader.result
                                if (typeof result === 'string') {
                                  const base64 = result.includes(',') ? result.split(',')[1] : result
                                  setForm({ ...form, headerRightLogo: base64 })
                                }
                              }
                              reader.readAsDataURL(file)
                            }}
                            onClear={() => setForm({ ...form, headerRightLogo: '' })}
                          />
                        </div>
                      </div>
                    )}

                    {/* Detail Surat */}
                    <div className="space-y-4">
                      <h3 className="text-sm font-semibold text-neutral-900">Detail Surat</h3>
                      <div className="grid gap-4 sm:grid-cols-2">
                        <div className="space-y-2">
                          <Label className="text-xs">Nomor Surat</Label>
                          <Input
                            placeholder="001/BEM/XII/2025"
                            value={form.number}
                            onChange={(e) => setForm({ ...form, number: e.target.value })}
                          />
                        </div>
                        <div className="space-y-2">
                          <Label className="text-xs">Lampiran</Label>
                          <Input
                            placeholder="1 (satu) berkas"
                            value={form.lampiran}
                            onChange={(e) => setForm({ ...form, lampiran: e.target.value })}
                          />
                        </div>
                      </div>
                      <div className="space-y-2">
                        <Label className="text-xs">
                          Perihal <span className="text-red-500">*</span>
                        </Label>
                        <Input
                          placeholder="Undangan Rapat Koordinasi"
                          value={form.subject}
                          onChange={(e) => setForm({ ...form, subject: e.target.value })}
                          className={errors.subject ? 'border-red-500' : ''}
                        />
                        {errors.subject && (
                          <p className="text-xs text-red-600">{errors.subject}</p>
                        )}
                      </div>
                    </div>
                  </div>
                )}

                {step === 1 && (
                  <div className="space-y-6 animate-in fade-in-50 duration-300">
                    {/* Tujuan Surat */}
                    <div className="space-y-4">
                      <h3 className="text-sm font-semibold text-neutral-900">Tujuan Surat</h3>
                      <div className="grid gap-4 sm:grid-cols-2">
                        <div className="space-y-2">
                          <Label className="text-xs">Jabatan Penerima</Label>
                          <Input
                            placeholder="Rektor / Kepala Bagian"
                            value={form.toRole}
                            onChange={(e) => setForm({ ...form, toRole: e.target.value })}
                            className={errors.toRole ? 'border-red-500' : ''}
                          />
                          {errors.toRole && (
                            <p className="text-xs text-red-600">{errors.toRole}</p>
                          )}
                        </div>
                        <div className="space-y-2">
                          <Label className="text-xs">Nama Penerima</Label>
                          <Input
                            placeholder="Bapak/Ibu Nama Lengkap"
                            value={form.toName}
                            onChange={(e) => setForm({ ...form, toName: e.target.value })}
                          />
                        </div>
                      </div>
                      <div className="grid gap-4 sm:grid-cols-2">
                        <div className="space-y-2">
                          <Label className="text-xs">Di Tempat / Unit</Label>
                          <Input
                            placeholder="Gedung Rektorat"
                            value={form.toPlace}
                            onChange={(e) => setForm({ ...form, toPlace: e.target.value })}
                          />
                        </div>
                        <div className="space-y-2">
                          <Label className="text-xs">Kota Tujuan</Label>
                          <Input
                            placeholder="Tangerang"
                            value={form.toCity}
                            onChange={(e) => setForm({ ...form, toCity: e.target.value })}
                          />
                        </div>
                      </div>
                    </div>

                    {/* Isi Surat */}
                    <div className="space-y-4">
                      <h3 className="text-sm font-semibold text-neutral-900">Isi Surat</h3>
                      <div className="space-y-2">
                        <Label className="text-xs">Paragraf Pembuka</Label>
                        <TextArea
                          rows={2}
                          placeholder="Dengan hormat, sehubungan dengan..."
                          value={form.opening}
                          onChange={(e) => setForm({ ...form, opening: e.target.value })}
                        />
                      </div>
                      <div className="space-y-2">
                        <Label className="text-xs">
                          Isi Utama <span className="text-red-500">*</span>
                        </Label>
                        <TextArea
                          rows={5}
                          placeholder="Tuliskan isi surat secara lengkap..."
                          value={form.body}
                          onChange={(e) => setForm({ ...form, body: e.target.value })}
                          className={errors.body ? 'border-red-500' : ''}
                        />
                        {errors.body && (
                          <p className="text-xs text-red-600">{errors.body}</p>
                        )}
                      </div>
                      <div className="space-y-2">
                        <Label className="text-xs">Paragraf Penutup</Label>
                        <TextArea
                          rows={2}
                          placeholder="Demikian surat ini kami sampaikan..."
                          value={form.closing}
                          onChange={(e) => setForm({ ...form, closing: e.target.value })}
                        />
                      </div>
                      <div className="space-y-2">
                        <Label className="text-xs">Tembusan (Opsional)</Label>
                        <TextArea
                          rows={2}
                          placeholder="1. Arsip&#10;2. Wakil Rektor"
                          value={form.tembusan}
                          onChange={(e) => setForm({ ...form, tembusan: e.target.value })}
                        />
                      </div>
                    </div>
                  </div>
                )}

                {step === 2 && (
                  <div className="space-y-6 animate-in fade-in-50 duration-300">
                    <div className="p-4 rounded-lg bg-brand-50 border border-brand-100">
                      <p className="text-sm font-medium text-brand-900">Langkah Terakhir</p>
                      <p className="text-xs text-brand-700 mt-1">
                        Tentukan penandatangan surat, lalu tinjau kembali sebelum mengirim.
                      </p>
                    </div>

                    <div className="space-y-4">
                      <div className="flex items-center justify-between">
                        <h3 className="text-sm font-semibold text-neutral-900">Penandatangan</h3>
                        <Button
                          type="button"
                          variant="outline"
                          size="sm"
                          onClick={() =>
                            setForm({
                              ...form,
                              signers: [...form.signers, { role: '', name: '', nip: '' }],
                            })
                          }
                          className="h-8 text-xs gap-1"
                        >
                          <Plus className="h-3 w-3" /> Tambah
                        </Button>
                      </div>

                      <div className="space-y-3">
                        {form.signers.map((signer, idx) => (
                          <div
                            key={idx}
                            className="relative p-4 rounded-lg border border-neutral-200 bg-white"
                          >
                            {form.signers.length > 1 && (
                              <button
                                type="button"
                                onClick={() => {
                                  const next = form.signers.filter((_, i) => i !== idx)
                                  setForm({
                                    ...form,
                                    signers: next.length ? next : [{ role: '', name: '', nip: '' }],
                                  })
                                }}
                                className="absolute right-2 top-2 p-1 text-neutral-400 hover:text-red-500 hover:bg-red-50 rounded"
                              >
                                <X className="h-4 w-4" />
                              </button>
                            )}
                            <div className="grid gap-3 sm:grid-cols-3">
                              <div className="space-y-1">
                                <Label className="text-xs">Jabatan</Label>
                                <Input
                                  placeholder="Ketua Pelaksana"
                                  value={signer.role}
                                  onChange={(e) => {
                                    const next = [...form.signers]
                                    next[idx] = { ...next[idx], role: e.target.value }
                                    setForm({ ...form, signers: next })
                                  }}
                                  className={errors[`signers.${idx}.role`] ? 'border-red-500' : ''}
                                />
                              </div>
                              <div className="space-y-1">
                                <Label className="text-xs">Nama Lengkap</Label>
                                <Input
                                  placeholder="Nama Penandatangan"
                                  value={signer.name}
                                  onChange={(e) => {
                                    const next = [...form.signers]
                                    next[idx] = { ...next[idx], name: e.target.value }
                                    setForm({ ...form, signers: next })
                                  }}
                                  className={errors[`signers.${idx}.name`] ? 'border-red-500' : ''}
                                />
                              </div>
                              <div className="space-y-1">
                                <Label className="text-xs">NIP / NIM</Label>
                                <Input
                                  placeholder="Nomor Identitas"
                                  value={signer.nip}
                                  onChange={(e) => {
                                    const next = [...form.signers]
                                    next[idx] = { ...next[idx], nip: e.target.value }
                                    setForm({ ...form, signers: next })
                                  }}
                                />
                              </div>
                            </div>
                          </div>
                        ))}
                      </div>
                    </div>
                  </div>
                )}

                {/* Navigation Buttons */}
                <div className="flex items-center justify-between pt-6 border-t border-neutral-100">
                  <Button
                    type="button"
                    variant="ghost"
                    onClick={goPrev}
                    disabled={step === 0}
                    className="text-neutral-600"
                  >
                    Kembali
                  </Button>

                  {step < 2 ? (
                    <Button
                      type="button"
                      onClick={goNext}
                      disabled={!hasContent}
                      className="bg-brand-600 hover:bg-brand-700 text-white min-w-[100px]"
                    >
                      Lanjut
                    </Button>
                  ) : (
                    <Button
                      type="button"
                      onClick={handleSubmit}
                      disabled={!hasContent || createMutation.isPending}
                      className="bg-brand-600 hover:bg-brand-700 text-white min-w-[120px]"
                    >
                      {createMutation.isPending ? (
                        <Spinner className="mr-2 h-4 w-4 text-white" />
                      ) : (
                        <SendHorizonal className="mr-2 h-4 w-4" />
                      )}
                      Kirim Surat
                    </Button>
                  )}
                </div>
              </div>
            </CardContent>
          </Card>
        </div>
      </Container>
    </div>
  )
}

export default function SuratCreatePage() {
  return <SuratCreatePageInner />
}
