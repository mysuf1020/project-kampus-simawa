import { z } from 'zod'
import { EMAIL_DOMAIN, getEmailDomainError } from '@/lib/config/email'

// ============================================
// KONSTANTA VALIDASI
// ============================================
export const VALIDATION_LIMITS = {
  // Email
  EMAIL_MAX: 100,
  
  // Password
  PASSWORD_MIN: 8,
  PASSWORD_MAX: 64,
  
  // Username
  USERNAME_MIN: 4,
  USERNAME_MAX: 32,
  
  // Nama
  NAME_MIN: 2,
  NAME_MAX: 100,
  
  // OTP
  OTP_LENGTH: 6,
  
  // Nomor Telepon
  PHONE_MIN: 10,
  PHONE_MAX: 15,
  
  // NIM
  NIM_MIN: 8,
  NIM_MAX: 20,
  
  // Alamat
  ADDRESS_MAX: 500,
  
  // Deskripsi
  DESCRIPTION_MAX: 2000,
  
  // Judul
  TITLE_MIN: 3,
  TITLE_MAX: 200,
}

// ============================================
// PESAN ERROR DALAM BAHASA INDONESIA
// ============================================
export const ERROR_MESSAGES = {
  // Required
  required: (field: string) => `${field} wajib diisi`,
  
  // Email
  emailInvalid: 'Format email tidak valid. Contoh: nama@domain.com',
  emailMax: `Email maksimal ${VALIDATION_LIMITS.EMAIL_MAX} karakter`,
  
  // Password
  passwordMin: `Password minimal ${VALIDATION_LIMITS.PASSWORD_MIN} karakter`,
  passwordMax: `Password maksimal ${VALIDATION_LIMITS.PASSWORD_MAX} karakter`,
  passwordWeak: 'Password harus mengandung huruf besar, huruf kecil, dan angka',
  passwordMismatch: 'Konfirmasi password tidak cocok',
  
  // Username
  usernameMin: `Username minimal ${VALIDATION_LIMITS.USERNAME_MIN} karakter`,
  usernameMax: `Username maksimal ${VALIDATION_LIMITS.USERNAME_MAX} karakter`,
  usernameInvalid: 'Username hanya boleh huruf, angka, dan underscore (_)',
  
  // Nama
  nameMin: `Nama minimal ${VALIDATION_LIMITS.NAME_MIN} karakter`,
  nameMax: `Nama maksimal ${VALIDATION_LIMITS.NAME_MAX} karakter`,
  nameInvalid: 'Nama hanya boleh mengandung huruf dan spasi',
  
  // OTP
  otpLength: `Kode OTP harus ${VALIDATION_LIMITS.OTP_LENGTH} digit`,
  otpInvalid: 'Kode OTP hanya boleh angka',
  
  // Phone
  phoneMin: `Nomor telepon minimal ${VALIDATION_LIMITS.PHONE_MIN} digit`,
  phoneMax: `Nomor telepon maksimal ${VALIDATION_LIMITS.PHONE_MAX} digit`,
  phoneInvalid: 'Nomor telepon hanya boleh angka',
  
  // NIM
  nimMin: `NIM minimal ${VALIDATION_LIMITS.NIM_MIN} karakter`,
  nimMax: `NIM maksimal ${VALIDATION_LIMITS.NIM_MAX} karakter`,
  
  // Title
  titleMin: `Judul minimal ${VALIDATION_LIMITS.TITLE_MIN} karakter`,
  titleMax: `Judul maksimal ${VALIDATION_LIMITS.TITLE_MAX} karakter`,
  
  // Description
  descriptionMax: `Deskripsi maksimal ${VALIDATION_LIMITS.DESCRIPTION_MAX} karakter`,
  
  // Generic
  invalidFormat: (field: string) => `Format ${field} tidak valid`,
  tooShort: (field: string, min: number) => `${field} minimal ${min} karakter`,
  tooLong: (field: string, max: number) => `${field} maksimal ${max} karakter`,
}

// ============================================
// HELPER FUNCTIONS
// ============================================

// Validasi email dengan domain tertentu (untuk registrasi)
export const emailWithDomainSchema = z
  .string()
  .min(1, ERROR_MESSAGES.required('Email'))
  .max(VALIDATION_LIMITS.EMAIL_MAX, ERROR_MESSAGES.emailMax)
  .email(ERROR_MESSAGES.emailInvalid)
  .refine((val) => val.toLowerCase().endsWith(EMAIL_DOMAIN.toLowerCase()), {
    message: getEmailDomainError(),
  })

// Validasi email umum (untuk login)
export const emailSchema = z
  .string()
  .min(1, ERROR_MESSAGES.required('Email'))
  .max(VALIDATION_LIMITS.EMAIL_MAX, ERROR_MESSAGES.emailMax)
  .email(ERROR_MESSAGES.emailInvalid)

// Validasi password dengan aturan keamanan
export const passwordSchema = z
  .string()
  .min(VALIDATION_LIMITS.PASSWORD_MIN, ERROR_MESSAGES.passwordMin)
  .max(VALIDATION_LIMITS.PASSWORD_MAX, ERROR_MESSAGES.passwordMax)

// Validasi password dengan aturan kuat (huruf besar, kecil, angka)
export const strongPasswordSchema = z
  .string()
  .min(VALIDATION_LIMITS.PASSWORD_MIN, ERROR_MESSAGES.passwordMin)
  .max(VALIDATION_LIMITS.PASSWORD_MAX, ERROR_MESSAGES.passwordMax)
  .regex(/[A-Z]/, 'Password harus mengandung minimal 1 huruf besar')
  .regex(/[a-z]/, 'Password harus mengandung minimal 1 huruf kecil')
  .regex(/[0-9]/, 'Password harus mengandung minimal 1 angka')

