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

type _SuratTemplateListResponse = {
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

export type ReviseSuratPayload = {
  note: string
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

export const reviseSurat = async (id: number | string, payload: ReviseSuratPayload) => {
  const { data } = await api.post<ApiResponse<Surat>>(`/v1/surat/${id}/revise`, payload)
  return data.data
}

export const listArchiveSurat = async (params?: SuratListParams) => {
  const { data } = await api.get<OutboxInboxResponse>('/v1/surat/archive', {
    params: {
      page: params?.page,
      size: params?.size,
    },
  })
  return data.data.items
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
