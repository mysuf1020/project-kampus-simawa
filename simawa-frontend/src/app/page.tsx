import Link from 'next/link'
import {
  Button,
  Container,
} from '@/components/ui'
import { ArrowRight, LayoutDashboard, ShieldCheck, Users } from 'lucide-react'

export default function HomePage() {
  return (
    <div className="min-h-screen bg-white font-sans selection:bg-brand-500/30">
      {/* Navbar */}
      <header className="fixed top-0 w-full z-50 bg-white/80 backdrop-blur-md border-b border-neutral-100">
        <Container>
          <div className="flex items-center justify-between h-16">
            <div className="flex items-center gap-2">
              <div className="h-8 w-8 bg-brand-600 rounded-lg flex items-center justify-center text-white font-bold shadow-lg shadow-brand-500/20">S</div>
              <span className="font-bold text-xl tracking-tight text-neutral-900">SIMAWA</span>
            </div>
            <div className="flex items-center gap-4">
              <Link href="/login">
                <Button variant="ghost" className="font-medium text-neutral-600 hover:text-neutral-900">Masuk</Button>
              </Link>
              <Link href="/public">
                <Button className="bg-brand-600 hover:bg-brand-700 text-white shadow-lg shadow-brand-500/20 rounded-full px-6">
                  Lihat Kegiatan <ArrowRight className="ml-2 h-4 w-4" />
                </Button>
              </Link>
            </div>
          </div>
        </Container>
      </header>

      {/* Hero */}
      <section className="pt-32 pb-20 lg:pt-48 lg:pb-32 overflow-hidden relative">
        {/* Background elements */}
        <div className="absolute top-0 left-1/2 -translate-x-1/2 w-full h-full max-w-7xl -z-10 opacity-40 pointer-events-none">
          <div className="absolute top-20 right-0 w-96 h-96 bg-brand-200 rounded-full blur-3xl opacity-50"></div>
          <div className="absolute top-20 left-0 w-96 h-96 bg-blue-200 rounded-full blur-3xl opacity-50"></div>
          <div className="absolute -bottom-32 left-20 w-96 h-96 bg-purple-200 rounded-full blur-3xl opacity-50"></div>
        </div>

        <Container>
          <div className="text-center max-w-3xl mx-auto space-y-8">
            <div className="inline-flex items-center gap-2 px-3 py-1 rounded-full bg-brand-50 border border-brand-100 text-brand-700 text-sm font-medium animate-in fade-in slide-in-from-bottom-4 duration-500">
              <span className="relative flex h-2 w-2">
                <span className="animate-ping absolute inline-flex h-full w-full rounded-full bg-brand-400 opacity-75"></span>
                <span className="relative inline-flex rounded-full h-2 w-2 bg-brand-500"></span>
              </span>
              Sistem Informasi Mahasiswa
            </div>
            
            <h1 className="text-5xl lg:text-7xl font-bold tracking-tight text-neutral-900 leading-[1.1] animate-in fade-in slide-in-from-bottom-6 duration-700">
              Kelola Organisasi <br/>
              <span className="text-transparent bg-clip-text bg-gradient-to-r from-brand-600 to-blue-600">Lebih Efisien</span>
            </h1>
            
            <p className="text-lg text-neutral-600 leading-relaxed max-w-2xl mx-auto animate-in fade-in slide-in-from-bottom-8 duration-900">
              Platform terintegrasi untuk manajemen surat, proposal kegiatan, laporan pertanggungjawaban, dan keanggotaan organisasi mahasiswa.
            </p>

            <div className="flex items-center justify-center gap-4 pt-4 animate-in fade-in slide-in-from-bottom-10 duration-1000">
              <Link href="/login">
                <Button size="lg" className="h-12 px-8 bg-brand-600 hover:bg-brand-700 text-white text-base shadow-lg shadow-brand-500/20 rounded-full">
                  Mulai Sekarang
                </Button>
              </Link>
              <Link href="/public">
                <Button size="lg" variant="outline" className="h-12 px-8 border-neutral-200 text-neutral-700 hover:bg-neutral-50 bg-white rounded-full">
                  Jelajahi Publik
                </Button>
              </Link>
            </div>
          </div>
        </Container>
      </section>

      {/* Features */}
      <section className="py-24 bg-neutral-50 border-t border-neutral-100">
        <Container>
          <div className="text-center max-w-2xl mx-auto mb-16">
            <h2 className="text-3xl font-bold text-neutral-900 mb-4">Semua yang Anda Butuhkan</h2>
            <p className="text-neutral-600">Fitur lengkap untuk mendukung produktivitas organisasi mahasiswa dalam satu platform.</p>
          </div>
          
          <div className="grid md:grid-cols-3 gap-8">
            {[
              {
                icon: LayoutDashboard,
                title: "Dashboard Terpusat",
                desc: "Pantau semua aktivitas organisasi, status surat, dan pengajuan dalam satu tampilan yang informatif."
              },
              {
                icon: ShieldCheck,
                title: "Validasi Bertingkat",
                desc: "Sistem approval digital untuk surat dan proposal dengan alur yang jelas dan transparan."
              },
              {
                icon: Users,
                title: "Manajemen Anggota",
                desc: "Data keanggotaan terstruktur dengan hak akses yang dapat disesuaikan (RBAC) untuk setiap pengurus."
              }
            ].map((feature, i) => (
              <div key={i} className="group bg-white p-8 rounded-3xl border border-neutral-200 shadow-sm hover:shadow-lg hover:shadow-brand-500/5 hover:-translate-y-1 transition-all duration-300">
                <div className="h-14 w-14 bg-brand-50 rounded-2xl flex items-center justify-center text-brand-600 mb-6 group-hover:bg-brand-600 group-hover:text-white transition-colors duration-300">
                  <feature.icon className="h-7 w-7" />
                </div>
                <h3 className="text-xl font-bold text-neutral-900 mb-3">{feature.title}</h3>
                <p className="text-neutral-600 leading-relaxed">{feature.desc}</p>
              </div>
            ))}
          </div>
        </Container>
      </section>

      {/* CTA */}
      <section className="py-24 bg-white relative overflow-hidden">
        <Container>
          <div className="bg-brand-900 rounded-[2.5rem] p-12 md:p-20 text-center relative overflow-hidden">
            {/* Decorative circles */}
            <div className="absolute top-0 right-0 -mr-20 -mt-20 h-96 w-96 bg-brand-500 rounded-full blur-[100px] opacity-20"></div>
            <div className="absolute bottom-0 left-0 -ml-20 -mb-20 h-96 w-96 bg-blue-600 rounded-full blur-[100px] opacity-20"></div>
            
            <div className="relative z-10 max-w-3xl mx-auto space-y-8">
              <h2 className="text-3xl md:text-5xl font-bold text-white tracking-tight">Siap Memajukan Organisasi Anda?</h2>
              <p className="text-brand-100 text-lg leading-relaxed">
                Bergabunglah dengan SIMAWA dan rasakan kemudahan dalam mengelola administrasi organisasi mahasiswa.
              </p>
              <div className="flex flex-col sm:flex-row gap-4 justify-center pt-4">
                <Link href="/login">
                  <Button size="lg" className="h-14 px-8 bg-white text-brand-900 hover:bg-brand-50 font-semibold rounded-full text-base w-full sm:w-auto">
                    Masuk ke Dashboard
                  </Button>
                </Link>
              </div>
            </div>
          </div>
        </Container>
      </section>

      {/* Footer */}
      <footer className="py-12 bg-white border-t border-neutral-100">
        <Container>
          <div className="flex flex-col md:flex-row justify-between items-center gap-6">
            <div className="flex items-center gap-2">
              <div className="h-8 w-8 bg-neutral-900 rounded-lg flex items-center justify-center text-white text-sm font-bold">S</div>
              <span className="font-bold text-neutral-900 text-lg">SIMAWA</span>
            </div>
            <div className="text-sm text-neutral-500 text-center md:text-right">
              <p>© {new Date().getFullYear()} Universitas Raharja. All rights reserved.</p>
              <p className="mt-1">Built for Students, by Students.</p>
            </div>
          </div>
        </Container>
      </footer>
    </div>
  )
}
