'use client'

import { createContext, useContext, useMemo, ReactNode } from 'react'
import { useSession } from 'next-auth/react'
import { jwtDecode } from 'jwt-decode'

export type DecodedAccessToken = {
  sub?: string
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

export type RBACContextValue = {
  user: CurrentUser | null
  isAuthenticated: boolean
  hasAnyRole: (roles: string[]) => boolean
}

const RBACContext = createContext<RBACContextValue | null>(null)

type Props = {
  children: ReactNode
}

export function RBACProvider({ children }: Props) {
  const { status, data: session } = useSession()

  const user = useMemo<CurrentUser | null>(() => {
    if (status !== 'authenticated') return null
    const sessionUser = session?.user as
      | { access_token?: string; email?: string; username?: string; error?: string }
      | undefined
    if (!sessionUser?.access_token) return null
    if (sessionUser.error === 'RefreshTokenError') return null

    let decoded: DecodedAccessToken | null = null
    try {
      decoded = jwtDecode<DecodedAccessToken>(sessionUser.access_token)
    } catch {
      decoded = null
    }

    const rolesClaim = decoded?.roles
    const roles = Array.isArray(rolesClaim) ? rolesClaim.map((r) => String(r)) : []
    const id = decoded?.sub
      ? String(decoded.sub)
      : sessionUser.email
        ? String(sessionUser.email)
        : ''

    return {
      id,
      email: sessionUser.email || (decoded?.email ? String(decoded.email) : undefined),
      username: sessionUser.username || (decoded?.usr ? String(decoded.usr) : undefined),
      roles,
    }
  }, [session, status])

  const value = useMemo<RBACContextValue>(() => {
    const roles = user?.roles ?? []

    const hasAnyRole = (required: string[]): boolean => {
      if (!required || required.length === 0) return true
      if (roles.length === 0) return false
      return required.some((role) => roles.includes(role))
    }

    return {
      user,
      isAuthenticated: Boolean(user),
      hasAnyRole,
    }
  }, [user])

  return <RBACContext.Provider value={value}>{children}</RBACContext.Provider>
}

export const useRBAC = () => {
  const ctx = useContext(RBACContext)
  if (!ctx) {
    throw new Error('useRBAC must be used within RBACProvider')
  }
  return ctx
}
