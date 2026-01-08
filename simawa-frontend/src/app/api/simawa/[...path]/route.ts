import { auth } from '@/lib/auth'

export const runtime = 'nodejs'
export const dynamic = 'force-dynamic'

const backendBaseUrl = (process.env.NEXT_PUBLIC_API_BASE_URL || 'http://localhost:8080').replace(
  /\/$/,
  '',
)

type RouteContext = {
  params: {
    path?: string[]
  }
}

async function proxy(request: Request, context: RouteContext): Promise<Response> {
  const url = new URL(request.url)
  const path = context.params.path?.join('/') || ''
  const targetUrl = `${backendBaseUrl}/${path}${url.search}`

  const headers = new Headers(request.headers)
  headers.delete('host')
  headers.delete('connection')
  headers.delete('content-length')
  headers.delete('cookie')

  const session = await auth()
  const sessionUser = session?.user as { access_token?: string; error?: string } | undefined
  if (sessionUser?.access_token && sessionUser.error !== 'RefreshTokenError') {
    headers.set('Authorization', `Bearer ${sessionUser.access_token}`)
  } else {
    headers.delete('Authorization')
  }

  const init: {
    method: string
    headers: Headers
    body?: ReadableStream<Uint8Array> | null
    redirect: RequestRedirect
    duplex?: 'half'
  } = {
    method: request.method,
    headers,
    redirect: 'manual',
  }

  if (request.method !== 'GET' && request.method !== 'HEAD') {
    init.body = request.body
    init.duplex = 'half'
  }

  const response = await fetch(targetUrl, init as RequestInit)

  return new Response(response.body, {
    status: response.status,
    statusText: response.statusText,
    headers: response.headers,
  })
}

export const GET = proxy
export const POST = proxy
export const PUT = proxy
export const PATCH = proxy
export const DELETE = proxy
export const OPTIONS = proxy
