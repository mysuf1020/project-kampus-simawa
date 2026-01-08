import { api } from '../http-client'
import type { User } from './user'

export type OrgMember = {
  org_id: string
  user_id: string
  user?: User
  role: string
  created_at?: string
  updated_at?: string
}

type MemberListResponse = {
  items: OrgMember[]
}

type SimpleResponse = {
  added?: boolean
  updated?: boolean
  deleted?: boolean
}

export const listOrgMembers = async (orgId: string) => {
  const { data } = await api.get<MemberListResponse>(`/v1/orgs/${orgId}/members`)
  return data.items
}

export const addOrgMember = async (orgId: string, userId: string, role: string) => {
  const { data } = await api.post<SimpleResponse>(`/v1/orgs/${orgId}/members`, {
    user_id: userId,
    role,
  })
  return data.added ?? false
}

export const updateOrgMember = async (orgId: string, userId: string, role: string) => {
  const { data } = await api.put<SimpleResponse>(`/v1/orgs/${orgId}/members/${userId}`, {
    role,
  })
  return data.updated ?? false
}

export const deleteOrgMember = async (orgId: string, userId: string) => {
  const { data } = await api.delete<SimpleResponse>(`/v1/orgs/${orgId}/members/${userId}`)
  return data.deleted ?? false
}
