'use client'

import { useState } from 'react'
import { useParams, useRouter } from 'next/navigation'
import { useQuery, useMutation } from '@tanstack/react-query'
import Link from 'next/link'
import Image from 'next/image'
import { toast } from 'sonner'
import {
  ArrowLeft,
  Building2,
  CheckCircle2,
  Mail,
  Phone,
  User,
  GraduationCap,
  MessageSquare,
  Send,
} from 'lucide-react'

import {
  Button,
  Card,
  CardContent,
  Container,
  Input,
  Label,
  Spinner,
  TextArea,
} from '@/components/ui'
import { getOrganization } from '@/lib/apis/org'
import {
  submitPublicJoinRequest,
  type PublicJoinRequestPayload,
} from '@/lib/apis/org-join'

const DUMMY_LOGO = 'https://images.unsplash.com/photo-1560179707-f14e90ef3623?w=200&q=80'

export default function PublicJoinPage() {
  const params = useParams()
  const router = useRouter()
  const orgId = params.id as string

  const [form, setForm] = useState<PublicJoinRequestPayload>({
    name: '',
    email: '',
    nim: '',
    phone: '',
    jurusan: '',
    message: '',
  })
  const [errors, setErrors] = useState<Record<string, string>>({})
  const [submitted, setSubmitted] = useState(false)

  const { data: org, isLoading, isError } = useQuery({
    queryKey: ['org', orgId],
    queryFn: () => getOrganization(orgId),
    enabled: !!orgId,
  })

  const submitMutation = useMutation({
    mutationFn: () => submitPublicJoinRequest(orgId, form),
    onSuccess: () => {
      setSubmitted(true)
      toast.success('Permintaan bergabung berhasil dikirim!')
    },
    onError: (err: Error) => {
      toast.error(err.message || 'Gagal mengirim permintaan')
    },
  })

  const validate = (): boolean => {
    const newErrors: Record<string, string> = {}

    if (!form.name.trim()) {
      newErrors.name = 'Nama lengkap wajib diisi'
    }
    if (!form.email.trim()) {
      newErrors.email = 'Email wajib diisi'
    } else if (!/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(form.email)) {
      newErrors.email = 'Format email tidak valid'
    }
    if (!form.nim.trim()) {
      newErrors.nim = 'NIM wajib diisi'
    }

    setErrors(newErrors)
    return Object.keys(newErrors).length === 0
  }

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault()
    if (validate()) {
      submitMutation.mutate()
    }
  }

  if (isLoading) {
    return (
      <div className="min-h-screen bg-neutral-50 flex items-center justify-center">
        <Spinner size="lg" />
      </div>
    )
  }

  if (isError || !org) {
    return (
      <div className="min-h-screen bg-neutral-50 flex items-center justify-center p-6">
        <div className="text-center space-y-4">
          <div className="w-20 h-20 mx-auto bg-red-100 rounded-full flex items-center justify-center">
            <Building2 className="w-10 h-10 text-red-500" />
          </div>
          <h1 className="text-2xl font-bold text-neutral-900">Organisasi Tidak Ditemukan</h1>
          <p className="text-neutral-500">Halaman yang Anda cari tidak tersedia.</p>
          <Link
            href="/org"
            className="inline-flex items-center gap-2 text-brand-600 hover:text-brand-700 font-medium"
          >
            <ArrowLeft className="w-4 h-4" /> Kembali ke Daftar Organisasi
          </Link>
        </div>
      </div>
    )
  }

  if (submitted) {
    return (
      <div className="min-h-screen bg-gradient-to-b from-green-50 to-white flex items-center justify-center p-6">
        <div className="max-w-md w-full text-center space-y-6">
          <div className="w-20 h-20 mx-auto bg-green-100 rounded-full flex items-center justify-center animate-in zoom-in duration-300">
            <CheckCircle2 className="w-10 h-10 text-green-600" />
          </div>
          <div className="space-y-2">
            <h1 className="text-2xl font-bold text-neutral-900">Permintaan Terkirim!</h1>
            <p className="text-neutral-600">
              Permintaan bergabung Anda ke <strong>{org.name}</strong> telah berhasil dikirim.
              Tim organisasi akan meninjau dan menghubungi Anda melalui email.
            </p>
          </div>
          <div className="pt-4 space-y-3">
            <Link href={`/org/${org.slug}`}>
              <Button variant="outline" className="w-full">
                <ArrowLeft className="w-4 h-4 mr-2" />
                Kembali ke Halaman Organisasi
              </Button>
            </Link>
            <Link href="/public">
              <Button variant="ghost" className="w-full text-neutral-600">
                Lihat Aktivitas Publik
              </Button>
            </Link>
          </div>
        </div>
      </div>
    )
  }

  const logoImage = org.logo_url || DUMMY_LOGO

  return (
    <div className="min-h-screen bg-gradient-to-b from-brand-50/50 to-white">
      {/* Header */}
      <header className="bg-white border-b border-neutral-200">
        <Container>
          <div className="flex items-center justify-between h-16">
            <Link href={`/org/${org.slug}`} className="flex items-center gap-2 text-neutral-600 hover:text-neutral-900 transition-colors">
              <ArrowLeft className="w-4 h-4" />
              <span className="text-sm font-medium">Kembali</span>
            </Link>
          </div>
        </Container>
      </header>

      {/* Main Content */}
      <Container className="py-12">
        <div className="max-w-2xl mx-auto">
          {/* Org Info */}
          <div className="text-center mb-8">
            <div className="w-20 h-20 mx-auto bg-white rounded-2xl shadow-lg p-2 mb-4">
              <Image
                src={logoImage}
                alt={org.name}
                width={80}
                height={80}
                className="object-contain w-full h-full rounded-xl"
              />
            </div>
            <h1 className="text-2xl font-bold text-neutral-900">Bergabung dengan {org.name}</h1>
            <p className="text-neutral-500 mt-2">
              Isi formulir di bawah untuk mengajukan permintaan bergabung
            </p>
          </div>

          {/* Form */}
          <Card className="border-neutral-200 shadow-sm">
            <CardContent className="p-6 sm:p-8">
              <form onSubmit={handleSubmit} className="space-y-6">
                {/* Name */}
                <div className="space-y-2">
                  <Label className="text-sm font-medium text-neutral-700">
                    <User className="w-4 h-4 inline mr-2" />
                    Nama Lengkap <span className="text-red-500">*</span>
                  </Label>
                  <Input
                    placeholder="Masukkan nama lengkap Anda"
                    value={form.name}
                    onChange={(e) => setForm({ ...form, name: e.target.value })}
                    className={errors.name ? 'border-red-500' : ''}
                  />
                  {errors.name && <p className="text-xs text-red-600">{errors.name}</p>}
                </div>

                {/* Email */}
                <div className="space-y-2">
                  <Label className="text-sm font-medium text-neutral-700">
                    <Mail className="w-4 h-4 inline mr-2" />
                    Email <span className="text-red-500">*</span>
                  </Label>
                  <Input
                    type="email"
                    placeholder="contoh@email.com"
                    value={form.email}
                    onChange={(e) => setForm({ ...form, email: e.target.value })}
                    className={errors.email ? 'border-red-500' : ''}
                  />
                  {errors.email && <p className="text-xs text-red-600">{errors.email}</p>}
                </div>

                {/* NIM & Phone */}
                <div className="grid gap-4 sm:grid-cols-2">
                  <div className="space-y-2">
                    <Label className="text-sm font-medium text-neutral-700">
                      <GraduationCap className="w-4 h-4 inline mr-2" />
                      NIM <span className="text-red-500">*</span>
                    </Label>
                    <Input
                      placeholder="Nomor Induk Mahasiswa"
                      value={form.nim}
                      onChange={(e) => setForm({ ...form, nim: e.target.value })}
                      className={errors.nim ? 'border-red-500' : ''}
                    />
                    {errors.nim && <p className="text-xs text-red-600">{errors.nim}</p>}
                  </div>
                  <div className="space-y-2">
                    <Label className="text-sm font-medium text-neutral-700">
                      <Phone className="w-4 h-4 inline mr-2" />
                      No. Telepon
                    </Label>
                    <Input
                      placeholder="08xxxxxxxxxx"
                      value={form.phone}
                      onChange={(e) => setForm({ ...form, phone: e.target.value })}
                    />
                  </div>
                </div>

                {/* Jurusan */}
                <div className="space-y-2">
                  <Label className="text-sm font-medium text-neutral-700">
                    <Building2 className="w-4 h-4 inline mr-2" />
                    Jurusan / Program Studi
                  </Label>
                  <Input
                    placeholder="Contoh: Teknik Informatika"
                    value={form.jurusan}
                    onChange={(e) => setForm({ ...form, jurusan: e.target.value })}
                  />
                </div>

                {/* Message */}
                <div className="space-y-2">
                  <Label className="text-sm font-medium text-neutral-700">
                    <MessageSquare className="w-4 h-4 inline mr-2" />
                    Pesan / Motivasi (Opsional)
                  </Label>
                  <TextArea
                    rows={4}
                    placeholder="Ceritakan mengapa Anda ingin bergabung dengan organisasi ini..."
                    value={form.message}
                    onChange={(e) => setForm({ ...form, message: e.target.value })}
                  />
                </div>

                {/* Submit */}
                <Button
                  type="submit"
                  className="w-full bg-brand-600 hover:bg-brand-700 text-white"
                  disabled={submitMutation.isPending}
                >
                  {submitMutation.isPending ? (
                    <Spinner className="w-4 h-4 mr-2" />
                  ) : (
                    <Send className="w-4 h-4 mr-2" />
                  )}
                  Kirim Permintaan Bergabung
                </Button>

                <p className="text-xs text-center text-neutral-500">
                  Dengan mengirim formulir ini, Anda menyetujui bahwa data Anda akan diproses
                  oleh pengurus organisasi untuk keperluan seleksi anggota.
                </p>
              </form>
            </CardContent>
          </Card>
        </div>
      </Container>
    </div>
  )
}
