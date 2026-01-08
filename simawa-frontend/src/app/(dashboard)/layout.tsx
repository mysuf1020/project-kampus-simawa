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
      <div className="min-h-screen bg-neutral-50/50 text-neutral-900 md:flex">
        <Sidebar />
        <div className="flex-1 transition-all duration-300 ease-in-out">
          <header className="sticky top-0 z-10 flex items-center justify-between border-b border-neutral-200/60 bg-white/80 px-6 py-4 backdrop-blur-md supports-[backdrop-filter]:bg-white/60">
            <div>
              <p className="text-xs font-semibold tracking-wider text-brand-600 uppercase">Simawa</p>
              <p className="text-lg font-bold text-neutral-900 tracking-tight">Backoffice</p>
            </div>
          </header>
          <main className="p-6">{children}</main>
        </div>
      </div>
    </AuthGuard>
  )
}
