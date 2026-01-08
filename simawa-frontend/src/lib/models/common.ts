import { CustomError } from '@/lib/http-request/error-handler'

export type SearchParams = { [key: string]: string | string[] | undefined }

export interface BaseResponse<TData = unknown, TError = unknown> {
  data: TData
  error: TError
}

export interface SuccessResponse<TData = unknown> extends BaseResponse<TData, null> {
  status: number
  data: TData
}

export interface ErrorResponse<TError = unknown, TErrorData = null> extends BaseResponse<
  TErrorData,
  TError
> {
  status: number
  error: TError
}

export interface Pagination {
  current_page: number
  total_pages: number
  total_records: number
  page_size: number
}

export interface FilterParams {
  search?: string
  page?: string
  page_size?: string
  sort_by?: string
  sort_order?: string
}

export type Id<Data = unknown> = Data & {
  id: string
}

export type ActionResult<T> = {
  data: T | null
  error: CustomError | null
}

export interface Province {
  id: string
  name: string
}
export interface City {
  id: string
  name: string
}

export interface District {
  id: string
  name: string
}

export interface Village {
  id: string
  name: string
}

export interface ChangedData {
  key: string
  old_value: string
  new_value: string
  remark_old_value?: string
  remark_new_value?: string
}
