import { api, type ApiResponse } from '../http-client'

export type Asset = {
  id: number
  org_id: string
  name: string
  description: string
  quantity: number
  status: string // AVAILABLE | BORROWED
  created_at: string
  updated_at: string
}

export type AssetBorrowing = {
  id: number
  asset_id: number
  surat_id?: number
  borrower_id: string
  org_id: string
  quantity: number
  borrow_date: string
  return_date: string
  returned_at?: string
  status: string // BORROWED | RETURNED
  note: string
  created_at: string
  updated_at: string
  asset?: Asset
}

// --- Asset CRUD ---

export const listAssets = async (orgId: string): Promise<Asset[]> => {
  const { data } = await api.get<ApiResponse<Asset[]>>('/v1/assets', { params: { org_id: orgId } })
  return data.data ?? []
}

export const getAsset = async (id: number): Promise<Asset> => {
  const { data } = await api.get<ApiResponse<Asset>>(`/v1/assets/${id}`)
  return data.data!
}

export const createAsset = async (payload: {
  org_id: string
  name: string
  description?: string
  quantity?: number
}): Promise<Asset> => {
  const { data } = await api.post<ApiResponse<Asset>>('/v1/assets', payload)
  return data.data!
}

export const updateAsset = async (
  id: number,
  payload: { name?: string; description?: string; quantity?: number },
): Promise<Asset> => {
  const { data } = await api.put<ApiResponse<Asset>>(`/v1/assets/${id}`, payload)
  return data.data!
}

export const deleteAsset = async (id: number): Promise<void> => {
  await api.delete(`/v1/assets/${id}`)
}

// --- Borrowing ---

export const borrowAsset = async (payload: {
  asset_id: number
  org_id: string
  surat_id?: number
  quantity?: number
  borrow_date: string
  return_date: string
  note?: string
}): Promise<AssetBorrowing> => {
  const { data } = await api.post<ApiResponse<AssetBorrowing>>('/v1/assets/borrow', payload)
  return data.data!
}

export const returnAsset = async (borrowingId: number): Promise<AssetBorrowing> => {
  const { data } = await api.post<ApiResponse<AssetBorrowing>>(`/v1/assets/borrow/${borrowingId}/return`)
  return data.data!
}

export const listBorrowings = async (orgId: string): Promise<AssetBorrowing[]> => {
  const { data } = await api.get<ApiResponse<AssetBorrowing[]>>('/v1/assets/borrowings', {
    params: { org_id: orgId },
  })
  return data.data ?? []
}
