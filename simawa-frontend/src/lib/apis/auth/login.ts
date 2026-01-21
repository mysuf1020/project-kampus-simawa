type LoginPayload = {
  email: string
  password: string
  captchaToken?: string | null
}

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

type AuthResponse = {
  data?: BackendAuthTokens
  error?: {
    status?: number
    message?: string
  }
}

const baseUrl = process.env.NEXT_PUBLIC_API_BASE_URL || 'http://localhost:8080'

// Live login action against simawa-backend
export default async function loginAction(payload: LoginPayload): Promise<AuthResponse> {
  const body = {
    login: payload.email,
    password: payload.password,
    captcha_token: payload.captchaToken,
  }

  try {
    const res = await fetch(`${baseUrl}/auth/login`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(body),
    })

    const json = await res.json().catch(() => null)

    if (!res.ok) {
      const message = (json as { message?: string } | null)?.message
      return { error: { status: res.status, message: message || res.statusText } }
    }

    const envelope = json as BackendEnvelope<BackendAuthTokens> | null
    if (!envelope?.success || !envelope.data) {
      return {
        error: {
          status: 401,
          message: envelope?.message || 'Login gagal',
        },
      }
    }

    return { data: envelope.data }
  } catch (error) {
    console.error('Login request failed', error)
    return { error: { status: 500, message: 'network error' } }
  }
}
