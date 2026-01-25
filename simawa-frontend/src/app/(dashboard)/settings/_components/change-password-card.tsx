'use client'

import { useState } from 'react'
import { useForm } from 'react-hook-form'
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
import { z } from 'zod'
import { VALIDATION_LIMITS, ERROR_MESSAGES, passwordSchema } from '@/lib/validations/form-schemas'

const changePasswordFormSchema = z
  .object({
    old_password: z.string().min(1, ERROR_MESSAGES.required('Password Lama')),
    new_password: passwordSchema,
    confirm_password: z.string().min(1, ERROR_MESSAGES.required('Konfirmasi Password')),
  })
  .refine((data) => data.new_password === data.confirm_password, {
    message: ERROR_MESSAGES.passwordMismatch,
    path: ['confirm_password'],
  })
  .refine((data) => data.old_password !== data.new_password, {
    message: 'Password baru tidak boleh sama dengan password lama',
    path: ['new_password'],
  })

type ChangePasswordFormData = z.infer<typeof changePasswordFormSchema>

export function ChangePasswordCard() {
  const [isSubmitting, setIsSubmitting] = useState(false)

  const form = useForm<ChangePasswordFormData>({
    resolver: zodResolver(changePasswordFormSchema),
    defaultValues: {
      old_password: '',
      new_password: '',
      confirm_password: '',
    },
  })

  const onSubmit = async (values: ChangePasswordFormData) => {
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
              maxLength={VALIDATION_LIMITS.PASSWORD_MAX}
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
              placeholder="Password baru (min 8 karakter)"
              maxLength={VALIDATION_LIMITS.PASSWORD_MAX}
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
              maxLength={VALIDATION_LIMITS.PASSWORD_MAX}
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
