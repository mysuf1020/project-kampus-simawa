import type { JWT } from 'next-auth/jwt'

type BackendAuthTokens = {
  access_token: string
  expires_in: number
  refresh_token?: string
  refresh_expires_in?: number
}

type BackendEnvelope<T> = {
  success: boolean
  message: string
  data?: T
}

type RefreshResponse = {
  access_token: string
  refresh_token?: string
  expires_at: number
}

const baseUrl = process.env.NEXT_PUBLIC_API_BASE_URL || 'http://localhost:8080'

type RefreshableJWT = JWT & { refresh_token?: string }

export const refreshAccessToken = async (
  token: RefreshableJWT,
): Promise<RefreshResponse | null> => {
  try {
    const { refresh_token } = token
    const res = await fetch(`${baseUrl}/auth/refresh`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ refresh_token }),
    })
    if (!res.ok) return null
    const json = await res.json().catch(() => null)
    const envelope = json as BackendEnvelope<BackendAuthTokens> | null
    if (!envelope?.success || !envelope.data) return null
    const tokens = envelope.data
    return {
      access_token: tokens.access_token,
      refresh_token: tokens.refresh_token,
      expires_at: Date.now() + tokens.expires_in * 1000,
    }
  } catch (error) {
    console.error('Refresh token failed', error)
    return null
  }
}
