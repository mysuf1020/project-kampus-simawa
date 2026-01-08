'use client'

import { FormEvent, useMemo, useState } from 'react'
import { useMutation, useQueryClient } from '@tanstack/react-query'
import { CheckCircle, FileText, Loader2, ReceiptText, Info } from 'lucide-react'
import { toast } from 'sonner'

import {
  Button,
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
  Input,
  Label,
  TextArea,
} from '@/components/ui'
import { submitLPJ, uploadLPJReport } from '@/lib/apis/lpj'

type Props = {
  orgId: string
  onSuccess?: () => void
}

export function LPJSubmitCard({ orgId, onSuccess }: Props) {
  const queryClient = useQueryClient()

  const [summary, setSummary] = useState('')
  const [file, setFile] = useState<File | null>(null)

  const { mutateAsync: uploadReport, isPending: isUploading } = useMutation({
    mutationFn: uploadLPJReport,
  })

  const { mutateAsync: submit, isPending: isSubmitting } = useMutation({
    mutationFn: submitLPJ,
    onSuccess: async () => {
      await queryClient.invalidateQueries({ queryKey: ['lpj'] })
      onSuccess?.()
    },
  })

  const handleSubmit = async (e: FormEvent) => {
    e.preventDefault()
    if (!orgId) {
      toast.error('Organisasi belum dipilih')
      return
    }
    if (!file) {
      toast.error('File laporan LPJ belum dipilih')
      return
    }
    try {
      const { fileKey, size } = await uploadReport(file)
      await submit({
        org_id: orgId,
        summary,
        report_key: fileKey,
        file_size: size,
      })
      toast.success('LPJ berhasil dikirim')
      setSummary('')
      setFile(null)
    } catch (err) {
      // console.error(err)
      toast.error('Gagal mengirim LPJ')
    }
  }

  const isBusy = isUploading || isSubmitting
  const fileLabel = useMemo(() => {
    if (!file) return 'Belum ada file dipilih'
    const kb = file.size / 1024
    const mb = kb / 1024
    const sizeText = mb >= 1 ? `${mb.toFixed(1)} MB` : `${kb.toFixed(0)} KB`
    return `${file.name} • ${sizeText}`
  }, [file])

  return (
    <div className="space-y-6">
      <div className="space-y-4">
        <Card className="border-neutral-200 shadow-sm bg-blue-50/50">
          <CardContent className="p-4">
            <div className="flex items-start gap-3">
              <Info className="h-5 w-5 text-blue-600 shrink-0 mt-0.5" />
              <div className="space-y-1">
                <p className="text-sm font-semibold text-blue-900">Tips Pengiriman LPJ</p>
                <ul className="text-xs text-blue-700 list-disc pl-4 space-y-1">
                  <li>Format wajib PDF, maksimal 20 MB.</li>
                  <li>Gunakan ringkasan singkat agar reviewer cepat memahami isi LPJ.</li>
                  <li>Jika diminta revisi/ditolak, unggah PDF terbaru lalu kirim ulang.</li>
                </ul>
              </div>
            </div>
          </CardContent>
        </Card>

        <form className="space-y-4" onSubmit={handleSubmit}>
          <div className="space-y-1.5">
            <Label className="text-xs font-medium text-neutral-700">Ringkasan Kegiatan</Label>
            <TextArea
              rows={3}
              placeholder="Contoh: Laporan kegiatan Seminar Nasional yang dilaksanakan pada tanggal..."
              value={summary}
              onChange={(e) => setSummary(e.target.value)}
              className="text-sm resize-none"
            />
          </div>

          <div className="space-y-1.5">
            <Label className="text-xs font-medium text-neutral-700">File Laporan (PDF)</Label>
            <div className="relative">
              <Input
                type="file"
                accept="application/pdf"
                className="text-xs cursor-pointer file:text-xs file:font-medium file:bg-neutral-100 file:text-neutral-700 file:border-0 file:mr-4 file:px-4 file:py-2 file:rounded-md hover:file:bg-neutral-200"
                onChange={(e) => {
                  const f = e.target.files?.[0] || null
                  setFile(f)
                }}
              />
            </div>
            {file && (
              <div className="flex items-center gap-2 rounded-lg bg-neutral-50 px-3 py-2 text-xs text-neutral-700 border border-neutral-100 mt-2">
                <FileText className="h-4 w-4 text-brand-600" />
                <span>{fileLabel}</span>
              </div>
            )}
          </div>

          {orgId && (
            <p className="text-xs text-neutral-500">
              Mengirim sebagai: <span className="font-semibold text-neutral-900">{orgId}</span>
            </p>
          )}

          <Button
            type="submit"
            className="w-full bg-brand-600 hover:bg-brand-700 text-white"
            disabled={isBusy}
          >
            {isBusy ? (
              <Loader2 className="mr-2 h-4 w-4 animate-spin" />
            ) : (
              <ReceiptText className="mr-2 h-4 w-4" />
            )}
            Kirim Laporan
          </Button>
        </form>
      </div>
    </div>
  )
}
