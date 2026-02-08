'use client'

import { useState, useEffect } from 'react'
import {
  Search,
  MoreVertical,
  Eye,
  EyeOff,
  Trash2,
  ExternalLink,
  Loader2,
  ChevronLeft,
  ChevronRight,
  Globe,
  Lock,
} from 'lucide-react'
import { adminService } from '@/features/admin/services/adminService'
import { formatDistanceToNow } from 'date-fns'
import { useToast } from '@/contexts/ToastContext'

export default function AdminTripsPage() {
  const { success, error } = useToast()
  const [trips, setTrips] = useState<any[]>([])
  const [total, setTotal] = useState(0)
  const [page, setPage] = useState(1)
  const [publicOnly, setPublicOnly] = useState(false)
  const [loading, setLoading] = useState(true)
  const [actionMenu, setActionMenu] = useState<string | null>(null)
  const [deleteModal, setDeleteModal] = useState<{ id: string; title: string } | null>(null)

  const limit = 20

  useEffect(() => {
    loadTrips()
  }, [page, publicOnly])

  const loadTrips = async () => {
    setLoading(true)
    const result = await adminService.getTrips(page, limit, publicOnly)
    setTrips(result.trips)
    setTotal(result.total)
    setLoading(false)
  }

  const handleDelete = async () => {
    if (!deleteModal) return

    const ok = await adminService.deleteTrip(deleteModal.id)
    if (ok) {
      success('Trip deleted')
      loadTrips()
    } else {
      error('Failed to delete trip')
    }
    setDeleteModal(null)
  }

  const totalPages = Math.ceil(total / limit)

  return (
    <div className="p-6 lg:p-8">
      {/* Header */}
      <div className="mb-6">
        <h1 className="text-2xl font-bold text-gray-900 dark:text-white">Trips</h1>
        <p className="text-gray-500 dark:text-gray-400">Moderate user-created trips</p>
      </div>

      {/* Filters */}
      <div className="mb-6 flex items-center gap-4">
        <button
          onClick={() => { setPublicOnly(false); setPage(1) }}
          className={`px-4 py-2 rounded-lg font-medium transition-colors ${
            !publicOnly
              ? 'bg-teal-600 text-white'
              : 'bg-gray-100 dark:bg-gray-800 text-gray-600 dark:text-gray-400'
          }`}
        >
          All Trips
        </button>
        <button
          onClick={() => { setPublicOnly(true); setPage(1) }}
          className={`px-4 py-2 rounded-lg font-medium transition-colors ${
            publicOnly
              ? 'bg-teal-600 text-white'
              : 'bg-gray-100 dark:bg-gray-800 text-gray-600 dark:text-gray-400'
          }`}
        >
          Public Only
        </button>
      </div>

      {/* Trips table */}
      <div className="bg-white dark:bg-gray-900 rounded-xl border border-gray-200 dark:border-gray-800 overflow-hidden">
        {loading ? (
          <div className="flex justify-center py-12">
            <Loader2 className="w-8 h-8 text-teal-600 animate-spin" />
          </div>
        ) : (
          <>
            <div className="overflow-x-auto">
              <table className="w-full">
                <thead>
                  <tr className="border-b border-gray-200 dark:border-gray-800 bg-gray-50 dark:bg-gray-800/50">
                    <th className="px-4 py-3 text-left text-xs font-semibold text-gray-500 dark:text-gray-400 uppercase">
                      Trip
                    </th>
                    <th className="px-4 py-3 text-left text-xs font-semibold text-gray-500 dark:text-gray-400 uppercase">
                      Creator
                    </th>
                    <th className="px-4 py-3 text-left text-xs font-semibold text-gray-500 dark:text-gray-400 uppercase">
                      Visibility
                    </th>
                    <th className="px-4 py-3 text-left text-xs font-semibold text-gray-500 dark:text-gray-400 uppercase">
                      Created
                    </th>
                    <th className="px-4 py-3 text-right text-xs font-semibold text-gray-500 dark:text-gray-400 uppercase">
                      Actions
                    </th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-gray-100 dark:divide-gray-800">
                  {trips.map((trip) => (
                    <tr key={trip.id} className="hover:bg-gray-50 dark:hover:bg-gray-800/50">
                      <td className="px-4 py-3">
                        <div>
                          <p className="font-medium text-gray-900 dark:text-white">
                            {trip.title || 'Untitled Trip'}
                          </p>
                          <p className="text-sm text-gray-500 dark:text-gray-400">
                            {trip.destination || 'No destination'}
                          </p>
                        </div>
                      </td>
                      <td className="px-4 py-3">
                        <p className="text-sm text-gray-900 dark:text-white">
                          {trip.user?.first_name || trip.user?.username || 'Unknown'}
                        </p>
                        <p className="text-xs text-gray-500 dark:text-gray-400">
                          {trip.user?.email}
                        </p>
                      </td>
                      <td className="px-4 py-3">
                        {trip.is_public ? (
                          <span className="inline-flex items-center gap-1 px-2 py-1 bg-green-100 dark:bg-green-900/30 text-green-700 dark:text-green-400 text-xs font-medium rounded">
                            <Globe className="w-3 h-3" />
                            Public
                          </span>
                        ) : (
                          <span className="inline-flex items-center gap-1 px-2 py-1 bg-gray-100 dark:bg-gray-800 text-gray-600 dark:text-gray-400 text-xs font-medium rounded">
                            <Lock className="w-3 h-3" />
                            Private
                          </span>
                        )}
                      </td>
                      <td className="px-4 py-3 text-sm text-gray-500 dark:text-gray-400">
                        {formatDistanceToNow(new Date(trip.created_at), { addSuffix: true })}
                      </td>
                      <td className="px-4 py-3 text-right">
                        <div className="relative">
                          <button
                            onClick={() => setActionMenu(actionMenu === trip.id ? null : trip.id)}
                            className="p-2 text-gray-400 hover:text-gray-600 rounded-lg hover:bg-gray-100 dark:hover:bg-gray-800"
                          >
                            <MoreVertical className="w-5 h-5" />
                          </button>

                          {actionMenu === trip.id && (
                            <div className="absolute right-0 top-full mt-1 w-48 bg-white dark:bg-gray-800 rounded-lg shadow-lg border border-gray-200 dark:border-gray-700 py-1 z-10">
                              <a
                                href={`/trip/${trip.id}`}
                                target="_blank"
                                rel="noopener noreferrer"
                                className="w-full px-4 py-2 text-left text-sm hover:bg-gray-100 dark:hover:bg-gray-700 flex items-center gap-2"
                              >
                                <ExternalLink className="w-4 h-4" />
                                View Trip
                              </a>
                              <hr className="my-1 border-gray-200 dark:border-gray-700" />
                              <button
                                onClick={() => {
                                  setDeleteModal({ id: trip.id, title: trip.title || 'Untitled Trip' })
                                  setActionMenu(null)
                                }}
                                className="w-full px-4 py-2 text-left text-sm hover:bg-gray-100 dark:hover:bg-gray-700 flex items-center gap-2 text-red-600"
                              >
                                <Trash2 className="w-4 h-4" />
                                Delete Trip
                              </button>
                            </div>
                          )}
                        </div>
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>

            {/* Pagination */}
            <div className="px-4 py-3 border-t border-gray-200 dark:border-gray-800 flex items-center justify-between">
              <p className="text-sm text-gray-500 dark:text-gray-400">
                Showing {(page - 1) * limit + 1} to {Math.min(page * limit, total)} of {total}
              </p>
              <div className="flex gap-2">
                <button
                  onClick={() => setPage(page - 1)}
                  disabled={page === 1}
                  className="p-2 rounded-lg border border-gray-200 dark:border-gray-700 disabled:opacity-50 disabled:cursor-not-allowed hover:bg-gray-100 dark:hover:bg-gray-800"
                >
                  <ChevronLeft className="w-5 h-5" />
                </button>
                <button
                  onClick={() => setPage(page + 1)}
                  disabled={page >= totalPages}
                  className="p-2 rounded-lg border border-gray-200 dark:border-gray-700 disabled:opacity-50 disabled:cursor-not-allowed hover:bg-gray-100 dark:hover:bg-gray-800"
                >
                  <ChevronRight className="w-5 h-5" />
                </button>
              </div>
            </div>
          </>
        )}
      </div>

      {/* Delete Modal */}
      {deleteModal && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/60 backdrop-blur-sm">
          <div className="w-full max-w-md mx-4 bg-white dark:bg-gray-900 rounded-2xl shadow-2xl overflow-hidden">
            <div className="px-6 py-4 border-b border-gray-200 dark:border-gray-800">
              <h3 className="text-lg font-semibold text-gray-900 dark:text-white">
                Delete Trip
              </h3>
            </div>
            <div className="p-6">
              <p className="text-gray-600 dark:text-gray-400">
                Are you sure you want to delete <strong>{deleteModal.title}</strong>? This action cannot be undone.
              </p>
            </div>
            <div className="px-6 py-4 border-t border-gray-200 dark:border-gray-800 flex gap-3">
              <button
                onClick={() => setDeleteModal(null)}
                className="flex-1 px-4 py-2 text-gray-700 dark:text-gray-300 font-medium hover:bg-gray-100 dark:hover:bg-gray-800 rounded-lg"
              >
                Cancel
              </button>
              <button
                onClick={handleDelete}
                className="flex-1 px-4 py-2 bg-red-600 text-white font-medium rounded-lg hover:bg-red-700"
              >
                Delete Trip
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  )
}
