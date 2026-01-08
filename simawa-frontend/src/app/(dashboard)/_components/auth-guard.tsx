'use client'

import { useEffect, useState } from 'react'
import { usePathname, useRouter } from 'next/navigation'
import { useSession } from 'next-auth/react'
import { Spinner } from '@/components/ui'

function AuthGuard({ children }: { children: React.ReactNode }) {
  const router = useRouter()
  const pathname = usePathname()
  const { status, data: session } = useSession()
  const [allowed, setAllowed] = useState(false)

  useEffect(() => {
    if (status === 'loading') return

    const isSessionExpired = (session?.user as { error?: string } | undefined)?.error
    if (status !== 'authenticated' || isSessionExpired === 'RefreshTokenError') {
      const callbackUrl = encodeURIComponent(pathname || '/dashboard')
      router.replace(`/login?reason=unauthorized&callbackUrl=${callbackUrl}`)
      return
    }

    setAllowed(true)
  }, [pathname, router, session, status])

  if (!allowed || status === 'loading') {
    return (
      <div className="grid h-screen place-items-center bg-neutral-30">
        <Spinner size="lg" />
      </div>
    )
  }

  return <>{children}</>
}

export { AuthGuard }
