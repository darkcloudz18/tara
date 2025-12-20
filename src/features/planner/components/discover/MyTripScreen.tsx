'use client'

import {
  Heart,
  MapPin,
  X,
  Wallet,
  Calendar,
  ChevronRight,
  Trash2,
  Camera,
  Bed,
  UtensilsCrossed,
  Compass,
  ShoppingBag,
  Waves,
} from 'lucide-react'
import { DiscoverPlace, PlaceCategory } from '../../services/placeService'

interface GroupedPlaces {
  [location: string]: DiscoverPlace[]
}

interface MyTripScreenProps {
  addedPlaces: DiscoverPlace[]
  groupedByLocation: GroupedPlaces
  totalEstimatedCost: number
  onRemovePlace: (placeId: string) => void
  onClearAll: () => void
  onCreateTrip: () => void
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

export default function MyTripScreen({
  addedPlaces,
  groupedByLocation,
  totalEstimatedCost,
  onRemovePlace,
  onClearAll,
  onCreateTrip,
}: MyTripScreenProps) {
  const locations = Object.keys(groupedByLocation)

  return (
    <div className="flex flex-col h-full bg-gray-50">
      {/* Header */}
      <div className="bg-white border-b border-gray-100 px-4 py-4">
        <div className="flex items-center justify-between">
          <div className="flex items-center gap-2">
            <Heart className="w-6 h-6 text-primary-600 fill-primary-600" />
            <h1 className="text-xl font-bold text-gray-900">My Trip</h1>
            {addedPlaces.length > 0 && (
              <span className="px-2 py-0.5 bg-primary-100 text-primary-700 text-sm font-medium rounded-full">
                {addedPlaces.length}
              </span>
            )}
          </div>

          {addedPlaces.length > 0 && (
            <button
              onClick={onClearAll}
              className="flex items-center gap-1.5 px-3 py-1.5 text-red-600 hover:bg-red-50 rounded-lg text-sm font-medium transition-colors"
            >
              <Trash2 className="w-4 h-4" />
              Clear All
            </button>
          )}
        </div>
      </div>

      {/* Content */}
      <div className="flex-1 overflow-y-auto px-4 py-4">
        {addedPlaces.length === 0 ? (
          <div className="flex flex-col items-center justify-center h-full text-center px-6">
            <div className="w-20 h-20 bg-gray-100 rounded-full flex items-center justify-center mb-4">
              <Heart className="w-10 h-10 text-gray-300" />
            </div>
            <h3 className="text-lg font-semibold text-gray-900 mb-2">
              No places added yet
            </h3>
            <p className="text-gray-500 mb-6">
              Swipe right on places you want to visit to add them to your trip.
            </p>
          </div>
        ) : (
          <div className="space-y-6">
            {locations.map((location) => (
              <div key={location}>
                {/* Location Header */}
                <div className="flex items-center gap-2 mb-3">
                  <MapPin className="w-5 h-5 text-primary-600" />
                  <h2 className="font-semibold text-gray-900 uppercase text-sm tracking-wide">
                    {location}
                  </h2>
                  <span className="text-gray-400 text-sm">
                    ({groupedByLocation[location].length}{' '}
                    {groupedByLocation[location].length === 1
                      ? 'place'
                      : 'places'}
                    )
                  </span>
                </div>

                {/* Places */}
                <div className="space-y-3">
                  {groupedByLocation[location].map((place) => {
                    const CategoryIcon =
                      CATEGORY_ICONS[place.category] || Camera
                    return (
                      <div
                        key={place.id}
                        className="bg-white rounded-xl shadow-sm border border-gray-100 overflow-hidden"
                      >
                        <div className="flex items-center p-3 gap-3">
                          {/* Photo */}
                          {place.photos?.[0] ? (
                            <img
                              src={place.photos[0]}
                              alt={place.name}
                              className="w-16 h-16 rounded-lg object-cover flex-shrink-0"
                            />
                          ) : (
                            <div className="w-16 h-16 rounded-lg bg-gray-100 flex items-center justify-center flex-shrink-0">
                              <CategoryIcon className="w-6 h-6 text-gray-400" />
                            </div>
                          )}

                          {/* Info */}
                          <div className="flex-1 min-w-0">
                            <h3 className="font-medium text-gray-900 truncate">
                              {place.name}
                            </h3>
                            <div className="flex items-center gap-1.5 text-gray-500 text-sm">
                              <CategoryIcon className="w-3.5 h-3.5" />
                              <span className="capitalize">
                                {place.placeType}
                              </span>
                            </div>
                            {place.estimatedCost !== undefined &&
                            place.estimatedCost > 0 ? (
                              <p className="text-primary-600 font-medium text-sm mt-0.5">
                                ~P{place.estimatedCost.toLocaleString()}
                              </p>
                            ) : (
                              <p className="text-green-600 font-medium text-sm mt-0.5">
                                Free
                              </p>
                            )}
                          </div>

                          {/* Remove Button */}
                          <button
                            onClick={() => onRemovePlace(place.id)}
                            className="p-2 text-gray-400 hover:text-red-500 hover:bg-red-50 rounded-lg transition-colors"
                            aria-label="Remove"
                          >
                            <X className="w-5 h-5" />
                          </button>
                        </div>
                      </div>
                    )
                  })}
                </div>
              </div>
            ))}
          </div>
        )}
      </div>

      {/* Footer */}
      {addedPlaces.length > 0 && (
        <div className="bg-white border-t border-gray-100 px-4 py-4 space-y-4">
          {/* Total */}
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-2 text-gray-600">
              <Wallet className="w-5 h-5" />
              <span className="font-medium">Estimated Total</span>
            </div>
            <span className="text-xl font-bold text-gray-900">
              ~P{totalEstimatedCost.toLocaleString()}
            </span>
          </div>

          {/* Create Trip Button */}
          <button
            onClick={onCreateTrip}
            className="w-full flex items-center justify-center gap-2 px-6 py-4 bg-primary-600 text-white rounded-xl font-semibold text-lg transition-colors hover:bg-primary-700 active:scale-[0.98]"
          >
            <Calendar className="w-5 h-5" />
            Set Dates & Create Trip
            <ChevronRight className="w-5 h-5" />
          </button>
        </div>
      )}
    </div>
  )
}
