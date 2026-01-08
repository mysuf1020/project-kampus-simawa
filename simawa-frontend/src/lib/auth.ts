/* eslint-disable @typescript-eslint/no-explicit-any */
import NextAuth from 'next-auth'
import { jwtDecode } from 'jwt-decode'
import Credentials from 'next-auth/providers/credentials'
import type { Provider } from 'next-auth/providers'
import type { JWT } from 'next-auth/jwt'
import { NextResponse } from 'next/server'
import { refreshAccessToken } from './apis/auth/refresh-token'
import loginAction from './apis/auth/login'
import { RoledJwtPayload } from './models/authentication'

const backendUrl = process.env.NEXT_PUBLIC_API_BASE_URL || 'http://localhost:8080'

const revokeRefreshToken = async (refreshToken?: string) => {
  if (!refreshToken) return
  try {
    await fetch(`${backendUrl}/auth/logout`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ refresh_token: refreshToken }),
    })
  } catch {
    // ignore revoke failure
  }
}

const providers: Provider[] = [
  Credentials({
    credentials: {
      email: { label: 'Email', type: 'email' },
      password: { label: 'Password', type: 'password' },
    },
    async authorize(c) {
      if (typeof c.password !== 'string') return null
      if (typeof c.email !== 'string') return null
      const { email, password } = c
      const verifiedResponse = await loginAction({
        email,
        password,
      })
      if (verifiedResponse.data) {
        const tokens = verifiedResponse.data
        const decodedJwt = jwtDecode<RoledJwtPayload>(tokens.access_token)
        return {
          id: decodedJwt.sub || email,
          access_token: tokens.access_token,
          refresh_token: tokens.refresh_token,
          expires_at: Date.now() + tokens.expires_in * 1000,
          user_id: decodedJwt.sub,
          username: (decodedJwt as any).usr,
          roles: decodedJwt.roles,
          email,
        }
      }
      if (verifiedResponse.error?.status === 401) {
        return null
      }
      throw new Error(verifiedResponse.error?.message || 'Internal server error')
    },
  }),
]

export const { handlers, signIn, signOut, auth } = NextAuth({
  debug: process.env.NODE_ENV !== 'production',
  providers,
  secret: process.env.AUTH_SECRET,
  trustHost: true,
  session: {
    strategy: 'jwt',
  },
  pages: {
    signIn: '/login',
  },
  events: {
    signOut: async (message) => {
      const token = (message as { token?: { refresh_token?: string } }).token
      await revokeRefreshToken(token?.refresh_token)
    },
  },
  callbacks: {
    authorized: async ({ auth, request }) => {
      const isSessionExpired = (auth?.user as any)?.error === 'RefreshTokenError'
      if (isSessionExpired) {
        return false
      }
      if (auth?.user && request.nextUrl.pathname.startsWith('/login')) {
        return NextResponse.redirect(new URL('/dashboard', request.nextUrl.origin))
      }
      if (auth === null) {
        return false
      }
      return true
    },
    async jwt({ token, user }) {
      if (user) {
        const u = user as any
        return {
          ...token,
          sub: u.id ?? token.sub,
          id: u.id,
          refresh_token: u.refresh_token,
          access_token: u.access_token,
          user_id: u.user_id,
          username: u.username,
          expires_at: u.expires_at as number,
          error: u.error,
          roles: u.roles,
          email: u.email,
        }
      }
      const expiresAt = (token as any)?.expires_at as number | undefined
      const refreshToken = (token as any)?.refresh_token as string | undefined

      // Token belum siap / belum ada session: jangan paksa refresh.
      if (!expiresAt || !refreshToken) {
        return token
      }
      if (Date.now() < expiresAt) return token

      const newToken = await refreshAccessToken(token as unknown as JWT)
      if (newToken) return { ...token, ...newToken, error: undefined }
      return { ...token, error: 'RefreshTokenError' }
    },
    async session({ session, token }) {
      const s = session as any
      s.user = s.user ?? {}
      s.user.id =
        (token.sub as string | undefined) || ((token as any).id as string | undefined)
      s.user.refresh_token = token.refresh_token as string
      s.user.access_token = token.access_token as string
      s.user.user_id = token.user_id as string
      s.user.username = (token as any).username as string
      s.user.expires_at = token.expires_at as number
      s.user.error = token.error as any
      s.user.roles = token.roles as string[] | undefined
      s.user.email = token.email || ''
      return s
    },
  },
})
