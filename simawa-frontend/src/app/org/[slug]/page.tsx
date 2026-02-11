'use client'

import { useQuery } from '@tanstack/react-query'
import { useParams } from 'next/navigation'
import Image from 'next/image'
import Link from 'next/link'
import {
  Button,
  Container,
  Spinner,
} from '@/components/ui'
import { Building2, Mail, Phone, Globe, Instagram, ArrowLeft, Calendar, MapPin, Users, ExternalLink, LogIn, Crown, Shield, UserCircle } from 'lucide-react'
import { getOrganizationBySlug, getPublicMembers, type PublicMember } from '@/lib/apis/org'
import { fetchPublicActivities } from '@/lib/apis/activity'

// Dummy images for demo
const DUMMY_HERO = 'https://images.unsplash.com/photo-1523580494863-6f3031224c94?w=1920&q=80'
const DUMMY_LOGO = 'https://images.unsplash.com/photo-1560179707-f14e90ef3623?w=200&q=80'
const DUMMY_GALLERY = [
  'https://images.unsplash.com/photo-1540575467063-178a50c2df87?w=600&q=80',
  'https://images.unsplash.com/photo-1515187029135-18ee286d815b?w=600&q=80',
  'https://images.unsplash.com/photo-1528605248644-14dd04022da1?w=600&q=80',
  'https://images.unsplash.com/photo-1517457373958-b7bdd4587205?w=600&q=80',
  'https://images.unsplash.com/photo-1511578314322-379afb476865?w=600&q=80',
  'https://images.unsplash.com/photo-1475721027785-f74eccf877e2?w=600&q=80',
]

// Helper to check if URL is a valid image URL (not a social media profile URL)
const isValidImageUrl = (url?: string): boolean => {
  if (!url) return false
  // Reject social media profile URLs
  if (url.includes('instagram.com') && !url.includes('/p/')) return false
  if (url.includes('twitter.com') || url.includes('x.com')) return false
  if (url.includes('facebook.com')) return false
  if (url.includes('linkedin.com')) return false
  return true
}

