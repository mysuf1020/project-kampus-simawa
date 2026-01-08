const ACCESS_KEY = 'simawa_access_token'
const REFRESH_KEY = 'simawa_refresh_token'
const EXPIRY_KEY = 'simawa_access_exp'

const isBrowser = () => typeof window !== 'undefined'

export type StoredTokens = {
  accessToken: string
  refreshToken?: string
  expiresIn?: number
}

function setTokens(tokens: StoredTokens) {
  if (!isBrowser()) return
  const { accessToken, refreshToken, expiresIn } = tokens
  localStorage.setItem(ACCESS_KEY, accessToken)
  if (refreshToken) localStorage.setItem(REFRESH_KEY, refreshToken)
  if (expiresIn) {
    const expiryAt = Date.now() + expiresIn * 1000
    localStorage.setItem(EXPIRY_KEY, String(expiryAt))
  }
}

function clearTokens() {
  if (!isBrowser()) return
  localStorage.removeItem(ACCESS_KEY)
  localStorage.removeItem(REFRESH_KEY)
  localStorage.removeItem(EXPIRY_KEY)
}

function getAccessToken() {
  if (!isBrowser()) return ''
  return localStorage.getItem(ACCESS_KEY) || ''
}

function getRefreshToken() {
  if (!isBrowser()) return ''
  return localStorage.getItem(REFRESH_KEY) || ''
}

function isTokenExpired() {
  if (!isBrowser()) return false
  const exp = localStorage.getItem(EXPIRY_KEY)
  if (!exp) return false
  const expMs = Number(exp)
  if (Number.isNaN(expMs)) return false
  return Date.now() > expMs
}

export const authStorage = {
  setTokens,
  clearTokens,
  getAccessToken,
  getRefreshToken,
  isTokenExpired,
}
