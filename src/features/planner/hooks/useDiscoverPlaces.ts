'use client'

import { useState, useEffect, useCallback } from 'react'
import {
  DiscoverPlace,
  PlaceCategory,
  fetchDiscoverPlaces,
  fetchFeaturedPlaces,
  fetchDestinations,
} from '../services/placeService'

interface UseDiscoverPlacesReturn {
  places: DiscoverPlace[]
  destinations: string[]
  loading: boolean
  error: string | null
  selectedDestination: string
  selectedCategory: PlaceCategory
  setSelectedDestination: (destination: string) => void
  setSelectedCategory: (category: PlaceCategory) => void
  refresh: () => Promise<void>
}

export function useDiscoverPlaces(): UseDiscoverPlacesReturn {
  const [places, setPlaces] = useState<DiscoverPlace[]>([])
  const [destinations, setDestinations] = useState<string[]>([])
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState<string | null>(null)
  const [selectedDestination, setSelectedDestination] = useState<string>('all')
  const [selectedCategory, setSelectedCategory] = useState<PlaceCategory>('all')

  // Fetch destinations on mount
  useEffect(() => {
    const loadDestinations = async () => {
      const dests = await fetchDestinations()
      setDestinations(dests)
    }
    loadDestinations()
  }, [])

  // Fetch places when filters change
  const loadPlaces = useCallback(async () => {
    setLoading(true)
    setError(null)

    try {
      let fetchedPlaces: DiscoverPlace[]

      if (selectedDestination === 'all' && selectedCategory === 'all') {
        // Initial load - get featured places
        fetchedPlaces = await fetchFeaturedPlaces()
      } else {
        // Filtered load
        fetchedPlaces = await fetchDiscoverPlaces(
          selectedDestination === 'all' ? undefined : selectedDestination,
          selectedCategory
        )
      }

      setPlaces(fetchedPlaces)
    } catch (err) {
      setError('Failed to load places. Please try again.')
      console.error('Error loading places:', err)
    } finally {
      setLoading(false)
    }
  }, [selectedDestination, selectedCategory])

  useEffect(() => {
    loadPlaces()
  }, [loadPlaces])

  const refresh = useCallback(async () => {
    await loadPlaces()
  }, [loadPlaces])

  return {
    places,
    destinations,
    loading,
    error,
    selectedDestination,
    selectedCategory,
    setSelectedDestination,
    setSelectedCategory,
    refresh,
  }
}
