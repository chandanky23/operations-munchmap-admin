import { useState } from 'react'
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query'
import { shopsApi } from '../api'
import { Verification, type Shop } from '../types'
import {
  AlertCircle,
  CheckCircle,
  Clock,
  XCircle,
  RefreshCw,
  Store,
  AlertTriangle,
  Mail,
  Phone,
  CheckCircle2,
  X,
  Edit,
} from 'lucide-react'

const verificationStatusConfig = {
  [Verification.PENDING_VERIFICATION]: {
    label: 'Pending Verification',
    icon: Clock,
    color: 'bg-amber-50 text-amber-700 border-amber-200',
    badge: 'bg-amber-100 text-amber-800 border-amber-300',
    priority: 1, // Highest priority - needs action
  },
  [Verification.VERIFIED]: {
    label: 'Verified',
    icon: CheckCircle,
    color: 'bg-emerald-50 text-emerald-700 border-emerald-200',
    badge: 'bg-emerald-100 text-emerald-800 border-emerald-300',
    priority: 4,
  },
  [Verification.OPEN]: {
    label: 'Open',
    icon: CheckCircle2,
    color: 'bg-green-50 text-green-700 border-green-200',
    badge: 'bg-green-100 text-green-800 border-green-300',
    priority: 5,
  },
  [Verification.REJECTED]: {
    label: 'Rejected',
    icon: XCircle,
    color: 'bg-red-50 text-red-700 border-red-200',
    badge: 'bg-red-100 text-red-800 border-red-300',
    priority: 3,
  },
  [Verification.CLOSED]: {
    label: 'Closed',
    icon: X,
    color: 'bg-gray-50 text-gray-700 border-gray-200',
    badge: 'bg-gray-100 text-gray-800 border-gray-300',
    priority: 6,
  },
  [Verification.FRAUD]: {
    label: 'Fraud',
    icon: AlertTriangle,
    color: 'bg-red-50 text-red-700 border-red-200',
    badge: 'bg-red-100 text-red-800 border-red-300',
    priority: 2,
  },
}

