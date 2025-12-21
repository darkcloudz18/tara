'use client'

import { useState, useCallback } from 'react'
import { useRouter } from 'next/navigation'
import { useItineraries } from '@/features/planner/hooks/useItineraries'
import { useBucketList } from '@/features/planner/hooks/useBucketList'
import {
  DiscoverScreen,
  BucketListScreen,
  BottomNav,
  TripDateModal,
  TabType,
} from '@/features/planner/components/discover'
import { DiscoverPlace } from '@/features/planner/services/placeService'
import { List, Compass } from 'lucide-react'

export default function PlannerPage() {
  const router = useRouter()
  const { createItinerary } = useItineraries()
  const bucketList = useBucketList()

  const [activeTab, setActiveTab] = useState<TabType>('discover')
  const [showDateModal, setShowDateModal] = useState(false)
  const [showExistingTrips, setShowExistingTrips] = useState(false)
  const [skippedPlaces, setSkippedPlaces] = useState<Set<string>>(new Set())

  const handleAddPlace = async (place: DiscoverPlace) => {
    try {
      await bucketList.addPlace(place)
    } catch (err) {
      console.error('Failed to add to bucket list:', err)
    }
  }

  const handleSkipPlace = (placeId: string) => {
    setSkippedPlaces((prev) => new Set(prev).add(placeId))
  }

  const handleResetSkipped = useCallback(() => {
    setSkippedPlaces(new Set())
  }, [])

  const isPlaceSkipped = useCallback(
    (placeId: string) => skippedPlaces.has(placeId),
    [skippedPlaces]
  )

  // Get unique destinations from bucket list
  const uniqueDestinations = [...new Set(
    bucketList.items
      .filter((item) => !item.is_visited && item.place_location)
      .map((item) => item.place_location!)
  )]

  // Get total estimated cost
  const totalEstimatedCost = bucketList.items
    .filter((item) => !item.is_visited)
    .reduce((sum, item) => sum + (item.place_estimated_cost || 0), 0)

  const handleCreateTrip = async (data: {
    title: string
    startDate: string
    endDate: string
  }) => {
    // Create the itinerary
    const itinerary = await createItinerary({
      title: data.title,
      description: `Trip to ${uniqueDestinations.join(', ')}`,
      start_date: data.startDate,
      end_date: data.endDate,
      destinations: uniqueDestinations,
      total_budget: totalEstimatedCost,
    })

    if (itinerary) {
      // Navigate to the itinerary detail page
      router.push(`/planner/${itinerary.id}`)
    }
  }

  // If viewing existing trips, show the old list view
  if (showExistingTrips) {
    return <ExistingTripsView onBack={() => setShowExistingTrips(false)} />
  }

  return (
    <div className="h-screen flex flex-col bg-gray-50">
      {/* Top Bar - View Existing Trips */}
      <div className="bg-white border-b border-gray-100 px-4 py-2 flex items-center justify-end">
        <button
          onClick={() => setShowExistingTrips(true)}
          className="flex items-center gap-2 px-3 py-1.5 text-gray-600 hover:text-gray-900 hover:bg-gray-100 rounded-lg text-sm font-medium transition-colors"
        >
          <List className="w-4 h-4" />
          My Trips
        </button>
      </div>

      {/* Main Content - Split layout on desktop */}
      <div className="flex-1 overflow-hidden flex flex-col lg:flex-row">
        {/* Left side - Discover (always visible on desktop) */}
        <div className={`flex-1 lg:w-1/2 lg:border-r border-gray-200 ${activeTab === 'discover' ? 'flex' : 'hidden lg:flex'} flex-col`}>
          <DiscoverScreen
            onAddPlace={handleAddPlace}
            onSkipPlace={handleSkipPlace}
            isPlaceAdded={bucketList.isInBucketList}
            isPlaceSkipped={isPlaceSkipped}
            onResetSkipped={handleResetSkipped}
          />
        </div>

        {/* Right side - Bucket List (always visible on desktop) */}
        <div className={`flex-1 lg:w-1/2 ${activeTab === 'bucketlist' ? 'flex' : 'hidden lg:flex'} flex-col`}>
          <BucketListScreen
            items={bucketList.items}
            loading={bucketList.loading}
            groupedByLocation={bucketList.groupedByLocation()}
            onRemoveItem={bucketList.removeItem}
            onToggleVisited={bucketList.toggleVisited}
            onCreateTrip={() => setShowDateModal(true)}
          />
        </div>
      </div>

      {/* Bottom Navigation - Only show on mobile */}
      <div className="lg:hidden">
        <BottomNav
          activeTab={activeTab}
          onTabChange={setActiveTab}
          itemCount={bucketList.unvisitedCount}
        />
      </div>

      {/* Date Modal */}
      <TripDateModal
        isOpen={showDateModal}
        onClose={() => setShowDateModal(false)}
        onCreateTrip={handleCreateTrip}
        placeCount={bucketList.unvisitedCount}
        destinations={uniqueDestinations}
      />
    </div>
  )
}

