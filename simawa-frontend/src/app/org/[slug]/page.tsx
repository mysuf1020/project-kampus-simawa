'use client'

import React, { useEffect, useMemo, useState } from 'react'
import Link from 'next/link'
import { useParams } from 'next/navigation'
import { useQuery } from '@tanstack/react-query'
import { useSession } from 'next-auth/react'
import {
  ArrowRight,
  ArrowUpRight,
  Calendar,
  CheckCircle2,
  ChevronRight,
  Globe2,
  Instagram,
  Linkedin,
  Mail,
  MapPin,
  Phone,
  Sparkles,
  Twitter,
  UserPlus,
  Users,
} from 'lucide-react'

import {
  Button,
  Dialog,
  DialogContent,
  DialogDescription,
  DialogHeader,
  DialogTitle,
  Input,
  Label,
  TextArea,
  Container,
  Spinner,
  Text,
  Title,
  Badge,
} from '@/components/ui'
import { Page } from '@/components/commons'
import { getOrganization, getOrganizationBySlug } from '@/lib/apis/org'
import { submitPublicJoinRequest } from '@/lib/apis/org-join'
import {
  PUBLIC_PAGE_THEMES,
  SHOWCASE_ACCENTS,
  normalizeOrgPublicPageConfig,
} from '@/lib/org-public-page'
import { toast } from 'sonner'
import { cn } from '@/lib/utils'

const formatDate = (value?: string) => {
  if (!value) return '—'
  const parsed = Date.parse(value)
  if (Number.isNaN(parsed)) return '—'
  return new Date(parsed).toLocaleDateString('id-ID', {
    day: '2-digit',
    month: 'short',
    year: 'numeric',
  })
}

