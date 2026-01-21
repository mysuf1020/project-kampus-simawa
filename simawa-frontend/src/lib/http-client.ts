'use client'

import axios, { AxiosError } from 'axios'

const baseURL = process.env.NEXT_PUBLIC_API_BASE_PATH || '/api/simawa'

const api = axios.create({
  baseURL,
  withCredentials: false,
})

api.interceptors.response.use(
  (response) => response,
  async (error: AxiosError<ApiErrorResponse>) => {
    // Extract detailed error message from backend response
    const status = error.response?.status
    const backendMessage = error.response?.data?.message
    const errorDetail = error.response?.data?.error

    // Build comprehensive error message
    let message = backendMessage || error.message || 'Terjadi kesalahan'
    if (errorDetail) {
      message = `${message}: ${errorDetail}`
    }

    // Log for debugging
    console.error(
      `[API Error] ${status} - ${error.config?.method?.toUpperCase()} ${error.config?.url}`,
    )
    console.error(`[API Error] Message: ${message}`)
    if (error.response?.data) {
      console.error('[API Error] Response:', error.response.data)
    }

    // Attach formatted message to error for toast display
    const errorWithMeta = error as unknown as {
      displayMessage?: string
      statusCode?: number
    }
    errorWithMeta.displayMessage = message
    errorWithMeta.statusCode = status

    return Promise.reject(error)
  },
)

export type ApiResponse<T> = {
  success: boolean
  message: string
  data?: T
}

export type ApiErrorResponse = {
  success: boolean
  message: string
  error?: string
}

// Helper to extract error message for toast
export function getErrorMessage(error: unknown): string {
  if (axios.isAxiosError(error)) {
    const axiosError = error as AxiosError<ApiErrorResponse> & { displayMessage?: string }
    if (axiosError.displayMessage) {
      return axiosError.displayMessage
    }
    if (axiosError.response?.data?.message) {
      return axiosError.response.data.message
    }
  }
  if (error instanceof Error) {
    return error.message
  }
  return 'Terjadi kesalahan yang tidak diketahui'
}

export { api }
