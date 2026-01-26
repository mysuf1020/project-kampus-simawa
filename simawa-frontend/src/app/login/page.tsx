'use client'

import Link from 'next/link'
import { useRouter, useSearchParams } from 'next/navigation'
import { Suspense, useEffect, useState } from 'react'
import { useForm } from 'react-hook-form'
import { zodResolver } from '@hookform/resolvers/zod'
import { toast } from 'sonner'
import { signIn, useSession } from 'next-auth/react'
import { ArrowRight, Lock, Mail, ShieldCheck } from 'lucide-react'
import ReCAPTCHA from 'react-google-recaptcha'

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
import { getEmailPlaceholder } from '@/lib/config/email'
import { loginFormSchema, VALIDATION_LIMITS, type LoginFormData } from '@/lib/validations/form-schemas'

export default function LoginPage() {
  return (
    <Suspense fallback={null}>
      <LoginContent />
    </Suspense>
  )
}

function LoginContent() {
  const router = useRouter()
  const searchParams = useSearchParams()
  const [isSubmitting, setIsSubmitting] = useState(false)
  const [step, setStep] = useState<'credentials' | 'otp'>('credentials')
  const [captchaToken, setCaptchaToken] = useState<string | null>(null)
  const { status, data: session } = useSession()

  const form = useForm<LoginFormData>({
    resolver: zodResolver(loginFormSchema),
    defaultValues: { login: '', password: '' },
    mode: 'onChange',
  })

  // Only require captcha if configured
  const siteKey = process.env.NEXT_PUBLIC_RECAPTCHA_SITE_KEY

  const [otp, setOtp] = useState('')

  useEffect(() => {
    const reason = searchParams.get('reason')
    if (reason === 'session-expired') {
      toast.warning('Sesi kedaluwarsa, silakan login kembali.')
    }
  }, [router, searchParams])

  useEffect(() => {
    if (status !== 'authenticated') return
    const isSessionExpired = (session?.user as { error?: string } | undefined)?.error
    if (isSessionExpired === 'RefreshTokenError') return

    const callbackUrl = searchParams.get('callbackUrl') || '/dashboard'
    router.replace(callbackUrl)
  }, [router, searchParams, session, status])

  const onCredentialsSubmit = async (values: LoginFormData) => {
    setIsSubmitting(true)
    try {
      // Step 1: Call API to validate creds and trigger OTP
      const { login } = await import('@/lib/apis/auth') // Dynamic import to avoid server issues if any
      await login({
        login: values.login,
        password: values.password,
        captcha_token: captchaToken || undefined,
      })

      toast.success('Kredensial valid. Silakan masukan kode OTP yang dikirim ke email.')
      setStep('otp')
    } catch (err: any) {
      // Extract detailed error message
      const message =
        err?.response?.data?.message ||
        err?.displayMessage ||
        err?.message ||
        'Gagal login'
      toast.error(`Login gagal: ${message}`)
      console.error('[Login Error]', err?.response?.data || err)
    } finally {
      setIsSubmitting(false)
    }
  }

  const onOtpSubmit = async (e: React.FormEvent) => {
    e.preventDefault()
    if (!otp || otp.length < 6) {
      toast.error('Kode OTP tidak valid')
      return
    }

    setIsSubmitting(true)
    try {
      const callbackUrl = searchParams.get('callbackUrl') || '/dashboard'
      // Step 2: SignIn with NextAuth (which calls loginVerify)
      const result = await signIn('credentials', {
        email: form.getValues('login'),
        otp: otp,
        redirect: false,
      })

      if (!result?.ok) {
        const message =
          result?.error === 'CredentialsSignin'
            ? 'Kode OTP salah atau kadaluarsa'
            : result?.error || 'Gagal verifikasi'
        throw new Error(message)
      }

      toast.success('Berhasil masuk')
      const safeTarget =
        callbackUrl.startsWith('/') && !callbackUrl.startsWith('//')
          ? callbackUrl
          : '/dashboard'
      window.location.assign(safeTarget)
    } catch (err: any) {
      // Extract detailed error message for OTP verification
      const message = err?.message || 'Gagal verifikasi OTP'
      toast.error(`Verifikasi gagal: ${message}`)
      console.error('[OTP Verify Error]', err)
    } finally {
      setIsSubmitting(false)
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
            Platform Terpadu Manajemen Organisasi Mahasiswa
          </h1>
          <p className="text-brand-100 text-lg leading-relaxed">
            Kelola surat menyurat, proposal kegiatan, laporan pertanggungjawaban, dan
            anggota organisasi dalam satu dashboard yang efisien.
          </p>
          <div className="flex gap-4 pt-4">
            <div className="flex items-center gap-2 bg-white/10 px-4 py-2 rounded-full backdrop-blur-sm border border-white/10">
              <ShieldCheck className="h-4 w-4 text-green-400" />
              <span className="text-sm font-medium">Secure Access</span>
            </div>
          </div>
        </div>

        <div className="relative z-10 text-brand-200 text-sm">
          © {new Date().getFullYear()} Universitas Raharja. All rights reserved.
        </div>
      </div>

      {/* Right Login Form */}
      <div className="flex items-center justify-center p-6 lg:p-12">
        <div className="w-full max-w-md space-y-8">
          <div className="text-center lg:text-left">
            <h2 className="text-3xl font-bold text-neutral-900 tracking-tight">
              Selamat Datang Kembali
            </h2>
            <p className="mt-2 text-neutral-500">
              {step === 'credentials'
                ? 'Masuk ke SIMAWA Raharja untuk mengakses dashboard.'
                : 'Masukan kode OTP yang dikirim ke email Anda.'}
            </p>
          </div>

          <Card className="border-neutral-200 shadow-lg shadow-neutral-200/50">
            <CardContent className="pt-6">
              {step === 'credentials' ? (
                <form
                  className="space-y-5"
                  onSubmit={form.handleSubmit(onCredentialsSubmit)}
                >
                  <div className="space-y-2">
                    <Label htmlFor="login">Email</Label>
                    <div className="relative">
                      <Input
                        id="login"
                        type="email"
                        autoComplete="username"
                        placeholder={getEmailPlaceholder()}
                        className="pl-10 h-11"
                        maxLength={VALIDATION_LIMITS.EMAIL_MAX}
                        {...form.register('login')}
                      />
                      <Mail className="absolute left-3 top-3 h-5 w-5 text-neutral-400" />
                    </div>
                    {form.formState.errors.login && (
                      <p className="text-xs text-red-600 font-medium ml-1">
                        {form.formState.errors.login.message}
                      </p>
                    )}
                  </div>

                  <div className="space-y-2">
                    <div className="flex items-center justify-between">
                      <Label htmlFor="password">Password</Label>
                      <Link
                        href="/forgot-password"
                        className="text-xs font-medium text-brand-600 hover:text-brand-700 hover:underline"
                      >
                        Lupa password?
                      </Link>
                    </div>
                    <InputPassword
                      id="password"
                      autoComplete="current-password"
                      placeholder="Masukan password Anda"
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

                  <Button
                    className="w-full h-11 bg-brand-600 hover:bg-brand-700 text-white font-medium text-base shadow-lg shadow-brand-500/20 transition-all hover:scale-[1.02] active:scale-[0.98]"
                    type="submit"
                    disabled={isSubmitting}
                  >
                    {isSubmitting ? 'Memproses...' : 'Lanjut'}
                    {!isSubmitting && <ArrowRight className="ml-2 h-4 w-4" />}
                  </Button>
                </form>
              ) : (
                <form className="space-y-5" onSubmit={onOtpSubmit}>
                  <div className="space-y-2">
                    <Label htmlFor="otp">Kode OTP</Label>
                    <Input
                      id="otp"
                      placeholder="123456"
                      className="text-center text-2xl tracking-widest h-14 font-mono"
                      maxLength={6}
                      value={otp}
                      onChange={(e) => setOtp(e.target.value)}
                      autoFocus
                    />
                  </div>

                  <Button
                    className="w-full h-11 bg-brand-600 hover:bg-brand-700 text-white font-medium text-base shadow-lg shadow-brand-500/20 transition-all"
                    type="submit"
                    disabled={isSubmitting}
                  >
                    {isSubmitting ? 'Verifikasi...' : 'Masuk Dashboard'}
                  </Button>

                  <div className="text-center">
                    <button
                      type="button"
                      onClick={() => setStep('credentials')}
                      className="text-sm text-brand-600 hover:underline"
                    >
                      Kembali
                    </button>
                  </div>
                </form>
              )}
            </CardContent>
          </Card>

          <div className="text-center space-y-2">
            <p className="text-sm text-neutral-500">
              Belum punya akun?{' '}
              <Link
                className="font-medium text-brand-600 hover:text-brand-700 hover:underline transition-colors"
                href="/register"
              >
                Daftar Sekarang
              </Link>
            </p>
            <p className="text-sm text-neutral-500">
              Belum verifikasi email?{' '}
              <Link
                className="font-medium text-brand-600 hover:text-brand-700 hover:underline transition-colors"
                href="/verify-email"
              >
                Verifikasi disini
              </Link>
            </p>
          </div>
        </div>
      </div>
    </div>
  )
}
