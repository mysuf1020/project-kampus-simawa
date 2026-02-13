import { ShieldAlert, Mail } from 'lucide-react'
import { Container } from '../layout/container'

export const Forbidden = () => {
  return (
    <Container className="min-h-[60vh] flex items-center justify-center">
      <div className="max-w-md w-full text-center space-y-6 p-8">
        <div className="mx-auto flex h-16 w-16 items-center justify-center rounded-full bg-red-50 border border-red-100">
          <ShieldAlert className="h-8 w-8 text-red-500" />
        </div>
        <div className="space-y-2">
          <h2 className="text-xl font-bold text-neutral-900">
            Akses Ditolak
          </h2>
          <p className="text-sm text-neutral-500 leading-relaxed">
            Anda tidak memiliki hak akses untuk halaman ini. 
            Silakan hubungi <strong>Admin</strong>, <strong>BEM</strong>, atau <strong>DEMA</strong> untuk 
            mendapatkan akses yang sesuai.
          </p>
        </div>
        <div className="flex items-center justify-center gap-2 text-xs text-neutral-400">
          <Mail className="h-3.5 w-3.5" />
          <span>Hubungi administrator sistem Anda</span>
        </div>
      </div>
    </Container>
  )
}
