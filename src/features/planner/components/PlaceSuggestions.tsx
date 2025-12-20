'use client'

import { useState, useEffect } from 'react'
import { useGoogleMaps } from '../hooks/useGoogleMaps'
import { PLACE_TYPES, PlaceType } from '@/lib/google-maps'

interface Place {
  placeId: string
  name: string
  address: string
  rating?: number
  userRatingsTotal?: number
  types: string[]
  coordinates: { x: number; y: number }
  photoUrl?: string
}

interface PlaceSuggestionsProps {
  location: { lat: number; lng: number } | null
  onSelectPlace: (place: Place) => void
  className?: string
}

const SEARCH_TYPES = [
  { type: 'tourist_attraction', label: 'Attractions', icon: '🏛️' },
  { type: 'restaurant', label: 'Restaurants', icon: '🍽️' },
  { type: 'lodging', label: 'Hotels', icon: '🏨' },
  { type: 'shopping_mall', label: 'Shopping', icon: '🛍️' },
  { type: 'cafe', label: 'Cafes', icon: '☕' },
  { type: 'bar', label: 'Bars', icon: '🍺' },
]

export default function PlaceSuggestions({
  location,
  onSelectPlace,
  className = '',
}: PlaceSuggestionsProps) {
  const { isLoaded } = useGoogleMaps()
  const [places, setPlaces] = useState<Place[]>([])
  const [loading, setLoading] = useState(false)
  const [selectedType, setSelectedType] = useState('tourist_attraction')
  const [error, setError] = useState<string | null>(null)

  useEffect(() => {
    if (!isLoaded || !location) {
      setPlaces([])
      return
    }

    searchNearbyPlaces()
  }, [isLoaded, location, selectedType])

  const searchNearbyPlaces = async () => {
    if (!location || !isLoaded) return

    setLoading(true)
    setError(null)

    try {
      const service = new google.maps.places.PlacesService(
        document.createElement('div')
      )

      const request: google.maps.places.PlaceSearchRequest = {
        location: new google.maps.LatLng(location.lat, location.lng),
        radius: 5000, // 5km radius
        type: selectedType,
      }

      service.nearbySearch(request, (results, status) => {
        if (status === google.maps.places.PlacesServiceStatus.OK && results) {
          const mappedPlaces: Place[] = results.slice(0, 8).map((place) => ({
            placeId: place.place_id || '',
            name: place.name || '',
            address: place.vicinity || '',
            rating: place.rating,
            userRatingsTotal: place.user_ratings_total,
            types: place.types || [],
            coordinates: {
              x: place.geometry?.location?.lat() || 0,
              y: place.geometry?.location?.lng() || 0,
            },
            photoUrl: place.photos?.[0]?.getUrl({ maxWidth: 200 }),
          }))
          setPlaces(mappedPlaces)
        } else if (status === google.maps.places.PlacesServiceStatus.ZERO_RESULTS) {
          setPlaces([])
        } else {
          setError('Failed to load suggestions')
        }
        setLoading(false)
      })
    } catch (err) {
      setError('Failed to load suggestions')
      setLoading(false)
    }
  }

  const getPlaceType = (types: string[]): PlaceType => {
    if (types.includes('restaurant') || types.includes('food')) return 'restaurant'
    if (types.includes('lodging')) return 'hotel'
    if (types.includes('tourist_attraction')) return 'attraction'
    if (types.includes('shopping_mall') || types.includes('store')) return 'shopping'
    if (types.includes('natural_feature') || types.includes('park')) return 'beach'
    return 'activity'
  }

  if (!location) {
    return null
  }

  return (
    <div className={`bg-white rounded-lg border border-gray-200 ${className}`}>
      <div className="p-3 border-b border-gray-100">
        <h4 className="font-medium text-gray-900 text-sm mb-2">Suggested Activities Nearby</h4>

        {/* Type Filter */}
        <div className="flex flex-wrap gap-1">
          {SEARCH_TYPES.map((t) => (
            <button
              key={t.type}
              onClick={() => setSelectedType(t.type)}
              className={`px-2 py-1 rounded-full text-xs font-medium transition-colors ${
                selectedType === t.type
                  ? 'bg-primary-600 text-white'
                  : 'bg-gray-100 text-gray-600 hover:bg-gray-200'
              }`}
            >
              {t.icon} {t.label}
            </button>
          ))}
        </div>
      </div>

      <div className="max-h-64 overflow-y-auto">
        {loading ? (
          <div className="p-4 text-center text-gray-500 text-sm">
            <div className="w-5 h-5 border-2 border-gray-300 border-t-primary-600 rounded-full animate-spin mx-auto mb-2" />
            Loading suggestions...
          </div>
        ) : error ? (
          <div className="p-4 text-center text-red-500 text-sm">{error}</div>
        ) : places.length === 0 ? (
          <div className="p-4 text-center text-gray-500 text-sm">
            No places found nearby
          </div>
        ) : (
          <div className="divide-y divide-gray-100">
            {places.map((place) => (
              <button
                key={place.placeId}
                onClick={() => onSelectPlace(place)}
                className="w-full p-3 text-left hover:bg-gray-50 transition-colors flex gap-3"
              >
                {/* Photo or Icon */}
                {place.photoUrl ? (
                  <img
                    src={place.photoUrl}
                    alt={place.name}
                    className="w-12 h-12 rounded-lg object-cover flex-shrink-0"
                  />
                ) : (
                  <div className="w-12 h-12 rounded-lg bg-gray-100 flex items-center justify-center flex-shrink-0">
                    <span className="text-xl">
                      {PLACE_TYPES[getPlaceType(place.types)]?.icon || '📍'}
                    </span>
                  </div>
                )}

                {/* Info */}
                <div className="flex-1 min-w-0">
                  <h5 className="font-medium text-gray-900 text-sm truncate">
                    {place.name}
                  </h5>
                  <p className="text-xs text-gray-500 truncate">{place.address}</p>
                  {place.rating && (
                    <div className="flex items-center gap-1 mt-0.5">
                      <span className="text-yellow-500 text-xs">★</span>
                      <span className="text-xs text-gray-600">
                        {place.rating.toFixed(1)}
                        {place.userRatingsTotal && (
                          <span className="text-gray-400">
                            {' '}({place.userRatingsTotal})
                          </span>
                        )}
                      </span>
                    </div>
                  )}
                </div>

                {/* Add Icon */}
                <div className="flex-shrink-0 self-center">
                  <span className="text-primary-600 text-lg">+</span>
                </div>
              </button>
            ))}
          </div>
        )}
      </div>
    </div>
  )
}