export default function OrgPublicPage() {
  const { data: session } = useSession()
  const params = useParams()
  const slug = useMemo(() => {
    const raw = params?.slug
    return Array.isArray(raw) ? raw[0] : raw
  }, [params])

  const {
    data: orgBySlug,
    isLoading,
    isError,
  } = useQuery({
    queryKey: ['org-public', slug],
    queryFn: () => getOrganizationBySlug(slug as string),
    enabled: typeof slug === 'string' && slug.length > 0,
  })

  const { data: orgById } = useQuery({
    queryKey: ['org-detail', orgBySlug?.id],
    queryFn: () => getOrganization(orgBySlug?.id as string),
    enabled: Boolean(orgBySlug?.id),
  })

  const org = orgById || orgBySlug
  const displayName = org?.name || 'Organisasi'
  const displayDesc =
    org?.description ||
    'Deskripsi organisasi belum diisi. Tambahkan cerita dan sorotan agar profil publik lebih meyakinkan.'
  const slugDisplay = org?.slug || (typeof slug === 'string' ? slug : 'alamat')
  const contactEmail =
    org?.contact_email || (slugDisplay ? `halo@${slugDisplay}.id` : 'halo@simawa.local')
  const contactPhone = org?.contact_phone
  const websiteUrl = org?.website_url
  const instagramUrl = org?.instagram_url
  const twitterUrl = org?.twitter_url
  const linkedinUrl = org?.linkedin_url
  const heroImage = org?.hero_image
  const mappedLogoSrc = useMemo(() => {
    const name = org?.name?.trim()
    const key = name && name.length > 0 ? name : slugDisplay
    return `/org-logo/${encodeURIComponent(key)}`
  }, [org?.name, slugDisplay])
  const [logoSrc, setLogoSrc] = useState<string>(mappedLogoSrc)
  useEffect(() => {
    const candidate = org?.logo_url?.trim()
    setLogoSrc(candidate && candidate.length > 0 ? candidate : mappedLogoSrc)
  }, [mappedLogoSrc, org?.logo_url])
  const galleryUrls =
    org?.gallery_urls?.filter((g) => typeof g === 'string' && g.trim().length > 0) || []

  const galleryEntries = galleryUrls.map((raw, idx) => {
    let url = raw
    let caption = ''
    if (raw.includes('|')) {
      const [u, c] = raw.split('|')
      url = u.trim()
      caption = c?.trim()
    }
    let domain: string | null = null
    try {
      const parsed = new URL(url)
      domain = parsed.hostname.replace(/^www\\./, '')
    } catch {
      domain = null
    }
    return { url, caption, domain, idx }
  })

  const [showAllGallery, setShowAllGallery] = useState(false)

  const publicPage = useMemo(
    () =>
      normalizeOrgPublicPageConfig({
        links: org?.links,
        contactEmail,
      }),
    [org?.links, contactEmail],
  )
  const theme = PUBLIC_PAGE_THEMES[publicPage.theme]
  const canManage = Boolean(
    (session?.user as { access_token?: string } | undefined)?.access_token,
  )
  const [joinOpen, setJoinOpen] = useState(false)
  const [joinLoading, setJoinLoading] = useState(false)
  const [joinForm, setJoinForm] = useState({
    name: '',
    email: '',
    nim: '',
    phone: '',
    jurusan: '',
    message: '',
  })

  const [scrolled, setScrolled] = useState(false)
  useEffect(() => {
    const onScroll = () => setScrolled(window.scrollY > 50)
    window.addEventListener('scroll', onScroll)
    return () => window.removeEventListener('scroll', onScroll)
  }, [])

  return (
    <Page>
      <Page.Body className="relative min-h-screen bg-neutral-50 text-neutral-900 font-sans selection:bg-brand-500/30">
        {/* Navigation */}
        <header
          className={cn(
            'fixed top-0 inset-x-0 z-50 transition-all duration-300 border-b',
            scrolled
              ? 'bg-white/80 backdrop-blur-md border-neutral-200/50 py-3 shadow-sm'
              : 'bg-transparent border-transparent py-5'
          )}
        >
          <Container className="max-w-7xl">
            <div className="flex items-center justify-between">
              <Link
                href={typeof slug === 'string' ? `/org/${slug}` : '/'}
                className="flex items-center gap-3 group"
              >
                <div className="relative">
                  <div className={cn("absolute inset-0 rounded-full blur-md opacity-50 transition-colors duration-500", scrolled ? "bg-brand-200" : "bg-white/30")}></div>
                  <img
                    src={logoSrc}
                    alt={`${displayName} logo`}
                    className={cn(
                      "relative h-10 w-10 rounded-full object-contain p-1 border transition-all duration-300",
                      scrolled ? "bg-white border-neutral-200" : "bg-white/90 border-white/20"
                    )}
                    onError={() => {
                      if (logoSrc !== mappedLogoSrc) setLogoSrc(mappedLogoSrc)
                    }}
                  />
                </div>
                <div className={cn("leading-tight transition-colors duration-300", scrolled ? "text-neutral-900" : "text-white")}>
                  <p className="text-sm font-bold tracking-tight">{displayName}</p>
                  <p className={cn("text-[10px] font-medium tracking-wide opacity-80", scrolled ? "text-neutral-500" : "text-white/80")}>/{slugDisplay}</p>
                </div>
              </Link>

              <div className="flex items-center gap-4">
                <nav className={cn("hidden items-center gap-6 text-sm font-medium md:flex transition-colors duration-300", scrolled ? "text-neutral-600" : "text-white/90")}>
                  <a className="hover:text-brand-500 transition-colors" href="#tentang">
                    Tentang
                  </a>
                  <a className="hover:text-brand-500 transition-colors" href="#sorotan">
                    Program
                  </a>
                  {galleryEntries.length > 0 && (
                    <a className="hover:text-brand-500 transition-colors" href="#galeri">
                      Galeri
                    </a>
                  )}
                  <a className="hover:text-brand-500 transition-colors" href="#kontak">
                    Kontak
                  </a>
                </nav>

                <div className="flex items-center gap-2">
                  {canManage ? (
                    <Link href="/organizations">
                      <Button
                        size="sm"
                        className={cn("font-medium transition-all shadow-lg shadow-brand-500/20", scrolled ? "bg-brand-600 text-white hover:bg-brand-700" : "bg-white text-brand-700 hover:bg-neutral-100")}
                      >
                        Kelola
                      </Button>
                    </Link>
                  ) : (
                    <Button 
                      size="sm" 
                      onClick={() => setJoinOpen(true)}
                      className={cn("font-medium transition-all shadow-lg shadow-brand-500/20", scrolled ? "bg-brand-600 text-white hover:bg-brand-700" : "bg-white text-brand-700 hover:bg-neutral-100")}
                    >
                      Gabung
                    </Button>
                  )}
                </div>
              </div>
            </div>
          </Container>
        </header>

        <main>
          {isLoading && (
            <div className="flex h-screen items-center justify-center bg-neutral-50">
              <div className="flex flex-col items-center gap-3 text-neutral-500">
                <Spinner size="lg" /> 
                <p className="text-sm font-medium animate-pulse">Memuat profil organisasi...</p>
              </div>
            </div>
          )}

          {isError && (
            <div className="flex h-screen items-center justify-center bg-neutral-50">
              <div className="text-center max-w-md px-6">
                <div className="mx-auto mb-4 flex h-16 w-16 items-center justify-center rounded-full bg-red-50 text-red-500">
                  <Sparkles className="h-8 w-8" />
                </div>
                <Title level="h2">Halaman tidak ditemukan</Title>
                <Text className="mt-2 text-neutral-600">
                  Organisasi yang Anda cari mungkin belum terdaftar atau alamatnya salah.
                </Text>
                <Link href="/public">
                  <Button className="mt-6" variant="outline">Kembali ke Beranda</Button>
                </Link>
              </div>
            </div>
          )}

          {!isLoading && !isError && org && (
            <>
              {/* Hero Section */}
              <section className="relative min-h-[90vh] flex items-center pt-20 overflow-hidden">
                {/* Dynamic Background */}
                <div className={cn("absolute inset-0 -z-20 bg-gradient-to-br", theme.heroGradient)} />
                
                {heroImage && (
                  <div className="absolute inset-0 -z-10">
                    <div 
                      className="absolute inset-0 bg-cover bg-center transition-transform duration-[20s] ease-in-out hover:scale-105"
                      style={{ backgroundImage: `url(${heroImage})` }}
                    />
                    <div className="absolute inset-0 bg-gradient-to-b from-black/70 via-black/50 to-neutral-50" />
                    <div className="absolute inset-0 bg-[url('/noise.png')] opacity-[0.03] mix-blend-overlay"></div>
                  </div>
                )}
                
                {!heroImage && (
                   <div className="absolute inset-0 -z-10 bg-[radial-gradient(circle_at_50%_120%,rgba(255,255,255,0.1),transparent_50%)]"></div>
                )}

                <Container className="max-w-7xl relative z-10">
                  <div className="grid lg:grid-cols-2 gap-12 items-center">
                    <div className="space-y-8 animate-in fade-in slide-in-from-bottom-4 duration-700">
                      <div className="inline-flex items-center gap-2 rounded-full bg-white/10 px-4 py-1.5 text-xs font-medium text-white/90 border border-white/20 backdrop-blur-sm">
                        <Sparkles className="h-3.5 w-3.5 text-yellow-300" />
                        <span>{org.type || 'Organisasi Mahasiswa'}</span>
                        <span className="text-white/30 mx-1">•</span>
                        <span>Sejak {formatDate(org.created_at).split(' ')[2]}</span>
                      </div>
                      
                      <div>
                        <h1 className="text-5xl lg:text-7xl font-bold tracking-tight text-white leading-[1.1]">
                          {displayName}
                        </h1>
                        <p className="mt-6 text-lg lg:text-xl text-white/80 leading-relaxed max-w-2xl">
                          {org?.description?.slice(0, 150) || 'Membangun masa depan mahasiswa melalui kolaborasi dan inovasi.'}...
                        </p>
                      </div>

                      <div className="flex flex-wrap gap-4 pt-2">
                        <Button
                          size="lg"
                          className="h-12 px-8 bg-white text-brand-700 hover:bg-brand-50 border-0 font-semibold text-base shadow-lg shadow-black/5 transition-all hover:scale-105 active:scale-95"
                          onClick={() => setJoinOpen(true)}
                        >
                          <UserPlus className="mr-2 h-5 w-5" /> Bergabung Sekarang
                        </Button>
                        <Link href="/public">
                          <Button
                            size="lg"
                            variant="outline"
                            className="h-12 px-8 border-white/30 bg-white/5 text-white hover:bg-white/10 backdrop-blur-sm font-medium transition-all"
                          >
                            Jelajahi Kegiatan
                          </Button>
                        </Link>
                      </div>

                      <div className="pt-8 flex items-center gap-8 border-t border-white/10 text-white/80">
                        <div>
                          <p className="text-3xl font-bold text-white">50+</p>
                          <p className="text-sm font-medium text-white/60">Anggota Aktif</p>
                        </div>
                        <div className="w-px h-10 bg-white/10"></div>
                        <div>
                          <p className="text-3xl font-bold text-white">12+</p>
                          <p className="text-sm font-medium text-white/60">Program Kerja</p>
                        </div>
                        <div className="w-px h-10 bg-white/10"></div>
                        <div>
                          <p className="text-3xl font-bold text-white">Active</p>
                          <p className="text-sm font-medium text-white/60">Status</p>
                        </div>
                      </div>
                    </div>

                    {/* Right side floating card effect */}
                    <div className="hidden lg:block relative animate-in fade-in zoom-in-95 duration-1000 delay-200">
                      <div className="absolute -inset-4 bg-gradient-to-r from-brand-500 to-purple-500 rounded-[2rem] blur-2xl opacity-30 animate-pulse"></div>
                      <div className="relative bg-white/10 backdrop-blur-xl border border-white/20 p-8 rounded-[2rem] shadow-lg">
                        <div className="flex items-center justify-between mb-8">
                          <div className="flex items-center gap-4">
                            <div className="h-12 w-12 rounded-full bg-white/20 flex items-center justify-center text-white">
                              <Globe2 className="h-6 w-6" />
                            </div>
                            <div>
                              <p className="text-white font-semibold">Official Page</p>
                              <p className="text-white/60 text-sm">simawa.ac.id/org/{slugDisplay}</p>
                            </div>
                          </div>
                          <Badge className="bg-green-500/20 text-green-300 border-green-500/30 px-3">Verified</Badge>
                        </div>
                        
                        <div className="space-y-4">
                          {[
                            { label: 'Email', value: contactEmail, icon: Mail },
                            { label: 'Kategori', value: org.type, icon: Users },
                            { label: 'Lokasi', value: 'Kampus Pusat', icon: MapPin },
                          ].map((item, i) => (
                            <div key={i} className="flex items-center gap-4 p-4 rounded-xl bg-black/20 border border-white/5 hover:bg-black/30 transition-colors">
                              <item.icon className="h-5 w-5 text-white/70" />
                              <div>
                                <p className="text-xs text-white/50">{item.label}</p>
                                <p className="text-white font-medium">{item.value}</p>
                              </div>
                            </div>
                          ))}
                        </div>

                        <div className="mt-8">
                          <p className="text-white/60 text-sm mb-4">Connect with us:</p>
                          <div className="flex gap-3">
                            {[
                              { icon: Instagram, url: instagramUrl },
                              { icon: Twitter, url: twitterUrl },
                              { icon: Linkedin, url: linkedinUrl },
                              { icon: Globe2, url: websiteUrl },
                            ].map((social, i) => 
                              social.url ? (
                                <a 
                                  key={i} 
                                  href={social.url} 
                                  target="_blank" 
                                  rel="noreferrer"
                                  className="h-10 w-10 rounded-full bg-white/10 hover:bg-white/20 flex items-center justify-center text-white transition-all hover:-translate-y-1"
                                >
                                  <social.icon className="h-5 w-5" />
                                </a>
                              ) : null
                            )}
                          </div>
                        </div>
                      </div>
                    </div>
                  </div>
                </Container>
              </section>

              <Container className="max-w-7xl -mt-20 relative z-20 mb-20">
                <div className="grid lg:grid-cols-[2fr_1fr] gap-8">
                  {/* Main Content */}
                  <div className="space-y-8">
                    {/* About Card */}
                    <section id="tentang" className="scroll-mt-24">
                      <div className="bg-white rounded-3xl p-8 shadow-sm border border-neutral-200">
                        <div className="flex items-center gap-3 mb-6">
                          <div className="h-10 w-1 bg-brand-500 rounded-full"></div>
                          <h2 className="text-2xl font-bold text-neutral-900">Tentang Kami</h2>
                        </div>
                        <div className="prose prose-neutral max-w-none text-neutral-600 leading-relaxed">
                          {displayDesc.split('\n').map((paragraph, idx) => (
                            <p key={idx}>{paragraph}</p>
                          ))}
                        </div>
                      </div>
                    </section>

                    {/* Programs / Showcase */}
                    <section id="sorotan" className="scroll-mt-24">
                      <div className="flex items-center gap-3 mb-6">
                        <div className="h-10 w-1 bg-brand-500 rounded-full"></div>
                        <div>
                          <h2 className="text-2xl font-bold text-neutral-900">Program Unggulan</h2>
                          <p className="text-neutral-500">Inisiatif dan kegiatan yang kami jalankan</p>
                        </div>
                      </div>
                      
                      <div className="grid md:grid-cols-2 gap-6">
                        {publicPage.showcase
                          .filter((item) => item.enabled)
                          .map((item) => (
                            <ShowcaseCard
                              key={item.id}
                              title={item.title}
                              body={item.body}
                              accent={SHOWCASE_ACCENTS[item.accent]}
                              href={item.href}
                              ctaLabel={item.cta_label}
                            />
                          ))}
                      </div>
                    </section>

                    {/* Gallery */}
                    {galleryEntries.length > 0 && (
                      <section id="galeri" className="scroll-mt-24">
                        <div className="flex items-center justify-between mb-6">
                          <div className="flex items-center gap-3">
                            <div className="h-10 w-1 bg-brand-500 rounded-full"></div>
                            <h2 className="text-2xl font-bold text-neutral-900">Galeri Kegiatan</h2>
                          </div>
                          {galleryEntries.length > 6 && (
                            <Button variant="ghost" onClick={() => setShowAllGallery(!showAllGallery)}>
                              {showAllGallery ? "Lihat Sedikit" : "Lihat Semua"}
                            </Button>
                          )}
                        </div>

                        <div className="grid grid-cols-2 md:grid-cols-3 gap-4">
                          {(showAllGallery ? galleryEntries : galleryEntries.slice(0, 6)).map(
                            (item) => (
                              <div
                                key={`${item.url}-${item.idx}`}
                                className="group relative aspect-square overflow-hidden rounded-2xl bg-neutral-100 cursor-pointer"
                                onClick={() => window.open(item.url, '_blank')}
                              >
                                <img
                                  src={item.url}
                                  alt={item.caption || `Gallery image ${item.idx}`}
                                  className="h-full w-full object-cover transition-transform duration-500 group-hover:scale-110"
                                />
                                <div className="absolute inset-0 bg-gradient-to-t from-black/60 via-transparent to-transparent opacity-0 group-hover:opacity-100 transition-opacity duration-300">
                                  <div className="absolute bottom-0 left-0 p-4">
                                    <p className="text-white text-sm font-medium line-clamp-2">
                                      {item.caption || 'Dokumentasi Kegiatan'}
                                    </p>
                                  </div>
                                </div>
                              </div>
                            ),
                          )}
                        </div>
                      </section>
                    )}
                  </div>

                  {/* Sidebar Info */}
                  <aside className="space-y-6">
                    {/* Join Card */}
                    <div className="bg-brand-900 rounded-3xl p-8 text-white relative overflow-hidden">
                      <div className="absolute top-0 right-0 -mr-8 -mt-8 h-32 w-32 bg-brand-500 rounded-full blur-3xl opacity-20"></div>
                      <div className="absolute bottom-0 left-0 -ml-8 -mb-8 h-32 w-32 bg-purple-500 rounded-full blur-3xl opacity-20"></div>
                      
                      <div className="relative z-10">
                        <h3 className="text-xl font-bold mb-2">Tertarik bergabung?</h3>
                        <p className="text-brand-100 mb-6 text-sm">
                          Jadilah bagian dari perjalanan kami. Daftar sekarang untuk mengikuti kegiatan dan pengembangan diri.
                        </p>
                        <Button 
                          className="w-full bg-white text-brand-900 hover:bg-brand-50 font-semibold"
                          onClick={() => setJoinOpen(true)}
                        >
                          Daftar Anggota
                        </Button>
                      </div>
                    </div>

                    {/* Contact Info */}
                    <div id="kontak" className="bg-white rounded-3xl p-6 shadow-sm border border-neutral-200">
                      <h3 className="font-bold text-neutral-900 mb-4 px-2">Informasi Kontak</h3>
                      <div className="space-y-2">
                        <ContactRow
                          icon={<Mail className="h-4 w-4" />}
                          label="Email"
                          value={contactEmail}
                          href={`mailto:${contactEmail}`}
                        />
                        {contactPhone && (
                          <ContactRow
                            icon={<Phone className="h-4 w-4" />}
                            label="Telepon / WA"
                            value={contactPhone}
                            href={`https://wa.me/${contactPhone.replace(/^0/, '62').replace(/\D/g, '')}`}
                          />
                        )}
                        {websiteUrl && (
                          <ContactRow
                            icon={<Globe2 className="h-4 w-4" />}
                            label="Website"
                            value={websiteUrl.replace(/^https?:\/\//, '')}
                            href={websiteUrl}
                          />
                        )}
                        <div className="pt-4 mt-4 border-t border-neutral-100 grid grid-cols-4 gap-2">
                          {[
                            { icon: Instagram, url: instagramUrl, label: "IG" },
                            { icon: Twitter, url: twitterUrl, label: "TW" },
                            { icon: Linkedin, url: linkedinUrl, label: "IN" },
                          ].map((social, i) => 
                            social.url ? (
                              <a 
                                key={i}
                                href={social.url}
                                target="_blank"
                                rel="noreferrer"
                                className="flex flex-col items-center justify-center gap-1 p-2 rounded-xl hover:bg-neutral-50 text-neutral-600 hover:text-brand-600 transition-colors"
                              >
                                <social.icon className="h-5 w-5" />
                                <span className="text-[10px] font-medium">{social.label}</span>
                              </a>
                            ) : null
                          )}
                        </div>
                      </div>
                    </div>
                  </aside>
                </div>
              </Container>

              {/* Simple Footer */}
              <footer className="bg-white border-t border-neutral-200 py-12">
                <Container className="max-w-7xl">
                  <div className="flex flex-col md:flex-row justify-between items-center gap-6">
                    <div className="flex items-center gap-3">
                      <img
                        src={logoSrc}
                        alt="logo"
                        className="h-8 w-8 opacity-50 grayscale"
                      />
                      <p className="text-sm text-neutral-500">
                        © {new Date().getFullYear()} {displayName}. All rights reserved.
                      </p>
                    </div>
                    <div className="text-sm text-neutral-400">
                      Powered by <span className="font-semibold text-brand-600">SIMAWA</span>
                    </div>
                  </div>
                </Container>
              </footer>

              {/* Join Dialog */}
              <Dialog open={joinOpen} onOpenChange={setJoinOpen}>
                <DialogContent className="max-w-lg rounded-3xl p-0 overflow-hidden gap-0">
                  <div className="bg-brand-600 p-6 text-white text-center">
                    <div className="mx-auto bg-white/20 h-12 w-12 rounded-full flex items-center justify-center mb-4 backdrop-blur-sm">
                      <UserPlus className="h-6 w-6 text-white" />
                    </div>
                    <DialogTitle className="text-xl font-bold text-white">Formulir Pendaftaran</DialogTitle>
                    <DialogDescription className="text-brand-100 mt-1">
                      Bergabung dengan {displayName}
                    </DialogDescription>
                  </div>
                  
                  <div className="p-6 space-y-4">
                    <div className="grid gap-4 sm:grid-cols-2">
                      <div className="space-y-2">
                        <Label>Nama Lengkap <span className="text-red-500">*</span></Label>
                        <Input
                          placeholder="Nama sesuai KTM"
                          value={joinForm.name}
                          onChange={(e) => setJoinForm((p) => ({ ...p, name: e.target.value }))}
                          className="rounded-xl border-neutral-200"
                        />
                      </div>
                      <div className="space-y-2">
                        <Label>NIM <span className="text-red-500">*</span></Label>
                        <Input
                          placeholder="Nomor Induk Mahasiswa"
                          value={joinForm.nim}
                          onChange={(e) => setJoinForm((p) => ({ ...p, nim: e.target.value }))}
                          className="rounded-xl border-neutral-200"
                        />
                      </div>
                    </div>
                    <div className="space-y-2">
                      <Label> <span className="text-red-500">*</span></Label>
                      <Input
                        type="email"
                        placeholder="nama@raharja.info"
                        value={joinForm.email}
                        onChange={(e) => setJoinForm((p) => ({ ...p, email: e.target.value }))}
                        className="rounded-xl border-neutral-200"
                      />
                    </div>
                    <div className="grid gap-4 sm:grid-cols-2">
                      <div className="space-y-2">
                        <Label>No. WhatsApp</Label>
                        <Input
                          placeholder="08..."
                          value={joinForm.phone}
                          onChange={(e) => setJoinForm((p) => ({ ...p, phone: e.target.value }))}
                          className="rounded-xl border-neutral-200"
                        />
                      </div>
                      <div className="space-y-2">
                        <Label>Jurusan</Label>
                        <Input
                          placeholder="Sistem Informasi"
                          value={joinForm.jurusan}
                          onChange={(e) => setJoinForm((p) => ({ ...p, jurusan: e.target.value }))}
                          className="rounded-xl border-neutral-200"
                        />
                      </div>
                    </div>
                    <div className="space-y-2">
                      <Label>Alasan Bergabung</Label>
                      <TextArea
                        rows={3}
                        placeholder="Ceritakan motivasi singkat kamu..."
                        value={joinForm.message}
                        onChange={(e) => setJoinForm((p) => ({ ...p, message: e.target.value }))}
                        className="rounded-xl border-neutral-200 resize-none"
                      />
                    </div>

                    <div className="pt-4 flex gap-3">
                      <Button
                        variant="outline"
                        className="flex-1 rounded-xl"
                        onClick={() => setJoinOpen(false)}
                        disabled={joinLoading}
                      >
                        Batal
                      </Button>
                      <Button
                        className="flex-1 rounded-xl bg-brand-600 hover:bg-brand-700 text-white"
                        disabled={joinLoading || !org?.id}
                        onClick={async () => {
                          if (!org?.id) return
                          const name = joinForm.name.trim()
                          const email = joinForm.email.trim()
                          const nim = joinForm.nim.trim()
                          if (!name || !email || !nim) {
                            toast.error('Mohon lengkapi data wajib (*)')
                            return
                          }
                          setJoinLoading(true)
                          try {
                            await submitPublicJoinRequest(org.id, {
                              name,
                              email,
                              nim,
                              phone: joinForm.phone.trim(),
                              jurusan: joinForm.jurusan.trim(),
                              message: joinForm.message.trim(),
                            })
                            toast.success('Pendaftaran berhasil dikirim!')
                            setJoinOpen(false)
                            setJoinForm({ name: '', email: '', nim: '', phone: '', jurusan: '', message: '' })
                          } catch (err) {
                            const message = err instanceof Error ? err.message : 'Gagal mengirim permintaan'
                            toast.error(message)
                          } finally {
                            setJoinLoading(false)
                          }
                        }}
                      >
                        {joinLoading ? <Spinner className="mr-2 h-4 w-4 text-white" /> : <CheckCircle2 className="mr-2 h-4 w-4" />}
                        Kirim Pendaftaran
                      </Button>
                    </div>
                  </div>
                </DialogContent>
              </Dialog>
            </>
          )}
        </main>
      </Page.Body>
    </Page>
  )
}

function HighlightLine({ label, value }: { label: string; value: string }) {
  return (
    <div className="flex items-center justify-between gap-4 rounded-2xl bg-white/10 px-4 py-3 text-sm text-white border border-white/10">
      <span className="text-xs uppercase tracking-wide text-white/70">{label}</span>
      <span className="text-right font-semibold text-white">{value}</span>
    </div>
  )
}

function SectionTitle({ title, subtitle }: { title: string; subtitle?: string }) {
  return (
    <div>
      <p className="text-2xl font-semibold text-neutral-900">{title}</p>
      {subtitle ? <p className="mt-1 text-sm text-neutral-600">{subtitle}</p> : null}
    </div>
  )
}

type ShowcaseCardProps = {
  title: string
  body: string
  accent: string
  href?: string
  ctaLabel?: string
}

function ShowcaseCard({ title, body, accent, href, ctaLabel }: ShowcaseCardProps) {
  const label = ctaLabel?.trim() || 'Lihat detail'
  const isInternal = Boolean(href?.startsWith('/') || href?.startsWith('#'))

  return (
    <div className="group relative overflow-hidden rounded-3xl border border-neutral-200 bg-white p-6 shadow-sm shadow-neutral-100 transition-all hover:-translate-y-1 hover:shadow-lg">
      <div
        className={`pointer-events-none absolute inset-0 bg-gradient-to-br ${accent} opacity-[0.05] group-hover:opacity-[0.1] transition-opacity`}
      />
      <div className="relative space-y-4">
        <div className={`h-10 w-10 rounded-2xl bg-gradient-to-br ${accent} flex items-center justify-center text-white shadow-md`}>
          <Sparkles className="h-5 w-5" />
        </div>
        
        <div>
          <h3 className="text-lg font-bold text-neutral-900 group-hover:text-brand-600 transition-colors">{title}</h3>
          <p className="mt-2 text-sm leading-relaxed text-neutral-600">{body}</p>
        </div>

        {href && (
          <div className="pt-2">
            {isInternal ? (
              <Link
                href={href}
                className="inline-flex items-center gap-2 text-sm font-semibold text-brand-600 hover:text-brand-700"
              >
                {label} <ArrowRight className="h-4 w-4 transition-transform group-hover:translate-x-1" />
              </Link>
            ) : (
              <a
                href={href}
                target="_blank"
                rel="noreferrer"
                className="inline-flex items-center gap-2 text-sm font-semibold text-brand-600 hover:text-brand-700"
              >
                {label} <ArrowUpRight className="h-4 w-4 transition-transform group-hover:translate-x-1" />
              </a>
            )}
          </div>
        )}
      </div>
    </div>
  )
}

type ContactRowProps = {
  icon: React.ReactNode
  label: string
  value: string
  href?: string
}

function ContactRow({ icon, label, value, href }: ContactRowProps) {
  const content = (
    <div className="flex items-start gap-3 px-3 py-2 rounded-xl hover:bg-neutral-50 transition-colors group">
      <div className="mt-1 text-neutral-400 group-hover:text-brand-500 transition-colors">{icon}</div>
      <div className="space-y-0.5 min-w-0">
        <p className="text-xs text-neutral-500">{label}</p>
        <p className="text-sm font-medium text-neutral-900 truncate">{value}</p>
      </div>
    </div>
  )

  if (!href) return content

  return (
    <a
      href={href}
      target="_blank"
      rel="noreferrer"
      className="block"
    >
      {content}
    </a>
  )
}
