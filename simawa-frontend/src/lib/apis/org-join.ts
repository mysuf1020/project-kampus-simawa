import { api, type ApiResponse } from '../http-client'

export type OrgJoinRequest = {
  id: string
  org_id: string
  user_id?: string
  applicant_name: string
  applicant_email: string
  applicant_nim: string
  applicant_phone: string
  applicant_jurusan?: string
  message: string
  status: 'PENDING' | 'APPROVED' | 'REJECTED'
  decision_note?: string
  reviewed_at?: string
  reviewed_by?: string
  created_at?: string
  updated_at?: string
}

export type PublicJoinRequestPayload = {
  name: string
  email: string
  nim: string
  phone?: string
  jurusan?: string
  message?: string
}

export const submitPublicJoinRequest = async (
  orgId: string,
  payload: PublicJoinRequestPayload,
) => {
  const { data } = await api.post<ApiResponse<OrgJoinRequest>>(
    `/public/orgs/${orgId}/join-requests`,
    payload,
  )
  if (!data?.success || !data.data) {
    throw new Error(data?.message || 'Gagal mengirim permintaan bergabung')
  }
  return data.data
}

export const listJoinRequests = async (orgId: string, status: string = 'PENDING') => {
  const { data } = await api.get<{ items: OrgJoinRequest[] }>(
    `/v1/orgs/${orgId}/join-requests`,
    { params: { status } },
  )
  return data.items || []
}

export const decideJoinRequest = async (
  orgId: string,
  requestId: string,
  approve: boolean,
  decision_note: string = '',
  role: string = 'MEMBER',
) => {
  const { data } = await api.patch<ApiResponse<OrgJoinRequest>>(
    `/v1/orgs/${orgId}/join-requests/${requestId}`,
    { approve, decision_note, role },
  )
  if (!data?.success || !data.data) {
    throw new Error(data?.message || 'Gagal memproses permintaan')
  }
  return data.data
}
