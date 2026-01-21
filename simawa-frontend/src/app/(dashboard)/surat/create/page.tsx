'use client'

import { useEffect, useMemo } from 'react'
import { useRouter, useSearchParams } from 'next/navigation'
import { useMutation, useQuery } from '@tanstack/react-query'
import { Eye, SendHorizonal, Plus, X } from 'lucide-react'
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
  type CreateSuratPayload,
} from '@/lib/apis/surat'
// Tidak lagi embed PDF, preview dibuka di tab baru lewat endpoint /v1/surat/preview
import {
  useSuratCreateState,
  type SuratCreateForm,
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
    status: 'DRAFT',
    payload: {
      variant: 'non_academic',
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

function SuratCreatePageInner() {
  const router = useRouter()
  const searchParams = useSearchParams()
  const callback = searchParams.get('callback') || '/surat'

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

  useEffect(() => {
    if (!form.orgId && orgs?.length) {
      setForm({ ...form, orgId: orgs[0].id })
    }
  }, [form, orgs, setForm])

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

  // Auto-generate preview ketika form berubah (debounced ringan).
  useEffect(() => {
    // Tidak auto-preview lagi untuk menghindari call berulang dan masalah viewer.
  }, [])

  const handleSubmit = async () => {
    const payload = buildPayload(form)
    if (!payload) {
      toast.error('Organisasi masih kosong')
      return
    }
    await createMutation.mutateAsync(payload)
  }

  return (
    <Page>
      <Page.Header
        breadcrumbs={[
          { href: '/dashboard', children: 'Dashboard' },
          { href: '/surat', children: 'Surat' },
          { href: '/surat/create', children: 'Buat Surat' },
        ]}
      >
        <div className="flex flex-col gap-4 md:flex-row md:items-center md:justify-between">
          <div>
            <h1 className="text-2xl font-bold tracking-tight text-neutral-900">
              Buat Surat Baru
            </h1>
            <p className="mt-1 text-sm text-neutral-500">
              Lengkapi informasi surat langkah demi langkah lalu lihat preview sebelum
              dikirim.
            </p>
          </div>
          <StepIndicator step={step} />
        </div>
      </Page.Header>

      <Page.Body>
        <Container>
          <div className="grid gap-6 lg:grid-cols-[minmax(0,1fr),380px] lg:items-start">
            <Card className="border-neutral-200 shadow-sm">
              <CardContent className="space-y-6 p-6">
                <div className="flex flex-col gap-4 sm:flex-row sm:items-center sm:justify-between rounded-lg bg-neutral-50 p-4 border border-neutral-100">
                  <div className="min-w-0 space-y-1">
                    <p className="text-xs font-medium text-neutral-500 uppercase tracking-wider">
                      Organisasi Pengirim
                    </p>
                    <div className="flex flex-wrap items-center gap-2">
                      {currentOrgName ? (
                        <span className="font-semibold text-neutral-900">
                          {currentOrgName}
                        </span>
                      ) : (
                        <span className="text-neutral-400 italic">Belum dipilih</span>
                      )}
                      {form.subject && (
                        <>
                          <span className="text-neutral-300">/</span>
                          <span className="text-neutral-700 truncate max-w-[200px]">
                            {form.subject}
                          </span>
                        </>
                      )}
                    </div>
                  </div>
                </div>

                <div className="grid gap-6 md:grid-cols-[1fr,240px]">
                  <div className="space-y-2">
                    <Label className="text-sm font-medium text-neutral-700">
                      Pilih Organisasi
                    </Label>
                    <select
                      className="w-full rounded-lg border border-neutral-200 bg-white px-3 py-2 text-sm outline-none focus:border-brand-500 focus:ring-2 focus:ring-brand-500/20 transition-all"
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
                      <p className="text-xs text-red-600 font-medium mt-1">
                        {errors.orgId}
                      </p>
                    )}
                  </div>
                  <div className="space-y-2">
                    <Label className="text-sm font-medium text-neutral-700">
                      Tempat & Tanggal
                    </Label>
                    <Input
                      placeholder="Contoh: Tangerang, 07 Desember 2025"
                      value={form.placeAndDate}
                      onChange={(e) => setForm({ ...form, placeAndDate: e.target.value })}
                      className={
                        errors.placeAndDate ? 'border-red-500 focus:ring-red-500/20' : ''
                      }
                    />
                    {errors.placeAndDate && (
                      <p className="text-xs text-red-600 font-medium mt-1">
                        {errors.placeAndDate}
                      </p>
                    )}
                  </div>
                </div>

                {step === 0 && (
                  <div className="space-y-6 animate-in fade-in slide-in-from-bottom-2 duration-300">
                    <div className="rounded-xl border border-neutral-200 bg-white p-5 shadow-sm">
                      <div className="flex items-center justify-between gap-4 mb-4">
                        <div>
                          <h3 className="font-semibold text-neutral-900">
                            Kop Surat Custom
                          </h3>
                          <p className="text-xs text-neutral-500 mt-0.5">
                            Aktifkan jika ingin menggunakan kop surat khusus untuk surat
                            ini.
                          </p>
                        </div>
                        <Switch
                          checked={Boolean(form.useCustomHeader)}
                          onCheckedChange={(checked) =>
                            setForm({ ...form, useCustomHeader: checked })
                          }
                        />
                      </div>

                      {form.useCustomHeader && (
                        <div className="space-y-4 pt-4 border-t border-neutral-100">
                          <div className="grid gap-4 md:grid-cols-2">
                            <div className="space-y-2">
                              <Label>Nama Instansi</Label>
                              <Input
                                placeholder="Universitas Raharja"
                                value={form.headerOrgName}
                                onChange={(e) =>
                                  setForm({ ...form, headerOrgName: e.target.value })
                                }
                              />
                            </div>
                            <div className="space-y-2">
                              <Label>Unit / Organisasi</Label>
                              <Input
                                placeholder="Badan Eksekutif Mahasiswa"
                                value={form.headerOrgUnit}
                                onChange={(e) =>
                                  setForm({ ...form, headerOrgUnit: e.target.value })
                                }
                              />
                            </div>
                          </div>

                          <div className="grid gap-4 md:grid-cols-2">
                            <div className="space-y-2">
                              <Label>Alamat Lengkap</Label>
                              <Input
                                placeholder="Jln. Jenderal Sudirman No. 40..."
                                value={form.headerAddress}
                                onChange={(e) =>
                                  setForm({ ...form, headerAddress: e.target.value })
                                }
                              />
                            </div>
                            <div className="space-y-2">
                              <Label>Kontak / Telepon</Label>
                              <Input
                                placeholder="Telp: (021) 55123456"
                                value={form.headerPhone}
                                onChange={(e) =>
                                  setForm({ ...form, headerPhone: e.target.value })
                                }
                              />
                            </div>
                          </div>

                          <div className="grid gap-4 md:grid-cols-2">
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
                                    const base64 = result.includes(',')
                                      ? result.split(',')[1]
                                      : result
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
                                    const base64 = result.includes(',')
                                      ? result.split(',')[1]
                                      : result
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
                    </div>

                    <div className="space-y-4">
                      <h3 className="font-semibold text-neutral-900 border-b border-neutral-100 pb-2">
                        Detail Surat
                      </h3>
                      <div className="grid gap-4 md:grid-cols-2">
                        <div className="space-y-2">
                          <Label>Nomor Surat</Label>
                          <Input
                            placeholder="001/BEM/XII/2025"
                            value={form.number}
                            onChange={(e) => setForm({ ...form, number: e.target.value })}
                          />
                          <p className="text-[10px] text-neutral-500">
                            Kosongkan jika nomor surat digenerate otomatis/belakangan.
                          </p>
                        </div>
                        <div className="space-y-2">
                          <Label>Lampiran</Label>
                          <Input
                            placeholder="1 (satu) berkas"
                            value={form.lampiran}
                            onChange={(e) =>
                              setForm({ ...form, lampiran: e.target.value })
                            }
                          />
                        </div>
                      </div>
                      <div className="space-y-2">
                        <Label>
                          Perihal <span className="text-red-500">*</span>
                        </Label>
                        <Input
                          placeholder="Contoh: Undangan Rapat Koordinasi"
                          value={form.subject}
                          onChange={(e) => setForm({ ...form, subject: e.target.value })}
                          className={
                            errors.subject ? 'border-red-500 focus:ring-red-500/20' : ''
                          }
                        />
                        {errors.subject && (
                          <p className="text-xs text-red-600 font-medium mt-1">
                            {errors.subject}
                          </p>
                        )}
                      </div>
                    </div>
                  </div>
                )}

                {step === 1 && (
                  <div className="space-y-6 animate-in fade-in slide-in-from-bottom-2 duration-300">
                    <div className="rounded-xl border border-neutral-200 bg-white p-5 shadow-sm space-y-4">
                      <h3 className="font-semibold text-neutral-900">Tujuan Surat</h3>

                      <div className="grid gap-4 md:grid-cols-2">
                        <div className="space-y-2">
                          <Label>Jabatan Penerima</Label>
                          <Input
                            placeholder="Contoh: Rektor / Kepala Bagian"
                            value={form.toRole}
                            onChange={(e) => setForm({ ...form, toRole: e.target.value })}
                            className={
                              errors.toRole ? 'border-red-500 focus:ring-red-500/20' : ''
                            }
                          />
                          {errors.toRole && (
                            <p className="text-xs text-red-600 font-medium mt-1">
                              {errors.toRole}
                            </p>
                          )}
                        </div>
                        <div className="space-y-2">
                          <Label>Nama Penerima (Opsional)</Label>
                          <Input
                            placeholder="Bapak/Ibu Nama Lengkap"
                            value={form.toName}
                            onChange={(e) => setForm({ ...form, toName: e.target.value })}
                          />
                        </div>
                      </div>

                      <div className="grid gap-4 md:grid-cols-2">
                        <div className="space-y-2">
                          <Label>Di Tempat / Unit</Label>
                          <Input
                            placeholder="Gedung Rektorat / Ruang Rapat"
                            value={form.toPlace}
                            onChange={(e) =>
                              setForm({ ...form, toPlace: e.target.value })
                            }
                          />
                        </div>
                        <div className="space-y-2">
                          <Label>Kota Tujuan</Label>
                          <Input
                            placeholder="Tangerang"
                            value={form.toCity}
                            onChange={(e) => setForm({ ...form, toCity: e.target.value })}
                          />
                        </div>
                      </div>
                    </div>

                    <div className="space-y-4">
                      <h3 className="font-semibold text-neutral-900 border-b border-neutral-100 pb-2">
                        Isi Surat
                      </h3>

                      <div className="space-y-2">
                        <Label>Paragraf Pembuka</Label>
                        <TextArea
                          rows={2}
                          placeholder="Dengan hormat, sehubungan dengan..."
                          value={form.opening}
                          onChange={(e) => setForm({ ...form, opening: e.target.value })}
                          className="min-h-[80px]"
                        />
                      </div>

                      <div className="space-y-2">
                        <Label>Isi Utama</Label>
                        <TextArea
                          rows={6}
                          placeholder="Tuliskan isi surat secara lengkap di sini. Gunakan baris baru untuk paragraf baru."
                          value={form.body}
                          onChange={(e) => setForm({ ...form, body: e.target.value })}
                          className={`min-h-[150px] ${errors.body ? 'border-red-500 focus:ring-red-500/20' : ''}`}
                        />
                        {errors.body && (
                          <p className="text-xs text-red-600 font-medium mt-1">
                            {errors.body}
                          </p>
                        )}
                      </div>

                      <div className="space-y-2">
                        <Label>Paragraf Penutup</Label>
                        <TextArea
                          rows={2}
                          placeholder="Demikian surat ini kami sampaikan..."
                          value={form.closing}
                          onChange={(e) => setForm({ ...form, closing: e.target.value })}
                          className="min-h-[80px]"
                        />
                      </div>
                    </div>

                    <div className="space-y-2 bg-neutral-50 p-4 rounded-xl border border-neutral-100">
                      <Label className="text-neutral-900">Tembusan (Opsional)</Label>
                      <TextArea
                        rows={3}
                        placeholder="Contoh:&#10;1. Arsip&#10;2. Wakil Rektor"
                        value={form.tembusan}
                        onChange={(e) => setForm({ ...form, tembusan: e.target.value })}
                        className="bg-white"
                      />
                      <p className="text-[10px] text-neutral-500">
                        Pisahkan setiap tembusan dengan baris baru (Enter).
                      </p>
                    </div>
                  </div>
                )}

                {step === 2 && (
                  <div className="space-y-6 animate-in fade-in slide-in-from-bottom-2 duration-300">
                    <div className="bg-brand-50/50 p-4 rounded-xl border border-brand-100 flex gap-3">
                      <div className="h-10 w-10 shrink-0 rounded-full bg-brand-100 flex items-center justify-center text-brand-600">
                        <SendHorizonal className="h-5 w-5" />
                      </div>
                      <div>
                        <h3 className="font-semibold text-brand-900">Langkah Terakhir</h3>
                        <p className="text-sm text-brand-700 mt-1">
                          Tentukan penandatangan surat, lalu tinjau kembali sebelum
                          mengirim.
                        </p>
                      </div>
                    </div>

                    <div className="space-y-4">
                      <div className="flex items-center justify-between">
                        <h3 className="font-semibold text-neutral-900">
                          Daftar Penandatangan
                        </h3>
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
                          className="h-8 text-xs"
                        >
                          <Plus className="mr-1 h-3.5 w-3.5" /> Tambah
                        </Button>
                      </div>

                      <div className="space-y-3">
                        {form.signers.map((signer, idx) => (
                          <div
                            key={idx}
                            className="relative grid gap-4 p-4 rounded-xl border border-neutral-200 bg-white shadow-sm hover:border-brand-200 transition-colors"
                          >
                            <div className="absolute right-2 top-2">
                              {form.signers.length > 1 && (
                                <button
                                  type="button"
                                  onClick={() => {
                                    const next = form.signers.filter((_, i) => i !== idx)
                                    setForm({
                                      ...form,
                                      signers: next.length
                                        ? next
                                        : [{ role: '', name: '', nip: '' }],
                                    })
                                  }}
                                  className="text-neutral-400 hover:text-red-500 p-1 rounded-md hover:bg-red-50 transition-colors"
                                >
                                  <X className="h-4 w-4" />
                                </button>
                              )}
                            </div>

                            <div className="flex items-center gap-2 mb-1">
                              <Badge
                                variant="secondary"
                                className="bg-neutral-100 text-neutral-600 h-5 text-[10px]"
                              >
                                Pihak #{idx + 1}
                              </Badge>
                            </div>

                            <div className="grid gap-4 md:grid-cols-3">
                              <div className="space-y-2">
                                <Label className="text-xs">Jabatan</Label>
                                <Input
                                  placeholder="Ketua Pelaksana"
                                  value={signer.role}
                                  onChange={(e) => {
                                    const next = [...form.signers]
                                    next[idx] = { ...next[idx], role: e.target.value }
                                    setForm({ ...form, signers: next })
                                  }}
                                  className={
                                    errors[`signers.${idx}.role`] ? 'border-red-500' : ''
                                  }
                                />
                              </div>
                              <div className="space-y-2">
                                <Label className="text-xs">Nama Lengkap</Label>
                                <Input
                                  placeholder="Nama Penandatangan"
                                  value={signer.name}
                                  onChange={(e) => {
                                    const next = [...form.signers]
                                    next[idx] = { ...next[idx], name: e.target.value }
                                    setForm({ ...form, signers: next })
                                  }}
                                  className={
                                    errors[`signers.${idx}.name`] ? 'border-red-500' : ''
                                  }
                                />
                              </div>
                              <div className="space-y-2">
                                <Label className="text-xs">NIP / NIM (Opsional)</Label>
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

                <div className="flex items-center justify-between pt-6 border-t border-neutral-100 mt-6">
                  <Button
                    type="button"
                    variant="ghost"
                    onClick={goPrev}
                    disabled={step === 0}
                    className="text-neutral-600"
                  >
                    Kembali
                  </Button>

                  <div className="flex items-center gap-3">
                    <Button
                      type="button"
                      variant="outline"
                      onClick={handlePreview}
                      disabled={!hasContent}
                      className="hidden sm:flex"
                    >
                      <Eye className="mr-2 h-4 w-4" /> Preview
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

            <div className="space-y-6">
              <Card className="border-neutral-200 shadow-sm bg-neutral-50/50">
                <CardContent className="p-5 space-y-3">
                  <h4 className="font-semibold text-sm text-neutral-900 flex items-center gap-2">
                    <div className="h-1.5 w-1.5 rounded-full bg-brand-500" />
                    Panduan Struktur
                  </h4>
                  <ul className="text-xs text-neutral-600 space-y-2 list-none pl-1">
                    <li className="flex gap-2">
                      <span className="text-neutral-400">1.</span>
                      <span>Kop Surat (Otomatis/Custom)</span>
                    </li>
                    <li className="flex gap-2">
                      <span className="text-neutral-400">2.</span>
                      <span>Tempat & Tanggal (Kanan atas)</span>
                    </li>
                    <li className="flex gap-2">
                      <span className="text-neutral-400">3.</span>
                      <span>Nomor, Lampiran, Perihal</span>
                    </li>
                    <li className="flex gap-2">
                      <span className="text-neutral-400">4.</span>
                      <span>Tujuan & Pembuka</span>
                    </li>
                    <li className="flex gap-2">
                      <span className="text-neutral-400">5.</span>
                      <span>Isi & Penutup</span>
                    </li>
                    <li className="flex gap-2">
                      <span className="text-neutral-400">6.</span>
                      <span>Tanda Tangan</span>
                    </li>
                  </ul>
                </CardContent>
              </Card>
            </div>
          </div>
        </Container>
      </Page.Body>
    </Page>
  )
}

export default function SuratCreatePage() {
  return <SuratCreatePageInner />
}
