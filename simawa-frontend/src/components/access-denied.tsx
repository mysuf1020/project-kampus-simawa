import { ShieldAlert } from 'lucide-react'

export function AccessDenied() {
  return (
    <div className="flex min-h-[calc(100vh-200px)] items-center justify-center px-4">
      <div className="text-center max-w-md">
        <div className="mx-auto mb-6 flex h-16 w-16 items-center justify-center rounded-full bg-red-50">
          <ShieldAlert className="h-8 w-8 text-red-500" />
        </div>
        
        <h1 className="mb-3 text-2xl font-semibold text-neutral-900">
          Akses Ditolak
        </h1>
        
        <p className="mb-6 text-neutral-600 leading-relaxed">
          Anda tidak memiliki hak akses untuk halaman ini. Silakan hubungi{' '}
          <span className="font-semibold text-neutral-900">Admin</span>,{' '}
          <span className="font-semibold text-neutral-900">BEM</span>, atau{' '}
          <span className="font-semibold text-neutral-900">DEMA</span> untuk mendapatkan akses yang sesuai.
        </p>
        
        <div className="flex items-center justify-center gap-2 text-sm text-neutral-500">
          <svg
            className="h-4 w-4"
            fill="none"
            stroke="currentColor"
            viewBox="0 0 24 24"
          >
            <path
              strokeLinecap="round"
              strokeLinejoin="round"
              strokeWidth={2}
              d="M3 8l7.89 5.26a2 2 0 002.22 0L21 8M5 19h14a2 2 0 002-2V7a2 2 0 00-2-2H5a2 2 0 00-2 2v10a2 2 0 002 2z"
            />
          </svg>
          <span>Hubungi administrator sistem Anda</span>
        </div>
      </div>
    </div>
  )
}
