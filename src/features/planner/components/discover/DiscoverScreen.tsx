'use client'

import { useState, useMemo } from 'react'
import TinderCard from 'react-tinder-card'
import { X, Heart, Compass, RefreshCw } from 'lucide-react'
import PlaceCard from './PlaceCard'
import CategoryFilter from './CategoryFilter'
import DestinationFilter from './DestinationFilter'
import { useDiscoverPlaces } from '../../hooks/useDiscoverPlaces'
import { DiscoverPlace } from '../../services/placeService'

interface DiscoverScreenProps {
  onAddPlace: (place: DiscoverPlace) => void
  onSkipPlace: (placeId: string) => void
  isPlaceAdded: (placeId: string) => boolean
  isPlaceSkipped: (placeId: string) => boolean
  onResetSkipped: () => void
}

export default function DiscoverScreen({
  onAddPlace,
  onSkipPlace,
  isPlaceAdded,
  isPlaceSkipped,
  onResetSkipped,
}: DiscoverScreenProps) {
  const {
    places,
    destinations,
    loading,
    error,
    selectedDestination,
    selectedCategory,
    setSelectedDestination,
    setSelectedCategory,
    refresh,
  } = useDiscoverPlaces()

  const [currentIndex, setCurrentIndex] = useState(0)

  // Filter out already added or skipped places
  const availablePlaces = useMemo(() => {
    return places.filter(
      (place) => !isPlaceAdded(place.id) && !isPlaceSkipped(place.id)
    )
  }, [places, isPlaceAdded, isPlaceSkipped])

  const currentPlace = availablePlaces[currentIndex]

  const handleSwipe = (direction: string, place: DiscoverPlace) => {
    if (direction === 'right') {
      onAddPlace(place)
    } else if (direction === 'left') {
      onSkipPlace(place.id)
    }
    // Move to next card
    setCurrentIndex((prev) => Math.min(prev + 1, availablePlaces.length))
  }

  const handleButtonAdd = () => {
    if (currentPlace) {
      onAddPlace(currentPlace)
      setCurrentIndex((prev) => prev + 1)
    }
  }

  const handleButtonSkip = () => {
    if (currentPlace) {
      onSkipPlace(currentPlace.id)
      setCurrentIndex((prev) => prev + 1)
    }
  }

  const handleReset = () => {
    onResetSkipped()
    setCurrentIndex(0)
  }

  // Reset index when filters change
  const handleDestinationChange = (dest: string) => {
    setSelectedDestination(dest)
    setCurrentIndex(0)
  }

  const handleCategoryChange = (cat: typeof selectedCategory) => {
    setSelectedCategory(cat)
    setCurrentIndex(0)
  }

  return (
    <div className="flex flex-col h-full bg-gray-50">
      {/* Header */}
      <div className="bg-white border-b border-gray-100 px-4 pt-4 pb-3">
        <div className="flex items-center gap-2 mb-4">
          <Compass className="w-6 h-6 text-primary-600" />
          <h1 className="text-xl font-bold text-gray-900">Discover Places</h1>
        </div>

        {/* Destination Filter */}
        <DestinationFilter
          destinations={destinations}
          selected={selectedDestination}
          onChange={handleDestinationChange}
        />

        {/* Category Filter */}
        <CategoryFilter
          selected={selectedCategory}
          onChange={handleCategoryChange}
        />
      </div>

      {/* Card Stack */}
      <div className="flex-1 relative overflow-hidden px-4 py-6">
        {loading ? (
          <div className="flex items-center justify-center h-full">
            <div className="text-center">
              <div className="w-12 h-12 border-4 border-gray-200 border-t-primary-600 rounded-full animate-spin mx-auto mb-4" />
              <p className="text-gray-500">Finding amazing places...</p>
            </div>
          </div>
        ) : error ? (
          <div className="flex items-center justify-center h-full">
            <div className="text-center">
              <p className="text-red-500 mb-4">{error}</p>
              <button
                onClick={refresh}
                className="px-4 py-2 bg-primary-600 text-white rounded-lg font-medium"
              >
                Try Again
              </button>
            </div>
          </div>
        ) : availablePlaces.length === 0 ? (
          <div className="flex items-center justify-center h-full">
            <div className="text-center px-6">
              <div className="w-16 h-16 bg-gray-100 rounded-full flex items-center justify-center mx-auto mb-4">
                <Compass className="w-8 h-8 text-gray-400" />
              </div>
              <h3 className="text-lg font-semibold text-gray-900 mb-2">
                No more places to show
              </h3>
              <p className="text-gray-500 mb-6">
                You've seen all the places! Try different filters or reset to
                see skipped places again.
              </p>
              <button
                onClick={handleReset}
                className="flex items-center gap-2 px-5 py-3 bg-primary-600 text-white rounded-xl font-medium mx-auto"
              >
                <RefreshCw className="w-5 h-5" />
                Reset & See All
              </button>
            </div>
          </div>
        ) : (
          <div className="relative h-full max-w-md mx-auto">
            {/* Show current card and next card for stacking effect */}
            {availablePlaces
              .slice(currentIndex, currentIndex + 2)
              .reverse()
              .map((place, index) => (
                <TinderCard
                  key={place.id}
                  onSwipe={(dir) => handleSwipe(dir, place)}
                  preventSwipe={['up', 'down']}
                  className={`absolute inset-0 ${index === 0 ? 'z-0 scale-95 opacity-50' : 'z-10'}`}
                >
                  <PlaceCard place={place} className="h-full" />
                </TinderCard>
              ))}
          </div>
        )}
      </div>

      {/* Action Buttons */}
      {!loading && !error && availablePlaces.length > 0 && (
        <div className="bg-white border-t border-gray-100 px-4 py-4">
          <div className="flex items-center justify-center gap-8 max-w-md mx-auto">
            {/* Skip Button */}
            <button
              onClick={handleButtonSkip}
              className="w-16 h-16 rounded-full bg-red-50 border-2 border-red-200 flex items-center justify-center transition-transform active:scale-95 hover:bg-red-100"
              aria-label="Skip"
            >
              <X className="w-8 h-8 text-red-500" />
            </button>

            {/* Add Button */}
            <button
              onClick={handleButtonAdd}
              className="w-20 h-20 rounded-full bg-primary-600 shadow-lg flex items-center justify-center transition-transform active:scale-95 hover:bg-primary-700"
              aria-label="Add to trip"
            >
              <Heart className="w-10 h-10 text-white" />
            </button>
          </div>

          {/* Swipe hint */}
          <p className="text-center text-gray-400 text-sm mt-3">
            Swipe right to add, left to skip
          </p>
        </div>
      )}
    </div>
  )
}
