import { api } from '../http-client'

export const exportActivityReport = async (startDate: string, endDate: string) => {
  const response = await api.get('/v1/reports/activities/export', {
    params: { start: startDate, end: endDate },
    responseType: 'blob',
  })
  return response.data as Blob
}

export const exportSuratReport = async (startDate: string, endDate: string) => {
  const response = await api.get('/v1/reports/surat/export', {
    params: { start: startDate, end: endDate },
    responseType: 'blob',
  })
  return response.data as Blob
}

export const exportLPJReport = async (startDate: string, endDate: string) => {
  const response = await api.get('/v1/reports/lpj/export', {
    params: { start: startDate, end: endDate },
    responseType: 'blob',
  })
  return response.data as Blob
}
