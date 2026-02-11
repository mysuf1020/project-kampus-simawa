import { api, ApiResponse } from '../http-client'
import { authStorage, type StoredTokens } from '../auth/storage'

export type LoginPayload = {
  login: string
  password: string
  captcha_token?: string
}

export type LoginOTPPayload = {
  login: string
  otp: string
}

export type RegisterPayload = {
  username: string
  first_name: string
  second_name: string
  email: string
  nim: string
  jurusan: string
  phone: string
  gender?: string
  alamat?: string
  organisasi?: boolean
  password: string
  confirm_password: string
  captcha_token?: string
}

export type VerifyEmailPayload = {
  email: string
  otp: string
}

export type ForgotPasswordPayload = {
  email: string
}

export type ResetPasswordPayload = {
  email: string
  otp: string
  new_password: string
  confirm_password: string
}

export type AuthResponse = {
  access_token: string
  expires_in: number
  refresh_token?: string
  refresh_expires_in?: number
}

// Step 1: Login triggers OTP
export const login = async (payload: LoginPayload): Promise<void> => {
  const { data } = await api.post<ApiResponse<void>>('/auth/login', payload)
  if (!data?.success) {
    throw new Error(data?.message || 'Gagal login')
  }
}

// Step 2: Verify Login OTP
export const loginVerify = async (payload: LoginOTPPayload): Promise<StoredTokens> => {
  const { data } = await api.post<ApiResponse<AuthResponse>>(
    '/auth/login/verify',
    payload,
  )
  if (!data?.success || !data.data) {
    throw new Error(data?.message || 'Gagal verifikasi OTP')
  }
  const tokens = data.data
  return {
    accessToken: tokens.access_token,
    refreshToken: tokens.refresh_token,
    expiresIn: tokens.expires_in,
  }
}

export const register = async (payload: RegisterPayload): Promise<void> => {
  const { data } = await api.post<ApiResponse<void>>('/auth/register', payload)
  if (!data?.success) {
    throw new Error(data?.message || 'Gagal registrasi')
  }
}

export const verifyEmail = async (payload: VerifyEmailPayload): Promise<void> => {
  const { data } = await api.post<ApiResponse<void>>('/auth/verify-email', payload)
  if (!data?.success) {
    throw new Error(data?.message || 'Gagal verifikasi email')
  }
}

export const resendOTP = async (email: string): Promise<void> => {
  const { data } = await api.post<ApiResponse<void>>('/auth/otp/resend', { email })
  if (!data?.success) {
    throw new Error(data?.message || 'Gagal kirim ulang OTP')
  }
}

export const forgotPassword = async (email: string): Promise<void> => {
  const { data } = await api.post<ApiResponse<void>>('/auth/forgot-password', { email })
  if (!data?.success) {
    throw new Error(data?.message || 'Gagal request reset password')
  }
}

export const resetPassword = async (payload: ResetPasswordPayload): Promise<void> => {
  const { data } = await api.post<ApiResponse<void>>('/auth/reset-password', payload)
  if (!data?.success) {
    throw new Error(data?.message || 'Gagal reset password')
  }
}

export const logout = async (): Promise<void> => {
  const refreshToken = authStorage.getRefreshToken()
  if (!refreshToken) return
  try {
    await api.post('/auth/logout', { refresh_token: refreshToken })
  } catch {
    // ignore logout error; token will be cleared on client side
  }
}
