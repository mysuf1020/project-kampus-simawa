import type { Metadata } from 'next'

import { AuthGuard } from './_components/auth-guard'
import { Sidebar } from './_components/sidebar'

export const metadata: Metadata = {
  title: 'Simawa Dashboard',
  description: 'Dashboard layout mirroring backoffice shell',
}

export default function DashboardLayout({ children }: { children: React.ReactNode }) {
  return (
    <AuthGuard>
      <div className="min-h-screen bg-neutral-50/50 text-neutral-900 flex flex-col">
        <Sidebar />
        <main className="flex-1 p-3 sm:p-4 md:p-6">{children}</main>
      </div>
    </AuthGuard>
  )
}
