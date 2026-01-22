'use client'

import Link from 'next/link'
import { useRouter, useSearchParams } from 'next/navigation'
import { useState, useEffect, Suspense } from 'react'
import { useForm } from 'react-hook-form'
import { z } from 'zod'
import { zodResolver } from '@hookform/resolvers/zod'
import { toast } from 'sonner'
import { ArrowRight, KeyRound, Mail, RefreshCw } from 'lucide-react'

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
import { verifyEmail, resendOTP } from '@/lib/apis/auth'

const verifyEmailSchema = z.object({
  email: z.string().min(1, 'Email wajib diisi').email('Format email tidak valid'),
  otp: z.string().min(6, 'Kode OTP harus 6 digit'),
})

type VerifyEmailForm = z.infer<typeof verifyEmailSchema>

export default function VerifyEmailPage() {
  return (
    <Suspense fallback={null}>
      <VerifyEmailContent />
    </Suspense>
  )
}

function VerifyEmailContent() {
  const router = useRouter()
  const searchParams = useSearchParams()
  const [isSubmitting, setIsSubmitting] = useState(false)
  const [isResending, setIsResending] = useState(false)
  const [countdown, setCountdown] = useState(0)
  const emailFromQuery = searchParams.get('email') || ''

  const form = useForm<VerifyEmailForm>({
    resolver: zodResolver(verifyEmailSchema),
    defaultValues: {
      email: emailFromQuery,
      otp: '',
    },
  })

  // Update email when query param changes
  useEffect(() => {
    if (emailFromQuery) {
      form.setValue('email', emailFromQuery)
    }
  }, [emailFromQuery, form])

  // Countdown timer for resend
  useEffect(() => {
    if (countdown > 0) {
      const timer = setTimeout(() => setCountdown(countdown - 1), 1000)
      return () => clearTimeout(timer)
    }
  }, [countdown])

  const onSubmit = async (values: VerifyEmailForm) => {
    setIsSubmitting(true)
    try {
      await verifyEmail({
        email: values.email,
        otp: values.otp,
      })
      toast.success('Email berhasil diverifikasi! Silakan login.')
      router.push('/login')
    } catch (err: any) {
      toast.error(err.message || 'Gagal verifikasi email')
    } finally {
      setIsSubmitting(false)
    }
  }

  const handleResendOTP = async () => {
    const email = form.getValues('email')
    if (!email) {
      toast.error('Masukkan email terlebih dahulu')
      return
    }

    setIsResending(true)
    try {
      await resendOTP(email)
      toast.success('Kode OTP baru telah dikirim ke email Anda')
      setCountdown(60) // 60 second cooldown
    } catch (err: any) {
      toast.error(err.message || 'Gagal mengirim ulang OTP')
    } finally {
      setIsResending(false)
    }
  }

  return (
    <div className="min-h-screen flex items-center justify-center p-6 bg-neutral-50/50">
      <Card className="w-full max-w-md border-neutral-200 shadow-lg shadow-neutral-200/50">
        <CardHeader>
          <CardTitle className="text-2xl font-bold text-center">Verifikasi Email</CardTitle>
          <CardDescription className="text-center">
            Masukkan kode OTP yang dikirim ke email Anda untuk menyelesaikan verifikasi.
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
                  className={`pl-10 h-11 ${emailFromQuery ? 'bg-neutral-50' : ''}`}
                  readOnly={!!emailFromQuery}
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

            {/* Resend OTP Button */}
            <div className="flex items-center justify-between text-sm">
              <span className="text-neutral-500">Tidak menerima kode?</span>
              <button
                type="button"
                onClick={handleResendOTP}
                disabled={isResending || countdown > 0}
                className="inline-flex items-center gap-1.5 text-brand-600 hover:text-brand-700 font-medium disabled:opacity-50 disabled:cursor-not-allowed"
              >
                <RefreshCw className={`h-4 w-4 ${isResending ? 'animate-spin' : ''}`} />
                {countdown > 0 ? `Kirim ulang (${countdown}s)` : 'Kirim ulang OTP'}
              </button>
            </div>

            <Button
              className="w-full h-11 bg-brand-600 hover:bg-brand-700 text-white font-medium text-base shadow-lg shadow-brand-500/20 transition-all"
              type="submit"
              disabled={isSubmitting}
            >
              {isSubmitting ? 'Memverifikasi...' : 'Verifikasi Email'}
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