export default function OrganizationDetailPage() {
  const params = useParams()
  const slug = params.slug as string

  const {
    data: org,
    isLoading: orgLoading,
    isError,
  } = useQuery({
    queryKey: ['organization', slug],
    queryFn: () => getOrganizationBySlug(slug),
    enabled: !!slug,
  })

  const { data: activities } = useQuery({
    queryKey: ['public-activities'],
    queryFn: () => fetchPublicActivities(),
  })

  const { data: members = [] } = useQuery({
    queryKey: ['public-members', slug],
    queryFn: () => getPublicMembers(slug),
    enabled: !!slug,
  })

  const orgActivities = activities?.filter((a) => a.org_id === org?.id) || []

  // Use dummy images if no real images available or if URL is invalid
  const heroImage = (org && isValidImageUrl(org.hero_image)) ? org.hero_image! : DUMMY_HERO
  const logoImage = (org && isValidImageUrl(org.logo_url)) ? org.logo_url! : DUMMY_LOGO
  const validGalleryUrls = org?.gallery_urls?.filter(isValidImageUrl) || []
  const galleryImages = validGalleryUrls.length > 0 ? validGalleryUrls : DUMMY_GALLERY

  if (orgLoading) {
    return (
      <div className="min-h-screen bg-neutral-50 flex items-center justify-center">
        <Spinner size="lg" />
      </div>
    )
  }

  if (isError || !org) {
    return (
      <div className="min-h-screen bg-neutral-50 flex items-center justify-center p-6">
        <div className="text-center space-y-4">
          <div className="w-20 h-20 mx-auto bg-red-100 rounded-full flex items-center justify-center">
            <Building2 className="w-10 h-10 text-red-500" />
          </div>
          <h1 className="text-2xl font-bold text-neutral-900">Organisasi Tidak Ditemukan</h1>
          <p className="text-neutral-500">Halaman yang Anda cari tidak tersedia.</p>
          <Link
            href="/org"
            className="inline-flex items-center gap-2 text-brand-600 hover:text-brand-700 font-medium"
          >
            <ArrowLeft className="w-4 h-4" /> Kembali ke Daftar Organisasi
          </Link>
        </div>
      </div>
    )
  }

  return (
    <div className="min-h-screen bg-neutral-50">
      {/* Public Navbar */}
      <header className="fixed top-0 left-0 right-0 z-50 bg-white/95 backdrop-blur-sm border-b border-neutral-200 shadow-sm">
        <Container>
          <div className="flex items-center justify-between h-16">
            <Link href="/org" className="flex items-center gap-2">
              <div className="h-9 w-9 bg-brand-600 rounded-lg flex items-center justify-center text-white font-bold shadow-md">
                S
              </div>
              <span className="font-bold text-xl tracking-tight text-neutral-900">
                SIMAWA
              </span>
            </Link>
          </div>
        </Container>
      </header>

      {/* Hero Section - Full Width */}
      <div className="relative h-[50vh] min-h-[400px] max-h-[600px] mt-16">
        <Image
          src={heroImage}
          alt={org.name}
          fill
          className="object-cover"
          priority
        />
        <div className="absolute inset-0 bg-gradient-to-t from-black/80 via-black/40 to-black/20" />

        {/* Back Button */}
        <Link
          href="/org"
          className="absolute top-6 left-6 z-10 flex items-center gap-2 px-4 py-2 bg-white/10 backdrop-blur-md rounded-full text-white hover:bg-white/20 transition-all"
        >
          <ArrowLeft className="w-4 h-4" />
          <span className="text-sm font-medium">Kembali</span>
        </Link>

        {/* Hero Content */}
        <Container className="relative h-full flex items-end pb-12">
          <div className="flex flex-col md:flex-row md:items-end gap-6 w-full">
            {/* Logo */}
            <div className="w-28 h-28 md:w-36 md:h-36 bg-white rounded-2xl shadow-2xl p-3 flex-shrink-0 ring-4 ring-white/20">
              <Image
                src={logoImage}
                alt={org.name}
                width={144}
                height={144}
                className="object-contain w-full h-full rounded-xl"
              />
            </div>

            {/* Title & Type */}
            <div className="flex-1 text-white space-y-3">
              <h1 className="text-3xl md:text-5xl font-bold tracking-tight">{org.name}</h1>
              <div className="flex flex-wrap items-center gap-3">
                {org.type && (
                  <span className="px-4 py-1.5 text-sm font-medium bg-white/20 backdrop-blur-sm rounded-full">
                    {org.type}
                  </span>
                )}
                <span className="flex items-center gap-1.5 text-white/80 text-sm">
                  <Users className="w-4 h-4" />
                  Organisasi Mahasiswa
                </span>
              </div>
            </div>
          </div>
        </Container>
      </div>

      {/* Main Content */}
      <Container className="py-12">
        <div className="grid lg:grid-cols-3 gap-8">
          {/* Left Column - Main Content */}
          <div className="lg:col-span-2 space-y-8">
            {/* About Section */}
            <section className="bg-white rounded-2xl p-8 shadow-sm">
              <h2 className="text-xl font-bold text-neutral-900 mb-4">Tentang Organisasi</h2>
              <p className="text-neutral-600 leading-relaxed">
                {org.description || 'Organisasi mahasiswa yang aktif dalam berbagai kegiatan kampus dan pengembangan soft skill mahasiswa. Bergabunglah bersama kami untuk pengalaman yang tak terlupakan.'}
              </p>
            </section>

            {/* Bagan Organisasi Section */}
            {members.length > 0 && (
              <section className="bg-white rounded-2xl p-8 shadow-sm">
                <div className="flex items-center gap-3 mb-6">
                  <div className="w-10 h-10 bg-brand-100 rounded-xl flex items-center justify-center">
                    <Users className="w-5 h-5 text-brand-600" />
                  </div>
                  <div>
                    <h2 className="text-xl font-bold text-neutral-900">Struktur Organisasi</h2>
                    <p className="text-sm text-neutral-500">{members.length} Anggota</p>
                  </div>
                </div>

                {/* Ketua / Pimpinan */}
                {(() => {
                  const leaders = members.filter((m) =>
                    ['KETUA', 'KETUA UMUM', 'PRESIDEN', 'ADMIN'].includes(m.role.toUpperCase())
                  )
                  const wakil = members.filter((m) =>
                    ['WAKIL KETUA', 'WAKIL', 'WAKIL PRESIDEN'].includes(m.role.toUpperCase())
                  )
                  const sekretaris = members.filter((m) =>
                    ['SEKRETARIS', 'SEKRETARIS UMUM'].includes(m.role.toUpperCase())
                  )
                  const bendahara = members.filter((m) =>
                    ['BENDAHARA', 'BENDAHARA UMUM'].includes(m.role.toUpperCase())
                  )
                  const others = members.filter((m) => {
                    const r = m.role.toUpperCase()
                    return ![
                      'KETUA', 'KETUA UMUM', 'PRESIDEN', 'ADMIN',
                      'WAKIL KETUA', 'WAKIL', 'WAKIL PRESIDEN',
                      'SEKRETARIS', 'SEKRETARIS UMUM',
                      'BENDAHARA', 'BENDAHARA UMUM',
                    ].includes(r)
                  })

                  const getRoleIcon = (role: string) => {
                    const r = role.toUpperCase()
                    if (['KETUA', 'KETUA UMUM', 'PRESIDEN', 'ADMIN'].includes(r))
                      return <Crown className="w-4 h-4 text-amber-500" />
                    if (['WAKIL KETUA', 'WAKIL', 'WAKIL PRESIDEN', 'SEKRETARIS', 'SEKRETARIS UMUM', 'BENDAHARA', 'BENDAHARA UMUM'].includes(r))
                      return <Shield className="w-4 h-4 text-brand-500" />
                    return <UserCircle className="w-4 h-4 text-neutral-400" />
                  }

                  const MemberCard = ({ member, size = 'md' }: { member: PublicMember; size?: 'lg' | 'md' }) => (
                    <div className={`flex flex-col items-center text-center p-4 rounded-xl bg-neutral-50 hover:bg-neutral-100 transition-colors ${
                      size === 'lg' ? 'py-6' : ''
                    }`}>
                      <div className={`rounded-full bg-brand-100 flex items-center justify-center mb-3 ${
                        size === 'lg' ? 'w-16 h-16' : 'w-12 h-12'
                      }`}>
                        <span className={`font-bold text-brand-600 ${
                          size === 'lg' ? 'text-xl' : 'text-base'
                        }`}>
                          {member.name.charAt(0).toUpperCase()}
                        </span>
                      </div>
                      <div className="flex items-center gap-1.5 mb-1">
                        {getRoleIcon(member.role)}
                        <span className="text-xs font-semibold text-neutral-500 uppercase tracking-wide">
                          {member.role}
                        </span>
                      </div>
                      <p className={`font-semibold text-neutral-900 ${
                        size === 'lg' ? 'text-base' : 'text-sm'
                      }`}>
                        {member.name}
                      </p>
                    </div>
                  )

                  return (
                    <div className="space-y-6">
                      {/* Pimpinan Inti */}
                      {leaders.length > 0 && (
                        <div>
                          <div className="flex justify-center gap-4 flex-wrap">
                            {leaders.map((m, i) => (
                              <div key={i} className="w-full max-w-[200px]">
                                <MemberCard member={m} size="lg" />
                              </div>
                            ))}
                          </div>
                          {(wakil.length > 0 || sekretaris.length > 0 || bendahara.length > 0) && (
                            <div className="flex justify-center my-3">
                              <div className="w-px h-6 bg-neutral-200" />
                            </div>
                          )}
                        </div>
                      )}

                      {/* Wakil, Sekretaris, Bendahara */}
                      {(wakil.length > 0 || sekretaris.length > 0 || bendahara.length > 0) && (
                        <div>
                          <div className="flex justify-center gap-4 flex-wrap">
                            {[...wakil, ...sekretaris, ...bendahara].map((m, i) => (
                              <div key={i} className="w-full max-w-[180px]">
                                <MemberCard member={m} />
                              </div>
                            ))}
                          </div>
                          {others.length > 0 && (
                            <div className="flex justify-center my-3">
                              <div className="w-px h-6 bg-neutral-200" />
                            </div>
                          )}
                        </div>
                      )}

                      {/* Anggota Lainnya */}
                      {others.length > 0 && (
                        <div>
                          <p className="text-xs font-semibold text-neutral-400 uppercase tracking-wider text-center mb-3">Anggota</p>
                          <div className="grid grid-cols-2 md:grid-cols-3 gap-3">
                            {others.map((m, i) => (
                              <MemberCard key={i} member={m} />
                            ))}
                          </div>
                        </div>
                      )}
                    </div>
                  )
                })()}
              </section>
            )}

            {/* Gallery Section */}
            <section className="bg-white rounded-2xl p-8 shadow-sm">
              <div className="flex items-center justify-between mb-6">
                <h2 className="text-xl font-bold text-neutral-900">Galeri Kegiatan</h2>
                <span className="text-sm text-neutral-500">{galleryImages.length} Foto</span>
              </div>
              <div className="grid grid-cols-2 md:grid-cols-3 gap-3">
                {galleryImages.slice(0, 6).map((url, idx) => (
                  <div
                    key={idx}
                    className={`relative rounded-xl overflow-hidden group cursor-pointer ${idx === 0 ? 'col-span-2 row-span-2 aspect-square' : 'aspect-square'
                      }`}
                  >
                    <Image
                      src={url}
                      alt={`Gallery ${idx + 1}`}
                      fill
                      className="object-cover group-hover:scale-110 transition-transform duration-500"
                    />
                    <div className="absolute inset-0 bg-black/0 group-hover:bg-black/20 transition-colors" />
                  </div>
                ))}
              </div>
            </section>

            {/* Activities Section */}
            <section className="bg-white rounded-2xl p-8 shadow-sm">
              <h2 className="text-xl font-bold text-neutral-900 mb-6">Kegiatan Terbaru</h2>
              {orgActivities.length > 0 ? (
                <div className="space-y-4">
                  {orgActivities.slice(0, 5).map((activity) => (
                    <div
                      key={activity.id}
                      className="flex gap-4 p-4 rounded-xl bg-neutral-50 hover:bg-neutral-100 transition-colors"
                    >
                      <div className="flex-shrink-0 w-14 h-14 bg-brand-100 rounded-xl flex flex-col items-center justify-center text-brand-700">
                        {activity.start_at && (
                          <>
                            <span className="text-[10px] font-semibold uppercase">
                              {new Date(activity.start_at).toLocaleDateString('id-ID', { month: 'short' })}
                            </span>
                            <span className="text-lg font-bold leading-none">
                              {new Date(activity.start_at).getDate()}
                            </span>
                          </>
                        )}
                      </div>
                      <div className="flex-1 min-w-0">
                        <h3 className="font-semibold text-neutral-900 truncate">{activity.title}</h3>
                        <p className="text-sm text-neutral-500 line-clamp-1 mt-0.5">{activity.description}</p>
                        {activity.location && (
                          <div className="flex items-center gap-1.5 mt-2 text-xs text-neutral-400">
                            <MapPin className="w-3 h-3" />
                            <span>{activity.location}</span>
                          </div>
                        )}
                      </div>
                    </div>
                  ))}
                </div>
              ) : (
                <div className="text-center py-12 text-neutral-400">
                  <Calendar className="w-12 h-12 mx-auto mb-3 opacity-50" />
                  <p>Belum ada kegiatan terjadwal</p>
                </div>
              )}
            </section>
          </div>

          {/* Right Column - Sidebar */}
          <div className="space-y-6">
            {/* Contact Card */}
            <div className="bg-white rounded-2xl p-6 shadow-sm sticky top-6">
              <h3 className="font-bold text-neutral-900 mb-4">Informasi Kontak</h3>
              <div className="space-y-4">
                {org.contact_email && (
                  <a
                    href={`mailto:${org.contact_email}`}
                    className="flex items-center gap-3 p-3 rounded-xl bg-neutral-50 hover:bg-neutral-100 transition-colors group"
                  >
                    <div className="w-10 h-10 bg-brand-100 rounded-lg flex items-center justify-center">
                      <Mail className="w-5 h-5 text-brand-600" />
                    </div>
                    <div className="flex-1 min-w-0">
                      <p className="text-xs text-neutral-400">Email</p>
                      <p className="text-sm font-medium text-neutral-700 truncate group-hover:text-brand-600">
                        {org.contact_email}
                      </p>
                    </div>
                  </a>
                )}

                {org.contact_phone && (
                  <a
                    href={`tel:${org.contact_phone}`}
                    className="flex items-center gap-3 p-3 rounded-xl bg-neutral-50 hover:bg-neutral-100 transition-colors group"
                  >
                    <div className="w-10 h-10 bg-green-100 rounded-lg flex items-center justify-center">
                      <Phone className="w-5 h-5 text-green-600" />
                    </div>
                    <div className="flex-1 min-w-0">
                      <p className="text-xs text-neutral-400">Telepon</p>
                      <p className="text-sm font-medium text-neutral-700 truncate group-hover:text-green-600">
                        {org.contact_phone}
                      </p>
                    </div>
                  </a>
                )}

                {org.instagram_url && (
                  <a
                    href={org.instagram_url}
                    target="_blank"
                    rel="noopener noreferrer"
                    className="flex items-center gap-3 p-3 rounded-xl bg-neutral-50 hover:bg-neutral-100 transition-colors group"
                  >
                    <div className="w-10 h-10 bg-pink-100 rounded-lg flex items-center justify-center">
                      <Instagram className="w-5 h-5 text-pink-600" />
                    </div>
                    <div className="flex-1 min-w-0">
                      <p className="text-xs text-neutral-400">Instagram</p>
                      <p className="text-sm font-medium text-neutral-700 truncate group-hover:text-pink-600">
                        @{org.instagram_url.split('/').pop()}
                      </p>
                    </div>
                    <ExternalLink className="w-4 h-4 text-neutral-300 group-hover:text-neutral-500" />
                  </a>
                )}

                {org.website_url && (
                  <a
                    href={org.website_url}
                    target="_blank"
                    rel="noopener noreferrer"
                    className="flex items-center gap-3 p-3 rounded-xl bg-neutral-50 hover:bg-neutral-100 transition-colors group"
                  >
                    <div className="w-10 h-10 bg-blue-100 rounded-lg flex items-center justify-center">
                      <Globe className="w-5 h-5 text-blue-600" />
                    </div>
                    <div className="flex-1 min-w-0">
                      <p className="text-xs text-neutral-400">Website</p>
                      <p className="text-sm font-medium text-neutral-700 truncate group-hover:text-blue-600">
                        {org.website_url.replace(/^https?:\/\//, '')}
                      </p>
                    </div>
                    <ExternalLink className="w-4 h-4 text-neutral-300 group-hover:text-neutral-500" />
                  </a>
                )}

                {!org.contact_email && !org.contact_phone && !org.instagram_url && !org.website_url && (
                  <div className="text-center py-6 text-neutral-400">
                    <p className="text-sm">Belum ada informasi kontak</p>
                  </div>
                )}
              </div>

              {/* Join CTA */}
              <div className="mt-6 pt-6 border-t border-neutral-100">
                <Link
                  href={`/public/join/${org.id}`}
                  className="block w-full py-3 px-4 bg-brand-600 hover:bg-brand-700 text-white text-center font-medium rounded-xl transition-colors"
                >
                  Bergabung dengan Organisasi
                </Link>
              </div>
            </div>
          </div>
        </div>
      </Container>

      {/* Footer */}
      <footer className="bg-white border-t border-neutral-100 py-8 mt-12">
        <Container>
          <div className="text-center text-sm text-neutral-400">
            <p>© 2024 SIMAWA - Sistem Informasi Manajemen Organisasi Mahasiswa</p>
            <p className="mt-1">Universitas Raharja</p>
          </div>
        </Container>
      </footer>
    </div>
  )
}
