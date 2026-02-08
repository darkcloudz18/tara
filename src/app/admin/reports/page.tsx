'use client'

import { useState, useEffect } from 'react'
import {
  Flag,
  CheckCircle,
  XCircle,
  Clock,
  Eye,
  Loader2,
  AlertTriangle,
  User,
  Map,
  MessageSquare,
} from 'lucide-react'
import { adminService, ContentReport } from '@/features/admin/services/adminService'
import { formatDistanceToNow } from 'date-fns'
import { useToast } from '@/contexts/ToastContext'

export default function AdminReportsPage() {
  const { success, error } = useToast()
  const [reports, setReports] = useState<ContentReport[]>([])
  const [loading, setLoading] = useState(true)
  const [statusFilter, setStatusFilter] = useState<string>('pending')
  const [reviewModal, setReviewModal] = useState<ContentReport | null>(null)
  const [actionTaken, setActionTaken] = useState('')

  useEffect(() => {
    loadReports()
  }, [statusFilter])

  const loadReports = async () => {
    setLoading(true)
    const data = await adminService.getReports(statusFilter || undefined)
    setReports(data)
    setLoading(false)
  }

  const handleReview = async (status: 'resolved' | 'dismissed') => {
    if (!reviewModal) return

    const ok = await adminService.updateReport(reviewModal.id, status, actionTaken)
    if (ok) {
      success(`Report ${status}`)
      loadReports()
    } else {
      error('Failed to update report')
    }
    setReviewModal(null)
    setActionTaken('')
  }

  const getContentIcon = (type: string) => {
    switch (type) {
      case 'trip':
        return <Map className="w-4 h-4" />
      case 'user':
        return <User className="w-4 h-4" />
      case 'comment':
      case 'review':
        return <MessageSquare className="w-4 h-4" />
      default:
        return <Flag className="w-4 h-4" />
    }
  }

  const getReasonLabel = (reason: string) => {
    const labels: Record<string, string> = {
      spam: 'Spam',
      inappropriate: 'Inappropriate Content',
      misleading: 'Misleading Information',
      harassment: 'Harassment',
      other: 'Other',
    }
    return labels[reason] || reason
  }

  const getStatusBadge = (status: string) => {
    switch (status) {
      case 'pending':
        return (
          <span className="inline-flex items-center gap-1 px-2 py-1 bg-yellow-100 dark:bg-yellow-900/30 text-yellow-700 dark:text-yellow-400 text-xs font-medium rounded">
            <Clock className="w-3 h-3" />
            Pending
          </span>
        )
      case 'reviewed':
        return (
          <span className="inline-flex items-center gap-1 px-2 py-1 bg-blue-100 dark:bg-blue-900/30 text-blue-700 dark:text-blue-400 text-xs font-medium rounded">
            <Eye className="w-3 h-3" />
            Reviewed
          </span>
        )
      case 'resolved':
        return (
          <span className="inline-flex items-center gap-1 px-2 py-1 bg-green-100 dark:bg-green-900/30 text-green-700 dark:text-green-400 text-xs font-medium rounded">
            <CheckCircle className="w-3 h-3" />
            Resolved
          </span>
        )
      case 'dismissed':
        return (
          <span className="inline-flex items-center gap-1 px-2 py-1 bg-gray-100 dark:bg-gray-800 text-gray-600 dark:text-gray-400 text-xs font-medium rounded">
            <XCircle className="w-3 h-3" />
            Dismissed
          </span>
        )
      default:
        return null
    }
  }

  return (
    <div className="p-6 lg:p-8">
      {/* Header */}
      <div className="mb-6">
        <h1 className="text-2xl font-bold text-gray-900 dark:text-white">Reports</h1>
        <p className="text-gray-500 dark:text-gray-400">Review user-reported content</p>
      </div>

      {/* Filters */}
      <div className="mb-6 flex items-center gap-2 flex-wrap">
        {['pending', 'reviewed', 'resolved', 'dismissed', ''].map((status) => (
          <button
            key={status || 'all'}
            onClick={() => setStatusFilter(status)}
            className={`px-4 py-2 rounded-lg font-medium transition-colors ${
              statusFilter === status
                ? 'bg-teal-600 text-white'
                : 'bg-gray-100 dark:bg-gray-800 text-gray-600 dark:text-gray-400 hover:bg-gray-200 dark:hover:bg-gray-700'
            }`}
          >
            {status ? status.charAt(0).toUpperCase() + status.slice(1) : 'All'}
          </button>
        ))}
      </div>

      {/* Reports list */}
      <div className="bg-white dark:bg-gray-900 rounded-xl border border-gray-200 dark:border-gray-800 overflow-hidden">
        {loading ? (
          <div className="flex justify-center py-12">
            <Loader2 className="w-8 h-8 text-teal-600 animate-spin" />
          </div>
        ) : reports.length === 0 ? (
          <div className="py-12 text-center">
            <Flag className="w-12 h-12 text-gray-300 dark:text-gray-600 mx-auto mb-4" />
            <p className="text-gray-500 dark:text-gray-400">No reports found</p>
          </div>
        ) : (
          <div className="divide-y divide-gray-100 dark:divide-gray-800">
            {reports.map((report) => (
              <div
                key={report.id}
                className="p-4 hover:bg-gray-50 dark:hover:bg-gray-800/50 cursor-pointer"
                onClick={() => setReviewModal(report)}
              >
                <div className="flex items-start justify-between gap-4">
                  <div className="flex items-start gap-3">
                    <div className="w-10 h-10 rounded-lg bg-red-100 dark:bg-red-900/30 flex items-center justify-center text-red-600 dark:text-red-400">
                      <AlertTriangle className="w-5 h-5" />
                    </div>
                    <div>
                      <div className="flex items-center gap-2 mb-1">
                        <span className="inline-flex items-center gap-1 px-2 py-0.5 bg-gray-100 dark:bg-gray-800 text-gray-700 dark:text-gray-300 text-xs font-medium rounded">
                          {getContentIcon(report.content_type)}
                          {report.content_type}
                        </span>
                        {getStatusBadge(report.status)}
                      </div>
                      <p className="font-medium text-gray-900 dark:text-white">
                        {getReasonLabel(report.reason)}
                      </p>
                      {report.details && (
                        <p className="text-sm text-gray-500 dark:text-gray-400 mt-1 line-clamp-2">
                          {report.details}
                        </p>
                      )}
                      <p className="text-xs text-gray-400 mt-2">
                        Reported by {report.reporter?.username || report.reporter?.email || 'Unknown'} •{' '}
                        {formatDistanceToNow(new Date(report.created_at), { addSuffix: true })}
                      </p>
                    </div>
                  </div>
                </div>
              </div>
            ))}
          </div>
        )}
      </div>

      {/* Review Modal */}
      {reviewModal && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/60 backdrop-blur-sm">
          <div className="w-full max-w-lg mx-4 bg-white dark:bg-gray-900 rounded-2xl shadow-2xl overflow-hidden">
            <div className="px-6 py-4 border-b border-gray-200 dark:border-gray-800">
              <h3 className="text-lg font-semibold text-gray-900 dark:text-white">
                Review Report
              </h3>
            </div>
            <div className="p-6 space-y-4">
              <div className="flex items-center gap-2">
                <span className="text-sm font-medium text-gray-500 dark:text-gray-400">Type:</span>
                <span className="inline-flex items-center gap-1 px-2 py-0.5 bg-gray-100 dark:bg-gray-800 text-gray-700 dark:text-gray-300 text-xs font-medium rounded">
                  {getContentIcon(reviewModal.content_type)}
                  {reviewModal.content_type}
                </span>
              </div>
              <div>
                <span className="text-sm font-medium text-gray-500 dark:text-gray-400">Reason:</span>
                <p className="text-gray-900 dark:text-white mt-1">
                  {getReasonLabel(reviewModal.reason)}
                </p>
              </div>
              {reviewModal.details && (
                <div>
                  <span className="text-sm font-medium text-gray-500 dark:text-gray-400">Details:</span>
                  <p className="text-gray-900 dark:text-white mt-1">{reviewModal.details}</p>
                </div>
              )}
              <div>
                <span className="text-sm font-medium text-gray-500 dark:text-gray-400">Content ID:</span>
                <p className="text-gray-900 dark:text-white font-mono text-sm mt-1">
                  {reviewModal.content_id}
                </p>
              </div>
              <div>
                <span className="text-sm font-medium text-gray-500 dark:text-gray-400">Reported:</span>
                <p className="text-gray-900 dark:text-white mt-1">
                  {formatDistanceToNow(new Date(reviewModal.created_at), { addSuffix: true })} by{' '}
                  {reviewModal.reporter?.username || reviewModal.reporter?.email || 'Unknown'}
                </p>
              </div>

              {reviewModal.status === 'pending' && (
                <div>
                  <label className="text-sm font-medium text-gray-700 dark:text-gray-300 mb-2 block">
                    Action Taken (optional)
                  </label>
                  <textarea
                    value={actionTaken}
                    onChange={(e) => setActionTaken(e.target.value)}
                    placeholder="Describe any action taken..."
                    rows={3}
                    className="w-full px-3 py-2 bg-gray-100 dark:bg-gray-800 rounded-lg border-0 focus:outline-none focus:ring-2 focus:ring-teal-500"
                  />
                </div>
              )}
            </div>
            <div className="px-6 py-4 border-t border-gray-200 dark:border-gray-800 flex gap-3">
              <button
                onClick={() => setReviewModal(null)}
                className="flex-1 px-4 py-2 text-gray-700 dark:text-gray-300 font-medium hover:bg-gray-100 dark:hover:bg-gray-800 rounded-lg"
              >
                Close
              </button>
              {reviewModal.status === 'pending' && (
                <>
                  <button
                    onClick={() => handleReview('dismissed')}
                    className="flex-1 px-4 py-2 bg-gray-200 dark:bg-gray-700 text-gray-700 dark:text-gray-300 font-medium rounded-lg hover:bg-gray-300 dark:hover:bg-gray-600"
                  >
                    Dismiss
                  </button>
                  <button
                    onClick={() => handleReview('resolved')}
                    className="flex-1 px-4 py-2 bg-teal-600 text-white font-medium rounded-lg hover:bg-teal-700"
                  >
                    Resolve
                  </button>
                </>
              )}
            </div>
          </div>
        </div>
      )}
    </div>
  )
}
