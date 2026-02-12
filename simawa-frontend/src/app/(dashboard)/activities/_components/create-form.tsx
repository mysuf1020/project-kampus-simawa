'use client'

import { useEffect, useState } from 'react'
import { useForm } from 'react-hook-form'
import { z } from 'zod'
import { zodResolver } from '@hookform/resolvers/zod'
import { Loader2, Sparkles, Building2, Users, GraduationCap } from 'lucide-react'
import { toast } from 'sonner'
import { useQuery } from '@tanstack/react-query'

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
import { VALIDATION_LIMITS, ERROR_MESSAGES } from '@/lib/validations/form-schemas'
import { listOrganizations } from '@/lib/apis/org'

const activitySchema = z.object({
  org_id: z.string().min(1, ERROR_MESSAGES.required('Organisasi')),
  title: z.string()
    .min(VALIDATION_LIMITS.TITLE_MIN, ERROR_MESSAGES.titleMin)
    .max(VALIDATION_LIMITS.TITLE_MAX, ERROR_MESSAGES.titleMax),
  description: z.string().max(VALIDATION_LIMITS.DESCRIPTION_MAX, ERROR_MESSAGES.descriptionMax).optional(),
  location: z.string().max(200, 'Lokasi maksimal 200 karakter').optional(),
  type: z.string().max(100, 'Tipe maksimal 100 karakter').optional(),
  collab_type: z.string().optional(),
  collaborator_org_ids: z.array(z.string()).optional(),
  start_at: z.string().optional(),
  end_at: z.string().optional(),
})

const COLLAB_OPTIONS = [
  { value: 'INTERNAL', label: 'Internal', desc: 'Kegiatan internal organisasi', icon: Building2 },
  { value: 'COLLAB', label: 'Kolaborasi', desc: 'Bersama organisasi lain', icon: Users },
  { value: 'CAMPUS', label: 'Kampus', desc: 'Kegiatan tingkat kampus', icon: GraduationCap },
] as const

export type ActivityFormValues = z.infer<typeof activitySchema>

type Props = {
  orgId: string
  onCreate: (values: ActivityFormValues) => Promise<void>
  isLoading?: boolean
}

