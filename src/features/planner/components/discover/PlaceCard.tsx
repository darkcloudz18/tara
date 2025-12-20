'use client'

import { DiscoverPlace, PlaceCategory } from '../../services/placeService'
import {
  MapPin,
  Star,
  Sparkles,
  Award,
  Bed,
  UtensilsCrossed,
  Camera,
  Compass,
  Waves,
  ShoppingBag,
} from 'lucide-react'

interface PlaceCardProps {
  place: DiscoverPlace
  className?: string
}

// Category icon mapping
const CATEGORY_ICONS: Record<PlaceCategory | string, React.ElementType> = {
  stay: Bed,
  eat: UtensilsCrossed,
  see: Camera,
  do: Compass,
  beach: Waves,
  shopping: ShoppingBag,
}

const CATEGORY_COLORS: Record<PlaceCategory | string, string> = {
  stay: 'text-blue-600 bg-blue-50',
  eat: 'text-orange-600 bg-orange-50',
  see: 'text-purple-600 bg-purple-50',
  do: 'text-green-600 bg-green-50',
  beach: 'text-cyan-600 bg-cyan-50',
  shopping: 'text-pink-600 bg-pink-50',
}

export default function PlaceCard({ place, className = '' }: PlaceCardProps) {
  const CategoryIcon = CATEGORY_ICONS[place.category] || Camera
  const categoryColor = CATEGORY_COLORS[place.category] || CATEGORY_COLORS.see

  // Get photo URL or placeholder
  const photoUrl =
    place.photos?.[0] ||
    `https://images.unsplash.com/photo-1507525428034-b723cf961d3e?w=800&q=80`

  return (
    <div
      className={`bg-white rounded-2xl shadow-xl overflow-hidden ${className}`}
    >
      {/* Photo */}
      <div className="relative aspect-[4/3] overflow-hidden">
        <img
          src={photoUrl}
          alt={place.name}
          className="w-full h-full object-cover"
        />

        {/* Source Badge */}
        {place.source === 'partner' && (
          <div className="absolute top-3 left-3 flex items-center gap-1.5 px-3 py-1.5 bg-amber-100 text-amber-800 rounded-full text-sm font-semibold shadow-sm">
            <Sparkles className="w-4 h-4" />
            PARTNER
          </div>
        )}
        {place.source === 'tara' && place.isFeatured && (
          <div className="absolute top-3 left-3 flex items-center gap-1.5 px-3 py-1.5 bg-teal-100 text-teal-800 rounded-full text-sm font-semibold shadow-sm">
            <Award className="w-4 h-4" />
            TARA PICK
          </div>
        )}

        {/* Category Badge */}
        <div
          className={`absolute top-3 right-3 flex items-center gap-1.5 px-3 py-1.5 rounded-full text-sm font-medium shadow-sm ${categoryColor}`}
        >
          <CategoryIcon className="w-4 h-4" />
          {place.category.charAt(0).toUpperCase() + place.category.slice(1)}
        </div>
      </div>

      {/* Content */}
      <div className="p-5">
        {/* Title */}
        <h3 className="text-xl font-bold text-gray-900 mb-2 line-clamp-1">
          {place.name}
        </h3>

        {/* Location */}
        <div className="flex items-center gap-1.5 text-gray-500 mb-3">
          <MapPin className="w-4 h-4 flex-shrink-0" />
          <span className="text-sm truncate">
            {place.location}
            {place.placeType && (
              <span className="text-gray-400"> · {place.placeType}</span>
            )}
          </span>
        </div>

        {/* Rating & Price */}
        <div className="flex items-center justify-between mb-4">
          {place.rating > 0 ? (
            <div className="flex items-center gap-1.5">
              <Star className="w-5 h-5 text-yellow-500 fill-yellow-500" />
              <span className="font-semibold text-gray-900">
                {place.rating.toFixed(1)}
              </span>
              {place.reviewCount > 0 && (
                <span className="text-gray-400 text-sm">
                  ({place.reviewCount})
                </span>
              )}
            </div>
          ) : (
            <span className="text-gray-400 text-sm">No ratings yet</span>
          )}

          {place.estimatedCost !== undefined && place.estimatedCost > 0 ? (
            <div className="text-right">
              <span className="text-lg font-bold text-primary-600">
                ~P{place.estimatedCost.toLocaleString()}
              </span>
            </div>
          ) : (
            <span className="text-green-600 font-medium">Free</span>
          )}
        </div>

        {/* Description */}
        {place.description && (
          <p className="text-gray-600 text-sm line-clamp-2 leading-relaxed">
            "{place.description}"
          </p>
        )}

        {/* Tags */}
        {place.tags && place.tags.length > 0 && (
          <div className="flex flex-wrap gap-1.5 mt-3">
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
      </div>
    </div>
  )
}
