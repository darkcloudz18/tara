'use client'

import { useState, useEffect } from 'react'
import { supabase } from '@/lib/supabase'
import { useGoogleMaps } from '../hooks/useGoogleMaps'
import { PLACE_TYPES, PlaceType } from '@/lib/google-maps'
import { Listing } from '@/types/database'

interface Place {
  placeId: string
  name: string
  address: string
  rating?: number
  userRatingsTotal?: number
  types: string[]
  coordinates: { x: number; y: number }
  photoUrl?: string
  isPartner?: boolean
  price?: number
  listingId?: string
}

interface PlaceSuggestionsProps {
  location: { lat: number; lng: number } | null
  destinationName?: string // e.g., "Boracay", "El Nido" - for matching partner listings
  onSelectPlace: (place: Place) => void
  className?: string
}

const SEARCH_TYPES = [
  { type: 'all', label: 'All', icon: '✨' },
  { type: 'tourist_attraction', label: 'Attractions', icon: '🏛️' },
  { type: 'restaurant', label: 'Restaurants', icon: '🍽️' },
  { type: 'lodging', label: 'Hotels', icon: '🏨' },
  { type: 'shopping_mall', label: 'Shopping', icon: '🛍️' },
  { type: 'cafe', label: 'Cafes', icon: '☕' },
]

// Map our listing types to Google place types
const LISTING_TYPE_MAP: Record<string, string> = {
  hotel: 'lodging',
  resort: 'lodging',
  hostel: 'lodging',
  tour: 'tourist_attraction',
  activity: 'tourist_attraction',
  transport: 'transit_station',
}

