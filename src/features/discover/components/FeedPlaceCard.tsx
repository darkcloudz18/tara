'use client'

import { useState } from 'react'
import { MapPin, Star, Bookmark, BookmarkCheck, Heart, MessageCircle, Send, MoreHorizontal } from 'lucide-react'
import { DiscoverPlace } from '@/features/planner/services/placeService'

interface FeedPlaceCardProps {
  place: DiscoverPlace
  isInBucketList: boolean
  onAddToBucketList: () => void
  onRemoveFromBucketList: () => void
  className?: string
}

export default function FeedPlaceCard({
  place,
  isInBucketList,
  onAddToBucketList,
  onRemoveFromBucketList,
  className = '',
}: FeedPlaceCardProps) {
  const [imageLoaded, setImageLoaded] = useState(false)
  const [liked, setLiked] = useState(false)
  const [likeCount, setLikeCount] = useState(Math.floor(Math.random() * 500) + 50)

  const mainPhoto = place.photos?.[0] || 'https://images.unsplash.com/photo-1518509562904-e7ef99cdcc86?w=800'

  const handleBucketListToggle = () => {
    if (isInBucketList) {
      onRemoveFromBucketList()
    } else {
      onAddToBucketList()
    }
  }

  const handleLike = () => {
    setLiked(!liked)
    setLikeCount(prev => liked ? prev - 1 : prev + 1)
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

  return (
    <article className={`bg-white dark:bg-black ${className}`}>
      {/* Header - Instagram style */}
      <div className="flex items-center justify-between px-4 py-3">
        <div className="flex items-center gap-3">
          {/* Avatar/Icon */}
          <div className="w-8 h-8 rounded-full bg-gradient-to-br from-primary-400 to-blue-500 flex items-center justify-center text-white text-sm">
            {getCategoryIcon(place.category)}
          </div>
          {/* Location info */}
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
        {/* More options */}
        <button className="p-2 hover:bg-gray-100 dark:hover:bg-gray-800 rounded-full">
          <MoreHorizontal className="w-5 h-5 text-gray-600 dark:text-gray-400" />
        </button>
      </div>

      {/* Image - Square like Instagram */}
      <div className="relative aspect-square overflow-hidden bg-gray-100 dark:bg-gray-900">
        {!imageLoaded && (
          <div className="absolute inset-0 bg-gray-200 dark:bg-gray-800 animate-pulse" />
        )}
        <img
          src={mainPhoto}
          alt={place.name}
          className={`w-full h-full object-cover transition-opacity ${
            imageLoaded ? 'opacity-100' : 'opacity-0'
          }`}
          onLoad={() => setImageLoaded(true)}
          onDoubleClick={handleLike}
        />

        {/* Source badge */}
        {place.source === 'partner' && (
          <div className="absolute top-3 left-3 px-2 py-1 bg-amber-100 dark:bg-amber-900 text-amber-800 dark:text-amber-200 text-xs font-semibold rounded-md">
            Partner
          </div>
        )}
      </div>

      {/* Action buttons - Instagram style */}
      <div className="px-4 pt-3">
        <div className="flex items-center justify-between">
          <div className="flex items-center gap-4">
            {/* Like */}
            <button onClick={handleLike} className="hover:opacity-60 transition-opacity">
              <Heart
                className={`w-6 h-6 ${liked ? 'fill-red-500 text-red-500' : 'text-gray-900 dark:text-white'}`}
              />
            </button>
            {/* Comment */}
            <button className="hover:opacity-60 transition-opacity">
              <MessageCircle className="w-6 h-6 text-gray-900 dark:text-white" />
            </button>
            {/* Share */}
            <button className="hover:opacity-60 transition-opacity">
              <Send className="w-6 h-6 text-gray-900 dark:text-white" />
            </button>
          </div>
          {/* Bookmark/Bucket List */}
          <button onClick={handleBucketListToggle} className="hover:opacity-60 transition-opacity">
            {isInBucketList ? (
              <BookmarkCheck className="w-6 h-6 text-gray-900 dark:text-white fill-gray-900 dark:fill-white" />
            ) : (
              <Bookmark className="w-6 h-6 text-gray-900 dark:text-white" />
            )}
          </button>
        </div>

        {/* Likes count */}
        <p className="font-semibold text-sm text-gray-900 dark:text-white mt-3">
          {likeCount.toLocaleString()} likes
        </p>
      </div>

      {/* Content - Instagram style */}
      <div className="px-4 pb-4">
        {/* Name as "username" with description */}
        <p className="text-sm mt-1">
          <span className="font-semibold text-gray-900 dark:text-white">{place.name}</span>
          {' '}
          {place.description && (
            <span className="text-gray-600 dark:text-gray-400">{place.description}</span>
          )}
        </p>

        {/* Rating & Price row */}
        <div className="flex items-center gap-3 mt-2 text-sm text-gray-500 dark:text-gray-400">
          <span className="flex items-center gap-1">
            <Star className="w-4 h-4 text-yellow-500 fill-yellow-500" />
            {place.rating.toFixed(1)}
          </span>
          <span>•</span>
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

        {/* Tags */}
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
