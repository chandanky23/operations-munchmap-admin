import { useState } from 'react'
import { useQuery } from '@tanstack/react-query'
import { useNavigate } from 'react-router-dom'
import { refundsApi } from '../api'
import { PendingRefundStatus, type PendingRefund } from '../types'
import { AlertCircle, CheckCircle, Clock, XCircle, ChevronRight, RefreshCw, Receipt } from 'lucide-react'

const statusConfig = {
  [PendingRefundStatus.PENDING_ADMIN_REVIEW]: {
    label: 'Pending Review',
    icon: Clock,
    color: 'bg-amber-50 text-amber-700 border-amber-200',
    badge: 'bg-amber-100 text-amber-800',
  },
  [PendingRefundStatus.APPROVED]: {
    label: 'Approved',
    icon: CheckCircle,
    color: 'bg-blue-50 text-blue-700 border-blue-200',
    badge: 'bg-blue-100 text-blue-800',
  },
  [PendingRefundStatus.PROCESSING]: {
    label: 'Processing',
    icon: Clock,
    color: 'bg-indigo-50 text-indigo-700 border-indigo-200',
    badge: 'bg-indigo-100 text-indigo-800',
  },
  [PendingRefundStatus.COMPLETED]: {
    label: 'Completed',
    icon: CheckCircle,
    color: 'bg-emerald-50 text-emerald-700 border-emerald-200',
    badge: 'bg-emerald-100 text-emerald-800',
  },
  [PendingRefundStatus.FAILED]: {
    label: 'Failed',
    icon: AlertCircle,
    color: 'bg-red-50 text-red-700 border-red-200',
    badge: 'bg-red-100 text-red-800',
  },
  [PendingRefundStatus.CANCELLED]: {
    label: 'Cancelled',
    icon: XCircle,
    color: 'bg-gray-50 text-gray-700 border-gray-200',
    badge: 'bg-gray-100 text-gray-800',
  },
}

