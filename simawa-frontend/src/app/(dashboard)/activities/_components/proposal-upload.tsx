'use client'

import { FormEvent, useState } from 'react'
import { useMutation } from '@tanstack/react-query'
import { FileUp, Loader2 } from 'lucide-react'

import {
  Button,
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
  Input,
  Label,
} from '@/components/ui'
import { uploadActivityProposal } from '@/lib/apis/activity'

type Props = {
  orgId: string
}

export function ActivityProposalUploadCard({ orgId }: Props) {
  const [file, setFile] = useState<File | null>(null)
  const [uploadedKey, setUploadedKey] = useState<string | null>(null)

  const { mutateAsync, isPending } = useMutation({
    mutationFn: uploadActivityProposal,
  })

  const handleSubmit = async (e: FormEvent) => {
    e.preventDefault()
    if (!file) return
    const key = await mutateAsync(file)
    setUploadedKey(key)
  }

  return (
    <Card className="border-neutral-200 shadow-sm h-fit">
      <CardHeader className="bg-neutral-50/50 border-b border-neutral-100 pb-4">
        <div className="flex items-center gap-3">
          <div className="flex h-8 w-8 items-center justify-center rounded-lg bg-white border border-neutral-200 shadow-sm">
            <FileUp className="h-4 w-4 text-brand-600" />
          </div>
          <div className="space-y-0.5">
            <CardTitle className="text-base font-semibold text-neutral-900">
              Upload Proposal
            </CardTitle>
            <CardDescription className="text-xs text-neutral-500">
              Unggah proposal untuk kegiatan besar (seminar, workshop, lomba).
            </CardDescription>
          </div>
        </div>
      </CardHeader>
      <CardContent className="pt-4 space-y-4">
        <form className="space-y-4" onSubmit={handleSubmit}>
          <div className="space-y-1.5">
            <Label className="text-xs font-medium text-neutral-700">
              File Proposal (PDF)
            </Label>
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

          <div className="rounded-lg bg-blue-50 p-3 border border-blue-100">
            <p className="text-xs text-blue-700 leading-relaxed">
              <strong>Keterangan:</strong> File proposal yang diunggah akan masuk ke BEM untuk ditinjau. 
              Proposal diperlukan untuk kegiatan besar seperti seminar, workshop, atau lomba.
            </p>
          </div>

          {orgId ? null : (
            <div className="rounded-lg bg-amber-50 p-3 border border-amber-100">
              <p className="text-xs text-amber-700">
                Pilih organisasi terlebih dahulu sebelum mengunggah proposal.
              </p>
            </div>
          )}

          <Button
            type="submit"
            className="w-full bg-brand-600 hover:bg-brand-700 text-white"
            disabled={!file || isPending}
          >
            {isPending ? (
              <Loader2 className="mr-2 h-4 w-4 animate-spin" />
            ) : (
              <FileUp className="mr-2 h-4 w-4" />
            )}
            Upload Proposal
          </Button>

          {uploadedKey && (
            <div className="rounded-lg bg-green-50 p-3 border border-green-100 flex items-center gap-2">
              <div className="h-1.5 w-1.5 rounded-full bg-green-500" />
              <p className="text-xs font-medium text-green-700">
                Berkas berhasil diunggah.
              </p>
            </div>
          )}
        </form>
      </CardContent>
    </Card>
  )
}
