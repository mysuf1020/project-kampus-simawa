'use client'

import { useEffect } from 'react'
import { useForm } from 'react-hook-form'
import { z } from 'zod'
import { zodResolver } from '@hookform/resolvers/zod'
import { Loader2, Sparkles } from 'lucide-react'
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

const activitySchema = z.object({
  org_id: z.string().min(1, 'Pilih organisasi'),
  title: z.string().min(3, 'Minimal 3 karakter'),
  description: z.string().optional(),
  location: z.string().optional(),
  type: z.string().optional(),
  start_at: z.string().optional(),
  end_at: z.string().optional(),
})

export type ActivityFormValues = z.infer<typeof activitySchema>

type Props = {
  orgId: string
  onCreate: (values: ActivityFormValues) => Promise<void>
  isLoading?: boolean
}

export function ActivityCreateForm({ orgId, onCreate, isLoading }: Props) {
  const form = useForm<ActivityFormValues>({
    resolver: zodResolver(activitySchema),
    defaultValues: { org_id: '', title: '', description: '', location: '', type: '' },
    mode: 'onChange',
  })

  useEffect(() => {
    if (orgId) form.setValue('org_id', orgId)
  }, [orgId, form])

  const handleSubmit = async (values: ActivityFormValues) => {
    try {
      await onCreate(values)
      toast.success('Aktivitas berhasil dibuat')
      form.reset({ ...values, title: '', description: '', location: '', type: '' })
    } catch {
      toast.error('Gagal membuat aktivitas')
    }
  }

  return (
    <Card className="border-neutral-200 shadow-sm h-fit">
      <CardHeader className="bg-neutral-50/50 border-b border-neutral-100 pb-4">
        <CardTitle className="text-base font-semibold text-neutral-900">Buat Aktivitas</CardTitle>
        <CardDescription className="text-xs text-neutral-500">
          Isi formulir berikut untuk membuat kegiatan baru.
        </CardDescription>
      </CardHeader>
      <CardContent className="pt-4 space-y-4">
        <form className="space-y-4" onSubmit={form.handleSubmit(handleSubmit)}>
          <input type="hidden" {...form.register('org_id')} />
          
          <div className="space-y-1.5">
            <Label className="text-xs font-medium text-neutral-700">Judul Kegiatan</Label>
            <Input 
              placeholder="Contoh: Rapat Koordinasi Awal Tahun" 
              {...form.register('title')} 
              className="h-9 text-sm"
            />
            {form.formState.errors.title && (
              <p className="text-[10px] text-red-600 font-medium">
                {form.formState.errors.title.message}
              </p>
            )}
          </div>

          <div className="space-y-1.5">
            <Label className="text-xs font-medium text-neutral-700">Deskripsi</Label>
            <TextArea
              rows={3}
              placeholder="Jelaskan detail kegiatan secara singkat..."
              {...form.register('description')}
              className="text-sm resize-none"
            />
          </div>

          <div className="grid gap-4 sm:grid-cols-2">
            <div className="space-y-1.5">
              <Label className="text-xs font-medium text-neutral-700">Lokasi</Label>
              <Input 
                placeholder="Gedung / Ruangan" 
                {...form.register('location')} 
                className="h-9 text-sm"
              />
            </div>
            <div className="space-y-1.5">
              <Label className="text-xs font-medium text-neutral-700">Tipe</Label>
              <Input 
                placeholder="Rapat / Seminar / Lomba" 
                {...form.register('type')} 
                className="h-9 text-sm"
              />
            </div>
          </div>

          <div className="grid gap-4 sm:grid-cols-2">
            <div className="space-y-1.5">
              <Label className="text-xs font-medium text-neutral-700">Waktu Mulai</Label>
              <Input 
                type="datetime-local" 
                {...form.register('start_at')} 
                className="h-9 text-sm"
              />
            </div>
            <div className="space-y-1.5">
              <Label className="text-xs font-medium text-neutral-700">Waktu Selesai</Label>
              <Input 
                type="datetime-local" 
                {...form.register('end_at')} 
                className="h-9 text-sm"
              />
            </div>
          </div>

          <Button type="submit" className="w-full bg-brand-600 hover:bg-brand-700 text-white" disabled={isLoading}>
            {isLoading ? (
              <Loader2 className="mr-2 h-4 w-4 animate-spin" />
            ) : (
              <Sparkles className="mr-2 h-4 w-4" />
            )}
            Simpan Aktivitas
          </Button>
        </form>
      </CardContent>
    </Card>
  )
}
