import { api, ApiResponse } from '../http-client'
import { authStorage, type StoredTokens } from '../auth/storage'

export type LoginPayload = {
  login: string
  password: string
}

export type AuthResponse = {
  access_token: string
  expires_in: number
  refresh_token?: string
  refresh_expires_in?: number
}

export const login = async (payload: LoginPayload): Promise<StoredTokens> => {
  const { data } = await api.post<ApiResponse<AuthResponse>>('/auth/login', payload)
  if (!data?.success || !data.data) {
    throw new Error(data?.message || 'Gagal login')
  }
  const tokens = data.data
  return {
    accessToken: tokens.access_token,
    refreshToken: tokens.refresh_token,
    expiresIn: tokens.expires_in,
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