export const RestaurantApprovals = () => {
  const [verificationFilter, setVerificationFilter] = useState<Verification | 'all'>('all')
  const [stripeConnectedFilter, setStripeConnectedFilter] = useState(false)
  const [hasMenuFilter, setHasMenuFilter] = useState(false)
  const [page, setPage] = useState(0)
  const [pageSize] = useState(20)
  const queryClient = useQueryClient()

  // Modal state for status change
  const [showStatusModal, setShowStatusModal] = useState(false)
  const [selectedShop, setSelectedShop] = useState<Shop | null>(null)
  const [newStatus, setNewStatus] = useState<Verification | ''>('')
  const [statusNotes, setStatusNotes] = useState('')

  // Fetch filtered shops for the list
  const { data, isLoading, error, refetch } = useQuery({
    queryKey: ['shops', verificationFilter, stripeConnectedFilter, hasMenuFilter, page, pageSize],
    queryFn: () =>
      shopsApi.getShops({
        page,
        page_size: pageSize,
        ...(verificationFilter !== 'all' ? { verification_status: verificationFilter } : {}),
        ...(stripeConnectedFilter ? { stripe_connected: true } : {}),
        ...(hasMenuFilter ? { has_menu: true } : {}),
      }),
  })

  // Fetch stats for all shops (unfiltered, just first page to get counts)
  const { data: statsData } = useQuery({
    queryKey: ['shops-stats'],
    queryFn: () =>
      shopsApi.getShops({
        page: 0,
        page_size: 100, // Get enough to count accurately
      }),
    staleTime: 60000, // Cache for 1 minute
  })

  const approveMutation = useMutation({
    mutationFn: (shopId: string) => shopsApi.approveShop(shopId),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['shops'] })
      queryClient.invalidateQueries({ queryKey: ['shops-stats'] })
    },
  })

  const rejectMutation = useMutation({
    mutationFn: ({ shopId, reason }: { shopId: string; reason?: string }) =>
      shopsApi.rejectShop(shopId, { reason }),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['shops'] })
      queryClient.invalidateQueries({ queryKey: ['shops-stats'] })
    },
  })

  const updateStatusMutation = useMutation({
    mutationFn: ({ shopId, status, notes }: { shopId: string; status: Verification; notes?: string }) =>
      shopsApi.updateVerificationStatus(shopId, { verification_status: status, notes }),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['shops'] })
      queryClient.invalidateQueries({ queryKey: ['shops-stats'] })
      setShowStatusModal(false)
      setSelectedShop(null)
      setNewStatus('')
      setStatusNotes('')
    },
  })

  const shops = data?.data || []
  const pagination = data?.pagination
  const allShops = statsData?.data || []

  // Calculate stats from all shops (unfiltered)
  const pendingCount = allShops.filter(
    (s) => s.verification_status === Verification.PENDING_VERIFICATION
  ).length
  const verifiedCount = allShops.filter(
    (s) => s.verification_status === Verification.VERIFIED
  ).length
  const totalCount = statsData?.pagination?.total_items || 0

  const handleApprove = async (e: React.MouseEvent, shop: Shop) => {
    e.stopPropagation()
    if (confirm(`Approve restaurant "${shop.name}"?`)) {
      try {
        await approveMutation.mutateAsync(shop.id)
      } catch (error) {
        alert(`Failed to approve: ${error instanceof Error ? error.message : 'Unknown error'}`)
      }
    }
  }

  const handleReject = async (e: React.MouseEvent, shop: Shop) => {
    e.stopPropagation()
    const reason = prompt(`Reject restaurant "${shop.name}"? Please provide a reason:`)
    if (reason !== null) {
      try {
        await rejectMutation.mutateAsync({ shopId: shop.id, reason })
      } catch (error) {
        alert(`Failed to reject: ${error instanceof Error ? error.message : 'Unknown error'}`)
      }
    }
  }

  const handleChangeStatus = (e: React.MouseEvent, shop: Shop) => {
    e.stopPropagation()
    setSelectedShop(shop)
    setNewStatus(shop.verification_status)
    setShowStatusModal(true)
  }

  const handleSubmitStatusChange = async () => {
    if (!selectedShop || !newStatus) return

    try {
      await updateStatusMutation.mutateAsync({
        shopId: selectedShop.id,
        status: newStatus as Verification,
        notes: statusNotes || undefined,
      })
    } catch (error) {
      alert(`Failed to update status: ${error instanceof Error ? error.message : 'Unknown error'}`)
    }
  }

  return (
    <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8 space-y-6">
      {/* Header */}
      <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
        <div>
          <div className="flex items-center gap-3 mb-2">
            <div className="p-2 bg-purple-100 rounded-lg">
              <Store className="w-6 h-6 text-purple-600" />
            </div>
            <h1 className="text-3xl font-bold text-gray-900">Restaurant Approvals</h1>
          </div>
          <p className="text-gray-600">Review and approve new restaurant registrations</p>
        </div>
        <button
          onClick={() => refetch()}
          className="inline-flex items-center gap-2 px-4 py-2.5 bg-white border border-gray-300 rounded-lg hover:bg-gray-50 transition-colors shadow-sm font-medium text-gray-700"
        >
          <RefreshCw className="w-4 h-4" />
          Refresh
        </button>
      </div>

      {/* Pending Action Alert */}
      {pendingCount > 0 && verificationFilter === 'all' && (
        <div className="bg-amber-50 border-2 border-amber-300 rounded-xl p-5 flex items-start gap-4">
          <div className="flex-shrink-0">
            <AlertCircle className="w-6 h-6 text-amber-600" />
          </div>
          <div className="flex-1">
            <h3 className="text-lg font-semibold text-amber-900 mb-1">Action Required</h3>
            <p className="text-amber-800">
              You have <span className="font-bold">{pendingCount}</span> restaurant
              {pendingCount === 1 ? '' : 's'} pending verification that require admin review.
            </p>
          </div>
          <button
            onClick={() => setVerificationFilter(Verification.PENDING_VERIFICATION)}
            className="px-4 py-2 bg-amber-600 hover:bg-amber-700 text-white font-medium rounded-lg transition-colors"
          >
            View Pending
          </button>
        </div>
      )}

      {/* Stats Overview */}
      <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
        <div className="bg-gradient-to-br from-amber-50 to-amber-100 border border-amber-200 rounded-xl p-5">
          <div className="flex items-center justify-between">
            <div>
              <p className="text-sm font-medium text-amber-700">Pending Verification</p>
              <p className="text-2xl font-bold text-amber-900 mt-1">{pendingCount}</p>
            </div>
            <Clock className="w-8 h-8 text-amber-600 opacity-80" />
          </div>
        </div>
        <div className="bg-gradient-to-br from-emerald-50 to-emerald-100 border border-emerald-200 rounded-xl p-5">
          <div className="flex items-center justify-between">
            <div>
              <p className="text-sm font-medium text-emerald-700">Verified</p>
              <p className="text-2xl font-bold text-emerald-900 mt-1">{verifiedCount}</p>
            </div>
            <CheckCircle className="w-8 h-8 text-emerald-600 opacity-80" />
          </div>
        </div>
        <div className="bg-gradient-to-br from-gray-50 to-gray-100 border border-gray-200 rounded-xl p-5">
          <div className="flex items-center justify-between">
            <div>
              <p className="text-sm font-medium text-gray-700">Total Restaurants</p>
              <p className="text-2xl font-bold text-gray-900 mt-1">{totalCount}</p>
            </div>
            <Store className="w-8 h-8 text-gray-600 opacity-80" />
          </div>
        </div>
      </div>

      {/* Filter Bar */}
      <div className="bg-white border border-gray-200 rounded-xl p-4 shadow-sm">
        <div className="flex flex-col gap-4">
          {/* Status Filter */}
          <div className="flex flex-col sm:flex-row items-start sm:items-center gap-3">
            <div className="flex items-center gap-2 text-gray-700 font-medium">
              <Store className="w-5 h-5 text-gray-500" />
              Filter by Status:
            </div>
            <select
              value={verificationFilter}
              onChange={(e) => {
                setVerificationFilter(e.target.value as Verification | 'all')
                setPage(0) // Reset to first page when filter changes
              }}
              className="w-full sm:w-auto min-w-[200px] px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-purple-500 focus:border-purple-500 bg-white transition-colors"
            >
              <option value="all">All Statuses</option>
              {Object.entries(verificationStatusConfig).map(([value, config]) => (
                <option key={value} value={value}>
                  {config.label}
                </option>
              ))}
            </select>
          </div>

          {/* Additional Filters */}
          <div className="flex flex-col sm:flex-row items-start sm:items-center gap-4 pt-3 border-t border-gray-200">
            <div className="text-gray-700 font-medium text-sm">Additional Filters:</div>
            <label className="flex items-center gap-2 cursor-pointer">
              <input
                type="checkbox"
                checked={stripeConnectedFilter}
                onChange={(e) => {
                  setStripeConnectedFilter(e.target.checked)
                  setPage(0)
                }}
                className="w-4 h-4 text-purple-600 border-gray-300 rounded focus:ring-2 focus:ring-purple-500"
              />
              <span className="text-sm text-gray-700">Connected to Stripe</span>
            </label>
            <label className="flex items-center gap-2 cursor-pointer">
              <input
                type="checkbox"
                checked={hasMenuFilter}
                onChange={(e) => {
                  setHasMenuFilter(e.target.checked)
                  setPage(0)
                }}
                className="w-4 h-4 text-purple-600 border-gray-300 rounded focus:ring-2 focus:ring-purple-500"
              />
              <span className="text-sm text-gray-700">Menu Created</span>
            </label>
          </div>
        </div>
      </div>

      {/* Error State */}
      {error && (
        <div className="bg-red-50 border border-red-200 rounded-xl p-4 flex items-start gap-3">
          <AlertCircle className="w-5 h-5 text-red-600 flex-shrink-0 mt-0.5" />
          <div className="flex-1">
            <p className="text-sm font-medium text-red-800">Error loading restaurants</p>
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
            <span className="text-lg font-medium">Loading restaurants...</span>
          </div>
        </div>
      )}

      {/* Restaurants List */}
      {!isLoading && !error && (
        <>
          {shops.length === 0 ? (
            <div className="text-center py-16 bg-white border border-gray-200 rounded-xl">
              <Store className="w-16 h-16 text-gray-300 mx-auto mb-4" />
              <p className="text-lg font-medium text-gray-900 mb-1">No restaurants found</p>
              <p className="text-sm text-gray-500">
                {verificationFilter === 'all'
                  ? 'There are no restaurant registrations at the moment'
                  : `No restaurants with status "${verificationStatusConfig[verificationFilter as Verification]?.label}"`}
              </p>
            </div>
          ) : (
            <>
              <div className="space-y-3">
                {shops.map((shop) => {
                  const config = verificationStatusConfig[shop.verification_status]
                  const Icon = config.icon
                  const isPending = shop.verification_status === Verification.PENDING_VERIFICATION

                  return (
                    <div
                      key={shop.id}
                      className={`bg-white border rounded-xl p-6 transition-all ${
                        isPending ? 'border-2 border-amber-300 bg-amber-50' : 'border-gray-200'
                      }`}
                    >
                      <div className="flex items-start justify-between gap-4">
                        <div className="flex-1 min-w-0">
                          {/* Pending Badge */}
                          {isPending && (
                            <div className="inline-flex items-center gap-1.5 px-3 py-1 rounded-full bg-amber-200 text-amber-900 text-xs font-bold mb-3 border-2 border-amber-400">
                              <AlertCircle className="w-3.5 h-3.5" />
                              REQUIRES APPROVAL
                            </div>
                          )}

                          {/* Header */}
                          <div className="flex items-center gap-3 mb-3">
                            <div className={`p-2 rounded-lg ${config.color}`}>
                              <Icon className="w-5 h-5" />
                            </div>
                            <div className="flex-1 min-w-0">
                              <h3 className="text-lg font-semibold text-gray-900 truncate">
                                {shop.name}
                                {shop.branch && (
                                  <span className="text-gray-500 font-normal ml-2">({shop.branch})</span>
                                )}
                              </h3>
                              <span
                                className={`inline-flex items-center gap-1.5 px-2.5 py-1 rounded-md text-xs font-medium ${config.badge} mt-1`}
                              >
                                <Icon className="w-3.5 h-3.5" />
                                {config.label}
                              </span>
                            </div>
                          </div>

                          {/* Details Grid */}
                          <div className="grid grid-cols-2 md:grid-cols-4 gap-4 mb-3">
                            <div>
                              <p className="text-xs text-gray-500 mb-1 flex items-center gap-1">
                                <Mail className="w-3 h-3" />
                                Email
                              </p>
                              <p className="text-sm font-medium text-gray-900 truncate">{shop.email}</p>
                            </div>
                            <div>
                              <p className="text-xs text-gray-500 mb-1 flex items-center gap-1">
                                <Phone className="w-3 h-3" />
                                Phone
                              </p>
                              <p className="text-sm font-medium text-gray-900">{shop.phone_number}</p>
                            </div>
                            <div>
                              <p className="text-xs text-gray-500 mb-1">Cuisines</p>
                              <p className="text-sm font-medium text-gray-900 truncate">
                                {shop.cuisines?.join(', ') || 'N/A'}
                              </p>
                            </div>
                            <div>
                              <p className="text-xs text-gray-500 mb-1">Registered</p>
                              <p className="text-sm font-medium text-gray-900">
                                {new Date(shop.created_at).toLocaleDateString('en-US', {
                                  month: 'short',
                                  day: 'numeric',
                                  year: 'numeric',
                                })}
                              </p>
                            </div>
                          </div>

                          {/* Stripe Connect Status (shown when filter is active) */}
                          {shop.stripe_connect && (
                            <div className="bg-gradient-to-r from-purple-50 to-blue-50 border border-purple-200 rounded-lg p-3 mb-3">
                              <div className="flex items-center gap-2 mb-2">
                                <CheckCircle2 className="w-4 h-4 text-purple-600" />
                                <span className="text-sm font-semibold text-purple-900">Stripe Connected</span>
                              </div>
                              <div className="grid grid-cols-2 gap-3 text-xs">
                                <div>
                                  <span className="text-gray-600">Account: </span>
                                  <span className="font-mono text-gray-900">{shop.stripe_connect.stripe_account_id.slice(0, 20)}...</span>
                                </div>
                                <div>
                                  <span className="text-gray-600">Status: </span>
                                  <span className={`font-medium ${shop.stripe_connect.status === 'ACTIVE' ? 'text-green-700' : 'text-amber-700'}`}>
                                    {shop.stripe_connect.status}
                                  </span>
                                </div>
                                <div>
                                  <span className="text-gray-600">Charges: </span>
                                  <span className={`font-medium ${shop.stripe_connect.charges_enabled ? 'text-green-700' : 'text-red-700'}`}>
                                    {shop.stripe_connect.charges_enabled ? '✓ Enabled' : '✗ Disabled'}
                                  </span>
                                </div>
                                <div>
                                  <span className="text-gray-600">Payouts: </span>
                                  <span className={`font-medium ${shop.stripe_connect.payouts_enabled ? 'text-green-700' : 'text-red-700'}`}>
                                    {shop.stripe_connect.payouts_enabled ? '✓ Enabled' : '✗ Disabled'}
                                  </span>
                                </div>
                              </div>
                            </div>
                          )}

                          {/* Action Buttons */}
                          <div className={`flex gap-2 mt-4 pt-4 ${isPending ? 'border-t border-amber-200' : 'border-t border-gray-200'}`}>
                            {isPending && (
                              <>
                                <button
                                  onClick={(e) => handleApprove(e, shop)}
                                  disabled={approveMutation.isPending}
                                  className="inline-flex items-center gap-2 px-4 py-2 bg-emerald-600 hover:bg-emerald-700 disabled:bg-emerald-400 text-white font-medium rounded-lg transition-colors"
                                >
                                  <CheckCircle className="w-4 h-4" />
                                  {approveMutation.isPending ? 'Approving...' : 'Approve'}
                                </button>
                                <button
                                  onClick={(e) => handleReject(e, shop)}
                                  disabled={rejectMutation.isPending}
                                  className="inline-flex items-center gap-2 px-4 py-2 bg-red-600 hover:bg-red-700 disabled:bg-red-400 text-white font-medium rounded-lg transition-colors"
                                >
                                  <XCircle className="w-4 h-4" />
                                  {rejectMutation.isPending ? 'Rejecting...' : 'Reject'}
                                </button>
                              </>
                            )}
                            <button
                              onClick={(e) => handleChangeStatus(e, shop)}
                              className="inline-flex items-center gap-2 px-4 py-2 bg-gray-600 hover:bg-gray-700 text-white font-medium rounded-lg transition-colors ml-auto"
                            >
                              <Edit className="w-4 h-4" />
                              Change Status
                            </button>
                          </div>
                        </div>
                      </div>
                    </div>
                  )
                })}
              </div>

              {/* Pagination */}
              {pagination && pagination.total_pages > 1 && (
                <div className="flex items-center justify-between bg-white border border-gray-200 rounded-xl p-4">
                  <div className="text-sm text-gray-600">
                    Showing {page * pageSize + 1} to {Math.min((page + 1) * pageSize, pagination.total_items)} of{' '}
                    {pagination.total_items} restaurants
                  </div>
                  <div className="flex gap-2">
                    <button
                      onClick={() => setPage(page - 1)}
                      disabled={page === 0}
                      className="px-4 py-2 border border-gray-300 rounded-lg hover:bg-gray-50 disabled:opacity-50 disabled:cursor-not-allowed transition-colors font-medium"
                    >
                      Previous
                    </button>
                    <div className="flex items-center gap-1">
                      {Array.from({ length: pagination.total_pages }, (_, i) => i)
                        .filter(
                          (i) =>
                            i === 0 ||
                            i === pagination.total_pages - 1 ||
                            Math.abs(i - page) <= 1
                        )
                        .map((i, idx, arr) => (
                          <>
                            {idx > 0 && arr[idx - 1] !== i - 1 && (
                              <span key={`ellipsis-${i}`} className="px-2 text-gray-400">
                                ...
                              </span>
                            )}
                            <button
                              key={i}
                              onClick={() => setPage(i)}
                              className={`px-4 py-2 rounded-lg font-medium transition-colors ${
                                page === i
                                  ? 'bg-purple-600 text-white'
                                  : 'border border-gray-300 hover:bg-gray-50'
                              }`}
                            >
                              {i + 1}
                            </button>
                          </>
                        ))}
                    </div>
                    <button
                      onClick={() => setPage(page + 1)}
                      disabled={page >= pagination.total_pages - 1}
                      className="px-4 py-2 border border-gray-300 rounded-lg hover:bg-gray-50 disabled:opacity-50 disabled:cursor-not-allowed transition-colors font-medium"
                    >
                      Next
                    </button>
                  </div>
                </div>
              )}
            </>
          )}
        </>
      )}

      {/* Status Change Modal */}
      {showStatusModal && selectedShop && (
        <div className="fixed inset-0 bg-black/50 backdrop-blur-sm flex items-center justify-center p-4 z-50" onClick={() => setShowStatusModal(false)}>
          <div className="bg-white rounded-xl shadow-2xl max-w-md w-full p-6" onClick={(e) => e.stopPropagation()}>
            <div className="flex items-center gap-3 mb-6">
              <div className="p-2 bg-purple-100 rounded-lg">
                <Edit className="w-6 h-6 text-purple-600" />
              </div>
              <h3 className="text-xl font-semibold text-gray-900">Change Verification Status</h3>
            </div>

            <div className="space-y-4">
              {/* Restaurant Info */}
              <div className="bg-gray-50 border border-gray-200 p-4 rounded-lg">
                <p className="text-sm text-gray-600 mb-1">Restaurant</p>
                <p className="font-semibold text-gray-900">
                  {selectedShop.name}
                  {selectedShop.branch && <span className="text-gray-500 font-normal ml-2">({selectedShop.branch})</span>}
                </p>
                <p className="text-sm text-gray-600 mt-2">Current Status</p>
                <span className={`inline-flex items-center gap-1.5 px-2.5 py-1 rounded-md text-xs font-medium mt-1 ${verificationStatusConfig[selectedShop.verification_status].badge}`}>
                  {verificationStatusConfig[selectedShop.verification_status].label}
                </span>
              </div>

              {/* New Status Selection */}
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">
                  New Verification Status <span className="text-red-600">*</span>
                </label>
                <select
                  value={newStatus}
                  onChange={(e) => setNewStatus(e.target.value as Verification)}
                  className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-purple-500 focus:border-purple-500 bg-white transition-colors"
                >
                  <option value="">Select status...</option>
                  {Object.entries(verificationStatusConfig).map(([value, config]) => (
                    <option key={value} value={value}>
                      {config.label}
                    </option>
                  ))}
                </select>
              </div>

              {/* Notes */}
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">
                  Notes (Optional)
                </label>
                <textarea
                  value={statusNotes}
                  onChange={(e) => setStatusNotes(e.target.value)}
                  className="w-full border border-gray-300 rounded-lg p-3 focus:ring-2 focus:ring-purple-500 focus:border-purple-500 transition-colors"
                  rows={3}
                  placeholder="Add any notes about this status change..."
                />
              </div>

              {/* Warning if changing TO a restrictive status FROM a non-restrictive status */}
              {newStatus &&
               selectedShop &&
               (newStatus === Verification.REJECTED || newStatus === Verification.FRAUD) &&
               (selectedShop.verification_status !== Verification.REJECTED && selectedShop.verification_status !== Verification.FRAUD) && (
                <div className="bg-red-50 border border-red-200 p-4 rounded-lg flex gap-3">
                  <AlertTriangle className="w-5 h-5 text-red-600 flex-shrink-0 mt-0.5" />
                  <div className="text-sm text-red-800">
                    <p className="font-semibold mb-1">Warning</p>
                    <p>
                      You are changing the status to <strong>{verificationStatusConfig[newStatus].label}</strong>.
                      This may prevent the restaurant from accessing their account. Please ensure this is intentional.
                    </p>
                  </div>
                </div>
              )}

              {/* Info message when changing FROM a restrictive status TO a normal status */}
              {newStatus &&
               selectedShop &&
               (selectedShop.verification_status === Verification.REJECTED || selectedShop.verification_status === Verification.FRAUD) &&
               (newStatus !== Verification.REJECTED && newStatus !== Verification.FRAUD) && (
                <div className="bg-blue-50 border border-blue-200 p-4 rounded-lg flex gap-3">
                  <CheckCircle className="w-5 h-5 text-blue-600 flex-shrink-0 mt-0.5" />
                  <div className="text-sm text-blue-800">
                    <p className="font-semibold mb-1">Access Restoration</p>
                    <p>
                      You are changing the status from <strong>{verificationStatusConfig[selectedShop.verification_status].label}</strong> to <strong>{verificationStatusConfig[newStatus].label}</strong>.
                      This will restore the restaurant's access to their account.
                    </p>
                  </div>
                </div>
              )}

              {/* Action Buttons */}
              <div className="flex gap-3 pt-2">
                <button
                  onClick={handleSubmitStatusChange}
                  disabled={updateStatusMutation.isPending || !newStatus || newStatus === selectedShop.verification_status}
                  className="flex-1 bg-purple-600 hover:bg-purple-700 disabled:bg-purple-400 disabled:cursor-not-allowed text-white font-semibold py-3 px-4 rounded-lg transition-colors shadow-sm"
                >
                  {updateStatusMutation.isPending ? 'Updating...' : 'Update Status'}
                </button>
                <button
                  onClick={() => {
                    setShowStatusModal(false)
                    setSelectedShop(null)
                    setNewStatus('')
                    setStatusNotes('')
                  }}
                  disabled={updateStatusMutation.isPending}
                  className="flex-1 bg-gray-100 hover:bg-gray-200 disabled:opacity-50 text-gray-800 font-semibold py-3 px-4 rounded-lg transition-colors"
                >
                  Cancel
                </button>
              </div>

              {/* Error Display */}
              {updateStatusMutation.isError && (
                <div className="bg-red-50 border border-red-200 text-red-700 px-4 py-3 rounded-lg text-sm">
                  <p className="font-medium">Error updating status:</p>
                  <p className="mt-1">{updateStatusMutation.error instanceof Error ? updateStatusMutation.error.message : 'Unknown error'}</p>
                </div>
              )}
            </div>
          </div>
        </div>
      )}
    </div>
  )
}
