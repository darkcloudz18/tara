'use client'

import { useState } from 'react'
import { useRouter } from 'next/navigation'
import { useItineraries } from '@/features/planner/hooks/useItineraries'
import ItineraryCard from '@/features/planner/components/ItineraryCard'
import { NoItinerariesState } from '@/features/planner/components/EmptyState'
import DeleteConfirmModal from '@/features/planner/components/DeleteConfirmModal'

export default function PlannerPage() {
  const router = useRouter()
  const { itineraries, loading, error, deleteItinerary } = useItineraries()
  const [deleteId, setDeleteId] = useState<string | null>(null)
  const [deleting, setDeleting] = useState(false)

  const handleDeleteClick = (id: string) => {
    setDeleteId(id)
  }

  const handleDeleteConfirm = async () => {
    if (!deleteId) return

    setDeleting(true)
    const success = await deleteItinerary(deleteId)
    setDeleting(false)

    if (success) {
      setDeleteId(null)
    }
  }

  if (loading) {
    return (
      <div className="min-h-screen bg-gray-50">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
          <div className="animate-pulse">
            <div className="h-8 bg-gray-200 rounded w-48 mb-8" />
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
              {[1, 2, 3].map((i) => (
                <div key={i} className="h-72 bg-gray-200 rounded-lg" />
              ))}
            </div>
          </div>
        </div>
      </div>
    )
  }

  return (
    <div className="min-h-screen bg-gray-50">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
        {/* Header */}
        <div className="flex items-center justify-between mb-8">
          <div>
            <h1 className="text-2xl font-bold text-gray-900">My Trips</h1>
            <p className="text-gray-600 mt-1">
              {itineraries.length} {itineraries.length === 1 ? 'itinerary' : 'itineraries'}
            </p>
          </div>
          <button
            onClick={() => router.push('/planner/new')}
            className="btn-primary flex items-center gap-2"
          >
            <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 4v16m8-8H4" />
            </svg>
            New Trip
          </button>
        </div>

        {/* Error */}
        {error && (
          <div className="mb-6 p-4 bg-red-50 border border-red-200 rounded-lg text-red-700">
            {error}
          </div>
        )}

        {/* Content */}
        {itineraries.length === 0 ? (
          <NoItinerariesState />
        ) : (
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
            {itineraries.map((itinerary) => (
              <ItineraryCard
                key={itinerary.id}
                itinerary={itinerary}
                onDelete={handleDeleteClick}
              />
            ))}
          </div>
        )}
      </div>

      {/* Delete Confirmation Modal */}
      <DeleteConfirmModal
        isOpen={!!deleteId}
        onClose={() => setDeleteId(null)}
        onConfirm={handleDeleteConfirm}
        loading={deleting}
        title="Delete Itinerary"
        message="Are you sure you want to delete this itinerary? This will also delete all days and activities. This action cannot be undone."
      />
    </div>
  )
}
