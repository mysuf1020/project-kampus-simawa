'use client'

import axios from 'axios'

const baseURL = process.env.NEXT_PUBLIC_API_BASE_PATH || '/api/simawa'

const api = axios.create({
  baseURL,
  withCredentials: false,
})

api.interceptors.response.use(
  (response) => response,
  async (error) => {
    // Jangan hard-redirect saat 401; biarkan UI/middleware menangani agar tidak "nge-kick"
    // ketika ada error otorisasi sementara atau endpoint yang memang dibatasi.
    return Promise.reject(error)
  },
)

export type ApiResponse<T> = {
  success: boolean
  message: string
  data?: T
}

export { api }
