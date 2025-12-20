'use client'

import { useState, useCallback, useRef } from 'react'
import { useJsApiLoader } from '@react-google-maps/api'
import {
  GOOGLE_MAPS_API_KEY,
  GOOGLE_MAPS_LIBRARIES,
  coordinatesToLatLng,
} from '@/lib/google-maps'
import { ItineraryActivity } from '@/types/database'

export function useGoogleMaps() {
  const { isLoaded, loadError } = useJsApiLoader({
    googleMapsApiKey: GOOGLE_MAPS_API_KEY,
    libraries: GOOGLE_MAPS_LIBRARIES,
  })

  return {
    isLoaded,
    loadError,
  }
}

export function useDirections() {
  const [directions, setDirections] = useState<google.maps.DirectionsResult | null>(null)
  const [loading, setLoading] = useState(false)
  const [error, setError] = useState<string | null>(null)
  const directionsServiceRef = useRef<google.maps.DirectionsService | null>(null)

  const getDirectionsService = useCallback(() => {
    if (!directionsServiceRef.current && typeof google !== 'undefined') {
      directionsServiceRef.current = new google.maps.DirectionsService()
    }
    return directionsServiceRef.current
  }, [])

  const calculateRoute = useCallback(
    async (activities: ItineraryActivity[]): Promise<google.maps.DirectionsResult | null> => {
      const activitiesWithCoords = activities.filter((a) => a.coordinates)

      if (activitiesWithCoords.length < 2) {
        setError('Need at least 2 locations with coordinates to calculate directions')
        return null
      }

      const service = getDirectionsService()
      if (!service) {
        setError('Google Maps not loaded')
        return null
      }

      setLoading(true)
      setError(null)

      try {
        const origin = coordinatesToLatLng(activitiesWithCoords[0].coordinates)
        const destination = coordinatesToLatLng(
          activitiesWithCoords[activitiesWithCoords.length - 1].coordinates
        )

        if (!origin || !destination) {
          throw new Error('Invalid coordinates')
        }

        const waypoints = activitiesWithCoords.slice(1, -1).map((a) => ({
          location: coordinatesToLatLng(a.coordinates)!,
          stopover: true,
        }))

        const result = await new Promise<google.maps.DirectionsResult>((resolve, reject) => {
          service.route(
            {
              origin,
              destination,
              waypoints,
              travelMode: google.maps.TravelMode.DRIVING,
              optimizeWaypoints: false,
            },
            (response, status) => {
              if (status === google.maps.DirectionsStatus.OK && response) {
                resolve(response)
              } else {
                reject(new Error(`Directions request failed: ${status}`))
              }
            }
          )
        })

        setDirections(result)
        return result
      } catch (err: any) {
        setError(err.message || 'Failed to calculate directions')
        return null
      } finally {
        setLoading(false)
      }
    },
    [getDirectionsService]
  )

  const clearDirections = useCallback(() => {
    setDirections(null)
    setError(null)
  }, [])

  return {
    directions,
    loading,
    error,
    calculateRoute,
    clearDirections,
  }
}

export function useMapBounds(
  map: google.maps.Map | null,
  activities: ItineraryActivity[]
) {
  const fitBounds = useCallback(() => {
    if (!map || activities.length === 0) return

    const activitiesWithCoords = activities.filter((a) => a.coordinates)
    if (activitiesWithCoords.length === 0) return

    const bounds = new google.maps.LatLngBounds()
    activitiesWithCoords.forEach((activity) => {
      if (activity.coordinates) {
        bounds.extend({
          lat: activity.coordinates.x,
          lng: activity.coordinates.y,
        })
      }
    })

    map.fitBounds(bounds, 50)
  }, [map, activities])

  return { fitBounds }
}
