'use client'

import { useState } from 'react'
import { useQuery } from '@tanstack/react-query'
import Image from 'next/image'
import Link from 'next/link'
import {
  Button,
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
  Container,
  Tabs,
  TabsContent,
  TabsList,
  TabsTrigger,
  Spinner,
} from '@/components/ui'
import { Calendar, Building2, Image as ImageIcon, ExternalLink, LogIn } from 'lucide-react'
import { api } from '@/lib/http-client'

type Organization = {
  id: string
  name: string
  slug?: string
  type?: string
  description?: string
  logo_url?: string
  hero_image?: string
  website_url?: string
  instagram_url?: string
  contact_email?: string
  gallery_urls?: string[]
}

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

type Activity = {
  id: string
  title: string
  description?: string
  start_at?: string
  end_at?: string
  location?: string
  org_id: string
  cover_key?: string
}

const fetchPublicOrganizations = async (): Promise<Organization[]> => {
  const { data } = await api.get<{ items: Organization[] }>('/orgs')
  return data.items || []
}

const fetchPublicActivities = async (): Promise<Activity[]> => {
  const { data } = await api.get<{ calendar: Activity[] }>('/public/activities')
  return data.calendar || []
}

export default function PublicOrganizationsPage() {
  const [selectedOrg, setSelectedOrg] = useState<Organization | null>(null)

  const { data: organizations, isLoading: orgsLoading } = useQuery({
    queryKey: ['public-organizations'],
    queryFn: fetchPublicOrganizations,
  })

  const { data: activities, isLoading: activitiesLoading } = useQuery({
    queryKey: ['public-activities'],
    queryFn: fetchPublicActivities,
  })

  const orgActivities = selectedOrg
    ? activities?.filter((a) => a.org_id === selectedOrg.id) || []
    : activities || []

  return (
    <div className="min-h-screen bg-neutral-50">
      {/* Public Navbar */}
      <header className="sticky top-0 z-50 bg-white/95 backdrop-blur-sm border-b border-neutral-200 shadow-sm">
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

      {/* Hero Section */}
      <section className="bg-gradient-to-br from-brand-600 to-brand-800 text-white py-16">
        <Container>
          <div className="text-center max-w-3xl mx-auto">
            <h1 className="text-4xl lg:text-5xl font-bold tracking-tight mb-4">
              Organisasi Mahasiswa
            </h1>
            <p className="text-lg text-brand-100">
              Jelajahi organisasi mahasiswa Universitas Raharja beserta kegiatan dan galeri mereka.
            </p>
          </div>
        </Container>
      </section>

      {/* Main Content */}
      <main className="py-8">
        <Container>
          <Tabs defaultValue="organizations" className="w-full space-y-6">
            <TabsList>
              <TabsTrigger value="organizations" className="gap-2">
                <Building2 className="h-4 w-4" />
                Organisasi
              </TabsTrigger>
              <TabsTrigger value="calendar" className="gap-2">
                <Calendar className="h-4 w-4" />
                Kalender Kegiatan
              </TabsTrigger>
              <TabsTrigger value="gallery" className="gap-2">
                <ImageIcon className="h-4 w-4" />
                Galeri
              </TabsTrigger>
            </TabsList>

            {/* Organizations Tab */}
            <TabsContent value="organizations" className="space-y-6">
              {orgsLoading && (
                <div className="flex items-center justify-center py-12">
                  <Spinner size="lg" />
                </div>
              )}

              <div className="grid gap-6 sm:grid-cols-2 lg:grid-cols-3">
                {organizations?.map((org) => (
                  <Card
                    key={org.id}
                    className="overflow-hidden hover:shadow-lg transition-shadow cursor-pointer group"
                    onClick={() => setSelectedOrg(org)}
                  >
                    <div className="relative aspect-video bg-neutral-100">
                      {isValidImageUrl(org.hero_image) ? (
                        <Image
                          src={org.hero_image!}
                          alt={org.name}
                          fill
                          className="object-cover group-hover:scale-105 transition-transform"
                        />
                      ) : isValidImageUrl(org.logo_url) ? (
                        <div className="w-full h-full flex items-center justify-center bg-gradient-to-br from-brand-50 to-brand-100">
                          <Image
                            src={org.logo_url!}
                            alt={org.name}
                            width={80}
                            height={80}
                            className="object-contain"
                          />
                        </div>
                      ) : (
                        <div className="w-full h-full flex items-center justify-center bg-gradient-to-br from-neutral-100 to-neutral-200">
                          <Building2 className="h-12 w-12 text-neutral-400" />
                        </div>
                      )}
                    </div>
                    <CardHeader>
                      <div className="flex items-start justify-between">
                        <div>
                          <CardTitle className="line-clamp-1">{org.name}</CardTitle>
                          {org.type && (
                            <span className="inline-block mt-1 px-2 py-0.5 text-xs font-medium bg-brand-50 text-brand-700 rounded-full">
                              {org.type}
                            </span>
                          )}
                        </div>
                      </div>
                      <CardDescription className="line-clamp-2 mt-2">
                        {org.description || 'Organisasi mahasiswa Universitas Raharja'}
                      </CardDescription>
                    </CardHeader>
                    {org.slug && (
                      <CardContent className="pt-0">
                        <Link
                          href={`/org/${org.slug}`}
                          className="text-sm text-brand-600 hover:underline inline-flex items-center gap-1"
                          onClick={(e) => e.stopPropagation()}
                        >
                          Lihat Profil <ExternalLink className="h-3 w-3" />
                        </Link>
                      </CardContent>
                    )}
                  </Card>
                ))}
              </div>

              {!orgsLoading && (!organizations || organizations.length === 0) && (
                <div className="rounded-xl border border-dashed border-neutral-200 bg-neutral-50/50 p-12 text-center text-neutral-500">
                  Belum ada organisasi yang terdaftar.
                </div>
              )}
            </TabsContent>

            {/* Calendar Tab */}
            <TabsContent value="calendar" className="space-y-6">
              {activitiesLoading && (
                <div className="flex items-center justify-center py-12">
                  <Spinner size="lg" />
                </div>
              )}

              {/* Organization Filter */}
              <div className="flex flex-wrap gap-2">
                <button
                  onClick={() => setSelectedOrg(null)}
                  className={`px-3 py-1.5 text-sm rounded-full border transition-colors ${!selectedOrg
                      ? 'bg-brand-600 text-white border-brand-600'
                      : 'bg-white text-neutral-700 border-neutral-200 hover:border-brand-300'
                    }`}
                >
                  Semua
                </button>
                {organizations?.map((org) => (
                  <button
                    key={org.id}
                    onClick={() => setSelectedOrg(org)}
                    className={`px-3 py-1.5 text-sm rounded-full border transition-colors ${selectedOrg?.id === org.id
                        ? 'bg-brand-600 text-white border-brand-600'
                        : 'bg-white text-neutral-700 border-neutral-200 hover:border-brand-300'
                      }`}
                  >
                    {org.name}
                  </button>
                ))}
              </div>

              {/* Activities List */}
              <div className="space-y-4">
                {orgActivities.map((activity) => {
                  const org = organizations?.find((o) => o.id === activity.org_id)
                  return (
                    <Card key={activity.id} className="hover:shadow-md transition-shadow">
                      <CardHeader>
                        <div className="flex items-start gap-4">
                          <div className="flex-shrink-0 w-16 h-16 bg-brand-50 rounded-lg flex flex-col items-center justify-center text-brand-700">
                            {activity.start_at && (
                              <>
                                <span className="text-xs font-medium">
                                  {new Date(activity.start_at).toLocaleDateString(
                                    'id-ID',
                                    { month: 'short' },
                                  )}
                                </span>
                                <span className="text-xl font-bold">
                                  {new Date(activity.start_at).getDate()}
                                </span>
                              </>
                            )}
                          </div>
                          <div className="flex-1 min-w-0">
                            <CardTitle className="text-lg">{activity.title}</CardTitle>
                            {org && (
                              <span className="text-sm text-brand-600 font-medium">
                                {org.name}
                              </span>
                            )}
                            <CardDescription className="line-clamp-2 mt-1">
                              {activity.description}
                            </CardDescription>
                            {activity.location && (
                              <p className="text-sm text-neutral-500 mt-2">
                                📍 {activity.location}
                              </p>
                            )}
                          </div>
                        </div>
                      </CardHeader>
                    </Card>
                  )
                })}
              </div>

              {!activitiesLoading && orgActivities.length === 0 && (
                <div className="rounded-xl border border-dashed border-neutral-200 bg-neutral-50/50 p-12 text-center text-neutral-500">
                  Belum ada kegiatan yang dijadwalkan.
                </div>
              )}
            </TabsContent>

            {/* Gallery Tab */}
            <TabsContent value="gallery" className="space-y-6">
              {/* Organization Filter */}
              <div className="flex flex-wrap gap-2">
                <button
                  onClick={() => setSelectedOrg(null)}
                  className={`px-3 py-1.5 text-sm rounded-full border transition-colors ${!selectedOrg
                      ? 'bg-brand-600 text-white border-brand-600'
                      : 'bg-white text-neutral-700 border-neutral-200 hover:border-brand-300'
                    }`}
                >
                  Semua
                </button>
                {organizations?.map((org) => (
                  <button
                    key={org.id}
                    onClick={() => setSelectedOrg(org)}
                    className={`px-3 py-1.5 text-sm rounded-full border transition-colors ${selectedOrg?.id === org.id
                        ? 'bg-brand-600 text-white border-brand-600'
                        : 'bg-white text-neutral-700 border-neutral-200 hover:border-brand-300'
                      }`}
                  >
                    {org.name}
                  </button>
                ))}
              </div>

              {/* Gallery Grid */}
              <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4">
                {(selectedOrg ? [selectedOrg] : organizations)?.map((org) =>
                  org.gallery_urls?.map((url, idx) => (
                    <div
                      key={`${org.id}-${idx}`}
                      className="relative aspect-square rounded-xl overflow-hidden group"
                    >
                      {isValidImageUrl(url) && (
                        <Image
                          src={url}
                          alt={`${org.name} gallery ${idx + 1}`}
                          fill
                          className="object-cover group-hover:scale-105 transition-transform"
                        />
                      )}
                      <div className="absolute inset-0 bg-gradient-to-t from-black/60 to-transparent opacity-0 group-hover:opacity-100 transition-opacity flex items-end p-4">
                        <span className="text-white text-sm font-medium">{org.name}</span>
                      </div>
                    </div>
                  )),
                )}
              </div>

              {!orgsLoading &&
                !(selectedOrg ? [selectedOrg] : organizations)?.some(
                  (org) => org.gallery_urls && org.gallery_urls.length > 0,
                ) && (
                  <div className="rounded-xl border border-dashed border-neutral-200 bg-neutral-50/50 p-12 text-center text-neutral-500">
                    Belum ada foto galeri yang diunggah.
                  </div>
                )}
            </TabsContent>
          </Tabs>
        </Container>
      </main>

      {/* Footer */}
      <footer className="py-8 bg-white border-t border-neutral-200 mt-8">
        <Container>
          <div className="flex flex-col md:flex-row justify-between items-center gap-4">
            <div className="flex items-center gap-2">
              <div className="h-8 w-8 bg-neutral-900 rounded-lg flex items-center justify-center text-white text-sm font-bold">
                S
              </div>
              <span className="font-bold text-neutral-900">SIMAWA</span>
            </div>
            <p className="text-sm text-neutral-500">
              © {new Date().getFullYear()} Universitas Raharja. All rights reserved.
            </p>
          </div>
        </Container>
      </footer>
    </div>
  )
}
