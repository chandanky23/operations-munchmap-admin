import { apiClient } from './client'
import type {
  RefundListResponse,
  RefundDetailResponse,
  RefundActionResponse,
  ProcessRefundRequest,
  PendingRefundStatus,
} from '../types'

export interface GetRefundsParams {
  status?: PendingRefundStatus
  shop_id?: string
  customer_id?: string
  page?: number
  page_size?: number
}

export const refundsApi = {
  /**
   * Get list of pending refunds with optional filters
   */
  async getRefunds(params?: GetRefundsParams): Promise<RefundListResponse> {
    const queryParams = new URLSearchParams()

    if (params?.status) queryParams.append('status', params.status)
    if (params?.shop_id) queryParams.append('shop_id', params.shop_id)
    if (params?.customer_id) queryParams.append('customer_id', params.customer_id)
    if (params?.page) queryParams.append('page', params.page.toString())
    if (params?.page_size) queryParams.append('page_size', params.page_size.toString())

    const query = queryParams.toString()
    const endpoint = `/api/v1/admin/refunds${query ? `?${query}` : ''}`

    return apiClient.get<RefundListResponse>(endpoint)
  },

  /**
   * Get refund by ID
   */
  async getRefundById(refundId: string): Promise<RefundDetailResponse> {
    return apiClient.get<RefundDetailResponse>(`/api/v1/admin/refunds/${refundId}`)
  },

  /**
   * Process (approve and execute) a pending refund
   */
  async processRefund(
    refundId: string,
    data?: ProcessRefundRequest
  ): Promise<RefundActionResponse> {
    return apiClient.post<RefundActionResponse>(
      `/api/v1/admin/refunds/${refundId}/process`,
      data
    )
  },

  /**
   * Cancel a pending refund
   */
  async cancelRefund(refundId: string, reason?: string): Promise<RefundActionResponse> {
    return apiClient.post<RefundActionResponse>(
      `/api/v1/admin/refunds/${refundId}/cancel`,
      reason ? { reason } : undefined
    )
  },

  /**
   * Mark commission as recovered from restaurant
   */
  async markCommissionRecovered(
    refundId: string,
    recoveryNotes?: string
  ): Promise<RefundActionResponse> {
    return apiClient.post<RefundActionResponse>(
      `/api/v1/admin/refunds/${refundId}/mark-commission-recovered`,
      recoveryNotes ? { recovery_notes: recoveryNotes } : undefined
    )
  },
}
