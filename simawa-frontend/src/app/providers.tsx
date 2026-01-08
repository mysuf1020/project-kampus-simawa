'use client'

import React, { ReactNode } from 'react'
import { QueryClient, QueryClientProvider } from '@tanstack/react-query'
import { SessionProvider } from 'next-auth/react'

import { ConfirmationDialogProvider } from '@/lib/hooks/use-confirmation-dialog'
import { TooltipProvider, Toaster } from '@/components/ui'
import { RBACProvider } from '@/lib/providers/rbac-provider'

interface Props {
  children: ReactNode
}

function Providers({ children }: Props) {
  const [queryClient] = React.useState(
    () =>
      new QueryClient({
        defaultOptions: {
          queries: { retry: false },
        },
      }),
  )

  return (
    <SessionProvider>
      <QueryClientProvider client={queryClient}>
        <RBACProvider>
          <TooltipProvider>
            <ConfirmationDialogProvider>{children}</ConfirmationDialogProvider>
          </TooltipProvider>
          <Toaster />
        </RBACProvider>
      </QueryClientProvider>
    </SessionProvider>
  )
}

export default Providers
