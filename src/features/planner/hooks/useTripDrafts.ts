'use client'

import { useState, useEffect, useCallback } from 'react'
import { supabase, getUserSafe } from '@/lib/supabase'
import { Itinerary, ItineraryDay } from '@/types/database'
import { activityService, CreateActivityData } from '../services/activityService'
import { DiscoverPlace } from '../services/placeService'

export interface TripWithDays extends Itinerary {
  days?: ItineraryDay[]
}

export function useTripDrafts() {
  const [trips, setTrips] = useState<TripWithDays[]>([])
  const [loading, setLoading] = useState(false)
  const [error, setError] = useState<string | null>(null)

  const fetchUserTrips = useCallback(async (limit: number = 10): Promise<TripWithDays[]> => {
    setLoading(true)
    setError(null)

    try {
      const user = await getUserSafe()
      if (!user) {
        throw new Error('You must be logged in to view trips')
      }

      const { data, error: fetchError } = await supabase
        .from('itineraries')
        .select('*')
        .eq('user_id', user.id)
        .order('updated_at', { ascending: false })
        .limit(limit)

      if (fetchError) throw fetchError

      setTrips(data || [])
      return data || []
    } catch (err: any) {
      setError(err.message)
      return []
    } finally {
      setLoading(false)
    }
  }, [])

  const fetchTripDays = useCallback(async (tripId: string): Promise<ItineraryDay[]> => {
    try {
      const { data, error: fetchError } = await supabase
        .from('itinerary_days')
        .select('*')
        .eq('itinerary_id', tripId)
        .order('day_number', { ascending: true })

      if (fetchError) throw fetchError
      return data || []
    } catch (err: any) {
      setError(err.message)
      return []
    }
  }, [])

  const addPlaceToTrip = useCallback(async (
    dayId: string,
    place: DiscoverPlace
  ): Promise<void> => {
    const { data: { user } } = await supabase.auth.getUser()
    if (!user) {
      throw new Error('You must be logged in to add places to trips')
    }

    const activityData: CreateActivityData = {
      day_id: dayId,
      title: place.name,
      description: place.description,
      location: place.address || place.location,
      coordinates: place.coordinates,
      place_type: place.placeType,
      estimated_cost: place.estimatedCost,
    }

    await activityService.create(activityData)
  }, [])

  return {
    trips,
    loading,
    error,
    fetchUserTrips,
    fetchTripDays,
    addPlaceToTrip,
  }
}
