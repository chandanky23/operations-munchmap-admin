import { useState } from 'react'
import { useParams, useNavigate } from 'react-router-dom'
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query'
import { refundsApi } from '../api'
import { PendingRefundStatus } from '../types'
import { ArrowLeft, CheckCircle, XCircle, AlertTriangle, Receipt, DollarSign, FileText } from 'lucide-react'

export const RefundDetail = () => {
  const { refundId } = useParams<{ refundId: string }>()
  const navigate = useNavigate()
  const queryClient = useQueryClient()

  const [showProcessModal, setShowProcessModal] = useState(false)
  const [showCancelModal, setShowCancelModal] = useState(false)
  const [showCommissionRecoveryModal, setShowCommissionRecoveryModal] = useState(false)
  const [adminNotes, setAdminNotes] = useState('')
  const [recoveryNotes, setRecoveryNotes] = useState('')

  // Fetch enriched refund details (refund + shop + order + customer) in one API call
  const { data, isLoading, error } = useQuery({
    queryKey: ['enriched-refund', refundId],
    queryFn: () => refundsApi.getEnrichedRefundDetails(refundId!),
    enabled: !!refundId,
    refetchInterval: 60000, // Poll every 1 minute (60000ms)
  })

  const refund = data?.data?.refund
  const shop = data?.data?.shop
  const order = data?.data?.order
  const customer = data?.data?.customer

  const processMutation = useMutation({
    mutationFn: () =>
      refundsApi.processRefund(refundId!, { admin_notes: adminNotes || undefined }),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['refund', refundId] })
      queryClient.invalidateQueries({ queryKey: ['refunds'] })
      setShowProcessModal(false)
      setAdminNotes('')
    },
  })

  const cancelMutation = useMutation({
    mutationFn: () => refundsApi.cancelRefund(refundId!, adminNotes),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['refund', refundId] })
      queryClient.invalidateQueries({ queryKey: ['refunds'] })
      setShowCancelModal(false)
      setAdminNotes('')
    },
  })

  const commissionRecoveryMutation = useMutation({
    mutationFn: () => refundsApi.markCommissionRecovered(refundId!, recoveryNotes),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['refund', refundId] })
      queryClient.invalidateQueries({ queryKey: ['refunds'] })
      setShowCommissionRecoveryModal(false)
      setRecoveryNotes('')
    },
  })

  if (isLoading) {
    return (
      <div className="max-w-5xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
        <div className="text-center py-16">
          <div className="text-lg text-gray-600">Loading refund details...</div>
        </div>
      </div>
    )
  }

  if (error || !refund) {
    return (
      <div className="max-w-5xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
        <div className="bg-red-50 border border-red-200 rounded-xl p-4 flex items-start gap-3">
          <AlertTriangle className="w-5 h-5 text-red-600 flex-shrink-0 mt-0.5" />
          <div className="flex-1">
            <p className="text-sm font-medium text-red-800">Error loading refund</p>
            <p className="text-sm text-red-700 mt-1">
              {error instanceof Error ? error.message : 'Refund not found'}
            </p>
          </div>
        </div>
      </div>
    )
  }

  const canProcess = refund.status === PendingRefundStatus.PENDING_ADMIN_REVIEW
  const canCancel = refund.status === PendingRefundStatus.PENDING_ADMIN_REVIEW

  return (
    <div className="max-w-5xl mx-auto px-4 sm:px-6 lg:px-8 py-8 space-y-6">
      {/* Header */}
      <div className="flex items-center gap-4">
        <button
          onClick={() => navigate('/refunds')}
          className="p-2 hover:bg-gray-100 rounded-lg transition-colors"
          aria-label="Back to refunds"
        >
          <ArrowLeft className="w-6 h-6 text-gray-600" />
        </button>
        <div className="flex-1">
          <div className="flex items-center gap-3 mb-1">
            <div className="p-2 bg-indigo-100 rounded-lg">
              <Receipt className="w-6 h-6 text-indigo-600" />
            </div>
            <h1 className="text-3xl font-bold text-gray-900">Refund Details</h1>
          </div>
          <p className="text-gray-600">Review and process this refund request</p>
        </div>
      </div>

      {/* Main Grid */}
      <div className="grid lg:grid-cols-3 gap-6">
        {/* Left Column - Main Info */}
        <div className="lg:col-span-2 space-y-6">
          {/* Basic Information */}
          <div className="bg-white rounded-xl shadow-sm border border-gray-200 overflow-hidden">
            <div className="px-6 py-4 bg-gray-50 border-b border-gray-200">
              <h2 className="text-lg font-semibold text-gray-900 flex items-center gap-2">
                <FileText className="w-5 h-5 text-gray-600" />
                Refund Information
              </h2>
            </div>
            <div className="p-6">
              <div className="grid sm:grid-cols-2 gap-4">
                <InfoItem label="Refund ID" value={refund.id} mono />
                <InfoItem label="Order Number" value={order?.number || refund.order_id} mono={!order?.number} />
                <InfoItem
                  label="Restaurant"
                  value={shop?.name ? `${shop.name}${shop.branch ? ` (${shop.branch})` : ''}` : refund.shop_id}
                  mono={!shop?.name}
                />
                <InfoItem
                  label="Customer"
                  value={customer ? `${customer.first_name} ${customer.last_name} (${customer.email})` : refund.customer_id || 'N/A'}
                  mono={!customer && !!refund.customer_id}
                />
                <InfoItem
                  label="Status"
                  value={refund.status}
                  badge={refund.status === PendingRefundStatus.PENDING_ADMIN_REVIEW ? 'amber' :
                         refund.status === PendingRefundStatus.COMPLETED ? 'emerald' :
                         refund.status === PendingRefundStatus.FAILED ? 'red' : 'gray'}
                />
                <InfoItem label="Currency" value={refund.currency} />
                <InfoItem
                  label="Created At"
                  value={new Date(refund.created_at).toLocaleString('en-US', {
                    month: 'short',
                    day: 'numeric',
                    year: 'numeric',
                    hour: '2-digit',
                    minute: '2-digit'
                  })}
                />
                <InfoItem
                  label="Updated At"
                  value={new Date(refund.updated_at).toLocaleString('en-US', {
                    month: 'short',
                    day: 'numeric',
                    year: 'numeric',
                    hour: '2-digit',
                    minute: '2-digit'
                  })}
                />
              </div>

              {/* Order Details */}
              {order && order.items && (
                <div className="mt-6 pt-6 border-t border-gray-200">
                  <h3 className="font-semibold text-gray-900 mb-3">Order Details</h3>
                  <div className="bg-gray-50 rounded-lg p-4 space-y-2">
                    <div className="flex justify-between text-sm">
                      <span className="text-gray-600">Total Amount:</span>
                      <span className="font-medium text-gray-900">
                        {order.currency} {parseFloat(order.total_amount).toFixed(2)}
                      </span>
                    </div>
                    <div className="flex justify-between text-sm">
                      <span className="text-gray-600">Items:</span>
                      <span className="font-medium text-gray-900">
                        {order.items.reduce((sum: number, item: any) => sum + item.quantity, 0)} item(s)
                      </span>
                    </div>
                    <div className="flex justify-between text-sm">
                      <span className="text-gray-600">Order Type:</span>
                      <span className="font-medium text-gray-900">
                        {order.order_placed_by_type === 'GROUP' ? 'Group Order' : 'Solo Order'}
                      </span>
                    </div>
                  </div>
                </div>
              )}
            </div>
          </div>

          {/* Cancellation Reason */}
          {refund.cancellation_reason && (
            <div className="bg-white rounded-xl shadow-sm border border-gray-200 p-6">
              <h3 className="font-semibold text-gray-900 mb-3 flex items-center gap-2">
                <AlertTriangle className="w-5 h-5 text-amber-600" />
                Cancellation Reason
              </h3>
              <p className="text-gray-700 bg-amber-50 border border-amber-200 p-4 rounded-lg italic">
                {refund.cancellation_reason}
              </p>
            </div>
          )}

          {/* Admin Notes */}
          {refund.admin_notes && (
            <div className="bg-white rounded-xl shadow-sm border border-gray-200 p-6">
              <h3 className="font-semibold text-gray-900 mb-3">Admin Notes</h3>
              <p className="text-gray-700 bg-blue-50 border border-blue-200 p-4 rounded-lg">
                {refund.admin_notes}
              </p>
            </div>
          )}

          {/* Error Message */}
          {refund.error_message && (
            <div className="bg-red-50 border border-red-200 rounded-xl p-6">
              <h3 className="font-semibold text-red-800 mb-3 flex items-center gap-2">
                <AlertTriangle className="w-5 h-5" />
                Error Message
              </h3>
              <p className="text-red-700 font-mono text-sm">{refund.error_message}</p>
            </div>
          )}

          {/* Payment Intents */}
          <div className="bg-white rounded-xl shadow-sm border border-gray-200 p-6">
            <h3 className="font-semibold text-gray-900 mb-3 flex items-center justify-between">
              <span>Payment Intents</span>
              <span className="text-xs text-gray-500 font-normal">
                {refund.payment_intent_ids.length} {refund.payment_intent_ids.length === 1 ? 'payment' : 'payments'}
              </span>
            </h3>
            <div className="space-y-2">
              {refund.payment_intent_ids.length === 1 && customer ? (
                // Solo order - show customer details
                <div className="bg-blue-50 border border-blue-200 p-4 rounded-lg">
                  <div className="flex items-start gap-3">
                    <div className="flex-shrink-0 w-8 h-8 bg-blue-100 text-blue-700 rounded-full flex items-center justify-center text-sm font-medium">
                      1
                    </div>
                    <div className="flex-1">
                      <p className="font-medium text-gray-900">
                        {customer.first_name} {customer.last_name}
                      </p>
                      <p className="text-sm text-gray-600">{customer.email}</p>
                      <p className="text-sm text-emerald-700 font-medium mt-1">
                        {refund.currency} {parseFloat(refund.total_amount).toFixed(2)}
                      </p>
                      <p className="text-xs text-gray-500 font-mono mt-2 break-all">{refund.payment_intent_ids[0]}</p>
                    </div>
                  </div>
                </div>
              ) : (
                // Group order or multiple payments - show list with technical IDs
                refund.payment_intent_ids.map((id, index) => (
                  <div key={id} className="flex items-center gap-3 bg-gray-50 p-3 rounded-lg">
                    <span className="flex-shrink-0 w-6 h-6 bg-indigo-100 text-indigo-700 rounded-full flex items-center justify-center text-xs font-medium">
                      {index + 1}
                    </span>
                    <div className="flex-1">
                      <p className="text-sm text-gray-700 font-mono break-all">{id}</p>
                      {order?.order_placed_by_type === 'GROUP' && (
                        <p className="text-xs text-gray-500 mt-1">Group member payment</p>
                      )}
                    </div>
                  </div>
                ))
              )}
            </div>
            {refund.payment_intent_ids.length > 1 && order?.order_placed_by_type === 'GROUP' && (
              <div className="mt-4 pt-4 border-t border-gray-200">
                <p className="text-sm text-gray-600 italic">
                  This is a group order with {refund.payment_intent_ids.length} members. Each payment intent represents one member's contribution.
                </p>
              </div>
            )}
          </div>

          {/* Stripe Refund IDs */}
          {refund.stripe_refund_ids && refund.stripe_refund_ids.length > 0 && (
            <div className="bg-white rounded-xl shadow-sm border border-gray-200 p-6">
              <h3 className="font-semibold text-gray-900 mb-3">Stripe Refund IDs</h3>
              <div className="space-y-2">
                {refund.stripe_refund_ids.map((id, index) => (
                  <div key={id} className="flex items-center gap-3 bg-emerald-50 p-3 rounded-lg">
                    <span className="flex-shrink-0 w-6 h-6 bg-emerald-100 text-emerald-700 rounded-full flex items-center justify-center text-xs font-medium">
                      {index + 1}
                    </span>
                    <p className="text-sm text-gray-700 font-mono break-all">{id}</p>
                  </div>
                ))}
              </div>
            </div>
          )}
        </div>

        {/* Right Column - Financial & Actions */}
        <div className="space-y-6">
          {/* Financial Breakdown */}
          <div className="bg-gradient-to-br from-indigo-50 to-indigo-100 rounded-xl shadow-sm border border-indigo-200 overflow-hidden">
            <div className="px-6 py-4 bg-indigo-100 border-b border-indigo-200">
              <h2 className="text-lg font-semibold text-indigo-900 flex items-center gap-2">
                <DollarSign className="w-5 h-5" />
                Financial Breakdown
              </h2>
            </div>
            <div className="p-6 space-y-4">
              <div className="bg-blue-50 border border-blue-200 rounded-lg p-3 mb-4">
                <p className="text-xs text-blue-800 font-medium">
                  Customer receives 100% refund. Restaurant pays back net amount received. Platform contributes commission.
                </p>
              </div>

              <div className="flex justify-between items-center pb-3 border-b border-indigo-200">
                <div>
                  <span className="text-sm text-indigo-800 font-medium">Customer Refund</span>
                  <p className="text-xs text-indigo-600">100% of payment returned</p>
                </div>
                <span className="text-lg font-bold text-emerald-700">
                  {refund.currency} {parseFloat(refund.total_amount).toFixed(2)}
                </span>
              </div>

              <div className="flex justify-between items-center pb-3 border-b border-indigo-200">
                <div>
                  <span className="text-sm text-indigo-800 font-medium">Restaurant Payback</span>
                  <p className="text-xs text-indigo-600">Net amount they received</p>
                </div>
                <span className="text-lg font-bold text-red-700">
                  {refund.currency} {parseFloat(refund.restaurant_deduction).toFixed(2)}
                </span>
              </div>

              <div className="flex justify-between items-center pt-2">
                <div>
                  <span className="text-sm font-medium text-indigo-900">Platform Contribution</span>
                  <p className="text-xs text-indigo-600">Commission absorbed by platform</p>
                </div>
                <span className="text-lg font-bold text-indigo-700">
                  {refund.currency} {parseFloat(refund.platform_commission).toFixed(2)}
                </span>
              </div>
            </div>
          </div>

          {/* Commission Recovery Status */}
          {refund.status === PendingRefundStatus.COMPLETED && (
            <div className={`rounded-xl shadow-sm border p-6 ${
              refund.commission_recovery_pending
                ? 'bg-amber-50 border-amber-300'
                : 'bg-green-50 border-green-300'
            }`}>
              <div className="flex items-start justify-between gap-4">
                <div className="flex-1">
                  <h3 className={`text-lg font-semibold mb-2 flex items-center gap-2 ${
                    refund.commission_recovery_pending ? 'text-amber-900' : 'text-green-900'
                  }`}>
                    {refund.commission_recovery_pending ? (
                      <>
                        <AlertTriangle className="w-5 h-5" />
                        Commission Recovery Pending
                      </>
                    ) : (
                      <>
                        <CheckCircle className="w-5 h-5" />
                        Commission Recovered
                      </>
                    )}
                  </h3>
                  <p className={`text-sm mb-3 ${
                    refund.commission_recovery_pending ? 'text-amber-800' : 'text-green-800'
                  }`}>
                    {refund.commission_recovery_pending ? (
                      <>
                        Platform absorbed {refund.currency} {parseFloat(refund.platform_commission).toFixed(2)} to complete the customer refund.
                        This amount needs to be separately invoiced/recovered from the restaurant.
                      </>
                    ) : (
                      <>
                        Commission of {refund.currency} {parseFloat(refund.platform_commission).toFixed(2)} was recovered from restaurant on{' '}
                        {new Date(refund.commission_recovered_at!).toLocaleDateString('en-US', {
                          month: 'long',
                          day: 'numeric',
                          year: 'numeric'
                        })}.
                      </>
                    )}
                  </p>
                  {!refund.commission_recovery_pending && refund.commission_recovery_notes && (
                    <div className="bg-white border border-green-200 rounded-lg p-3 mt-2">
                      <p className="text-xs font-medium text-green-900 mb-1">Recovery Notes:</p>
                      <p className="text-sm text-green-800">{refund.commission_recovery_notes}</p>
                    </div>
                  )}
                </div>
                {refund.commission_recovery_pending && (
                  <button
                    onClick={() => setShowCommissionRecoveryModal(true)}
                    className="flex-shrink-0 bg-amber-600 hover:bg-amber-700 text-white font-medium py-2 px-4 rounded-lg transition-colors flex items-center gap-2"
                  >
                    <CheckCircle className="w-4 h-4" />
                    Mark as Recovered
                  </button>
                )}
              </div>
            </div>
          )}

          {/* Actions */}
          {(canProcess || canCancel) && (
            <div className="bg-white rounded-xl shadow-sm border border-gray-200 p-6 space-y-3">
              <h2 className="text-lg font-semibold text-gray-900 mb-4">Admin Actions</h2>
              {canProcess && (
                <button
                  onClick={() => setShowProcessModal(true)}
                  className="w-full bg-emerald-600 hover:bg-emerald-700 active:bg-emerald-800 text-white font-semibold py-3 px-4 rounded-lg transition-colors flex items-center justify-center gap-2 shadow-sm"
                >
                  <CheckCircle className="w-5 h-5" />
                  Process Refund
                </button>
              )}
              {canCancel && (
                <button
                  onClick={() => setShowCancelModal(true)}
                  className="w-full bg-red-600 hover:bg-red-700 active:bg-red-800 text-white font-semibold py-3 px-4 rounded-lg transition-colors flex items-center justify-center gap-2 shadow-sm"
                >
                  <XCircle className="w-5 h-5" />
                  Cancel Refund
                </button>
              )}
            </div>
          )}
        </div>
      </div>

      {/* Process Modal */}
      {showProcessModal && (
        <Modal
          title="Process Refund"
          icon={<CheckCircle className="w-6 h-6 text-emerald-600" />}
          onClose={() => setShowProcessModal(false)}
        >
          <div className="space-y-4">
            <div className="bg-amber-50 border border-amber-200 p-4 rounded-lg flex gap-3">
              <AlertTriangle className="w-5 h-5 text-amber-600 flex-shrink-0 mt-0.5" />
              <div className="text-sm text-amber-800">
                <p className="font-semibold mb-2">This action will:</p>
                <ul className="list-disc list-inside space-y-1">
                  <li>Refund {refund.currency} {parseFloat(refund.total_amount).toFixed(2)} to customer (100% of payment)</li>
                  <li>Reverse {refund.currency} {parseFloat(refund.restaurant_deduction).toFixed(2)} from restaurant (net amount they received)</li>
                  <li>Platform contributes {refund.currency} {parseFloat(refund.platform_commission).toFixed(2)} (commission)</li>
                </ul>
                <p className="mt-2 text-xs text-amber-700 font-medium">
                  Result: Customer made whole, restaurant pays back what they received, platform absorbs {refund.currency} {parseFloat(refund.platform_commission).toFixed(2)} cost.
                </p>
              </div>
            </div>

            <div>
              <label className="block text-sm font-medium text-gray-700 mb-2">
                Admin Notes (Optional)
              </label>
              <textarea
                value={adminNotes}
                onChange={(e) => setAdminNotes(e.target.value)}
                className="w-full border border-gray-300 rounded-lg p-3 focus:ring-2 focus:ring-emerald-500 focus:border-emerald-500 transition-colors"
                rows={3}
                placeholder="Add any notes about this refund processing..."
              />
            </div>

            <div className="flex gap-3 pt-2">
              <button
                onClick={() => processMutation.mutate()}
                disabled={processMutation.isPending}
                className="flex-1 bg-emerald-600 hover:bg-emerald-700 disabled:bg-emerald-400 disabled:cursor-not-allowed text-white font-semibold py-3 px-4 rounded-lg transition-colors shadow-sm"
              >
                {processMutation.isPending ? 'Processing...' : 'Confirm & Process'}
              </button>
              <button
                onClick={() => setShowProcessModal(false)}
                disabled={processMutation.isPending}
                className="flex-1 bg-gray-100 hover:bg-gray-200 disabled:opacity-50 text-gray-800 font-semibold py-3 px-4 rounded-lg transition-colors"
              >
                Cancel
              </button>
            </div>

            {processMutation.isError && (
              <div className="bg-red-50 border border-red-200 text-red-700 px-4 py-3 rounded-lg text-sm">
                <p className="font-medium">Error processing refund:</p>
                <p className="mt-1">{processMutation.error instanceof Error ? processMutation.error.message : 'Unknown error'}</p>
              </div>
            )}
          </div>
        </Modal>
      )}

      {/* Cancel Modal */}
      {showCancelModal && (
        <Modal
          title="Cancel Refund Request"
          icon={<XCircle className="w-6 h-6 text-red-600" />}
          onClose={() => setShowCancelModal(false)}
        >
          <div className="space-y-4">
            <p className="text-gray-700">
              Are you sure you want to cancel this refund request? This action cannot be undone.
            </p>

            <div>
              <label className="block text-sm font-medium text-gray-700 mb-2">
                Reason for Cancellation <span className="text-red-600">*</span>
              </label>
              <textarea
                value={adminNotes}
                onChange={(e) => setAdminNotes(e.target.value)}
                className="w-full border border-gray-300 rounded-lg p-3 focus:ring-2 focus:ring-red-500 focus:border-red-500 transition-colors"
                rows={3}
                placeholder="Explain why this refund is being cancelled..."
                required
              />
            </div>

            <div className="flex gap-3 pt-2">
              <button
                onClick={() => cancelMutation.mutate()}
                disabled={cancelMutation.isPending || !adminNotes.trim()}
                className="flex-1 bg-red-600 hover:bg-red-700 disabled:bg-red-400 disabled:cursor-not-allowed text-white font-semibold py-3 px-4 rounded-lg transition-colors shadow-sm"
              >
                {cancelMutation.isPending ? 'Cancelling...' : 'Confirm Cancellation'}
              </button>
              <button
                onClick={() => setShowCancelModal(false)}
                disabled={cancelMutation.isPending}
                className="flex-1 bg-gray-100 hover:bg-gray-200 disabled:opacity-50 text-gray-800 font-semibold py-3 px-4 rounded-lg transition-colors"
              >
                Back
              </button>
            </div>

            {cancelMutation.isError && (
              <div className="bg-red-50 border border-red-200 text-red-700 px-4 py-3 rounded-lg text-sm">
                <p className="font-medium">Error cancelling refund:</p>
                <p className="mt-1">{cancelMutation.error instanceof Error ? cancelMutation.error.message : 'Unknown error'}</p>
              </div>
            )}
          </div>
        </Modal>
      )}

      {/* Commission Recovery Modal */}
      {showCommissionRecoveryModal && (
        <Modal
          title="Mark Commission as Recovered"
          icon={<CheckCircle className="w-6 h-6 text-emerald-600" />}
          onClose={() => setShowCommissionRecoveryModal(false)}
        >
          <div className="space-y-4">
            <div className="bg-blue-50 border border-blue-200 p-4 rounded-lg">
              <p className="text-sm text-blue-800">
                You are about to mark {refund.currency} {parseFloat(refund.platform_commission).toFixed(2)} as recovered from the restaurant.
                Only do this after you have successfully invoiced/collected this amount.
              </p>
            </div>

            <div>
              <label className="block text-sm font-medium text-gray-700 mb-2">
                Recovery Notes (Optional)
              </label>
              <textarea
                value={recoveryNotes}
                onChange={(e) => setRecoveryNotes(e.target.value)}
                className="w-full border border-gray-300 rounded-lg p-3 focus:ring-2 focus:ring-emerald-500 focus:border-emerald-500 transition-colors"
                rows={3}
                placeholder="E.g., Invoice #12345 paid on 2026-06-15, Wire transfer reference: ABC123..."
              />
            </div>

            <div className="flex gap-3 pt-2">
              <button
                onClick={() => commissionRecoveryMutation.mutate()}
                disabled={commissionRecoveryMutation.isPending}
                className="flex-1 bg-emerald-600 hover:bg-emerald-700 disabled:bg-emerald-400 disabled:cursor-not-allowed text-white font-semibold py-3 px-4 rounded-lg transition-colors shadow-sm"
              >
                {commissionRecoveryMutation.isPending ? 'Processing...' : 'Confirm Recovery'}
              </button>
              <button
                onClick={() => setShowCommissionRecoveryModal(false)}
                disabled={commissionRecoveryMutation.isPending}
                className="flex-1 bg-gray-100 hover:bg-gray-200 disabled:opacity-50 text-gray-800 font-semibold py-3 px-4 rounded-lg transition-colors"
              >
                Cancel
              </button>
            </div>

            {commissionRecoveryMutation.isError && (
              <div className="bg-red-50 border border-red-200 text-red-700 px-4 py-3 rounded-lg text-sm">
                <p className="font-medium">Error marking commission as recovered:</p>
                <p className="mt-1">{commissionRecoveryMutation.error instanceof Error ? commissionRecoveryMutation.error.message : 'Unknown error'}</p>
              </div>
            )}
          </div>
        </Modal>
      )}
    </div>
  )
}

