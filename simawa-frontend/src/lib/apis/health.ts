import { api } from '../http-client'

export type HealthResponse = {
  status: string
  uptime_seconds: number
  db_ok: boolean
  redis_ok: boolean
  minio_ok: boolean
  counts: Record<string, number>
}

export const fetchHealth = async (): Promise<HealthResponse> => {
  const { data } = await api.get<HealthResponse>('/health')
  return data
}