export const Refunds = () => {
  const [statusFilter, setStatusFilter] = useState<PendingRefundStatus | 'all'>('all')
  const navigate = useNavigate()

  const { data, isLoading, error, refetch } = useQuery({
    queryKey: ['refunds', statusFilter],
    queryFn: () =>
      refundsApi.getRefunds(
        statusFilter === 'all' ? {} : { status: statusFilter }
      ),
    refetchInterval: 60000, // Poll every 1 minute (60000ms)
  })

  const refunds = data?.data || []

  const handleViewDetails = (refund: PendingRefund) => {
    navigate(`/refunds/${refund.id}`)
  }

  return (
    <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8 space-y-6">
      {/* Header */}
      <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
        <div>
          <div className="flex items-center gap-3 mb-2">
            <div className="p-2 bg-indigo-100 rounded-lg">
              <Receipt className="w-6 h-6 text-indigo-600" />
            </div>
            <h1 className="text-3xl font-bold text-gray-900">Refund Management</h1>
          </div>
          <p className="text-gray-600">
            Monitor and process refund requests from cancelled orders
          </p>
        </div>
        <button
          onClick={() => refetch()}
          className="inline-flex items-center gap-2 px-4 py-2.5 bg-white border border-gray-300 rounded-lg hover:bg-gray-50 transition-colors shadow-sm font-medium text-gray-700"
        >
          <RefreshCw className="w-4 h-4" />
          Refresh
        </button>
      </div>

      {/* Stats Overview */}
      <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
        <div className="bg-gradient-to-br from-amber-50 to-amber-100 border border-amber-200 rounded-xl p-5">
          <div className="flex items-center justify-between">
            <div>
              <p className="text-sm font-medium text-amber-700">Pending Review</p>
              <p className="text-2xl font-bold text-amber-900 mt-1">
                {refunds.filter(r => r.status === PendingRefundStatus.PENDING_ADMIN_REVIEW).length}
              </p>
            </div>
            <Clock className="w-8 h-8 text-amber-600 opacity-80" />
          </div>
        </div>
        <div className="bg-gradient-to-br from-emerald-50 to-emerald-100 border border-emerald-200 rounded-xl p-5">
          <div className="flex items-center justify-between">
            <div>
              <p className="text-sm font-medium text-emerald-700">Completed</p>
              <p className="text-2xl font-bold text-emerald-900 mt-1">
                {refunds.filter(r => r.status === PendingRefundStatus.COMPLETED).length}
              </p>
            </div>
            <CheckCircle className="w-8 h-8 text-emerald-600 opacity-80" />
          </div>
        </div>
        <div className="bg-gradient-to-br from-gray-50 to-gray-100 border border-gray-200 rounded-xl p-5">
          <div className="flex items-center justify-between">
            <div>
              <p className="text-sm font-medium text-gray-700">Total Refunds</p>
              <p className="text-2xl font-bold text-gray-900 mt-1">{refunds.length}</p>
            </div>
            <Receipt className="w-8 h-8 text-gray-600 opacity-80" />
          </div>
        </div>
      </div>

      {/* Filter Bar */}
      <div className="bg-white border border-gray-200 rounded-xl p-4 shadow-sm">
        <div className="flex flex-col sm:flex-row items-start sm:items-center gap-3">
          <div className="flex items-center gap-2 text-gray-700 font-medium">
            <Receipt className="w-5 h-5 text-gray-500" />
            Filter by Status:
          </div>
          <select
            value={statusFilter}
            onChange={(e) => setStatusFilter(e.target.value as PendingRefundStatus | 'all')}
            className="w-full sm:w-auto min-w-[200px] px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-indigo-500 focus:border-indigo-500 bg-white transition-colors"
          >
            <option value="all">All Statuses</option>
            {Object.entries(statusConfig).map(([value, config]) => (
              <option key={value} value={value}>
                {config.label}
              </option>
            ))}
          </select>
        </div>
      </div>

      {/* Error State */}
      {error && (
        <div className="bg-red-50 border border-red-200 rounded-xl p-4 flex items-start gap-3">
          <AlertCircle className="w-5 h-5 text-red-600 flex-shrink-0 mt-0.5" />
          <div className="flex-1">
            <p className="text-sm font-medium text-red-800">Error loading refunds</p>
            <p className="text-sm text-red-700 mt-1">
              {error instanceof Error ? error.message : 'Unknown error occurred'}
            </p>
          </div>
        </div>
      )}

      {/* Loading State */}
      {isLoading && (
        <div className="text-center py-16">
          <div className="inline-flex items-center gap-3 text-gray-600">
            <RefreshCw className="w-5 h-5 animate-spin" />
            <span className="text-lg font-medium">Loading refunds...</span>
          </div>
        </div>
      )}

      {/* Refunds List */}
      {!isLoading && !error && (
        <>
          {refunds.length === 0 ? (
            <div className="text-center py-16 bg-white border border-gray-200 rounded-xl">
              <Receipt className="w-16 h-16 text-gray-300 mx-auto mb-4" />
              <p className="text-lg font-medium text-gray-900 mb-1">No refunds found</p>
              <p className="text-sm text-gray-500">
                {statusFilter === 'all'
                  ? 'There are no refund requests at the moment'
                  : `No refunds with status "${statusConfig[statusFilter as PendingRefundStatus]?.label}"`
                }
              </p>
            </div>
          ) : (
            <div className="space-y-3">
              {refunds.map((refund) => {
                const config = statusConfig[refund.status]
                const Icon = config.icon

                return (
                  <div
                    key={refund.id}
                    onClick={() => handleViewDetails(refund)}
                    className="group bg-white border border-gray-200 rounded-xl p-6 hover:border-indigo-300 hover:shadow-md transition-all cursor-pointer"
                  >
                    <div className="flex items-start justify-between gap-4">
                      <div className="flex-1 min-w-0">
                        {/* Header */}
                        <div className="flex items-center gap-3 mb-3">
                          <div className={`p-2 rounded-lg ${config.color}`}>
                            <Icon className="w-5 h-5" />
                          </div>
                          <div className="flex-1 min-w-0">
                            <h3 className="text-lg font-semibold text-gray-900 truncate">
                              Refund #{refund.id.slice(0, 8)}
                            </h3>
                            <span className={`inline-flex items-center gap-1.5 px-2.5 py-1 rounded-md text-xs font-medium ${config.badge} mt-1`}>
                              <Icon className="w-3.5 h-3.5" />
                              {config.label}
                            </span>
                          </div>
                        </div>

                        {/* Details Grid */}
                        <div className="grid grid-cols-2 md:grid-cols-4 gap-4 mb-3">
                          <div>
                            <p className="text-xs text-gray-500 mb-1">Order ID</p>
                            <p className="text-sm font-medium text-gray-900 font-mono">
                              #{refund.order_id.slice(0, 8)}
                            </p>
                          </div>
                          <div>
                            <p className="text-xs text-gray-500 mb-1">Refund Amount</p>
                            <p className="text-sm font-semibold text-emerald-600">
                              {refund.currency} {parseFloat(refund.total_amount).toFixed(2)}
                            </p>
                          </div>
                          <div>
                            <p className="text-xs text-gray-500 mb-1">Commission</p>
                            <p className="text-sm font-semibold text-indigo-600">
                              {refund.currency} {parseFloat(refund.platform_commission).toFixed(2)}
                            </p>
                          </div>
                          <div>
                            <p className="text-xs text-gray-500 mb-1">Created</p>
                            <p className="text-sm font-medium text-gray-900">
                              {new Date(refund.created_at).toLocaleDateString('en-US', {
                                month: 'short',
                                day: 'numeric',
                                year: 'numeric'
                              })}
                            </p>
                          </div>
                        </div>

                        {/* Cancellation Reason */}
                        {refund.cancellation_reason && (
                          <div className="bg-gray-50 border border-gray-200 rounded-lg p-3">
                            <p className="text-xs font-medium text-gray-700 mb-1">Cancellation Reason</p>
                            <p className="text-sm text-gray-600 line-clamp-2">
                              {refund.cancellation_reason}
                            </p>
                          </div>
                        )}
                      </div>

                      {/* Action Button */}
                      <button
                        onClick={(e) => {
                          e.stopPropagation()
                          handleViewDetails(refund)
                        }}
                        className="flex-shrink-0 p-2 text-gray-400 group-hover:text-indigo-600 group-hover:bg-indigo-50 rounded-lg transition-all"
                        aria-label="View details"
                      >
                        <ChevronRight className="w-6 h-6" />
                      </button>
                    </div>
                  </div>
                )
              })}
            </div>
          )}
        </>
      )}
    </div>
  )
}