// Helper Components
const InfoItem = ({
  label,
  value,
  mono = false,
  badge
}: {
  label: string
  value: string
  mono?: boolean
  badge?: 'amber' | 'emerald' | 'red' | 'gray'
}) => (
  <div>
    <p className="text-xs text-gray-500 mb-1 font-medium">{label}</p>
    {badge ? (
      <span className={`inline-flex px-3 py-1 rounded-md text-sm font-medium ${
        badge === 'amber' ? 'bg-amber-100 text-amber-800' :
        badge === 'emerald' ? 'bg-emerald-100 text-emerald-800' :
        badge === 'red' ? 'bg-red-100 text-red-800' :
        'bg-gray-100 text-gray-800'
      }`}>
        {value}
      </span>
    ) : (
      <p className={`text-sm font-medium text-gray-900 break-all ${mono ? 'font-mono' : ''}`}>
        {value}
      </p>
    )}
  </div>
)

const Modal = ({
  title,
  icon,
  children,
  onClose,
}: {
  title: string
  icon: React.ReactNode
  children: React.ReactNode
  onClose: () => void
}) => (
  <div className="fixed inset-0 bg-black/50 backdrop-blur-sm flex items-center justify-center p-4 z-50" onClick={onClose}>
    <div className="bg-white rounded-xl shadow-2xl max-w-md w-full p-6" onClick={(e) => e.stopPropagation()}>
      <div className="flex items-center gap-3 mb-6">
        {icon}
        <h3 className="text-xl font-semibold text-gray-900">{title}</h3>
      </div>
      {children}
    </div>
  </div>
)
