'use client'

import { useState } from 'react'
import { useMutation, useQueryClient } from '@tanstack/react-query'
import { toast } from 'sonner'
import { Check, X, Loader2 } from 'lucide-react'

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
import { approveSurat } from '@/lib/apis/surat'

type Props = {
  suratId: number | null
  open: boolean
  onOpenChange: (open: boolean) => void
  action: 'approve' | 'reject' | null
}

export function SuratApprovalDialog({ suratId, open, onOpenChange, action }: Props) {
  const queryClient = useQueryClient()
  const [note, setNote] = useState('')

  const { mutateAsync: decideSurat, isPending } = useMutation({
    mutationFn: async () => {
      if (!suratId || !action) return
      await approveSurat(suratId, {
        approve: action === 'approve',
        note: note.trim() || (action === 'approve' ? 'Surat disetujui' : 'Surat ditolak'),
      })
    },
    onSuccess: async () => {
      await queryClient.invalidateQueries({ queryKey: ['surat-inbox'] })
      toast.success(
        action === 'approve' ? 'Surat berhasil disetujui' : 'Surat berhasil ditolak'
      )
      onOpenChange(false)
      setNote('')
    },
    onError: () => {
      toast.error('Gagal memproses surat')
    },
  })

  const title = action === 'approve' ? 'Setujui Surat' : 'Tolak Surat'
  const description =
    action === 'approve'
      ? 'Apakah Anda yakin ingin menyetujui surat ini? Surat akan diteruskan ke status APPROVED.'
      : 'Apakah Anda yakin ingin menolak surat ini? Surat akan dikembalikan ke status REJECTED.'
  const confirmText = action === 'approve' ? 'Setujui' : 'Tolak'
  const variant = action === 'approve' ? 'default' : 'destructive'

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="sm:max-w-[425px]">
        <DialogHeader>
          <DialogTitle>{title}</DialogTitle>
          <DialogDescription>{description}</DialogDescription>
        </DialogHeader>
        <div className="grid gap-4 py-4">
          <div className="space-y-2">
            <Label htmlFor="note">Catatan (Opsional)</Label>
            <TextArea
              id="note"
              placeholder={
                action === 'approve'
                  ? 'Contoh: Surat sudah sesuai.'
                  : 'Contoh: Perbaiki format tanggal.'
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
            variant={variant}
            onClick={() => decideSurat()}
            disabled={isPending}
            className={action === 'approve' ? 'bg-green-600 hover:bg-green-700' : ''}
          >
            {isPending ? (
              <Loader2 className="mr-2 h-4 w-4 animate-spin" />
            ) : action === 'approve' ? (
              <Check className="mr-2 h-4 w-4" />
            ) : (
              <X className="mr-2 h-4 w-4" />
            )}
            {confirmText}
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  )
}
