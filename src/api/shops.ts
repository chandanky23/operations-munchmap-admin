import { apiClient } from './client'
import type {
  GetShopsParams,
  ShopListResponse,
  ShopDetailResponse,
  ShopActionResponse,
  ApproveShopRequest,
  RejectShopRequest,
  UpdateVerificationStatusRequest,
} from '../types'

export const shopsApi = {
  /**
   * Get list of shops with optional filters and pagination
   */
  async getShops(params?: GetShopsParams): Promise<ShopListResponse> {
    const queryParams = new URLSearchParams()

    if (params?.page !== undefined) queryParams.append('page', params.page.toString())
    if (params?.page_size !== undefined) queryParams.append('page_size', params.page_size.toString())

    if (params?.verification_status) {
      const statuses = Array.isArray(params.verification_status)
        ? params.verification_status
        : [params.verification_status]
      statuses.forEach(status => queryParams.append('verification_status', status))
    }

    if (params?.status) {
      const statuses = Array.isArray(params.status) ? params.status : [params.status]
      statuses.forEach(status => queryParams.append('status', status))
    }

    if (params?.show_new_restaurant !== undefined) {
      queryParams.append('show_new_restaurant', params.show_new_restaurant.toString())
    }

    const query = queryParams.toString()
    const endpoint = `/api/v1/admin/shops${query ? `?${query}` : ''}`

    return apiClient.get<ShopListResponse>(endpoint)
  },

  /**
   * Get shop by ID
   */
  async getShopById(shopId: string): Promise<ShopDetailResponse> {
    return apiClient.get<ShopDetailResponse>(`/api/v1/admin/shops/${shopId}`)
  },

  /**
   * Approve a pending shop
   */
  async approveShop(shopId: string, data?: ApproveShopRequest): Promise<ShopActionResponse> {
    return apiClient.post<ShopActionResponse>(
      `/api/v1/admin/shops/${shopId}/approve`,
      data
    )
  },

  /**
   * Reject a pending shop
   */
  async rejectShop(shopId: string, data?: RejectShopRequest): Promise<ShopActionResponse> {
    return apiClient.post<ShopActionResponse>(
      `/api/v1/admin/shops/${shopId}/reject`,
      data
    )
  },

  /**
   * Update shop verification status
   */
  async updateVerificationStatus(
    shopId: string,
    data: UpdateVerificationStatusRequest
  ): Promise<ShopActionResponse> {
    return apiClient.patch<ShopActionResponse>(
      `/api/v1/admin/shops/${shopId}/verification-status`,
      data
    )
  },
}
