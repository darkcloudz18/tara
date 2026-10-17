'use client'

import { useState } from 'react'
import Link from 'next/link'
import { MapPin, Bookmark, BookmarkCheck, Sparkles } from 'lucide-react'
import { DiscoverPlace } from '@/features/planner/services/placeService'
import { capture } from '@/lib/analytics'

interface FeedPlaceCardProps {
  place: DiscoverPlace
  isInBucketList: boolean
  onAddToBucketList: () => void
  onRemoveFromBucketList: () => void
  className?: string
  surface?: 'feed' | 'discover' | 'destination'
}

export default function FeedPlaceCard({
  place,
  isInBucketList,
  onAddToBucketList,
  onRemoveFromBucketList,
  className = '',
  surface = 'feed',
}: FeedPlaceCardProps) {
  const [imageLoaded, setImageLoaded] = useState(false)

  const mainPhoto = place.photos?.[0] || 'https://images.unsplash.com/photo-1518509562904-e7ef99cdcc86?w=800'

  const handleBucketListToggle = () => {
    if (isInBucketList) {
      onRemoveFromBucketList()
    } else {
      onAddToBucketList()
    }
  }

  const handlePlanClick = () => {
    capture('plan_from_card_clicked', {
      placeId: place.source === 'tara' ? place.sourceId : place.id,
      destinationSlug: place.location,
      surface,
    })
  }

  const getCategoryIcon = (category: string) => {
    switch (category) {
      case 'stay':
        return '🏨'
      case 'eat':
        return '🍽️'
      case 'see':
        return '📸'
      case 'do':
        return '🏄'
      default:
        return '📍'
    }
  }

  const planHref = `/trip/new?destination=${encodeURIComponent(place.location)}`

  return (
    <article className={`bg-white dark:bg-black ${className}`}>
      {/* Header */}
      <div className="flex items-center justify-between px-4 py-3">
        <div className="flex items-center gap-3">
          <div className="w-8 h-8 rounded-full bg-gradient-to-br from-primary-400 to-blue-500 flex items-center justify-center text-white text-sm">
            {getCategoryIcon(place.category)}
          </div>
          <div>
            <div className="flex items-center gap-1">
              <span className="font-semibold text-sm text-gray-900 dark:text-white">{place.location}</span>
              {place.isFeatured && (
                <span className="text-primary-500">✓</span>
              )}
            </div>
            <span className="text-xs text-gray-500 dark:text-gray-400 capitalize">{place.category}</span>
          </div>
        </div>
      </div>

      {/* Image */}
      <div className="relative aspect-square overflow-hidden bg-gray-100 dark:bg-gray-900">
        {!imageLoaded && (
          <div className="absolute inset-0 bg-gray-200 dark:bg-gray-800 animate-pulse" />
        )}
        <img
          src={mainPhoto}
          alt={place.name}
          loading="lazy"
          decoding="async"
          className={`w-full h-full object-cover transition-opacity ${
            imageLoaded ? 'opacity-100' : 'opacity-0'
          }`}
          onLoad={() => setImageLoaded(true)}
        />

        {place.source === 'partner' && (
          <div className="absolute top-3 left-3 px-2 py-1 bg-amber-100 dark:bg-amber-900 text-amber-800 dark:text-amber-200 text-xs font-semibold rounded-md">
            Partner
          </div>
        )}
      </div>

      {/* Actions — Save (primary) + Plan a trip here (secondary). Likes /
          comments / share removed per Task 19 (seeded counts, no social
          mechanic that feeds the funnel). */}
      <div className="px-4 pt-3">
        <div className="flex items-center justify-between gap-3">
          <Link
            href={planHref}
            onClick={handlePlanClick}
            className="inline-flex items-center gap-1.5 text-sm font-medium text-teal-600 dark:text-teal-400 hover:text-teal-700 dark:hover:text-teal-300"
          >
            <Sparkles className="w-4 h-4" />
            Plan a trip here
          </Link>
          <button
            onClick={handleBucketListToggle}
            aria-label={isInBucketList ? 'Saved to bucket list' : 'Save to bucket list'}
            aria-pressed={isInBucketList}
            className="min-w-[44px] min-h-[44px] flex items-center justify-center hover:opacity-60 transition-opacity"
          >
            {isInBucketList ? (
              <BookmarkCheck className="w-6 h-6 text-gray-900 dark:text-white fill-gray-900 dark:fill-white" />
            ) : (
              <Bookmark className="w-6 h-6 text-gray-900 dark:text-white" />
            )}
          </button>
        </div>
      </div>

      {/* Content */}
      <div className="px-4 pb-4">
        <p className="text-sm mt-3">
          <span className="font-semibold text-gray-900 dark:text-white">{place.name}</span>
          {' '}
          {place.description && (
            <span className="text-gray-600 dark:text-gray-400">{place.description}</span>
          )}
        </p>

        {/* Price + location — rating removed (seeded avg 4.5 across all
            253 places, not real reviews). */}
        <div className="flex items-center gap-3 mt-2 text-sm text-gray-500 dark:text-gray-400">
          <span className="flex items-center gap-1">
            <MapPin className="w-3 h-3" />
            {place.location}
          </span>
          {place.estimatedCost !== undefined && (
            <>
              <span>•</span>
              <span className={place.estimatedCost === 0 ? 'text-green-600 dark:text-green-400' : ''}>
                {place.estimatedCost === 0 ? 'Free' : `~₱${place.estimatedCost.toLocaleString()}`}
              </span>
            </>
          )}
        </div>

        {place.tags && place.tags.length > 0 && (
          <div className="flex flex-wrap gap-1 mt-2">
            {place.tags.slice(0, 3).map((tag) => (
              <span key={tag} className="text-primary-600 dark:text-primary-400 text-sm">
                #{tag.replace(/\s+/g, '')}
              </span>
            ))}
          </div>
        )}
      </div>
    </article>
  )
}