export default function PlaceSuggestions({
  location,
  destinationName,
  onSelectPlace,
  className = '',
}: PlaceSuggestionsProps) {
  const { isLoaded } = useGoogleMaps()
  const [partnerListings, setPartnerListings] = useState<Place[]>([])
  const [googlePlaces, setGooglePlaces] = useState<Place[]>([])
  const [loading, setLoading] = useState(false)
  const [selectedType, setSelectedType] = useState('all')
  const [error, setError] = useState<string | null>(null)

  // Fetch partner listings from Supabase
  useEffect(() => {
    if (!location && !destinationName) {
      setPartnerListings([])
      return
    }
    fetchPartnerListings()
  }, [location, destinationName, selectedType])

  // Fetch Google Places
  useEffect(() => {
    if (!isLoaded || !location) {
      setGooglePlaces([])
      return
    }
    if (selectedType !== 'all') {
      searchNearbyPlaces()
    } else {
      setGooglePlaces([])
    }
  }, [isLoaded, location, selectedType])

  const fetchPartnerListings = async () => {
    try {
      let query = supabase
        .from('listings')
        .select('*')
        .eq('is_active', true)
        .order('average_rating', { ascending: false })
        .limit(10)

      // Filter by location name if provided
      if (destinationName) {
        query = query.ilike('location', `%${destinationName}%`)
      }

      // Filter by listing type based on selected type
      if (selectedType !== 'all') {
        const listingTypes = Object.entries(LISTING_TYPE_MAP)
          .filter(([_, googleType]) => googleType === selectedType)
          .map(([listingType]) => listingType)

        if (listingTypes.length > 0) {
          query = query.in('listing_type', listingTypes)
        }
      }

      const { data, error } = await query

      if (error) throw error

      const mappedListings: Place[] = (data || []).map((listing: Listing) => ({
        placeId: `partner-${listing.id}`,
        listingId: listing.id,
        name: listing.title,
        address: listing.location,
        rating: listing.average_rating,
        userRatingsTotal: listing.total_reviews,
        types: [listing.listing_type],
        coordinates: listing.coordinates || { x: location?.lat || 0, y: location?.lng || 0 },
        photoUrl: listing.photos?.[0],
        isPartner: true,
        price: listing.price,
      }))

      setPartnerListings(mappedListings)
    } catch (err) {
      console.error('Error fetching partner listings:', err)
    }
  }

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
          const mappedPlaces: Place[] = results.slice(0, 6).map((place) => ({
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
            isPartner: false,
          }))
          setGooglePlaces(mappedPlaces)
        } else if (status === google.maps.places.PlacesServiceStatus.ZERO_RESULTS) {
          setGooglePlaces([])
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

  // Combine partner listings (first) with Google places
  const allPlaces = [...partnerListings, ...googlePlaces]

  const getPlaceType = (types: string[]): PlaceType => {
    if (types.includes('restaurant') || types.includes('food')) return 'restaurant'
    if (types.includes('lodging') || types.includes('hotel') || types.includes('resort') || types.includes('hostel')) return 'hotel'
    if (types.includes('tourist_attraction') || types.includes('tour') || types.includes('activity')) return 'attraction'
    if (types.includes('shopping_mall') || types.includes('store')) return 'shopping'
    if (types.includes('natural_feature') || types.includes('park')) return 'beach'
    if (types.includes('transport')) return 'transport'
    return 'activity'
  }

  if (!location && !destinationName) {
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

      <div className="max-h-72 overflow-y-auto">
        {loading && allPlaces.length === 0 ? (
          <div className="p-4 text-center text-gray-500 text-sm">
            <div className="w-5 h-5 border-2 border-gray-300 border-t-primary-600 rounded-full animate-spin mx-auto mb-2" />
            Loading suggestions...
          </div>
        ) : error ? (
          <div className="p-4 text-center text-red-500 text-sm">{error}</div>
        ) : allPlaces.length === 0 ? (
          <div className="p-4 text-center text-gray-500 text-sm">
            No places found nearby. Try a different category.
          </div>
        ) : (
          <div className="divide-y divide-gray-100">
            {/* Partner listings section */}
            {partnerListings.length > 0 && (
              <div className="bg-primary-50/50">
                <div className="px-3 py-2 text-xs font-medium text-primary-700 border-b border-primary-100">
                  ⭐ Tara Partners
                </div>
                {partnerListings.map((place) => (
                  <button
                    key={place.placeId}
                    onClick={() => onSelectPlace(place)}
                    className="w-full p-3 text-left hover:bg-primary-100/50 transition-colors flex gap-3"
                  >
                    {/* Photo or Icon */}
                    {place.photoUrl ? (
                      <img
                        src={place.photoUrl}
                        alt={place.name}
                        className="w-12 h-12 rounded-lg object-cover flex-shrink-0"
                      />
                    ) : (
                      <div className="w-12 h-12 rounded-lg bg-primary-100 flex items-center justify-center flex-shrink-0">
                        <span className="text-xl">
                          {PLACE_TYPES[getPlaceType(place.types)]?.icon || '📍'}
                        </span>
                      </div>
                    )}

                    {/* Info */}
                    <div className="flex-1 min-w-0">
                      <div className="flex items-center gap-2">
                        <h5 className="font-medium text-gray-900 text-sm truncate">
                          {place.name}
                        </h5>
                        <span className="px-1.5 py-0.5 bg-primary-600 text-white text-[10px] font-medium rounded">
                          PARTNER
                        </span>
                      </div>
                      <p className="text-xs text-gray-500 truncate">{place.address}</p>
                      <div className="flex items-center gap-2 mt-0.5">
                        {place.rating && place.rating > 0 && (
                          <span className="text-xs text-gray-600">
                            <span className="text-yellow-500">★</span> {place.rating.toFixed(1)}
                          </span>
                        )}
                        {place.price && (
                          <span className="text-xs font-medium text-primary-600">
                            ₱{place.price.toLocaleString()}
                          </span>
                        )}
                      </div>
                    </div>

                    {/* Add Icon */}
                    <div className="flex-shrink-0 self-center">
                      <span className="text-primary-600 text-lg">+</span>
                    </div>
                  </button>
                ))}
              </div>
            )}

            {/* Google Places section */}
            {googlePlaces.length > 0 && (
              <>
                {partnerListings.length > 0 && (
                  <div className="px-3 py-2 text-xs font-medium text-gray-500 bg-gray-50">
                    More places nearby
                  </div>
                )}
                {googlePlaces.map((place) => (
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
              </>
            )}
          </div>
        )}
      </div>
    </div>
  )
}
