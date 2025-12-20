'use client'

import { useState, useCallback, useMemo } from 'react'
import { DiscoverPlace } from '../services/placeService'

interface TripBuilderState {
  addedPlaces: DiscoverPlace[]
  skippedPlaceIds: Set<string>
}

interface GroupedPlaces {
  [location: string]: DiscoverPlace[]
}

interface UseTripBuilderReturn {
  addedPlaces: DiscoverPlace[]
  skippedPlaceIds: Set<string>
  addPlace: (place: DiscoverPlace) => void
  removePlace: (placeId: string) => void
  skipPlace: (placeId: string) => void
  isPlaceAdded: (placeId: string) => boolean
  isPlaceSkipped: (placeId: string) => boolean
  clearTrip: () => void
  resetSkipped: () => void
  groupedByLocation: GroupedPlaces
  totalEstimatedCost: number
  placeCount: number
  uniqueDestinations: string[]
}

export function useTripBuilder(): UseTripBuilderReturn {
  const [state, setState] = useState<TripBuilderState>({
    addedPlaces: [],
    skippedPlaceIds: new Set(),
  })

  const addPlace = useCallback((place: DiscoverPlace) => {
    setState((prev) => {
      // Don't add duplicates
      if (prev.addedPlaces.some((p) => p.id === place.id)) {
        return prev
      }
      return {
        ...prev,
        addedPlaces: [...prev.addedPlaces, place],
      }
    })
  }, [])

  const removePlace = useCallback((placeId: string) => {
    setState((prev) => ({
      ...prev,
      addedPlaces: prev.addedPlaces.filter((p) => p.id !== placeId),
    }))
  }, [])

  const skipPlace = useCallback((placeId: string) => {
    setState((prev) => ({
      ...prev,
      skippedPlaceIds: new Set([...prev.skippedPlaceIds, placeId]),
    }))
  }, [])

  const isPlaceAdded = useCallback(
    (placeId: string) => {
      return state.addedPlaces.some((p) => p.id === placeId)
    },
    [state.addedPlaces]
  )

  const isPlaceSkipped = useCallback(
    (placeId: string) => {
      return state.skippedPlaceIds.has(placeId)
    },
    [state.skippedPlaceIds]
  )

  const clearTrip = useCallback(() => {
    setState({
      addedPlaces: [],
      skippedPlaceIds: new Set(),
    })
  }, [])

  const resetSkipped = useCallback(() => {
    setState((prev) => ({
      ...prev,
      skippedPlaceIds: new Set(),
    }))
  }, [])

  // Group places by location
  const groupedByLocation = useMemo(() => {
    const grouped: GroupedPlaces = {}
    state.addedPlaces.forEach((place) => {
      const location = place.location || 'Other'
      if (!grouped[location]) {
        grouped[location] = []
      }
      grouped[location].push(place)
    })
    return grouped
  }, [state.addedPlaces])

  // Calculate total estimated cost
  const totalEstimatedCost = useMemo(() => {
    return state.addedPlaces.reduce(
      (sum, place) => sum + (place.estimatedCost || 0),
      0
    )
  }, [state.addedPlaces])

  // Get unique destinations
  const uniqueDestinations = useMemo(() => {
    return [...new Set(state.addedPlaces.map((p) => p.location))]
  }, [state.addedPlaces])

  return {
    addedPlaces: state.addedPlaces,
    skippedPlaceIds: state.skippedPlaceIds,
    addPlace,
    removePlace,
    skipPlace,
    isPlaceAdded,
    isPlaceSkipped,
    clearTrip,
    resetSkipped,
    groupedByLocation,
    totalEstimatedCost,
    placeCount: state.addedPlaces.length,
    uniqueDestinations,
  }
}
