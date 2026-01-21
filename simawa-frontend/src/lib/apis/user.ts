import { api, type ApiResponse } from '../http-client'

export type User = {
  id: string
  username: string
  first_name: string
  second_name?: string
  organisasi?: boolean
  ukm?: string
  hmj?: string
  jurusan?: string
  nim?: string
  email: string
  phone?: string
  alamat?: string
  created_at?: string
  updated_at?: string
}

export type CreateUserPayload = {
  username: string
  first_name: string
  second_name?: string
  organisasi?: boolean
  ukm?: string
  hmj?: string
  jurusan?: string
  nim?: string
  email: string
  phone: string
  alamat: string
  tanggal_lahir: string
  password: string
}

export type UserRoleAssignment = {
  id: string
  role_code: string
  org_id?: string
}

export type UserSearchItem = {
  id: string
  username: string
  first_name: string
  email: string
  nim?: string
}

type UserListResponse = {
  data: {
    items: User[]
    total: number
  }
}

export const createUser = async (payload: CreateUserPayload) => {
  const body = {
    username: payload.username,
    firstname: payload.first_name,
    secondname: payload.second_name,
    organisasi: payload.organisasi ?? false,
    ukm: payload.ukm ?? '',
    hmj: payload.hmj ?? '',
    jurusan: payload.jurusan ?? '',
    nim: payload.nim ?? '',
    email: payload.email,
    phone: payload.phone,
    alamat: payload.alamat,
    tanggal_lahir: payload.tanggal_lahir,
    password: payload.password,
  }
  const { data } = await api.post<ApiResponse<User>>('/v1/users', body)
  return data.data
}

export const assignUserRoles = async (id: string, roles: string[]) => {
  const { data } = await api.post('/v1/users/' + id + '/roles', { roles })
  return data
}

export const listUserAssignments = async (id: string) => {
  const { data } = await api.get<{ items: UserRoleAssignment[] }>(`/v1/users/${id}/roles`)
  return data.items
}

export const listUsers = async (params?: {
  q?: string
  page?: number
  size?: number
  org_id?: string
  role_code?: string
  role_prefix?: string
}) => {
  const { data } = await api.get<UserListResponse>('/v1/users', { params })
  return data.data
}

export const changePassword = async (payload: {
  old_password: string
  new_password: string
  confirm_password: string
}) => {
  const { data } = await api.put<ApiResponse<void>>('/v1/users/change-password', payload)
  return data
}

export const searchUsers = async (params?: { q?: string; size?: number }) => {
  const { data } = await api.get<{ items: UserSearchItem[] }>('/v1/users/search', {
    params,
  })
  return data.items
}
