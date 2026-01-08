import { api } from '../http-client'

export type Notification = {
  id: string
  user_id: string
  title: string
  body: string
  data?: Record<string, unknown>
  read_at?: string | null
  created_at?: string
}

type NotificationListResponse = {
  items: Notification[]
}

type MarkReadResponse = {
  read: boolean
}

type MentionPayload = {
  user_id: string
  title: string
  body?: string
  data?: Record<string, unknown>
}

type MentionResponse = {
  sent: boolean
}

export const listNotifications = async () => {
  const { data } = await api.get<NotificationListResponse>('/v1/notifications')
  return data.items
}

export const markNotificationRead = async (id: string) => {
  const { data } = await api.post<MarkReadResponse>(`/v1/notifications/${id}/read`)
  return data.read
}

export const mentionUser = async (payload: MentionPayload) => {
  const { data } = await api.post<MentionResponse>('/v1/notifications/mention', payload)
  return data.sent
}
