'use client'

import { useState } from 'react'
import { useMutation, useQueryClient } from '@tanstack/react-query'
import { toast } from 'sonner'
import { Check, X, Loader2, RotateCcw } from 'lucide-react'

import {
  Button,
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
  Label,
  TextArea,
} from '@/components/ui'
import { approveSurat, reviseSurat } from '@/lib/apis/surat'

type Props = {
  suratId: number | null
  open: boolean
  onOpenChange: (open: boolean) => void
  action: 'approve' | 'reject' | 'revise' | null
}

export function SuratApprovalDialog({ suratId, open, onOpenChange, action }: Props) {
  const queryClient = useQueryClient()
  const [note, setNote] = useState('')

  const { mutateAsync: decideSurat, isPending } = useMutation({
    mutationFn: async () => {
      if (!suratId || !action) return
      const defaultNotes: Record<string, string> = {
        approve: 'Surat disetujui',
        reject: 'Surat ditolak',
        revise: 'Surat perlu revisi',
      }
      if (action === 'revise') {
        await reviseSurat(suratId, {
          note: note.trim() || defaultNotes[action],
        })
      } else {
        await approveSurat(suratId, {
          approve: action === 'approve',
          note: note.trim() || defaultNotes[action],
        })
      }
    },
    onSuccess: async () => {
      await queryClient.invalidateQueries({ queryKey: ['surat-inbox'] })
      const messages: Record<string, string> = {
        approve: 'Surat berhasil disetujui',
        reject: 'Surat berhasil ditolak',
        revise: 'Surat dikembalikan untuk revisi',
      }
      toast.success(messages[action || 'approve'])
      onOpenChange(false)
      setNote('')
    },
    onError: () => {
      toast.error('Gagal memproses surat')
    },
  })

  const config: Record<
    string,
    { title: string; description: string; confirmText: string; buttonClass: string }
  > = {
    approve: {
      title: 'Setujui Surat',
      description:
        'Apakah Anda yakin ingin menyetujui surat ini? Surat akan diteruskan ke status APPROVED.',
      confirmText: 'Setujui',
      buttonClass: 'bg-green-600 hover:bg-green-700 text-white',
    },
    reject: {
      title: 'Tolak Surat',
      description:
        'Apakah Anda yakin ingin menolak surat ini? Surat akan dikembalikan ke status REJECTED.',
      confirmText: 'Tolak',
      buttonClass: 'bg-red-600 hover:bg-red-700 text-white',
    },
    revise: {
      title: 'Minta Revisi',
      description:
        'Apakah Anda yakin ingin meminta revisi surat ini? Surat akan dikembalikan ke pembuat untuk diperbaiki.',
      confirmText: 'Minta Revisi',
      buttonClass: 'bg-blue-600 hover:bg-blue-700 text-white',
    },
  }

  const currentConfig = config[action || 'approve']

  const getIcon = () => {
    if (isPending) return <Loader2 className="mr-2 h-4 w-4 animate-spin" />
    if (action === 'approve') return <Check className="mr-2 h-4 w-4" />
    if (action === 'revise') return <RotateCcw className="mr-2 h-4 w-4" />
    return <X className="mr-2 h-4 w-4" />
  }

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="sm:max-w-[425px]">
        <DialogHeader>
          <DialogTitle>{currentConfig.title}</DialogTitle>
          <DialogDescription>{currentConfig.description}</DialogDescription>
        </DialogHeader>
        <div className="grid gap-4 py-4">
          <div className="space-y-2">
            <Label htmlFor="note">
              Catatan {action === 'revise' ? '(Wajib)' : '(Opsional)'}
            </Label>
            <TextArea
              id="note"
              placeholder={
                action === 'approve'
                  ? 'Contoh: Surat sudah sesuai.'
                  : action === 'revise'
                    ? 'Contoh: Perbaiki format tanggal dan nomor surat.'
                    : 'Contoh: Surat tidak sesuai prosedur.'
              }
              value={note}
              onChange={(e) => setNote(e.target.value)}
              rows={3}
            />
          </div>
        </div>
        <DialogFooter>
          <Button
            variant="outline"
            onClick={() => onOpenChange(false)}
            disabled={isPending}
          >
            Batal
          </Button>
          <Button
            onClick={() => decideSurat()}
            disabled={isPending || (action === 'revise' && !note.trim())}
            className={currentConfig.buttonClass}
          >
            {getIcon()}
            {currentConfig.confirmText}
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  )
}
