/* eslint-disable @typescript-eslint/no-explicit-any */
import { ErrorResponse } from '.'

/**
 * A custom Error class for HTTP errors.
 * It now includes an optional 'payload' property to hold the JSON body of an error response.
 */
export class ApiError extends Error {
  response: Response
  status: number
  payload?: any

  constructor(response: Response, payload?: any) {
    // Use the message from the API payload if available, otherwise default to status text
    const message =
      payload?.message || `Permintaan gagal: ${response.status} ${response.statusText}`
    super(message)
    this.name = 'ApiError'
    this.response = response
    this.status = response.status
    this.payload = payload
  }
}

// Define the shape of the serializable error object we will always return to the client.
export interface CustomError {
  message: string
  error?: ErrorResponse
  details?: string | string[]
  code?: number
}

/**
 * Processes an error from a Server Action and returns a client-safe, serializable error object.
 *
 * @param {unknown} error - The error object caught in the Server Action.
 * @param {string} [context='performing action'] - A string describing the context for server-side logging.
 * @returns {CustomError} A serializable error object safe to return to the client.
 */
export function handleError(
  error: unknown,
  context: string = 'performing action',
  authenticatedApi: boolean = true,
): CustomError {
  console.error(`Server Action Error while ${context}:`, error)
  if (error && typeof error === 'object' && Object.hasOwn(error, 'response')) {
    const errorResponse = error as ErrorResponse
    if (errorResponse.status === 401 && authenticatedApi) {
      // Hindari hard redirect di util error handler; cukup kembalikan pesan yang ramah.
      // Halaman yang butuh login sebaiknya dilindungi oleh middleware.
      return {
        message: 'Sesi berakhir. Silakan login kembali.',
        error: errorResponse,
      }
    }
    return {
      message: 'Terjadi kesalahan. Silakan coba lagi.',
      error: errorResponse,
    }
  }

  if (error instanceof Error) {
    return { message: error.message }
  }

  return { message: 'Terjadi kesalahan tak terduga. Silakan coba lagi.' }
}
