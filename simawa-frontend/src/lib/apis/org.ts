import { api, type ApiResponse } from '../http-client'

export type Organization = {
  id: string
  name: string
  slug?: string
  type?: string
  description?: string
  logo_key?: string
  hero_image?: string
  website_url?: string
  instagram_url?: string
  twitter_url?: string
  linkedin_url?: string
  contact_email?: string
  contact_phone?: string
  logo_url?: string
  gallery_urls?: string[]
  links?: Record<string, unknown>
  created_at?: string
  updated_at?: string
  can_manage?: boolean
}

type ListOrganizationsResponse = {
  items: Organization[]
}

export const listOrganizations = async () => {
  const { data } = await api.get<ListOrganizationsResponse>('/v1/orgs')
  return data.items
}

export const getOrganization = async (id: string) => {
  const { data } = await api.get<ApiResponse<Organization>>(`/orgs/${id}`)
  return data.data
}

export const getOrganizationBySlug = async (slug: string) => {
  const { data } = await api.get<ApiResponse<Organization>>(`/orgs/slug/${slug}`)
  return data.data
}

export const updateOrganization = async (id: string, payload: Partial<Organization>) => {
  const { data } = await api.put<ApiResponse<Organization>>(`/v1/orgs/${id}`, payload)
  return data.data
}

export type UploadOrganizationImageKind = 'hero' | 'logo' | 'gallery'

export type UploadOrganizationImageResponse = {
  file_key: string
  url: string
}

export const uploadOrganizationImage = async (
  id: string,
  kind: UploadOrganizationImageKind,
  file: File,
) => {
  const form = new FormData()
  form.append('file', file)

  const { data } = await api.post<UploadOrganizationImageResponse>(
    `/v1/orgs/${id}/upload`,
    form,
    {
      params: { kind },
      headers: { 'Content-Type': 'multipart/form-data' },
    },
  )

  return data
}

export const uploadOrgHero = async (id: string, file: File) => {
  return uploadOrganizationImage(id, 'hero', file)
}

export const deleteOrgHero = async (id: string) => {
  const { data } = await api.delete<ApiResponse<void>>(`/v1/orgs/${id}/hero`)
  return data
}
