'use client'

import { useState, useEffect, useCallback } from 'react'
import { Loader2, Compass } from 'lucide-react'
import VideoCard from './VideoCard'
import FeedPlaceCard from './FeedPlaceCard'
import { FeedItem, fetchDiscoverFeed } from '../services/discoverFeedService'
import { CreatorVideo } from '../services/creatorVideoService'
import { DiscoverPlace } from '@/features/planner/services/placeService'
import { useBucketList } from '@/features/planner/hooks/useBucketList'

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
  const [feed, setFeed] = useState<FeedItem[]>([])
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState<string | null>(null)

  const bucketList = useBucketList()

  // Track which video the user last engaged with (for referral attribution)
  const [lastViewedVideoCreatorId, setLastViewedVideoCreatorId] = useState<string | null>(null)
  const [lastViewedVideoId, setLastViewedVideoId] = useState<string | null>(null)

  const loadFeed = useCallback(async () => {
    try {
      setLoading(true)
      setError(null)
      const feedItems = await fetchDiscoverFeed(30)
      setFeed(feedItems)
    } catch (err: any) {
      setError(err.message || 'Failed to load feed')
    } finally {
      setLoading(false)
    }
  }, [])

  useEffect(() => {
    loadFeed()
  }, [loadFeed])

  const handleAddToBucketList = async (place: DiscoverPlace) => {
    try {
      // Pass referral info when adding to bucket list
      await bucketList.addPlace(place, lastViewedVideoCreatorId, lastViewedVideoId)
    } catch (err: any) {
      if (err.message?.includes('logged in')) {
        onLoginRequired?.()
      } else {
        console.error('Failed to add to bucket list:', err)
      }
    }
  }

  const handleRemoveFromBucketList = async (placeId: string) => {
    const item = bucketList.getItemByPlaceId(placeId)
    if (item) {
      await bucketList.removeItem(item.id)
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
      <div className="flex flex-col items-center justify-center min-h-screen bg-gray-50">
        <Loader2 className="w-8 h-8 text-primary-600 animate-spin mb-4" />
        <p className="text-gray-500">Discovering amazing places...</p>
      </div>
    )
  }

  if (error) {
    return (
      <div className="flex flex-col items-center justify-center min-h-screen bg-gray-50 px-4">
        <p className="text-red-500 mb-4">{error}</p>
        <button
          onClick={loadFeed}
          className="px-4 py-2 bg-primary-600 text-white rounded-lg font-medium"
        >
          Try Again
        </button>
      </div>
    )
  }

  if (feed.length === 0) {
    return (
      <div className="flex flex-col items-center justify-center min-h-screen bg-gray-50 px-4">
        <Compass className="w-16 h-16 text-gray-300 mb-4" />
        <h2 className="text-xl font-semibold text-gray-900 mb-2">No content yet</h2>
        <p className="text-gray-500 text-center">
          Check back soon for amazing travel content!
        </p>
      </div>
    )
  }

  return (
    <div className="min-h-screen bg-gray-100">
      {/* Feed */}
      <div className="max-w-lg mx-auto pb-20">
        {feed.map((item, index) => (
          <div key={item.id} className="mb-4">
            {item.type === 'video' ? (
              <div
                onMouseEnter={() => handleVideoView(item.data as CreatorVideo)}
                onClick={() => handleVideoView(item.data as CreatorVideo)}
              >
                <VideoCard
                  video={item.data as CreatorVideo}
                  onCreatorClick={handleVideoCreatorClick}
                  className="mx-4"
                />
              </div>
            ) : (
              <FeedPlaceCard
                place={item.data as DiscoverPlace}
                isInBucketList={bucketList.isInBucketList((item.data as DiscoverPlace).id)}
                onAddToBucketList={() => handleAddToBucketList(item.data as DiscoverPlace)}
                onRemoveFromBucketList={() =>
                  handleRemoveFromBucketList((item.data as DiscoverPlace).id)
                }
                className="mx-4"
              />
            )}
          </div>
        ))}

        {/* Load More */}
        <div className="text-center py-8">
          <button
            onClick={loadFeed}
            className="px-6 py-3 bg-white text-primary-600 rounded-xl font-medium shadow-sm hover:shadow-md transition-shadow"
          >
            Load More
          </button>
        </div>
      </div>
    </div>
  )
}
