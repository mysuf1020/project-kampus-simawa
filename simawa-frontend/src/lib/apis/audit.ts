import { api } from '../http-client'

export type AuditLog = {
  id: string
  user_id: string
  action: string
  entity_type: string
  entity_id: string
  ip_address: string
  user_agent: string
  description: string
  metadata: Record<string, unknown>
  created_at: string
  // User info from backend join
  username?: string
  email?: string
}

export type AuditLogListParams = {
  page?: number
  size?: number
  action?: string
  entity_type?: string
}

type AuditLogListResponse = {
  items: AuditLog[]
  total: number
  page: number
  size: number
}

export const listAuditLogs = async (params?: AuditLogListParams) => {
  const { data } = await api.get<AuditLogListResponse>('/v1/audit', {
    params,
  })
  return data
}
