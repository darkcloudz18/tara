'use client'

import { useState } from 'react'
import { MapPin, Star, Navigation, ChevronRight } from 'lucide-react'
import BucketIcon from '@/components/icons/BucketIcon'
import { DiscoverPlace } from '@/features/planner/services/placeService'

interface PlaceCardProps {
  place: DiscoverPlace
  isInBucketList: boolean
  onAddToBucketList: () => void
  onRemoveFromBucketList: () => void
  variant?: 'default' | 'compact' | 'featured'
}

export default function PlaceCard({
  place,
  isInBucketList,
  onAddToBucketList,
  onRemoveFromBucketList,
  variant = 'default',
}: PlaceCardProps) {
  const [imageLoaded, setImageLoaded] = useState(false)
  const [isHovered, setIsHovered] = useState(false)

  const mainPhoto = place.photos?.[0] || 'https://images.unsplash.com/photo-1518509562904-e7ef99cdcc86?w=800'

  const handleBucketToggle = (e: React.MouseEvent) => {
    e.stopPropagation()
    if (isInBucketList) {
      onRemoveFromBucketList()
    } else {
      onAddToBucketList()
    }
  }

  const getCategoryStyle = (category: string) => {
    switch (category) {
      case 'stay':
        return { bg: 'bg-blue-100 dark:bg-blue-900', text: 'text-blue-700 dark:text-blue-300', emoji: '🏨' }
      case 'eat':
        return { bg: 'bg-orange-100 dark:bg-orange-900', text: 'text-orange-700 dark:text-orange-300', emoji: '🍜' }
      case 'see':
        return { bg: 'bg-purple-100 dark:bg-purple-900', text: 'text-purple-700 dark:text-purple-300', emoji: '📸' }
      case 'do':
        return { bg: 'bg-green-100 dark:bg-green-900', text: 'text-green-700 dark:text-green-300', emoji: '🏄' }
      default:
        return { bg: 'bg-teal-100 dark:bg-teal-900', text: 'text-teal-700 dark:text-teal-300', emoji: '🌴' }
    }
  }

  const categoryStyle = getCategoryStyle(place.category)

  if (variant === 'featured') {
    return (
      <div
        className="relative rounded-2xl overflow-hidden group cursor-pointer"
        onMouseEnter={() => setIsHovered(true)}
        onMouseLeave={() => setIsHovered(false)}
      >
        {/* Image */}
        <div className="aspect-[16/10] relative">
          {!imageLoaded && (
            <div className="absolute inset-0 bg-gray-200 dark:bg-gray-800 animate-pulse" />
          )}
          <img
            src={mainPhoto}
            alt={place.name}
            className={`w-full h-full object-cover transition-transform duration-500 ${
              isHovered ? 'scale-105' : 'scale-100'
            } ${imageLoaded ? 'opacity-100' : 'opacity-0'}`}
            onLoad={() => setImageLoaded(true)}
          />
          {/* Gradient Overlay */}
          <div className="absolute inset-0 bg-gradient-to-t from-black/80 via-black/20 to-transparent" />
        </div>

        {/* Bucket Button */}
        <button
          onClick={handleBucketToggle}
          className={`absolute top-4 right-4 p-3 rounded-full transition-all shadow-lg ${
            isInBucketList
              ? 'bg-teal-500 text-white'
              : 'bg-white/90 dark:bg-gray-900/90 text-gray-700 dark:text-gray-300 hover:bg-white dark:hover:bg-gray-800'
          }`}
        >
          <BucketIcon className="w-5 h-5" filled={isInBucketList} />
        </button>

        {/* Content Overlay */}
        <div className="absolute bottom-0 left-0 right-0 p-5">
          {/* Category Badge */}
          <span className={`inline-flex items-center gap-1 px-3 py-1 rounded-full text-xs font-medium mb-3 ${categoryStyle.bg} ${categoryStyle.text}`}>
            {categoryStyle.emoji} {place.category}
          </span>

          {/* Title */}
          <h3 className="text-xl font-bold text-white mb-2">{place.name}</h3>

          {/* Location */}
          <div className="flex items-center gap-1 text-white/80 mb-3">
            <MapPin className="w-4 h-4" />
            <span className="text-sm">{place.location}</span>
          </div>

          {/* Bottom Row */}
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-4">
              {/* Rating */}
              <div className="flex items-center gap-1">
                <Star className="w-4 h-4 text-yellow-400 fill-yellow-400" />
                <span className="text-white font-medium">{place.rating.toFixed(1)}</span>
              </div>
              {/* Price */}
              {place.estimatedCost !== undefined && (
                <span className={`font-semibold ${place.estimatedCost === 0 ? 'text-green-400' : 'text-white'}`}>
                  {place.estimatedCost === 0 ? 'Free' : `₱${place.estimatedCost.toLocaleString()}`}
                </span>
              )}
            </div>
            {/* View Button */}
            <button className="flex items-center gap-1 px-4 py-2 bg-white/20 backdrop-blur-sm rounded-full text-white text-sm font-medium hover:bg-white/30 transition-colors">
              Explore <ChevronRight className="w-4 h-4" />
            </button>
          </div>
        </div>
      </div>
    )
  }

  // Default card variant
  return (
    <div
      className="bg-white dark:bg-gray-900 rounded-2xl overflow-hidden shadow-sm hover:shadow-xl transition-all duration-300 group cursor-pointer border border-gray-100 dark:border-gray-800"
      onMouseEnter={() => setIsHovered(true)}
      onMouseLeave={() => setIsHovered(false)}
    >
      {/* Image */}
      <div className="aspect-[4/3] relative overflow-hidden">
        {!imageLoaded && (
          <div className="absolute inset-0 bg-gray-200 dark:bg-gray-800 animate-pulse" />
        )}
        <img
          src={mainPhoto}
          alt={place.name}
          className={`w-full h-full object-cover transition-transform duration-500 ${
            isHovered ? 'scale-110' : 'scale-100'
          } ${imageLoaded ? 'opacity-100' : 'opacity-0'}`}
          onLoad={() => setImageLoaded(true)}
        />

        {/* Top Badges */}
        <div className="absolute top-3 left-3 right-3 flex justify-between items-start">
          {/* Category */}
          <span className={`inline-flex items-center gap-1 px-2.5 py-1 rounded-lg text-xs font-medium ${categoryStyle.bg} ${categoryStyle.text}`}>
            {categoryStyle.emoji} {place.category}
          </span>

          {/* Partner Badge */}
          {place.source === 'partner' && (
            <span className="px-2.5 py-1 bg-amber-400 text-amber-900 rounded-lg text-xs font-bold">
              PARTNER
            </span>
          )}
        </div>

        {/* Bucket Button */}
        <button
          onClick={handleBucketToggle}
          className={`absolute bottom-3 right-3 p-2.5 rounded-xl transition-all shadow-lg ${
            isInBucketList
              ? 'bg-teal-500 text-white scale-110'
              : 'bg-white/90 dark:bg-gray-900/90 text-gray-700 dark:text-gray-300 hover:scale-110'
          }`}
        >
          <BucketIcon className="w-5 h-5" filled={isInBucketList} />
        </button>
      </div>

      {/* Content */}
      <div className="p-4">
        {/* Location */}
        <div className="flex items-center gap-1 text-gray-500 dark:text-gray-400 text-sm mb-1">
          <MapPin className="w-3.5 h-3.5" />
          <span>{place.location}</span>
        </div>

        {/* Title */}
        <h3 className="font-bold text-gray-900 dark:text-white text-lg mb-2 line-clamp-1 group-hover:text-teal-600 dark:group-hover:text-teal-400 transition-colors">
          {place.name}
        </h3>

        {/* Description */}
        {place.description && (
          <p className="text-gray-600 dark:text-gray-400 text-sm line-clamp-2 mb-3">
            {place.description}
          </p>
        )}

        {/* Bottom Row */}
        <div className="flex items-center justify-between pt-3 border-t border-gray-100 dark:border-gray-800">
          {/* Rating */}
          <div className="flex items-center gap-1">
            <Star className="w-4 h-4 text-yellow-500 fill-yellow-500" />
            <span className="font-semibold text-gray-900 dark:text-white">{place.rating.toFixed(1)}</span>
            <span className="text-gray-500 dark:text-gray-400 text-sm">({place.reviewCount})</span>
          </div>

          {/* Price */}
          {place.estimatedCost !== undefined && (
            <span className={`font-bold ${place.estimatedCost === 0 ? 'text-green-600 dark:text-green-400' : 'text-teal-600 dark:text-teal-400'}`}>
              {place.estimatedCost === 0 ? 'Free' : `₱${place.estimatedCost.toLocaleString()}`}
            </span>
          )}
        </div>

        {/* Tags */}
        {place.tags && place.tags.length > 0 && (
          <div className="flex flex-wrap gap-1.5 mt-3">
            {place.tags.slice(0, 3).map((tag) => (
              <span
                key={tag}
                className="px-2 py-0.5 bg-gray-100 dark:bg-gray-800 text-gray-600 dark:text-gray-400 text-xs rounded-md"
              >
                {tag}
              </span>
            ))}
          </div>
        )}
      </div>
    </div>
  )
}
