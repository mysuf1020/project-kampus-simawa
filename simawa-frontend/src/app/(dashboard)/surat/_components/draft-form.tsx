import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
  Input,
  Label,
  TextArea,
  Button,
  Text,
} from '@/components/ui'
import { Eye, SendHorizonal } from 'lucide-react'
import { useState } from 'react'
import { toast } from 'sonner'
import { useSuratDraftState } from '@/features/surat/surat-draft.atoms'
import {
  previewSurat,
  createSurat,
  submitSurat,
  downloadSurat,
  type CreateSuratPayload,
} from '@/lib/apis/surat'
// Preview kini dibuka di tab baru; tidak ada embed PDF.

type Props = {
  orgId: string
}

export function DraftFormCard({ orgId, onSent }: Props & { onSent?: () => void }) {
  const { draft, setDraft, step, goToReview, goToForm, resetDraft } = useSuratDraftState()
  const [isPreviewLoading, setIsPreviewLoading] = useState(false)
  const [isSending, setIsSending] = useState(false)

  const hasContent =
    Boolean(draft.title) ||
    Boolean(draft.body) ||
    Boolean(draft.opening) ||
    Boolean(draft.closing)

  const buildPayload = (): CreateSuratPayload | null => {
    if (!orgId) return null

    const bodyParagraphs = draft.body
      .split(/\n+/)
      .map((p) => p.trim())
      .filter(Boolean)

    const signs: Array<{
      role: string
      name: string
      nip?: string
      stamp_base64?: string
      ttd_base64?: string
      stamp_text?: string
    }> = []

    if (draft.signer1Name || draft.signer1Role) {
      signs.push({
        role: draft.signer1Role || '',
        name: draft.signer1Name || '',
        nip: draft.signer1Nip || '',
        stamp_base64: '',
        ttd_base64: '',
        stamp_text: '',
      })
    }

    return {
      org_id: orgId,
      status: 'DRAFT',
      payload: {
        variant: 'non_academic',
        created_at: new Date().toISOString(),
        // header sengaja tidak diisi di FE;
        // backend akan prefille berdasarkan data organisasi (logo, nama, dsb).
        meta: {
          number: draft.number || '',
          subject: draft.title || 'Draft surat',
          to_role: draft.toRole || '',
          to_name: draft.toName || '',
          to_place: draft.toPlace || '',
          to_city: draft.toCity || '',
          place_and_date: draft.placeAndDate || '',
          lampiran: draft.lampiran || '',
        },
        body_opening: draft.opening || '',
        body_content: bodyParagraphs,
        body_closing: draft.closing || '',
        footer: '',
        signs,
        tembusan: [],
      },
    }
  }

  const handlePreview = async () => {
    const payload = buildPayload()
    if (!payload) return
    goToReview()
    setIsPreviewLoading(true)
    try {
      const blob = await previewSurat(payload)
      const url = URL.createObjectURL(blob)
      window.open(url, '_blank', 'noopener,noreferrer')
      setTimeout(() => URL.revokeObjectURL(url), 60_000)
    } finally {
      setIsPreviewLoading(false)
    }
  }

  const handleSend = async () => {
    const payload = buildPayload()
    if (!payload) {
      toast.error('Organisasi belum dipilih')
      return
    }
    setIsSending(true)
    try {
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
          // optional download
        }
      }
      toast.success('Surat berhasil dikirim')
      onSent?.()
      resetDraft()
      goToForm()
    } catch {
      toast.error('Gagal mengirim surat')
    } finally {
      setIsSending(false)
    }
  }

  return (
    <Card className="border-neutral-200 shadow-sm">
      <CardHeader className="border-b border-neutral-100 bg-neutral-50/50 pb-4">
        <CardTitle className="text-base font-semibold text-neutral-900">Draft Cepat</CardTitle>
        <CardDescription className="text-xs text-neutral-500">
          Buat surat singkat lalu kirim untuk diproses.
        </CardDescription>
      </CardHeader>
      <CardContent className="space-y-4 pt-4">
        <div className="flex items-center gap-2 text-xs text-neutral-500 mb-2">
          <span className={step === 'FORM' ? 'font-semibold text-brand-600' : ''}>1. Isi Detail</span>
          <span>→</span>
          <span className={step === 'REVIEW' ? 'font-semibold text-brand-600' : ''}>2. Tinjau</span>
        </div>

        <div className="space-y-2">
          <Label className="text-xs font-medium">Judul / Perihal</Label>
          <Input
            placeholder="Undangan rapat"
            value={draft.title}
            onChange={(e) => setDraft({ ...draft, title: e.target.value })}
            className="h-9"
          />
        </div>

        <div className="grid gap-4 md:grid-cols-2">
          <div className="space-y-2">
            <Label className="text-xs font-medium">Nomor Surat</Label>
            <Input
              placeholder="001/BEM/OSPEK/XII/2025"
              value={draft.number}
              onChange={(e) => setDraft({ ...draft, number: e.target.value })}
              className="h-9"
            />
          </div>
          <div className="space-y-2">
            <Label className="text-xs font-medium">Lampiran</Label>
            <Input
              placeholder="1 berkas"
              value={draft.lampiran}
              onChange={(e) => setDraft({ ...draft, lampiran: e.target.value })}
              className="h-9"
            />
          </div>
        </div>

        <div className="grid gap-4 md:grid-cols-2">
          <div className="space-y-2">
            <Label className="text-xs font-medium">Jabatan Penerima</Label>
            <Input
              placeholder="Kepala TU"
              value={draft.toRole}
              onChange={(e) => setDraft({ ...draft, toRole: e.target.value })}
              className="h-9"
            />
          </div>
          <div className="space-y-2">
            <Label className="text-xs font-medium">Nama Penerima</Label>
            <Input
              placeholder="Bapak/Ibu"
              value={draft.toName}
              onChange={(e) => setDraft({ ...draft, toName: e.target.value })}
              className="h-9"
            />
          </div>
        </div>

        <div className="grid gap-4 md:grid-cols-2">
          <div className="space-y-2">
            <Label className="text-xs font-medium">Tempat / Unit</Label>
            <Input
              placeholder="Gedung A"
              value={draft.toPlace}
              onChange={(e) => setDraft({ ...draft, toPlace: e.target.value })}
              className="h-9"
            />
          </div>
          <div className="space-y-2">
            <Label className="text-xs font-medium">Kota</Label>
            <Input
              placeholder="Tangerang"
              value={draft.toCity}
              onChange={(e) => setDraft({ ...draft, toCity: e.target.value })}
              className="h-9"
            />
          </div>
        </div>

        <div className="space-y-2">
          <Label className="text-xs font-medium">Tempat & Tanggal</Label>
          <Input
            placeholder="Tangerang, 07 Desember 2025"
            value={draft.placeAndDate}
            onChange={(e) => setDraft({ ...draft, placeAndDate: e.target.value })}
            className="h-9"
          />
        </div>

        <div className="space-y-2">
          <Label className="text-xs font-medium">Paragraf Pembuka</Label>
          <TextArea
            rows={2}
            placeholder="Sehubungan dengan ..."
            value={draft.opening}
            onChange={(e) => setDraft({ ...draft, opening: e.target.value })}
            className="text-sm"
          />
        </div>

        <div className="space-y-2">
          <Label className="text-xs font-medium">Isi Surat (Paragraf Utama)</Label>
          <TextArea
            rows={4}
            placeholder="Isi utama surat. Pisahkan paragraf dengan enter."
            value={draft.body}
            onChange={(e) => setDraft({ ...draft, body: e.target.value })}
            className="text-sm"
          />
        </div>

        <div className="space-y-2">
          <Label className="text-xs font-medium">Paragraf Penutup</Label>
          <TextArea
            rows={2}
            placeholder="Demikian kami sampaikan ..."
            value={draft.closing}
            onChange={(e) => setDraft({ ...draft, closing: e.target.value })}
            className="text-sm"
          />
        </div>

        <div className="grid gap-4 md:grid-cols-3">
          <div className="space-y-2">
            <Label className="text-xs font-medium">Penandatangan (Jabatan)</Label>
            <Input
              placeholder="Ketua Pelaksana"
              value={draft.signer1Role}
              onChange={(e) => setDraft({ ...draft, signer1Role: e.target.value })}
              className="h-9"
            />
          </div>
          <div className="space-y-2">
            <Label className="text-xs font-medium">Nama Penandatangan</Label>
            <Input
              placeholder="Andi Setiawan"
              value={draft.signer1Name}
              onChange={(e) => setDraft({ ...draft, signer1Name: e.target.value })}
              className="h-9"
            />
          </div>
          <div className="space-y-2">
            <Label className="text-xs font-medium">NIP (Opsional)</Label>
            <Input
              placeholder="Isi NIP jika ada"
              value={draft.signer1Nip}
              onChange={(e) => setDraft({ ...draft, signer1Nip: e.target.value })}
              className="h-9"
            />
          </div>
        </div>

        <div className="flex gap-3 pt-4 border-t border-neutral-100">
          <Button
            type="button"
            variant="outline"
            className="flex-1"
            disabled={!hasContent || isPreviewLoading}
            isLoading={isPreviewLoading}
            onClick={handlePreview}
          >
            <Eye className="mr-2 h-4 w-4" />
            Preview PDF
          </Button>
          <Button
            className="flex-1 bg-brand-600 hover:bg-brand-700 text-white"
            disabled={!hasContent || !orgId || isSending}
            isLoading={isSending}
            type="button"
            onClick={handleSend}
          >
            <SendHorizonal className="mr-2 h-4 w-4" /> Kirim
          </Button>
        </div>
      </CardContent>
    </Card>
  )
}
