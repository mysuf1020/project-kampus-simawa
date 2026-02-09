'use client'

import { useEffect, useMemo, useState } from 'react'
import { useQueryClient } from '@tanstack/react-query'
import { toast } from 'sonner'
import Image from 'next/image'
import {
  ChevronUp,
  Globe,
  Instagram,
  Linkedin,
  Mail,
  MapPin,
  Phone,
  Settings2,
  Twitter,
  Upload,
  ImageIcon,
  X,
  Trash2,
} from 'lucide-react'

import {
  Badge,
  Button,
  Card,
  Collapsible,
  CollapsibleContent,
  CollapsibleTrigger,
  Input,
  Label,
  Tabs,
  TabsContent,
  TabsList,
  TabsTrigger,
  TextArea,
} from '@/components/ui'
import { cn } from '@/lib/utils'
import { Organization, uploadOrganizationImage, deleteOrgHero } from '@/lib/apis/org'

type OrgCardProps = {
  org: Organization
  canManage: boolean
  isPending: boolean
  onSubmit: (id: string, payload: Partial<Organization>) => Promise<void>
  onDelete?: (id: string) => Promise<void>
  isAdmin?: boolean
}

export function OrgCard({ org, canManage, isPending, onSubmit, onDelete, isAdmin }: OrgCardProps) {
  const queryClient = useQueryClient()
  const [editorOpen, setEditorOpen] = useState(false)
  const [logoUploading, setLogoUploading] = useState(false)
  const [heroUploading, setHeroUploading] = useState(false)

  const [formData, setFormData] = useState({
    name: org.name || '',
    slug: org.slug || '',
    description: org.description || '',
    website_url: org.website_url || '',
    instagram_url: org.instagram_url || '',
    twitter_url: org.twitter_url || '',
    linkedin_url: org.linkedin_url || '',
    contact_email: org.contact_email || '',
    contact_phone: org.contact_phone || '',
    gallery_urls: org.gallery_urls || ([] as string[]),
  })

  useEffect(() => {
    setFormData({
      name: org.name || '',
      slug: org.slug || '',
      description: org.description || '',
      website_url: org.website_url || '',
      instagram_url: org.instagram_url || '',
      twitter_url: org.twitter_url || '',
      linkedin_url: org.linkedin_url || '',
      contact_email: org.contact_email || '',
      contact_phone: org.contact_phone || '',
      gallery_urls: org.gallery_urls || [],
    })
  }, [org])

  const pageAddress = useMemo(() => {
    if (!org.slug) return 'Belum diatur'
    return `/org/${org.slug}`
  }, [org.slug])

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()
    await onSubmit(org.id, formData)
  }

  const handleLogoUpload = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0]
    if (!file) return

    // Validate file size (max 5MB)
    if (file.size > 5 * 1024 * 1024) {
      toast.error('Ukuran file maksimal 5MB')
      return
    }

    // Validate file type
    if (!file.type.startsWith('image/')) {
      toast.error('File harus berupa gambar')
      return
    }

    setLogoUploading(true)
    try {
      await uploadOrganizationImage(org.id, 'logo', file)
      await queryClient.invalidateQueries({ queryKey: ['orgs'] })
      toast.success('Logo berhasil diupload')
    } catch (err: unknown) {
      const message = err instanceof Error ? err.message : 'Gagal upload logo'
      toast.error(message)
    } finally {
      setLogoUploading(false)
      // Reset input to allow re-uploading same file
      e.target.value = ''
    }
  }

  const handleHeroUpload = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0]
    if (!file) return

    // Validate file size (max 5MB)
    if (file.size > 5 * 1024 * 1024) {
      toast.error('Ukuran file maksimal 5MB')
      return
    }

    // Validate file type
    if (!file.type.startsWith('image/')) {
      toast.error('File harus berupa gambar')
      return
    }

    setHeroUploading(true)
    try {
      await uploadOrganizationImage(org.id, 'hero', file)
      await queryClient.invalidateQueries({ queryKey: ['orgs'] })
      toast.success('Hero image berhasil diupload')
    } catch (err: unknown) {
      const message = err instanceof Error ? err.message : 'Gagal upload hero image'
      toast.error(message)
    } finally {
      setHeroUploading(false)
      // Reset input to allow re-uploading same file
      e.target.value = ''
    }
  }

  const handleHeroDelete = async () => {
    if (!confirm('Apakah Anda yakin ingin menghapus gambar hero?')) return
    try {
      await deleteOrgHero(org.id)
      await queryClient.invalidateQueries({ queryKey: ['orgs'] })
      toast.success('Hero image berhasil dihapus')
    } catch (err: unknown) {
      const message = err instanceof Error ? err.message : 'Gagal menghapus hero image'
      toast.error(message)
    }
  }

  const handleGalleryUpload = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const files = e.target.files
    if (!files || files.length === 0) return

    const newUrls: string[] = []

    for (let i = 0; i < files.length; i++) {
      const file = files[i]
      if (file.size > 5 * 1024 * 1024) {
        toast.error(`File ${file.name} terlalu besar (max 5MB)`)
        continue
      }
      if (!file.type.startsWith('image/')) {
        toast.error(`File ${file.name} bukan gambar`)
        continue
      }

      try {
        const res = await uploadOrganizationImage(org.id, 'gallery', file)
        newUrls.push(res.url)
      } catch (err) {
        console.error(err)
        toast.error(`Gagal upload ${file.name}`)
      }
    }

    if (newUrls.length > 0) {
      setFormData((prev) => ({
        ...prev,
        gallery_urls: [...prev.gallery_urls, ...newUrls],
      }))
      toast.success(
        `${newUrls.length} gambar ditambahkan ke galeri (Simpan untuk menerapkan)`,
      )
    }

    e.target.value = ''
  }

  const removeGalleryImage = (index: number) => {
    setFormData((prev) => ({
      ...prev,
      gallery_urls: prev.gallery_urls.filter((_, i) => i !== index),
    }))
  }

  return (
    <Card className="group border-neutral-200 bg-white shadow-sm hover:border-brand-200 transition-colors">
      <Collapsible open={editorOpen} onOpenChange={setEditorOpen}>
        <div className="flex flex-col sm:flex-row sm:items-start sm:justify-between p-6 gap-4">
          <div className="flex-1 space-y-1">
            <div className="flex items-center gap-2">
              <h3 className="text-base font-semibold text-neutral-900">{org.name}</h3>
              <Badge
                variant="secondary"
                className="bg-neutral-100 text-neutral-600 border-neutral-200 font-normal text-[10px]"
              >
                {org.type || 'ORG'}
              </Badge>
            </div>
            <p className="text-sm text-neutral-500 line-clamp-2">
              {org.description || 'Tidak ada deskripsi'}
            </p>
            <div className="flex items-center gap-2 text-xs text-neutral-400 pt-2">
              <MapPin className="h-3.5 w-3.5" />
              <span>{pageAddress}</span>
            </div>
          </div>
          <div className="flex items-center gap-2 shrink-0">
            {canManage ? (
              <>
                <CollapsibleTrigger asChild>
                  <Button
                    variant="outline"
                    size="sm"
                    className={
                      editorOpen ? 'bg-brand-50 border-brand-200 text-brand-700' : ''
                    }
                  >
                    {editorOpen ? (
                      <>
                        Tutup <ChevronUp className="ml-2 h-3.5 w-3.5" />
                      </>
                    ) : (
                      <>
                        <Settings2 className="mr-2 h-3.5 w-3.5" />
                        Kelola
                      </>
                    )}
                  </Button>
                </CollapsibleTrigger>
                {isAdmin && onDelete && (
                  <Button
                    variant="outline"
                    size="sm"
                    className="text-red-600 border-red-200 hover:bg-red-50 hover:border-red-300"
                    onClick={() => {
                      if (confirm(`Apakah Anda yakin ingin menghapus organisasi "${org.name}"? Tindakan ini tidak dapat dibatalkan.`)) {
                        onDelete(org.id)
                      }
                    }}
                  >
                    <Trash2 className="h-3.5 w-3.5" />
                  </Button>
                )}
              </>
            ) : (
              <Badge variant="outline" className="bg-neutral-50 text-neutral-500">
                View Only
              </Badge>
            )}
          </div>
        </div>
        {canManage && (
          <CollapsibleContent>
            <div className="border-t border-neutral-100 bg-neutral-50/30 p-6">
              <form className="space-y-6" onSubmit={handleSubmit}>
                <Tabs defaultValue="basic" className="w-full">
                  <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4 mb-6">
                    <TabsList className="bg-white border border-neutral-200 p-1 rounded-lg">
                      <TabsTrigger
                        value="basic"
                        className="rounded-md text-xs data-[state=active]:bg-neutral-100 data-[state=active]:text-neutral-900"
                      >
                        Info Dasar
                      </TabsTrigger>
                      <TabsTrigger
                        value="branding"
                        className="rounded-md text-xs data-[state=active]:bg-neutral-100 data-[state=active]:text-neutral-900"
                      >
                        Tampilan
                      </TabsTrigger>
                      <TabsTrigger
                        value="gallery"
                        className="rounded-md text-xs data-[state=active]:bg-neutral-100 data-[state=active]:text-neutral-900"
                      >
                        Galeri
                      </TabsTrigger>
                      <TabsTrigger
                        value="contact"
                        className="rounded-md text-xs data-[state=active]:bg-neutral-100 data-[state=active]:text-neutral-900"
                      >
                        Kontak
                      </TabsTrigger>
                    </TabsList>
                    <Button
                      type="submit"
                      disabled={isPending}
                      size="sm"
                      className="bg-brand-600 hover:bg-brand-700 text-white shadow-sm"
                    >
                      {isPending ? 'Menyimpan...' : 'Simpan Perubahan'}
                    </Button>
                  </div>

                  <TabsContent
                    value="basic"
                    className="space-y-4 animate-in fade-in-50 duration-300"
                  >
                    <div className="grid gap-4 sm:grid-cols-2">
                      <div className="space-y-2">
                        <Label className="text-xs font-medium text-neutral-600">
                          Nama Organisasi
                        </Label>
                        <Input
                          value={formData.name}
                          onChange={(e) =>
                            setFormData({ ...formData, name: e.target.value })
                          }
                          placeholder="Nama organisasi"
                          className="h-9"
                        />
                      </div>
                      <div className="space-y-2">
                        <Label className="text-xs font-medium text-neutral-600">
                          Slug URL
                        </Label>
                        <Input
                          value={formData.slug}
                          onChange={(e) =>
                            setFormData({ ...formData, slug: e.target.value })
                          }
                          placeholder="nama-organisasi"
                          className="h-9"
                        />
                      </div>
                    </div>
                    <div className="space-y-2">
                      <Label className="text-xs font-medium text-neutral-600">
                        Deskripsi
                      </Label>
                      <TextArea
                        value={formData.description}
                        onChange={(e: React.ChangeEvent<HTMLTextAreaElement>) =>
                          setFormData({ ...formData, description: e.target.value })
                        }
                        placeholder="Deskripsi singkat organisasi"
                        rows={3}
                        className="resize-none"
                      />
                    </div>
                  </TabsContent>

                  <TabsContent
                    value="branding"
                    className="space-y-6 animate-in fade-in-50 duration-300"
                  >
                    <div className="grid gap-6 sm:grid-cols-2">
                      <div className="space-y-2">
                        <Label className="text-xs font-medium text-neutral-600">
                          Logo Organisasi
                        </Label>
                        <p className="text-[10px] text-neutral-500 mb-2">
                          Ditampilkan di kartu dan sidebar.
                        </p>
                        <div className="relative group/upload">
                          <input
                            type="file"
                            accept=".png,.jpg,.jpeg,.webp"
                            onChange={handleLogoUpload}
                            className="hidden"
                            id={`logo-upload-${org.id}`}
                            disabled={logoUploading}
                          />
                          <label
                            htmlFor={`logo-upload-${org.id}`}
                            className={cn(
                              'flex flex-col items-center justify-center w-full h-24 border-2 border-dashed rounded-lg cursor-pointer transition-all',
                              org.logo_url
                                ? 'border-brand-200 bg-brand-50/30'
                                : 'border-neutral-200 bg-neutral-50 hover:bg-neutral-100 hover:border-neutral-300',
                            )}
                          >
                            {org.logo_url ? (
                              <div className="relative w-full h-full p-3">
                                <Image
                                  src={org.logo_url}
                                  alt="Logo"
                                  fill
                                  className="object-contain"
                                />
                                <div className="absolute inset-0 bg-black/40 opacity-0 group-hover/upload:opacity-100 transition-opacity rounded-lg flex items-center justify-center">
                                  <p className="text-white text-xs font-medium">
                                    Ganti Logo
                                  </p>
                                </div>
                              </div>
                            ) : (
                              <div className="flex flex-col items-center text-center p-3">
                                <Upload className="h-5 w-5 text-neutral-400 mb-1" />
                                <span className="text-xs text-neutral-500 font-medium">
                                  {logoUploading ? 'Mengupload...' : 'Upload Logo'}
                                </span>
                                <span className="text-[10px] text-neutral-400">
                                  Max 2MB
                                </span>
                              </div>
                            )}
                          </label>
                        </div>
                      </div>
                      <div className="space-y-2">
                        <Label className="text-xs font-medium text-neutral-600">
                          Hero Image
                        </Label>
                        <p className="text-[10px] text-neutral-500 mb-2">
                          Digunakan sebagai banner di halaman profil publik.
                        </p>
                        <div className="relative group/upload">
                          <input
                            type="file"
                            accept=".png,.jpg,.jpeg,.webp"
                            onChange={handleHeroUpload}
                            className="hidden"
                            id={`hero-upload-${org.id}`}
                            disabled={heroUploading}
                          />
                          <label
                            htmlFor={`hero-upload-${org.id}`}
                            className={cn(
                              'flex flex-col items-center justify-center w-full h-24 border-2 border-dashed rounded-lg cursor-pointer transition-all',
                              org.hero_image
                                ? 'border-brand-200 bg-brand-50/30'
                                : 'border-neutral-200 bg-neutral-50 hover:bg-neutral-100 hover:border-neutral-300',
                            )}
                          >
                            {org.hero_image ? (
                              <div className="relative w-full h-full p-2">
                                <Image
                                  src={org.hero_image}
                                  alt="Hero"
                                  fill
                                  className="object-cover rounded-md"
                                />
                                <div className="absolute inset-0 bg-black/40 opacity-0 group-hover/upload:opacity-100 transition-opacity rounded-md flex items-center justify-center">
                                  <p className="text-white text-xs font-medium">
                                    Ganti Hero
                                  </p>
                                </div>
                              </div>
                            ) : (
                              <div className="flex flex-col items-center text-center p-3">
                                <ImageIcon className="h-5 w-5 text-neutral-400 mb-1" />
                                <span className="text-xs text-neutral-500 font-medium">
                                  {heroUploading ? 'Mengupload...' : 'Upload Hero'}
                                </span>
                                <span className="text-[10px] text-neutral-400">
                                  Max 2MB
                                </span>
                              </div>
                            )}
                          </label>
                        </div>
                      </div>
                    </div>
                  </TabsContent>

                  <TabsContent
                    value="gallery"
                    className="space-y-4 animate-in fade-in-50 duration-300"
                  >
                    <div className="space-y-2">
                      <Label className="text-xs font-medium text-neutral-600">
                        Galeri Kegiatan
                      </Label>
                      <p className="text-[10px] text-neutral-500 mb-4">
                        Upload foto kegiatan organisasi untuk ditampilkan di profil
                        publik.
                      </p>

                      <div className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-4 gap-4">
                        {formData.gallery_urls.map((url, idx) => (
                          <div
                            key={idx}
                            className="relative aspect-square rounded-lg border border-neutral-200 overflow-hidden group"
                          >
                            <Image
                              src={url}
                              alt={`Gallery ${idx}`}
                              fill
                              className="object-cover"
                            />
                            <div className="absolute inset-0 bg-black/0 group-hover:bg-black/40 transition-colors flex items-center justify-center opacity-0 group-hover:opacity-100">
                              <Button
                                type="button"
                                variant="destructive"
                                size="icon"
                                className="h-8 w-8 rounded-full"
                                onClick={() => removeGalleryImage(idx)}
                              >
                                <X className="h-4 w-4" />
                              </Button>
                            </div>
                          </div>
                        ))}

                        <div className="relative aspect-square">
                          <input
                            type="file"
                            accept=".png,.jpg,.jpeg,.webp"
                            multiple
                            onChange={handleGalleryUpload}
                            className="hidden"
                            id={`gallery-upload-${org.id}`}
                          />
                          <label
                            htmlFor={`gallery-upload-${org.id}`}
                            className="flex flex-col items-center justify-center w-full h-full border-2 border-dashed border-neutral-200 rounded-lg cursor-pointer hover:bg-neutral-50 hover:border-brand-300 transition-all bg-neutral-50/50 text-neutral-400 hover:text-brand-600"
                          >
                            <Upload className="h-6 w-6 mb-2" />
                            <span className="text-xs font-medium">Upload</span>
                          </label>
                        </div>
                      </div>
                    </div>
                  </TabsContent>

                  <TabsContent
                    value="contact"
                    className="space-y-4 animate-in fade-in-50 duration-300"
                  >
                    <div className="grid gap-4 sm:grid-cols-2">
                      <div className="space-y-2">
                        <Label className="text-xs font-medium text-neutral-600 flex items-center gap-1.5">
                          <Mail className="h-3 w-3" /> Email
                        </Label>
                        <Input
                          type="email"
                          value={formData.contact_email}
                          onChange={(e) =>
                            setFormData({ ...formData, contact_email: e.target.value })
                          }
                          placeholder="email@organisasi.com"
                          className="h-9"
                        />
                      </div>
                      <div className="space-y-2">
                        <Label className="text-xs font-medium text-neutral-600 flex items-center gap-1.5">
                          <Phone className="h-3 w-3" /> Telepon
                        </Label>
                        <Input
                          type="tel"
                          value={formData.contact_phone}
                          onChange={(e) =>
                            setFormData({ ...formData, contact_phone: e.target.value })
                          }
                          placeholder="+62..."
                          className="h-9"
                        />
                      </div>
                    </div>
                    <div className="grid gap-4 sm:grid-cols-2">
                      <div className="space-y-2">
                        <Label className="text-xs font-medium text-neutral-600 flex items-center gap-1.5">
                          <Globe className="h-3 w-3" /> Website
                        </Label>
                        <Input
                          type="url"
                          value={formData.website_url}
                          onChange={(e) =>
                            setFormData({ ...formData, website_url: e.target.value })
                          }
                          placeholder="https://..."
                          className="h-9"
                        />
                      </div>
                      <div className="space-y-2">
                        <Label className="text-xs font-medium text-neutral-600 flex items-center gap-1.5">
                          <Instagram className="h-3 w-3" /> Instagram
                        </Label>
                        <Input
                          value={formData.instagram_url}
                          onChange={(e) =>
                            setFormData({ ...formData, instagram_url: e.target.value })
                          }
                          placeholder="@username"
                          className="h-9"
                        />
                      </div>
                    </div>
                    <div className="grid gap-4 sm:grid-cols-2">
                      <div className="space-y-2">
                        <Label className="text-xs font-medium text-neutral-600 flex items-center gap-1.5">
                          <Twitter className="h-3 w-3" /> Twitter
                        </Label>
                        <Input
                          value={formData.twitter_url}
                          onChange={(e) =>
                            setFormData({ ...formData, twitter_url: e.target.value })
                          }
                          placeholder="@username"
                          className="h-9"
                        />
                      </div>
                      <div className="space-y-2">
                        <Label className="text-xs font-medium text-neutral-600 flex items-center gap-1.5">
                          <Linkedin className="h-3 w-3" /> LinkedIn
                        </Label>
                        <Input
                          value={formData.linkedin_url}
                          onChange={(e) =>
                            setFormData({ ...formData, linkedin_url: e.target.value })
                          }
                          placeholder="linkedin.com/company/..."
                          className="h-9"
                        />
                      </div>
                    </div>
                  </TabsContent>
                </Tabs>
              </form>
            </div>
          </CollapsibleContent>
        )}
      </Collapsible>
    </Card>
  )
}
