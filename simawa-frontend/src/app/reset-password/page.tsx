'use client'

import Link from 'next/link'
import { useRouter, useSearchParams } from 'next/navigation'
import { useState, useEffect, Suspense } from 'react'
import { useForm } from 'react-hook-form'
import { z } from 'zod'
import { zodResolver } from '@hookform/resolvers/zod'
import { toast } from 'sonner'
import { ArrowRight, KeyRound, Mail } from 'lucide-react'

import {
  Button,
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
  Input,
  InputPassword,
  Label,
} from '@/components/ui'
import { resetPassword } from '@/lib/apis/auth'

const resetPasswordSchema = z
  .object({
    email: z.string().min(1, 'Email wajib diisi').email('Format email tidak valid'),
    otp: z.string().min(6, 'Kode OTP harus 6 digit'),
    new_password: z.string().min(8, 'Password minimal 8 karakter'),
    confirm_password: z.string().min(1, 'Konfirmasi password wajib diisi'),
  })
  .refine((data) => data.new_password === data.confirm_password, {
    message: 'Password tidak cocok',
    path: ['confirm_password'],
  })

type ResetPasswordForm = z.infer<typeof resetPasswordSchema>

export default function ResetPasswordPage() {
  return (
    <Suspense fallback={null}>
      <ResetPasswordContent />
    </Suspense>
  )
}

function ResetPasswordContent() {
  const router = useRouter()
  const searchParams = useSearchParams()
  const [isSubmitting, setIsSubmitting] = useState(false)
  const emailFromQuery = searchParams.get('email') || ''

  const form = useForm<ResetPasswordForm>({
    resolver: zodResolver(resetPasswordSchema),
    defaultValues: {
      email: emailFromQuery,
      otp: '',
      new_password: '',
      confirm_password: '',
    },
  })

  // Update email when query param changes
  useEffect(() => {
    if (emailFromQuery) {
      form.setValue('email', emailFromQuery)
    }
  }, [emailFromQuery, form])

  const onSubmit = async (values: ResetPasswordForm) => {
    setIsSubmitting(true)
    try {
      await resetPassword({
        email: values.email,
        otp: values.otp,
        new_password: values.new_password,
        confirm_password: values.confirm_password,
      })
      toast.success('Password berhasil diubah. Silakan login.')
      router.push('/login')
    } catch (err: any) {
      toast.error(err.message || 'Gagal mereset password')
    } finally {
      setIsSubmitting(false)
    }
  }

  return (
    <div className="min-h-screen flex items-center justify-center p-6 bg-neutral-50/50">
      <Card className="w-full max-w-md border-neutral-200 shadow-lg shadow-neutral-200/50">
        <CardHeader>
          <CardTitle className="text-2xl font-bold text-center">Reset Password</CardTitle>
          <CardDescription className="text-center">
            Masukan kode OTP yang diterima di email dan password baru Anda.
          </CardDescription>
        </CardHeader>
        <CardContent>
          <form className="space-y-5" onSubmit={form.handleSubmit(onSubmit)}>
            <div className="space-y-2">
              <Label htmlFor="email">Email</Label>
              <div className="relative">
                <Input
                  id="email"
                  type="email"
                  placeholder="nama@raharja.info"
                  className="pl-10 h-11 bg-neutral-50"
                  readOnly
                  {...form.register('email')}
                />
                <Mail className="absolute left-3 top-3 h-5 w-5 text-neutral-400" />
              </div>
              {!emailFromQuery && (
                <p className="text-xs text-amber-600 font-medium ml-1">
                  Silakan mulai dari halaman <Link href="/forgot-password" className="underline">Lupa Password</Link>
                </p>
              )}
              {form.formState.errors.email && (
                <p className="text-xs text-red-600 font-medium ml-1">
                  {form.formState.errors.email.message}
                </p>
              )}
            </div>

            <div className="space-y-2">
              <Label htmlFor="otp">Kode OTP</Label>
              <div className="relative">
                <Input
                  id="otp"
                  placeholder="123456"
                  className="pl-10 h-11 tracking-widest font-mono"
                  maxLength={6}
                  {...form.register('otp')}
                />
                <KeyRound className="absolute left-3 top-3 h-5 w-5 text-neutral-400" />
              </div>
              {form.formState.errors.otp && (
                <p className="text-xs text-red-600 font-medium ml-1">
                  {form.formState.errors.otp.message}
                </p>
              )}
            </div>

            <div className="space-y-2">
              <Label htmlFor="new_password">Password Baru</Label>
              <InputPassword
                id="new_password"
                placeholder="Password Baru"
                className="h-11"
                {...form.register('new_password')}
              />
              {form.formState.errors.new_password && (
                <p className="text-xs text-red-600 font-medium ml-1">
                  {form.formState.errors.new_password.message}
                </p>
              )}
            </div>

            <div className="space-y-2">
              <Label htmlFor="confirm_password">Konfirmasi Password Baru</Label>
              <InputPassword
                id="confirm_password"
                placeholder="Ulangi Password Baru"
                className="h-11"
                {...form.register('confirm_password')}
              />
              {form.formState.errors.confirm_password && (
                <p className="text-xs text-red-600 font-medium ml-1">
                  {form.formState.errors.confirm_password.message}
                </p>
              )}
            </div>

            <Button
              className="w-full h-11 bg-brand-600 hover:bg-brand-700 text-white font-medium text-base shadow-lg shadow-brand-500/20 transition-all"
              type="submit"
              disabled={isSubmitting}
            >
              {isSubmitting ? 'Memproses...' : 'Ubah Password'}
              {!isSubmitting && <ArrowRight className="ml-2 h-4 w-4" />}
            </Button>
          </form>

          <div className="mt-6 text-center">
            <Link
              href="/login"
              className="text-sm font-medium text-brand-600 hover:text-brand-700 hover:underline"
            >
              Kembali ke Login
            </Link>
          </div>
        </CardContent>
      </Card>
    </div>
  )
}
