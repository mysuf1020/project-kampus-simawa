import { NextResponse } from 'next/server'
import type { NextRequest } from 'next/server'

// Public routes that don't require authentication
const publicPaths = [
  '/org',
  '/login',
  '/register',
  '/forgot-password',
  '/reset-password',
  '/verify-email',
  '/public',
  '/gallery',
]

function isPublicPath(pathname: string): boolean {
  // Root path is always public
  if (pathname === '/') return true
  
  // Check if path starts with any public path
  return publicPaths.some(path => 
    pathname === path || pathname.startsWith(path + '/')
  )
}

export function middleware(request: NextRequest) {
  const { pathname } = request.nextUrl
  
  console.log('[Middleware] Processing:', pathname)
  
  // Allow public routes without any auth check
  if (isPublicPath(pathname)) {
    console.log('[Middleware] Public path allowed:', pathname)
    return NextResponse.next()
  }
  
  console.log('[Middleware] Protected path, checking auth:', pathname)
  
  // For protected routes, check session cookie
  const sessionCookie = request.cookies.get('authjs.session-token') || 
                        request.cookies.get('__Secure-authjs.session-token')
  
  if (!sessionCookie) {
    console.log('[Middleware] No session, redirecting to login')
    const callbackUrl = encodeURIComponent(pathname)
    return NextResponse.redirect(new URL(`/login?callbackUrl=${callbackUrl}`, request.nextUrl.origin))
  }
  
  console.log('[Middleware] Session found, allowing')
  return NextResponse.next()
}

export const config = {
  matcher: [
    /*
     * Match all paths except:
     * - _next (Next.js internals)
     * - static files (images, fonts, etc.)
     * - api routes
     */
    '/((?!_next|favicon.ico|api|images|fonts|.*\\.png$|.*\\.jpg$|.*\\.jpeg$|.*\\.gif$|.*\\.svg$|.*\\.ico$|.*\\.webp$).*)',
  ],
}
