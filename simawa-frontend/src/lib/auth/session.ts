import { jwtDecode } from 'jwt-decode'
import { authStorage } from './storage'

export type DecodedAccessToken = {
  sub: string
  email?: string
  usr?: string
  roles?: string[]
  [key: string]: unknown
}

export type CurrentUser = {
  id: string
  email?: string
  username?: string
  roles: string[]
}

export const decodeAccessToken = (token: string): DecodedAccessToken | null => {
  if (!token) return null
  try {
    return jwtDecode<DecodedAccessToken>(token)
  } catch {
    return null
  }
}

export const getCurrentUser = (): CurrentUser | null => {
  const token = authStorage.getAccessToken()
  if (!token) return null
  const decoded = decodeAccessToken(token)
  if (!decoded?.sub) return null

  const rolesClaim = decoded.roles
  const roles = Array.isArray(rolesClaim) ? rolesClaim.map((r) => String(r)) : []

  return {
    id: String(decoded.sub),
    email: decoded.email ? String(decoded.email) : undefined,
    username: decoded.usr ? String(decoded.usr) : undefined,
    roles,
  }
}
