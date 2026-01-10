import { api, type ApiResponse } from '../http-client'

export type LPJ = {
  id: string
  activity_id?: string | null
  org_id: string
  summary: string
  budget_plan?: number
  budget_real?: number
  report_key: string
  file_size?: number
  photos: unknown
  status: string
  note?: string
  submitted_by: string
  revision_no?: number
  reviewed_by?: string | null
  reviewed_at?: string | null
  created_at?: string
  updated_at?: string
}

export type SubmitLPJPayload = {
  activity_id?: string
  org_id: string
  summary?: string
  budget_plan?: number
  budget_real?: number
  report_key: string
  file_size?: number
  photos?: string[]
}

type LPJListResponse = {
  items: LPJ[]
}

export const uploadLPJReport = async (file: File) => {
  const form = new FormData()
  form.append('file', file)
  const { data } = await api.post<{ file_key: string; size: number }>(
    '/v1/lpj/upload',
    form,
    {
      headers: { 'Content-Type': 'multipart/form-data' },
    },
  )
  return { fileKey: data.file_key, size: data.size }
}

export const submitLPJ = async (payload: SubmitLPJPayload) => {
  const { data } = await api.post<ApiResponse<LPJ>>('/v1/lpj/submit', payload)
  return data.data
}

export const approveLPJ = async (lpjId: string, approve: boolean, note?: string) => {
  const { data } = await api.post<ApiResponse<LPJ>>(`/v1/lpj/${lpjId}/approve`, {
    approve,
    note,
  })
  return data.data
}

export const addLPJRevision = async (lpjId: string, note: string) => {
  const { data } = await api.post<ApiResponse<LPJ>>(`/v1/lpj/${lpjId}/revision`, {
    note,
  })
  return data.data
}

export const listLPJByOrg = async (
  orgId: string,
  status?: string,
  page = 1,
  size = 10,
) => {
  const { data } = await api.get<LPJListResponse>(`/v1/lpj/org/${orgId}`, {
    params: { status, page, size },
  })
  return data.items
}

type LPJDetailResponse = {
  lpj: LPJ
  history: {
    id: string
    action: string
    note: string
    created_at: string
    user_id: string
  }[]
  report_url?: string
}

export const getLPJDetail = async (activityId: string) => {
  const { data } = await api.get<LPJDetailResponse>(`/v1/lpj/${activityId}`)
  return data
}

export const getLPJDownloadURL = async (activityId: string) => {
  const { data } = await api.get<{ url: string; file_key: string }>(
    `/v1/lpj/${activityId}/download`,
  )
  return data.url
}
