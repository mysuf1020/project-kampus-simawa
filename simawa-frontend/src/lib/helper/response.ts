import { AxiosResponse } from 'axios'
import { BaseResponse, ErrorResponse } from '@/lib/models/common'
import { ErrorObj } from '@/lib/models/error'

class ApiError<T extends string | ErrorObj> extends Error {
  errorResponse: ErrorResponse<T>
  constructor(message: string, errResponse: ErrorResponse<T>) {
    super(message)
    this.errorResponse = errResponse
  }
}

const handleResponse = <T>(response: AxiosResponse<BaseResponse<T>>): T => {
  if (response.status === 200) {
    return response.data.data
  }

  const error = response.data.error as ErrorResponse<ErrorObj | string>

  if (typeof error.error == 'string') {
    throw new Error(error.error)
  }

  throw new ApiError(error.error.message, error)
}

export { handleResponse }
