import { api, type ApiResponse } from '../http-client'

export type Surat = {
  id: number
  org_id: string
  target_org_id?: string | null
  variant?: string
  status: string
  number?: string
  subject: string
  to_role?: string
  to_name?: string
  to_place?: string
  to_city?: string
  file_key?: string
  file_url?: string
  approval_note?: string
  created_by?: string | null
  submitted_by?: string | null
  approved_by?: string | null
  meta_json?: Record<string, unknown>
  created_at?: string
  updated_at?: string
  url?: string
}

export type SuratTemplate = {
  id: number
  name: string
  variant?: string
  description?: string
  payload_json?: Record<string, unknown>
  theme_json?: Record<string, unknown>
  created_by?: string
  created_at?: string
  updated_at?: string
}

type ListSuratResponse = {
  data: {
    items: Surat[]
    total: number
  }
}

type OutboxInboxResponse = {
  data: {
    items: Surat[]
    total: number
  }
}

type DownloadSuratResponse = {
  url: string
  file_key: string
}

type SuratTemplateListResponse = {
  items: SuratTemplate[]
}

export type SuratListParams = {
  status?: string
  page?: string | number
  size?: string | number
}

export type CreateSuratPayload = {
  org_id: string
  target_org_id?: string
  status?: string
  payload: Record<string, unknown>
  theme?: Record<string, unknown>
}

export type ApproveSuratPayload = {
  approve: boolean
  note?: string
}

export const createSurat = async (payload: CreateSuratPayload) => {
  const { data } = await api.post<ApiResponse<Surat>>('/v1/surat', payload)
  return data.data
}

export const previewSurat = async (payload: CreateSuratPayload) => {
  const res = await api.post('/v1/surat/preview', payload, {
    responseType: 'blob',
  })
  return res.data as Blob
}

export const submitSurat = async (id: number | string) => {
  const { data } = await api.post<ApiResponse<Surat>>(`/v1/surat/${id}/submit`)
  return data.data
}

export const approveSurat = async (id: number | string, payload: ApproveSuratPayload) => {
  const { data } = await api.post<ApiResponse<Surat>>(`/v1/surat/${id}/approve`, payload)
  return data.data
}

export const listOutboxSurat = async (orgId: string, params?: SuratListParams) => {
  const { data } = await api.get<OutboxInboxResponse>(`/v1/surat/outbox/${orgId}`, {
    params: {
      status: params?.status,
      page: params?.page,
      size: params?.size,
    },
  })
  return data.data.items
}

export const listInboxSurat = async (params?: SuratListParams) => {
  const { data } = await api.get<OutboxInboxResponse>('/v1/surat/inbox', {
    params: {
      status: params?.status,
      page: params?.page,
      size: params?.size,
    },
  })
  return data.data.items
}

export const listSurat = async () => {
  const { data } = await api.get<ListSuratResponse>('/v1/surat')
  return data.data.items
}

export const getSurat = async (id: number | string) => {
  const { data } = await api.get<ApiResponse<Surat>>(`/v1/surat/${id}`)
  return data.data
}

export const downloadSurat = async (id: number | string) => {
  const { data } = await api.get<DownloadSuratResponse>(`/v1/surat/${id}/download`)
  return data
}

export type CreateTemplatePayload = {
  name: string
  variant?: string
  description?: string
  payload_json?: Record<string, unknown>
  theme_json?: Record<string, unknown>
}

export const createTemplate = async (payload: CreateTemplatePayload) => {
  const { data } = await api.post<ApiResponse<SuratTemplate>>(
    '/v1/surat/templates',
    payload,
  )
  return data.data
}

export const listTemplates = async () => {
  const { data } = await api.get<SuratTemplateListResponse>('/v1/surat/templates')
  return data.items
}

export const getTemplate = async (id: number | string) => {
  const { data } = await api.get<ApiResponse<SuratTemplate>>(`/v1/surat/templates/${id}`)
  return data.data
}

export const updateTemplate = async (
  id: number | string,
  payload: Record<string, unknown>,
) => {
  const { data } = await api.put<ApiResponse<SuratTemplate>>(
    `/v1/surat/templates/${id}`,
    payload,
  )
  return data.data
}

export const deleteTemplate = async (id: number | string) => {
  const { data } = await api.delete<{ deleted: boolean }>(`/v1/surat/templates/${id}`)
  return data.deleted
}

export const renderFromTemplate = async (payload: Record<string, unknown>) => {
  const { data } = await api.post('/v1/surat/pdf-from-template', payload)
  return data
}
