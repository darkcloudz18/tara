'use client'

import { useState } from 'react'
import { MapPin, Star, Heart, MessageCircle, Send, MoreHorizontal } from 'lucide-react'
import BucketIcon from '@/components/icons/BucketIcon'
import { DiscoverPlace } from '@/features/planner/services/placeService'

interface PlaceCardProps {
  place: DiscoverPlace
  isInBucketList: boolean
  onAddToBucketList: () => void
  onRemoveFromBucketList: () => void
}

export default function PlaceCard({
  place,
  isInBucketList,
  onAddToBucketList,
  onRemoveFromBucketList,
}: PlaceCardProps) {
  const [imageLoaded, setImageLoaded] = useState(false)
  const [liked, setLiked] = useState(false)
  const [likeCount, setLikeCount] = useState(Math.floor(Math.random() * 500) + 50)

  const mainPhoto = place.photos?.[0] || 'https://images.unsplash.com/photo-1518509562904-e7ef99cdcc86?w=800'

  const handleBucketToggle = (e: React.MouseEvent) => {
    e.stopPropagation()
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

  const getCategoryStyle = (category: string) => {
    switch (category) {
      case 'stay':
        return { emoji: '🏨', label: 'Stay' }
      case 'eat':
        return { emoji: '🍜', label: 'Food' }
      case 'see':
        return { emoji: '📸', label: 'See' }
      case 'do':
        return { emoji: '🏄', label: 'Activity' }
      default:
        return { emoji: '🌴', label: 'Place' }
    }
  }

  const categoryStyle = getCategoryStyle(place.category)

  return (
    <article className="bg-white dark:bg-black">
      {/* Header */}
      <div className="flex items-center justify-between px-4 py-3">
        <div className="flex items-center gap-3">
          {/* Location Avatar */}
          <div className="w-10 h-10 rounded-full bg-gradient-to-br from-teal-400 to-teal-600 flex items-center justify-center text-lg">
            {categoryStyle.emoji}
          </div>
          {/* Location Info */}
          <div>
            <div className="flex items-center gap-1">
              <span className="font-semibold text-sm text-gray-900 dark:text-white">{place.location}</span>
              {place.isFeatured && (
                <svg className="w-4 h-4 text-teal-500 fill-teal-500" viewBox="0 0 24 24">
                  <path d="M9 16.17L4.83 12l-1.42 1.41L9 19 21 7l-1.41-1.41z"/>
                </svg>
              )}
            </div>
            <span className="text-xs text-gray-500 dark:text-gray-400">{categoryStyle.label}</span>
          </div>
        </div>
        {/* More Options */}
        <button className="p-2 hover:bg-gray-100 dark:hover:bg-gray-800 rounded-full transition-colors">
          <MoreHorizontal className="w-5 h-5 text-gray-600 dark:text-gray-400" />
        </button>
      </div>

      {/* Square Image */}
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

        {/* Partner Badge */}
        {place.source === 'partner' && (
          <div className="absolute top-3 left-3 px-2.5 py-1 bg-amber-400 text-amber-900 text-xs font-bold rounded-lg">
            PARTNER
          </div>
        )}

        {/* Price Tag */}
        {place.estimatedCost !== undefined && (
          <div className="absolute bottom-3 left-3 px-3 py-1.5 bg-black/70 backdrop-blur-sm text-white text-sm font-semibold rounded-lg">
            {place.estimatedCost === 0 ? 'Free' : `₱${place.estimatedCost.toLocaleString()}`}
          </div>
        )}
      </div>

      {/* Action Buttons */}
      <div className="px-4 pt-3">
        <div className="flex items-center justify-between">
          <div className="flex items-center gap-4">
            {/* Like */}
            <button onClick={handleLike} className="hover:opacity-60 transition-opacity">
              <Heart
                className={`w-7 h-7 ${liked ? 'fill-red-500 text-red-500' : 'text-gray-900 dark:text-white'}`}
              />
            </button>
            {/* Comment */}
            <button className="hover:opacity-60 transition-opacity">
              <MessageCircle className="w-7 h-7 text-gray-900 dark:text-white" />
            </button>
            {/* Share */}
            <button className="hover:opacity-60 transition-opacity">
              <Send className="w-7 h-7 text-gray-900 dark:text-white" />
            </button>
          </div>

          {/* Bucket List */}
          <button
            onClick={handleBucketToggle}
            className="hover:opacity-60 transition-opacity"
          >
            <BucketIcon
              className={`w-7 h-7 ${isInBucketList ? 'text-teal-500' : 'text-gray-900 dark:text-white'}`}
              filled={isInBucketList}
            />
          </button>
        </div>

        {/* Likes Count */}
        <p className="font-semibold text-sm text-gray-900 dark:text-white mt-3">
          {likeCount.toLocaleString()} likes
        </p>
      </div>

      {/* Content */}
      <div className="px-4 pb-4">
        {/* Place Name & Description */}
        <p className="text-sm mt-1">
          <span className="font-semibold text-gray-900 dark:text-white">{place.name}</span>
          {place.description && (
            <>
              {' '}
              <span className="text-gray-700 dark:text-gray-300">{place.description}</span>
            </>
          )}
        </p>

        {/* Rating & Location */}
        <div className="flex items-center gap-3 mt-2 text-sm text-gray-500 dark:text-gray-400">
          <span className="flex items-center gap-1">
            <Star className="w-4 h-4 text-yellow-500 fill-yellow-500" />
            <span className="font-medium text-gray-900 dark:text-white">{place.rating.toFixed(1)}</span>
            <span>({place.reviewCount})</span>
          </span>
          <span>•</span>
          <span className="flex items-center gap-1">
            <MapPin className="w-3.5 h-3.5" />
            {place.location}
          </span>
        </div>

        {/* Tags */}
        {place.tags && place.tags.length > 0 && (
          <div className="flex flex-wrap gap-1 mt-2">
            {place.tags.slice(0, 4).map((tag) => (
              <span key={tag} className="text-teal-600 dark:text-teal-400 text-sm">
                #{tag.replace(/\s+/g, '')}
              </span>
            ))}
          </div>
        )}
      </div>
    </article>
  )
}