// Validasi username
export const usernameSchema = z
  .string()
  .min(VALIDATION_LIMITS.USERNAME_MIN, ERROR_MESSAGES.usernameMin)
  .max(VALIDATION_LIMITS.USERNAME_MAX, ERROR_MESSAGES.usernameMax)
  .regex(/^[a-zA-Z0-9_]+$/, ERROR_MESSAGES.usernameInvalid)

// Validasi nama
export const nameSchema = z
  .string()
  .min(VALIDATION_LIMITS.NAME_MIN, ERROR_MESSAGES.nameMin)
  .max(VALIDATION_LIMITS.NAME_MAX, ERROR_MESSAGES.nameMax)

// Validasi OTP
export const otpSchema = z
  .string()
  .length(VALIDATION_LIMITS.OTP_LENGTH, ERROR_MESSAGES.otpLength)
  .regex(/^\d+$/, ERROR_MESSAGES.otpInvalid)

// Validasi nomor telepon
export const phoneSchema = z
  .string()
  .min(VALIDATION_LIMITS.PHONE_MIN, ERROR_MESSAGES.phoneMin)
  .max(VALIDATION_LIMITS.PHONE_MAX, ERROR_MESSAGES.phoneMax)
  .regex(/^\d+$/, ERROR_MESSAGES.phoneInvalid)
  .optional()
  .or(z.literal(''))

// ============================================
// FORM SCHEMAS
// ============================================

// Login Schema
export const loginFormSchema = z.object({
  login: emailSchema,
  password: z
    .string()
    .min(1, ERROR_MESSAGES.required('Password'))
    .max(VALIDATION_LIMITS.PASSWORD_MAX, ERROR_MESSAGES.passwordMax),
})
export type LoginFormData = z.infer<typeof loginFormSchema>

// Register Schema
export const registerFormSchema = z
  .object({
    username: usernameSchema,
    first_name: nameSchema,
    email: emailWithDomainSchema,
    password: passwordSchema,
    confirm_password: z
      .string()
      .min(1, ERROR_MESSAGES.required('Konfirmasi Password')),
  })
  .refine((data) => data.password === data.confirm_password, {
    message: ERROR_MESSAGES.passwordMismatch,
    path: ['confirm_password'],
  })
export type RegisterFormData = z.infer<typeof registerFormSchema>

// Forgot Password Schema
export const forgotPasswordFormSchema = z.object({
  email: emailSchema,
})
export type ForgotPasswordFormData = z.infer<typeof forgotPasswordFormSchema>

// Reset Password Schema
export const resetPasswordFormSchema = z
  .object({
    email: emailSchema,
    otp: otpSchema,
    password: passwordSchema,
    confirm_password: z.string()
      .min(1, ERROR_MESSAGES.required('Konfirmasi Password')),
  })
  .refine((data) => data.password === data.confirm_password, {
    message: ERROR_MESSAGES.passwordMismatch,
    path: ['confirm_password'],
  })
export type ResetPasswordFormData = z.infer<typeof resetPasswordFormSchema>

// OTP Verification Schema
export const otpVerificationSchema = z.object({
  otp: otpSchema,
})
export type OtpVerificationFormData = z.infer<typeof otpVerificationSchema>

// Change Password Schema
export const changePasswordFormSchema = z
  .object({
    current_password: z
      .string()
      .min(1, ERROR_MESSAGES.required('Password Lama')),
    new_password: passwordSchema,
    confirm_password: z
      .string()
      .min(1, ERROR_MESSAGES.required('Konfirmasi Password')),
  })
  .refine((data) => data.new_password === data.confirm_password, {
    message: ERROR_MESSAGES.passwordMismatch,
    path: ['confirm_password'],
  })
  .refine((data) => data.current_password !== data.new_password, {
    message: 'Password baru tidak boleh sama dengan password lama',
    path: ['new_password'],
  })
export type ChangePasswordFormData = z.infer<typeof changePasswordFormSchema>

// User Create Schema (Admin)
export const userCreateFormSchema = z.object({
  username: usernameSchema,
  email: emailSchema,
  first_name: nameSchema,
  second_name: z
    .string()
    .max(VALIDATION_LIMITS.NAME_MAX, ERROR_MESSAGES.nameMax)
    .optional()
    .or(z.literal('')),
  phone: phoneSchema,
  nim: z
    .string()
    .min(VALIDATION_LIMITS.NIM_MIN, ERROR_MESSAGES.nimMin)
    .max(VALIDATION_LIMITS.NIM_MAX, ERROR_MESSAGES.nimMax)
    .optional()
    .or(z.literal('')),
})
export type UserCreateFormData = z.infer<typeof userCreateFormSchema>

// User Update Schema (Admin)
export const userUpdateFormSchema = z.object({
  first_name: nameSchema,
  second_name: z
    .string()
    .max(VALIDATION_LIMITS.NAME_MAX, ERROR_MESSAGES.nameMax)
    .optional()
    .or(z.literal('')),
  phone: phoneSchema,
  nim: z
    .string()
    .max(VALIDATION_LIMITS.NIM_MAX, ERROR_MESSAGES.nimMax)
    .optional()
    .or(z.literal('')),
})
export type UserUpdateFormData = z.infer<typeof userUpdateFormSchema>
