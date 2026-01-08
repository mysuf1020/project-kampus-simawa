'use client'
import Axios, { InternalAxiosRequestConfig } from 'axios'

const axios = Axios.create({
  baseURL: `${process.env.NEXT_PUBLIC_BASE_API_URL}/${process.env.NEXT_PUBLIC_API_VERSION}`,
})

const jwtToken = () => async (config: InternalAxiosRequestConfig) => {
  return config
}

axios.interceptors.request.use(jwtToken())

export default axios
