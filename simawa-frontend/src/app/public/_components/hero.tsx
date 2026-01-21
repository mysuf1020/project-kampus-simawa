export function PublicHero() {
  return (
    <div className="relative overflow-hidden rounded-3xl bg-brand-900 px-8 py-12 md:px-12 md:py-16 text-center text-white shadow-lg shadow-brand-900/20">
      <div className="absolute top-0 right-0 -mr-20 -mt-20 h-80 w-80 bg-brand-500 rounded-full blur-[100px] opacity-20"></div>
      <div className="absolute bottom-0 left-0 -ml-20 -mb-20 h-80 w-80 bg-blue-600 rounded-full blur-[100px] opacity-20"></div>

      <div className="relative z-10 max-w-2xl mx-auto space-y-4">
        <div className="inline-flex items-center rounded-full bg-white/10 px-3 py-1 text-xs font-medium text-brand-100 backdrop-blur-sm border border-white/10">
          Info Publik
        </div>
        <h1 className="text-3xl md:text-4xl font-bold tracking-tight text-white leading-tight">
          Agenda & Aktivitas Mahasiswa
        </h1>
        <p className="text-brand-100 text-lg leading-relaxed">
          Temukan berbagai kegiatan seru dan bermanfaat dari organisasi mahasiswa di
          lingkungan Universitas Raharja.
        </p>
      </div>
    </div>
  )
}
