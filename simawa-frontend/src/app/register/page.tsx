'use client'

import Link from 'next/link'
import { useRouter } from 'next/navigation'
import { Suspense, useState, useEffect } from 'react'
import { useForm } from 'react-hook-form'
import { zodResolver } from '@hookform/resolvers/zod'
import { toast } from 'sonner'
import { ArrowRight, Mail, User, ShieldCheck, RefreshCw } from 'lucide-react'

import { Button, Card, CardContent, Input, InputPassword, Label } from '@/components/ui'
import { register, verifyEmail, resendOTP } from '@/lib/apis/auth'
import { EMAIL_DOMAIN, getEmailPlaceholder } from '@/lib/config/email'
import { 
  registerFormSchema, 
  otpVerificationSchema,
  VALIDATION_LIMITS,
  type RegisterFormData,
  type OtpVerificationFormData,
} from '@/lib/validations/form-schemas'

export default function RegisterPage() {
  return (
    <Suspense fallback={null}>
      <RegisterContent />
    </Suspense>
  )
}

function RegisterContent() {
  const router = useRouter()
  const [step, setStep] = useState<'register' | 'otp'>('register')
  const [email, setEmail] = useState('')
  const [isSubmitting, setIsSubmitting] = useState(false)
  const [isResending, setIsResending] = useState(false)
  const [countdown, setCountdown] = useState(0)

  // Countdown timer for resend
  useEffect(() => {
    if (countdown > 0) {
      const timer = setTimeout(() => setCountdown(countdown - 1), 1000)
      return () => clearTimeout(timer)
    }
  }, [countdown])

  const form = useForm<RegisterFormData>({
    resolver: zodResolver(registerFormSchema),
    defaultValues: {
      username: '',
      first_name: '',
      email: '',
      password: '',
      confirm_password: '',
    },
    mode: 'onChange',
  })

  const otpForm = useForm<OtpVerificationFormData>({
    resolver: zodResolver(otpVerificationSchema),
    defaultValues: { otp: '' },
  })

  const onRegister = async (values: RegisterFormData) => {
    setIsSubmitting(true)
    try {
      await register(values)
      setEmail(values.email)
      setStep('otp')
      toast.success('Registrasi berhasil. Silakan cek email untuk kode OTP.')
    } catch (err: any) {
      toast.error(err.message || 'Gagal registrasi')
    } finally {
      setIsSubmitting(false)
    }
  }

  const onVerify = async (values: OtpVerificationFormData) => {
    setIsSubmitting(true)
    try {
      await verifyEmail({ email, otp: values.otp })
      toast.success('Verifikasi berhasil. Silakan login.')
      router.push('/login')
    } catch (err: any) {
      toast.error(err.message || 'Gagal verifikasi OTP')
    } finally {
      setIsSubmitting(false)
    }
  }

  const handleResendOTP = async () => {
    if (!email) return
    setIsResending(true)
    try {
      await resendOTP(email)
      toast.success('Kode OTP baru telah dikirim ke email Anda')
      setCountdown(60)
    } catch (err: any) {
      toast.error(err.message || 'Gagal mengirim ulang OTP')
    } finally {
      setIsResending(false)
    }
  }

  return (
    <div className="min-h-screen grid lg:grid-cols-2 bg-neutral-50/50">
      {/* Left Brand Panel */}
      <div className="hidden lg:flex flex-col justify-between bg-brand-900 p-12 text-white relative overflow-hidden">
        <div className="absolute top-0 right-0 -mr-20 -mt-20 h-96 w-96 bg-brand-500 rounded-full blur-[100px] opacity-20"></div>
        <div className="absolute bottom-0 left-0 -ml-20 -mb-20 h-96 w-96 bg-blue-600 rounded-full blur-[100px] opacity-20"></div>

        <div className="relative z-10">
          <div className="flex items-center gap-3">
            <div className="h-10 w-10 bg-white rounded-xl flex items-center justify-center shadow-lg shadow-black/10">
              <span className="text-brand-700 font-bold text-lg">S</span>
            </div>
            <span className="font-bold text-xl tracking-tight">SIMAWA</span>
          </div>
        </div>

        <div className="relative z-10 max-w-lg space-y-6">
          <h1 className="text-4xl font-bold leading-tight">
            Bergabung dengan Komunitas Mahasiswa
          </h1>
          <p className="text-brand-100 text-lg leading-relaxed">
            Daftarkan diri Anda untuk mengakses berbagai kegiatan dan organisasi
            kemahasiswaan.
          </p>
          <div className="flex gap-4 pt-4">
            <div className="flex items-center gap-2 bg-white/10 px-4 py-2 rounded-full backdrop-blur-sm border border-white/10">
              <ShieldCheck className="h-4 w-4 text-green-400" />
              <span className="text-sm font-medium">Verified Student</span>
            </div>
          </div>
        </div>

        <div className="relative z-10 text-brand-200 text-sm">
          © {new Date().getFullYear()} Universitas Raharja. All rights reserved.
        </div>
      </div>

      {/* Right Form */}
      <div className="flex items-center justify-center p-6 lg:p-12">
        <div className="w-full max-w-md space-y-8">
          <div className="text-center lg:text-left">
            <h2 className="text-3xl font-bold text-neutral-900 tracking-tight">
              {step === 'register' ? 'Buat Akun Baru' : 'Verifikasi Email'}
            </h2>
            <p className="mt-2 text-neutral-500">
              {step === 'register'
                ? 'Lengkapi data diri Anda untuk mendaftar.'
                : `Masukan kode OTP yang dikirim ke ${email}`}
            </p>
          </div>

          <Card className="border-neutral-200 shadow-lg shadow-neutral-200/50">
            <CardContent className="pt-6">
              {step === 'register' ? (
                <form className="space-y-5" onSubmit={form.handleSubmit(onRegister)}>
                  <div className="space-y-2">
                    <Label htmlFor="username">Username</Label>
                    <div className="relative">
                      <Input
                        id="username"
                        placeholder="Username (min 4, max 32 karakter)"
                        className="pl-10 h-11"
                        maxLength={VALIDATION_LIMITS.USERNAME_MAX}
                        {...form.register('username')}
                      />
                      <User className="absolute left-3 top-3 h-5 w-5 text-neutral-400" />
                    </div>
                    {form.formState.errors.username && (
                      <p className="text-xs text-red-600 font-medium ml-1">
                        {form.formState.errors.username.message}
                      </p>
                    )}
                  </div>

                  <div className="space-y-2">
                    <Label htmlFor="first_name">Nama Lengkap</Label>
                    <div className="relative">
                      <Input
                        id="first_name"
                        placeholder="Nama Lengkap"
                        className="pl-10 h-11"
                        maxLength={VALIDATION_LIMITS.NAME_MAX}
                        {...form.register('first_name')}
                      />
                      <User className="absolute left-3 top-3 h-5 w-5 text-neutral-400" />
                    </div>
                    {form.formState.errors.first_name && (
                      <p className="text-xs text-red-600 font-medium ml-1">
                        {form.formState.errors.first_name.message}
                      </p>
                    )}
                  </div>

                  <div className="space-y-2">
                    <Label htmlFor="email">Email ({EMAIL_DOMAIN})</Label>
                    <div className="relative">
                      <Input
                        id="email"
                        type="email"
                        placeholder={getEmailPlaceholder()}
                        className="pl-10 h-11"
                        maxLength={VALIDATION_LIMITS.EMAIL_MAX}
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
                    <Label htmlFor="password">Password</Label>
                    <InputPassword
                      id="password"
                      placeholder="Password (min 8 karakter)"
                      className="h-11"
                      maxLength={VALIDATION_LIMITS.PASSWORD_MAX}
                      {...form.register('password')}
                    />
                    {form.formState.errors.password && (
                      <p className="text-xs text-red-600 font-medium ml-1">
                        {form.formState.errors.password.message}
                      </p>
                    )}
                  </div>

                  <div className="space-y-2">
                    <Label htmlFor="confirm_password">Konfirmasi Password</Label>
                    <InputPassword
                      id="confirm_password"
                      placeholder="Ulangi Password"
                      className="h-11"
                      maxLength={VALIDATION_LIMITS.PASSWORD_MAX}
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
                    {isSubmitting ? 'Memproses...' : 'Daftar Sekarang'}
                    {!isSubmitting && <ArrowRight className="ml-2 h-4 w-4" />}
                  </Button>
                </form>
              ) : (
                <form className="space-y-5" onSubmit={otpForm.handleSubmit(onVerify)}>
                  <div className="space-y-2">
                    <Label htmlFor="otp">Kode OTP</Label>
                    <Input
                      id="otp"
                      placeholder="123456"
                      className="text-center text-2xl tracking-widest h-14 font-mono"
                      maxLength={6}
                      {...otpForm.register('otp')}
                    />
                    {otpForm.formState.errors.otp && (
                      <p className="text-xs text-red-600 font-medium ml-1">
                        {otpForm.formState.errors.otp.message}
                      </p>
                    )}
                  </div>

                  <Button
                    className="w-full h-11 bg-brand-600 hover:bg-brand-700 text-white font-medium text-base shadow-lg shadow-brand-500/20 transition-all"
                    type="submit"
                    disabled={isSubmitting}
                  >
                    {isSubmitting ? 'Memverifikasi...' : 'Verifikasi Akun'}
                  </Button>

                  {/* Resend OTP Button */}
                  <div className="flex items-center justify-between text-sm pt-2">
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

                  <div className="text-center">
                    <button
                      type="button"
                      onClick={() => setStep('register')}
                      className="text-sm text-brand-600 hover:underline"
                    >
                      Kembali ke registrasi
                    </button>
                  </div>
                </form>
              )}
            </CardContent>
          </Card>

          <p className="text-center text-sm text-neutral-500">
            Sudah punya akun?{' '}
            <Link
              className="font-medium text-brand-600 hover:text-brand-700 hover:underline transition-colors"
              href="/login"
            >
              Masuk disini
            </Link>
          </p>
        </div>
      </div>
    </div>
  )
}