export function ActivityCreateForm({ orgId, onCreate, isLoading }: Props) {
  const [collabType, setCollabType] = useState('INTERNAL')
  const [selectedCollabOrgs, setSelectedCollabOrgs] = useState<string[]>([])

  const { data: orgs } = useQuery({ queryKey: ['orgs'], queryFn: listOrganizations })

  const form = useForm<ActivityFormValues>({
    resolver: zodResolver(activitySchema),
    defaultValues: { org_id: '', title: '', description: '', location: '', type: '', collab_type: 'INTERNAL', collaborator_org_ids: [] },
    mode: 'onChange',
  })

  useEffect(() => {
    if (orgId) form.setValue('org_id', orgId)
  }, [orgId, form])

  useEffect(() => {
    form.setValue('collab_type', collabType)
    if (collabType !== 'COLLAB') {
      setSelectedCollabOrgs([])
      form.setValue('collaborator_org_ids', [])
    }
  }, [collabType, form])

  const toggleCollabOrg = (id: string) => {
    setSelectedCollabOrgs((prev) => {
      const next = prev.includes(id) ? prev.filter((v) => v !== id) : [...prev, id]
      form.setValue('collaborator_org_ids', next)
      return next
    })
  }

  const handleSubmit = async (values: ActivityFormValues) => {
    try {
      await onCreate(values)
      toast.success('Aktivitas berhasil dibuat')
      form.reset({ ...values, title: '', description: '', location: '', type: '', collab_type: 'INTERNAL', collaborator_org_ids: [] })
      setCollabType('INTERNAL')
      setSelectedCollabOrgs([])
    } catch {
      toast.error('Gagal membuat aktivitas')
    }
  }

  return (
    <Card className="border-neutral-200 shadow-sm h-fit">
      <CardHeader className="bg-neutral-50/50 border-b border-neutral-100 pb-4">
        <CardTitle className="text-base font-semibold text-neutral-900">
          Buat Aktivitas
        </CardTitle>
        <CardDescription className="text-xs text-neutral-500">
          Isi formulir berikut untuk membuat kegiatan baru.
        </CardDescription>
      </CardHeader>
      <CardContent className="pt-4 space-y-4">
        <form className="space-y-4" onSubmit={form.handleSubmit(handleSubmit)}>
          <input type="hidden" {...form.register('org_id')} />

          <div className="space-y-1.5">
            <Label htmlFor="title" className="text-xs font-medium text-neutral-700">
              Judul Kegiatan
            </Label>
            <Input
              id="title"
              placeholder="Judul kegiatan (min 3, max 200 karakter)"
              maxLength={VALIDATION_LIMITS.TITLE_MAX}
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
            <Label htmlFor="description" className="text-xs font-medium text-neutral-700">
              Deskripsi
            </Label>
            <TextArea
              id="description"
              rows={3}
              placeholder="Jelaskan detail kegiatan (max 2000 karakter)"
              maxLength={VALIDATION_LIMITS.DESCRIPTION_MAX}
              {...form.register('description')}
              className="text-sm resize-none"
            />
          </div>

          <div className="grid gap-4 sm:grid-cols-2">
            <div className="space-y-1.5">
              <Label htmlFor="location" className="text-xs font-medium text-neutral-700">
                Lokasi
              </Label>
              <Input
                id="location"
                placeholder="Gedung / Ruangan"
                maxLength={200}
                {...form.register('location')}
                className="h-9 text-sm"
              />
            </div>
            <div className="space-y-1.5">
              <Label htmlFor="type" className="text-xs font-medium text-neutral-700">
                Tipe
              </Label>
              <Input
                id="type"
                placeholder="Rapat / Seminar / Lomba"
                maxLength={100}
                {...form.register('type')}
                className="h-9 text-sm"
              />
            </div>
          </div>

          <div className="space-y-1.5">
            <Label className="text-xs font-medium text-neutral-700">
              Lingkup Kegiatan
            </Label>
            <div className="grid grid-cols-3 gap-2">
              {COLLAB_OPTIONS.map((opt) => {
                const Icon = opt.icon
                const active = collabType === opt.value
                return (
                  <button
                    key={opt.value}
                    type="button"
                    onClick={() => setCollabType(opt.value)}
                    className={`flex flex-col items-center gap-1.5 rounded-lg border-2 p-2.5 text-center transition-all ${
                      active
                        ? 'border-brand-500 bg-brand-50 text-brand-700'
                        : 'border-neutral-200 bg-white text-neutral-500 hover:border-neutral-300'
                    }`}
                  >
                    <Icon className={`h-4 w-4 ${active ? 'text-brand-600' : 'text-neutral-400'}`} />
                    <span className="text-[11px] font-semibold leading-tight">{opt.label}</span>
                  </button>
                )
              })}
            </div>
          </div>

          {collabType === 'COLLAB' && (
            <div className="space-y-1.5">
              <Label className="text-xs font-medium text-neutral-700">
                Organisasi Kolaborator
              </Label>
              <div className="flex flex-wrap gap-2">
                {(orgs ?? []).filter((o) => o.id !== orgId).map((org) => {
                  const selected = selectedCollabOrgs.includes(org.id)
                  return (
                    <button
                      key={org.id}
                      type="button"
                      onClick={() => toggleCollabOrg(org.id)}
                      className={`inline-flex items-center gap-1.5 rounded-full px-3 py-1.5 text-[11px] font-medium border transition-all ${
                        selected
                          ? 'border-brand-500 bg-brand-50 text-brand-700'
                          : 'border-neutral-200 bg-white text-neutral-600 hover:border-neutral-300'
                      }`}
                    >
                      <Building2 className="h-3 w-3" />
                      {org.name}
                    </button>
                  )
                })}
              </div>
              {selectedCollabOrgs.length === 0 && (
                <p className="text-[10px] text-neutral-400">Pilih minimal satu organisasi kolaborator</p>
              )}
            </div>
          )}

          <div className="grid gap-4 sm:grid-cols-2">
            <div className="space-y-1.5">
              <Label htmlFor="start_at" className="text-xs font-medium text-neutral-700">
                Waktu Mulai
              </Label>
              <Input
                id="start_at"
                type="datetime-local"
                {...form.register('start_at')}
                className="h-9 text-sm"
              />
            </div>
            <div className="space-y-1.5">
              <Label htmlFor="end_at" className="text-xs font-medium text-neutral-700">
                Waktu Selesai
              </Label>
              <Input
                id="end_at"
                type="datetime-local"
                {...form.register('end_at')}
                className="h-9 text-sm"
              />
            </div>
          </div>

          <Button
            type="submit"
            className="w-full bg-brand-600 hover:bg-brand-700 text-white"
            disabled={isLoading}
          >
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
