'use client'

import { useState, useCallback } from 'react'
import { Loader2, Compass } from 'lucide-react'
import VideoCard from './VideoCard'
import FeedPlaceCard from './FeedPlaceCard'
import AddToTripModal from '@/features/planner/components/AddToTripModal'
import { FeedItem, fetchDiscoverFeedPaginated } from '../services/discoverFeedService'
import { CreatorVideo } from '../services/creatorVideoService'
import { DiscoverPlace } from '@/features/planner/services/placeService'
import { useInfiniteScroll } from '@/hooks/useInfiniteScroll'

interface DiscoverFeedProps {
  onLoginRequired?: () => void
  currentVideoCreatorId?: string | null
  setCurrentVideoCreatorId?: (id: string | null) => void
}

export default function DiscoverFeed({
  onLoginRequired,
  currentVideoCreatorId,
  setCurrentVideoCreatorId,
}: DiscoverFeedProps) {
  const [showAddToTripModal, setShowAddToTripModal] = useState(false)
  const [selectedPlace, setSelectedPlace] = useState<DiscoverPlace | null>(null)
  const [addedPlaces, setAddedPlaces] = useState<Set<string>>(new Set())

  // Track which video the user last engaged with (for referral attribution)
  const [lastViewedVideoCreatorId, setLastViewedVideoCreatorId] = useState<string | null>(null)
  const [lastViewedVideoId, setLastViewedVideoId] = useState<string | null>(null)

  // Use infinite scroll hook
  const {
    items: feed,
    loading,
    loadingMore,
    hasMore,
    error,
    refresh: loadFeed,
  } = useInfiniteScroll<FeedItem>({
    fetchFn: fetchDiscoverFeedPaginated,
    pageSize: 20,
    threshold: 300,
  })

  const handleAddToTrip = (place: DiscoverPlace) => {
    setSelectedPlace(place)
    setShowAddToTripModal(true)
  }

  const handleTripAddSuccess = (tripId: string) => {
    if (selectedPlace) {
      setAddedPlaces((prev) => new Set(prev).add(selectedPlace.id))
    }
  }

  const handleVideoCreatorClick = (creatorId: string) => {
    // Navigate to creator profile or show modal
    console.log('View creator:', creatorId)
  }

  const handleVideoView = (video: CreatorVideo) => {
    // Track the video for referral attribution
    setLastViewedVideoCreatorId(video.creator_id)
    setLastViewedVideoId(video.id)
    setCurrentVideoCreatorId?.(video.creator_id)
  }

  if (loading) {
    return (
      <div className="flex flex-col items-center justify-center py-20">
        <Loader2 className="w-8 h-8 text-primary-600 dark:text-primary-400 animate-spin mb-4" />
        <p className="text-gray-500 dark:text-gray-400">Discovering amazing places...</p>
      </div>
    )
  }

  if (error) {
    return (
      <div className="flex flex-col items-center justify-center py-20 px-4">
        <p className="text-red-500 dark:text-red-400 mb-4">{error}</p>
        <button
          onClick={loadFeed}
          className="px-4 py-2 bg-primary-600 text-white rounded-lg font-medium hover:bg-primary-700"
        >
          Try Again
        </button>
      </div>
    )
  }

  if (feed.length === 0) {
    return (
      <div className="flex flex-col items-center justify-center py-20 px-4">
        <Compass className="w-16 h-16 text-gray-300 dark:text-gray-600 mb-4" />
        <h2 className="text-xl font-semibold text-gray-900 dark:text-white mb-2">No content yet</h2>
        <p className="text-gray-500 dark:text-gray-400 text-center">
          Check back soon for amazing travel content!
        </p>
      </div>
    )
  }

  return (
    <div className="pb-20 lg:pb-8">
      {/* Feed */}
      <div>
        {feed.map((item) => (
          <div key={item.id} className="border-b border-gray-100 dark:border-gray-800">
            {item.type === 'video' ? (
              <div
                onMouseEnter={() => handleVideoView(item.data as CreatorVideo)}
                onClick={() => handleVideoView(item.data as CreatorVideo)}
              >
                <VideoCard
                  video={item.data as CreatorVideo}
                  onCreatorClick={handleVideoCreatorClick}
                />
              </div>
            ) : (
              <FeedPlaceCard
                place={item.data as DiscoverPlace}
                isInBucketList={addedPlaces.has((item.data as DiscoverPlace).id)}
                onAddToBucketList={() => handleAddToTrip(item.data as DiscoverPlace)}
                onRemoveFromBucketList={() => {}}
              />
            )}
          </div>
        ))}

        {/* Infinite Scroll Sentinel */}
        <div id="infinite-scroll-sentinel" className="py-8">
          {loadingMore && (
            <div className="flex justify-center">
              <Loader2 className="w-6 h-6 text-primary-600 dark:text-primary-400 animate-spin" />
            </div>
          )}
          {!hasMore && feed.length > 0 && (
            <p className="text-center text-gray-400 dark:text-gray-500 text-sm">
              You&apos;ve seen it all! Check back for new places.
            </p>
          )}
        </div>
      </div>

      {/* Add to Trip Modal */}
      <AddToTripModal
        isOpen={showAddToTripModal}
        onClose={() => setShowAddToTripModal(false)}
        place={selectedPlace}
        onSuccess={handleTripAddSuccess}
      />
    </div>
  )
}
