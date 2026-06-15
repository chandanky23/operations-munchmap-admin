export const PendingRefundStatus = {
  PENDING_ADMIN_REVIEW: 'PENDING_ADMIN_REVIEW',
  APPROVED: 'APPROVED',
  PROCESSING: 'PROCESSING',
  COMPLETED: 'COMPLETED',
  FAILED: 'FAILED',
  CANCELLED: 'CANCELLED',
} as const

export type PendingRefundStatus = (typeof PendingRefundStatus)[keyof typeof PendingRefundStatus]

export interface PendingRefund {
  id: string
  order_id: string
  shop_id: string
  customer_id: string | null

  // Payment information
  payment_intent_ids: string[]
  total_amount: string
  platform_commission: string
  restaurant_deduction: string
  currency: string

  // Refund details
  cancellation_reason: string | null
  status: PendingRefundStatus

  // Admin processing
  processed_by_admin_id: string | null
  processed_at: Date | null
  admin_notes: string | null

  // Stripe refund tracking
  stripe_refund_ids: string[] | null
  error_message: string | null

  // Commission recovery tracking
  commission_recovery_pending: boolean
  commission_recovered_at: Date | null
  commission_recovered_by_admin_id: string | null
  commission_recovery_notes: string | null

  // Audit trail
  created_at: Date
  updated_at: Date
}

export interface RefundListResponse {
  success: boolean
  data: PendingRefund[]
  pagination?: {
    page: number
    page_size: number
    total: number
  }
}

export interface RefundDetailResponse {
  success: boolean
  data: PendingRefund
}

export interface ProcessRefundRequest {
  admin_notes?: string
  platform_commission_percent?: number
}

export interface RefundActionResponse {
  success: boolean
  message: string
  data: PendingRefund
}