// Existing Trips View (preserved from original)
function ExistingTripsView({ onBack }: { onBack: () => void }) {
  const router = useRouter()
  const { itineraries, loading, error, deleteItinerary } = useItineraries()
  const [deleteId, setDeleteId] = useState<string | null>(null)
  const [deleting, setDeleting] = useState(false)

  const handleDeleteConfirm = async () => {
    if (!deleteId) return
    setDeleting(true)
    const success = await deleteItinerary(deleteId)
    setDeleting(false)
    if (success) setDeleteId(null)
  }

  if (loading) {
    return (
      <div className="min-h-screen bg-gray-50">
        <div className="max-w-7xl mx-auto px-4 py-8">
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
      <div className="max-w-7xl mx-auto px-4 py-8">
        {/* Header */}
        <div className="flex items-center justify-between mb-8">
          <div className="flex items-center gap-4">
            <button
              onClick={onBack}
              className="flex items-center gap-2 text-gray-600 hover:text-gray-900"
            >
              <Compass className="w-5 h-5" />
              <span className="font-medium">Discover</span>
            </button>
            <div className="h-6 w-px bg-gray-300" />
            <div>
              <h1 className="text-2xl font-bold text-gray-900">My Trips</h1>
              <p className="text-gray-600 mt-1">
                {itineraries.length}{' '}
                {itineraries.length === 1 ? 'trip' : 'trips'}
              </p>
            </div>
          </div>
          <button onClick={onBack} className="btn-primary flex items-center gap-2">
            <Compass className="w-5 h-5" />
            Plan New Trip
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
          <div className="text-center py-16">
            <div className="w-20 h-20 bg-gray-100 rounded-full flex items-center justify-center mx-auto mb-4">
              <List className="w-10 h-10 text-gray-300" />
            </div>
            <h3 className="text-lg font-semibold text-gray-900 mb-2">
              No trips yet
            </h3>
            <p className="text-gray-500 mb-6">
              Start discovering amazing places and create your first trip!
            </p>
            <button onClick={onBack} className="btn-primary">
              Start Discovering
            </button>
          </div>
        ) : (
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
            {itineraries.map((itinerary) => (
              <div
                key={itinerary.id}
                onClick={() => router.push(`/planner/${itinerary.id}`)}
                className="bg-white rounded-xl shadow-sm border border-gray-100 p-6 cursor-pointer hover:shadow-md transition-shadow"
              >
                <h3 className="text-lg font-semibold text-gray-900 mb-2">
                  {itinerary.title}
                </h3>
                <p className="text-sm text-gray-500 mb-4">
                  {itinerary.destinations?.join(', ')}
                </p>
                <div className="flex items-center justify-between text-sm">
                  <span className="text-gray-600">
                    {new Date(itinerary.start_date).toLocaleDateString()} -{' '}
                    {new Date(itinerary.end_date).toLocaleDateString()}
                  </span>
                  {itinerary.total_budget && (
                    <span className="font-medium text-primary-600">
                      P{itinerary.total_budget.toLocaleString()}
                    </span>
                  )}
                </div>
              </div>
            ))}
          </div>
        )}
      </div>

      {/* Delete Modal - simplified inline */}
      {deleteId && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/50">
          <div className="bg-white rounded-xl p-6 max-w-md mx-4">
            <h3 className="text-lg font-semibold mb-2">Delete Trip?</h3>
            <p className="text-gray-600 mb-6">This action cannot be undone.</p>
            <div className="flex gap-3">
              <button
                onClick={() => setDeleteId(null)}
                className="flex-1 px-4 py-2 border rounded-lg"
              >
                Cancel
              </button>
              <button
                onClick={handleDeleteConfirm}
                disabled={deleting}
                className="flex-1 px-4 py-2 bg-red-600 text-white rounded-lg"
              >
                {deleting ? 'Deleting...' : 'Delete'}
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  )
}
