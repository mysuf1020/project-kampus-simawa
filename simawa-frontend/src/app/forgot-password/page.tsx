'use client'

import Link from 'next/link'
import { useState } from 'react'
import { useForm } from 'react-hook-form'
import { z } from 'zod'
import { zodResolver } from '@hookform/resolvers/zod'
import { toast } from 'sonner'
import { ArrowRight, Mail } from 'lucide-react'

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
import { forgotPassword } from '@/lib/apis/auth'

const forgotPasswordSchema = z.object({
  email: z.string().min(1, 'Email wajib diisi').email('Format email tidak valid'),
})

type ForgotPasswordForm = z.infer<typeof forgotPasswordSchema>

export default function ForgotPasswordPage() {
  const [isSubmitting, setIsSubmitting] = useState(false)
  const [isSent, setIsSent] = useState(false)

  const form = useForm<ForgotPasswordForm>({
    resolver: zodResolver(forgotPasswordSchema),
    defaultValues: { email: '' },
  })

  const onSubmit = async (values: ForgotPasswordForm) => {
    setIsSubmitting(true)
    try {
      await forgotPassword(values.email)
      setIsSent(true)
      toast.success('Email reset password telah dikirim')
    } catch (err: any) {
      toast.error(err.message || 'Gagal mengirim email reset password')
    } finally {
      setIsSubmitting(false)
    }
  }

  return (
    <div className="min-h-screen flex items-center justify-center p-6 bg-neutral-50/50">
      <Card className="w-full max-w-md border-neutral-200 shadow-lg shadow-neutral-200/50">
        <CardHeader>
          <CardTitle className="text-2xl font-bold text-center">Lupa Password</CardTitle>
          <CardDescription className="text-center">
            Masukan email Anda untuk menerima instruksi reset password.
          </CardDescription>
        </CardHeader>
        <CardContent>
          {isSent ? (
            <div className="text-center space-y-4">
              <div className="bg-green-50 text-green-700 p-4 rounded-lg text-sm">
                Email instruksi reset password telah dikirim ke{' '}
                <strong>{form.getValues('email')}</strong>. Silakan cek kotak masuk atau
                folder spam Anda.
              </div>
              <p className="text-sm text-neutral-500">
                Setelah menerima kode OTP, silakan lanjutkan ke halaman reset password.
              </p>
              <Link href={`/reset-password?email=${encodeURIComponent(form.getValues('email'))}`}>
                <Button className="w-full">Lanjut ke Reset Password</Button>
              </Link>
            </div>
          ) : (
            <form className="space-y-5" onSubmit={form.handleSubmit(onSubmit)}>
              <div className="space-y-2">
                <Label htmlFor="email">Email</Label>
                <div className="relative">
                  <Input
                    id="email"
                    type="email"
                    placeholder="nama@raharja.info"
                    className="pl-10 h-11"
                    {...form.register('email')}
                  />
                  <Mail className="absolute left-3 top-3 h-5 w-5 text-neutral-400" />
                </div>
                {form.formState.errors.email && (
                  <p className="text-xs text-red-600 font-medium ml-1">
                    {form.formState.errors.email.message}
                  </p>
                )}
              </div>

              <Button
                className="w-full h-11 bg-brand-600 hover:bg-brand-700 text-white font-medium text-base shadow-lg shadow-brand-500/20 transition-all"
                type="submit"
                disabled={isSubmitting}
              >
                {isSubmitting ? 'Memproses...' : 'Kirim Instruksi'}
                {!isSubmitting && <ArrowRight className="ml-2 h-4 w-4" />}
              </Button>
            </form>
          )}

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
