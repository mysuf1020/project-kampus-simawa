'use client'

import Link from 'next/link'
import { useRouter, useSearchParams } from 'next/navigation'
import { Suspense, useEffect, useState } from 'react'
import { useForm } from 'react-hook-form'
import { z } from 'zod'
import { zodResolver } from '@hookform/resolvers/zod'
import { toast } from 'sonner'
import { signIn, useSession } from 'next-auth/react'
import { ArrowRight, Lock, Mail, ShieldCheck } from 'lucide-react'

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

const loginSchema = z.object({
  login: z.string().min(1, 'Email wajib diisi').email('Format email tidak valid'),
  password: z.string().min(1, 'Password wajib diisi'),
})

type LoginForm = z.infer<typeof loginSchema>

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
  const { status, data: session } = useSession()

  const form = useForm<LoginForm>({
    resolver: zodResolver(loginSchema),
    defaultValues: { login: '', password: '' },
    mode: 'onChange',
  })

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

  const onSubmit = async (values: LoginForm) => {
    setIsSubmitting(true)
    try {
      const callbackUrl = searchParams.get('callbackUrl') || '/dashboard'
      const result = await signIn('credentials', {
        email: values.login,
        password: values.password,
        redirect: false,
      })

      if (!result?.ok) {
        const message =
          result?.error === 'CredentialsSignin'
            ? 'Email atau password salah'
            : result?.error || 'Gagal login'
        throw new Error(message)
      }

      toast.success('Berhasil masuk')
      // Hard navigate agar cookie/session terbaca oleh semua halaman (menghindari loop AuthGuard).
      const safeTarget =
        callbackUrl.startsWith('/') && !callbackUrl.startsWith('//')
          ? callbackUrl
          : '/dashboard'
      window.location.assign(safeTarget)
    } catch (err) {
      let message = 'Gagal login'
      if (err instanceof Error) {
        message = err.message
      }
      toast.error(message)
      form.setError('login', { message: '' })
      form.setError('password', { message: '' })
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
            Kelola surat menyurat, proposal kegiatan, laporan pertanggungjawaban, dan anggota organisasi dalam satu dashboard yang efisien.
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
            <h2 className="text-3xl font-bold text-neutral-900 tracking-tight">Selamat Datang Kembali</h2>
            <p className="mt-2 text-neutral-500">
              Masuk ke akun Anda untuk mengakses dashboard.
            </p>
          </div>

          <Card className="border-neutral-200 shadow-lg shadow-neutral-200/50">
            <CardContent className="pt-6">
              <form className="space-y-5" onSubmit={form.handleSubmit(onSubmit)}>
                <div className="space-y-2">
                  <Label htmlFor="login">Email</Label>
                  <div className="relative">
                    <Input
                      id="login"
                      type="email"
                      autoComplete="username"
                      placeholder="nama@raharja.info"
                      className="pl-10 h-11"
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
                      href="#"
                      className="text-xs font-medium text-brand-600 hover:text-brand-700 hover:underline"
                      onClick={(e) => {
                        e.preventDefault()
                        toast.info('Silakan hubungi admin untuk reset password.')
                      }}
                    >
                      Lupa password?
                    </Link>
                  </div>
                  <InputPassword
                    id="password"
                    autoComplete="current-password"
                    placeholder="Masukan password Anda"
                    className="h-11"
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
                  {isSubmitting ? 'Memproses...' : 'Masuk Dashboard'}
                  {!isSubmitting && <ArrowRight className="ml-2 h-4 w-4" />}
                </Button>
              </form>
            </CardContent>
          </Card>

          <p className="text-center text-sm text-neutral-500">
            Belum punya akun?{' '}
            <Link
              className="font-medium text-brand-600 hover:text-brand-700 hover:underline transition-colors"
              href="https://wa.me/6285117617610"
              target="_blank"
            >
              Hubungi Administrator
            </Link>
          </p>
        </div>
      </div>
    </div>
  )
}
