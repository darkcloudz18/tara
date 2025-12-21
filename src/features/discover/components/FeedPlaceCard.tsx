'use client'

import { useState } from 'react'
import { MapPin, Star, Bookmark, BookmarkCheck, Heart } from 'lucide-react'
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

  const mainPhoto = place.photos?.[0] || 'https://images.unsplash.com/photo-1518509562904-e7ef99cdcc86?w=800'

  const handleBucketListToggle = () => {
    if (isInBucketList) {
      onRemoveFromBucketList()
    } else {
      onAddToBucketList()
    }
  }

  const getCategoryEmoji = (category: string) => {
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
    <div className={`bg-white rounded-2xl overflow-hidden shadow-sm ${className}`}>
      {/* Image */}
      <div className="relative aspect-[4/3] overflow-hidden">
        {!imageLoaded && (
          <div className="absolute inset-0 bg-gray-200 animate-pulse" />
        )}
        <img
          src={mainPhoto}
          alt={place.name}
          className={`w-full h-full object-cover transition-opacity ${
            imageLoaded ? 'opacity-100' : 'opacity-0'
          }`}
          onLoad={() => setImageLoaded(true)}
        />

        {/* Gradient overlay */}
        <div className="absolute inset-0 bg-gradient-to-t from-black/60 via-transparent to-transparent" />

        {/* Featured badge */}
        {place.isFeatured && (
          <div className="absolute top-3 left-3 px-2 py-1 bg-amber-500 text-white text-xs font-semibold rounded-full">
            ✨ Featured
          </div>
        )}

        {/* Source badge */}
        <div className="absolute top-3 right-3 px-2 py-1 bg-white/90 backdrop-blur-sm text-xs font-medium rounded-full text-gray-700">
          {place.source === 'partner' ? '🤝 Partner' : '🌴 Tara Pick'}
        </div>

        {/* Quick action - Bucket List */}
        <button
          onClick={handleBucketListToggle}
          className={`absolute bottom-3 right-3 w-12 h-12 rounded-full flex items-center justify-center transition-all ${
            isInBucketList
              ? 'bg-primary-500 text-white'
              : 'bg-white/90 backdrop-blur-sm text-gray-700 hover:bg-white'
          }`}
        >
          {isInBucketList ? (
            <BookmarkCheck className="w-6 h-6" />
          ) : (
            <Bookmark className="w-6 h-6" />
          )}
        </button>

        {/* Like button */}
        <button
          onClick={() => setLiked(!liked)}
          className={`absolute bottom-3 right-16 w-12 h-12 rounded-full flex items-center justify-center transition-all ${
            liked
              ? 'bg-red-500 text-white'
              : 'bg-white/90 backdrop-blur-sm text-gray-700 hover:bg-white'
          }`}
        >
          <Heart className={`w-6 h-6 ${liked ? 'fill-white' : ''}`} />
        </button>
      </div>

      {/* Content */}
      <div className="p-4">
        {/* Category & Location */}
        <div className="flex items-center gap-2 text-sm text-gray-500 mb-2">
          <span>{getCategoryEmoji(place.category)}</span>
          <span className="capitalize">{place.category}</span>
          <span>•</span>
          <span className="flex items-center gap-1">
            <MapPin className="w-3 h-3" />
            {place.location}
          </span>
        </div>

        {/* Name */}
        <h3 className="font-bold text-lg text-gray-900 mb-1">{place.name}</h3>

        {/* Description */}
        {place.description && (
          <p className="text-gray-600 text-sm line-clamp-2 mb-3">{place.description}</p>
        )}

        {/* Rating & Price */}
        <div className="flex items-center justify-between">
          <div className="flex items-center gap-1">
            <Star className="w-4 h-4 text-yellow-500 fill-yellow-500" />
            <span className="font-semibold text-gray-900">{place.rating.toFixed(1)}</span>
            <span className="text-gray-500 text-sm">({place.reviewCount.toLocaleString()})</span>
          </div>

          {place.estimatedCost !== undefined && (
            <span className={`font-semibold ${place.estimatedCost === 0 ? 'text-green-600' : 'text-primary-600'}`}>
              {place.estimatedCost === 0 ? 'Free' : `~₱${place.estimatedCost.toLocaleString()}`}
            </span>
          )}
        </div>

        {/* Tags */}
        {place.tags && place.tags.length > 0 && (
          <div className="flex flex-wrap gap-1 mt-3">
            {place.tags.slice(0, 4).map((tag) => (
              <span
                key={tag}
                className="px-2 py-0.5 bg-gray-100 text-gray-600 text-xs rounded-full"
              >
                {tag}
              </span>
            ))}
          </div>
        )}

        {/* Add to Bucket List Button */}
        <button
          onClick={handleBucketListToggle}
          className={`w-full mt-4 py-3 rounded-xl font-semibold transition-colors ${
            isInBucketList
              ? 'bg-primary-100 text-primary-700 hover:bg-primary-200'
              : 'bg-primary-600 text-white hover:bg-primary-700'
          }`}
        >
          {isInBucketList ? '✓ In Bucket List' : '+ Add to Bucket List'}
        </button>
      </div>
    </div>
  )
}
