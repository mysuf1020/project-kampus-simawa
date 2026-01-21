import { api, type ApiResponse } from '../http-client'

export type Activity = {
  id: string
  org_id: string
  title: string
  description?: string
  location?: string
  type?: string
  public?: boolean
  status?: string
  approval_note?: string
  cover_approved?: boolean
  start_at?: string
  end_at?: string
  cover_key?: string
  metadata?: Record<string, unknown>
  created_by?: string
  updated_by?: string
  created_at?: string
  updated_at?: string
}

export type CreateActivityPayload = {
  org_id: string
  title: string
  description?: string
  location?: string
  type?: string
  public?: boolean
  start_at?: string
  end_at?: string
  metadata?: Record<string, unknown>
}

type PublicActivitiesResponse = {
  calendar: Activity[]
  gallery: Activity[]
}

type ListActivitiesResponse = {
  items: Activity[]
  total?: number
}

type ApproveActivityRequest = {
  approve: boolean
  note?: string
}

type CoverApprovalRequest = {
  approve: boolean
  note?: string
}

type UploadProposalResponse = {
  file_key: string
}

export type ListActivitiesParams = {
  page?: string | number
  size?: string | number
  status?: string
  type?: string
  publicOnly?: boolean
  start_from?: string
  start_to?: string
}

const toEpochSeconds = (value?: string): number => {
  if (!value) {
    return Math.floor(Date.now() / 1000)
  }
  const parsed = Date.parse(value)
  if (Number.isNaN(parsed)) {
    return Math.floor(Date.now() / 1000)
  }
  return Math.floor(parsed / 1000)
}

export const fetchPublicActivities = async (params?: Record<string, unknown>) => {
  const { data } = await api.get<PublicActivitiesResponse>('/public/activities', {
    params,
  })
  return data.calendar
}

export const fetchPublicActivityById = async (id: string) => {
  const { data } = await api.get<ApiResponse<Activity>>(`/public/activities/${id}`)
  return data.data
}

export const fetchPublicGallery = async (params?: { page?: number; size?: number }) => {
  const { data } = await api.get<ListActivitiesResponse>('/public/activities/gallery', {
    params,
  })
  return data
}

export const fetchActivityPhotos = async (id: string) => {
  const { data } = await api.get<ApiResponse<{ cover: string; gallery: string[] }>>(
    `/public/activities/${id}/photos`,
  )
  return data.data
}

export const addGalleryPhoto = async (id: string, url: string) => {
  const { data } = await api.post<ApiResponse<Activity>>(`/v1/activities/${id}/gallery`, {
    url,
  })
  return data.data
}

export const removeGalleryPhoto = async (id: string, url: string) => {
  const { data } = await api.delete<ApiResponse<Activity>>(
    `/v1/activities/${id}/gallery`,
    {
      data: { url },
    },
  )
  return data.data
}

export const createActivity = async (payload: CreateActivityPayload) => {
  const body = {
    org_id: payload.org_id,
    title: payload.title,
    description: payload.description,
    location: payload.location,
    type: payload.type,
    public: payload.public ?? true,
    start_at: toEpochSeconds(payload.start_at),
    end_at: toEpochSeconds(payload.end_at),
    metadata: payload.metadata,
  }

  const { data } = await api.post<ApiResponse<Activity>>('/v1/activities', body)
  return data.data
}

export const submitActivity = async (id: string) => {
  const { data } = await api.post<ApiResponse<Activity>>(`/v1/activities/${id}/submit`)
  return data.data
}

export const approveActivity = async (id: string, payload: ApproveActivityRequest) => {
  const { data } = await api.post<ApiResponse<Activity>>(
    `/v1/activities/${id}/approve`,
    payload,
  )
  return data.data
}

export const reviseActivity = async (id: string, note?: string) => {
  const { data } = await api.post<ApiResponse<Activity>>(
    `/v1/activities/${id}/revision`,
    {
      note,
    },
  )
  return data.data
}

export const approveActivityCover = async (id: string, payload: CoverApprovalRequest) => {
  const { data } = await api.post<ApiResponse<Activity>>(
    `/v1/activities/${id}/cover`,
    payload,
  )
  return data.data
}

export const listPendingCovers = async () => {
  const { data } = await api.get<ListActivitiesResponse>('/v1/activities/pending-cover')
  return data.items
}

export const listActivitiesByOrg = async (
  orgId: string,
  params?: ListActivitiesParams,
) => {
  const { data } = await api.get<ListActivitiesResponse>(`/v1/activities/org/${orgId}`, {
    params: {
      status: params?.status || undefined,
      type: params?.type || undefined,
      public: params?.publicOnly ?? undefined,
      page: params?.page,
      size: params?.size,
      start_from: params?.start_from,
      start_to: params?.start_to,
    },
  })
  return data
}

export const uploadActivityProposal = async (file: File) => {
  const form = new FormData()
  form.append('file', file)
  const { data } = await api.post<UploadProposalResponse>('/v1/activities/upload', form, {
    headers: { 'Content-Type': 'multipart/form-data' },
  })
  return data.file_key
}
