import { api } from '../http-client'

export type DashboardSummary = {
  activities_pending: number
  cover_pending: number
  lpj_pending: number
  surat_pending: number
  org_total: number
  users_total: number
  last_achievements: string[]
}

type DashboardSummaryResponse = {
  data: DashboardSummary
}

export const fetchDashboardSummary = async (): Promise<DashboardSummary> => {
  const { data } = await api.get<DashboardSummaryResponse>('/v1/dashboard/summary')
  return data.data
}
