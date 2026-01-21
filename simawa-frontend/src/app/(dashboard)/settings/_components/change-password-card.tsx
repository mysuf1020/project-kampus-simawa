'use client'

import { useState } from 'react'
import { useForm } from 'react-hook-form'
import { z } from 'zod'
import { zodResolver } from '@hookform/resolvers/zod'
import { toast } from 'sonner'
import { Lock, Save } from 'lucide-react'

import {
  Button,
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
  InputPassword,
  Label,
} from '@/components/ui'
import { changePassword } from '@/lib/apis/user'

const changePasswordSchema = z
  .object({
    old_password: z.string().min(1, 'Password lama wajib diisi'),
    new_password: z.string().min(8, 'Password baru minimal 8 karakter'),
    confirm_password: z.string().min(1, 'Konfirmasi password wajib diisi'),
  })
  .refine((data) => data.new_password === data.confirm_password, {
    message: 'Password baru tidak cocok',
    path: ['confirm_password'],
  })

type ChangePasswordForm = z.infer<typeof changePasswordSchema>

export function ChangePasswordCard() {
  const [isSubmitting, setIsSubmitting] = useState(false)

  const form = useForm<ChangePasswordForm>({
    resolver: zodResolver(changePasswordSchema),
    defaultValues: {
      old_password: '',
      new_password: '',
      confirm_password: '',
    },
  })

  const onSubmit = async (values: ChangePasswordForm) => {
    setIsSubmitting(true)
    try {
      await changePassword(values)
      toast.success('Password berhasil diubah')
      form.reset()
    } catch (err: any) {
      toast.error(err.message || 'Gagal mengubah password')
    } finally {
      setIsSubmitting(false)
    }
  }

  return (
    <Card className="border-neutral-200 shadow-sm h-full">
      <CardHeader>
        <CardTitle className="flex items-center gap-2 text-lg">
          <Lock className="h-5 w-5 text-brand-600" />
          Ganti Password
        </CardTitle>
        <CardDescription>
          Perbarui kata sandi akun Anda secara berkala untuk keamanan.
        </CardDescription>
      </CardHeader>
      <CardContent>
        <form onSubmit={form.handleSubmit(onSubmit)} className="space-y-4">
          <div className="space-y-2">
            <Label htmlFor="old_password">Password Lama</Label>
            <InputPassword
              id="old_password"
              placeholder="Masukan password lama"
              {...form.register('old_password')}
            />
            {form.formState.errors.old_password && (
              <p className="text-xs text-red-600">
                {form.formState.errors.old_password.message}
              </p>
            )}
          </div>

          <div className="space-y-2">
            <Label htmlFor="new_password">Password Baru</Label>
            <InputPassword
              id="new_password"
              placeholder="Masukan password baru"
              {...form.register('new_password')}
            />
            {form.formState.errors.new_password && (
              <p className="text-xs text-red-600">
                {form.formState.errors.new_password.message}
              </p>
            )}
          </div>

          <div className="space-y-2">
            <Label htmlFor="confirm_password">Konfirmasi Password Baru</Label>
            <InputPassword
              id="confirm_password"
              placeholder="Ulangi password baru"
              {...form.register('confirm_password')}
            />
            {form.formState.errors.confirm_password && (
              <p className="text-xs text-red-600">
                {form.formState.errors.confirm_password.message}
              </p>
            )}
          </div>

          <div className="pt-2">
            <Button type="submit" disabled={isSubmitting} className="w-full sm:w-auto">
              {isSubmitting ? 'Menyimpan...' : 'Simpan Password'}
            </Button>
          </div>
        </form>
      </CardContent>
    </Card>
  )
}
