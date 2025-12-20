'use client'

import { useState, useEffect, useCallback } from 'react'
import { Itinerary, ItineraryDay, ItineraryActivity } from '@/types/database'
import { itineraryService, UpdateItineraryData } from '../services/itineraryService'
import { dayService } from '../services/dayService'
import { activityService } from '../services/activityService'

export interface ItineraryWithDetails extends Itinerary {
  days: (ItineraryDay & { activities: ItineraryActivity[] })[]
}

export function useItinerary(itineraryId: string | null) {
  const [itinerary, setItinerary] = useState<Itinerary | null>(null)
  const [days, setDays] = useState<ItineraryDay[]>([])
  const [activities, setActivities] = useState<ItineraryActivity[]>([])
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState<string | null>(null)

  const fetchItinerary = useCallback(async () => {
    if (!itineraryId) {
      setLoading(false)
      return
    }

    try {
      setLoading(true)
      setError(null)

      // Fetch itinerary, days, and activities in parallel
      const [itineraryData, daysData, activitiesData] = await Promise.all([
        itineraryService.getById(itineraryId),
        dayService.getByItinerary(itineraryId),
        activityService.getByItinerary(itineraryId),
      ])

      setItinerary(itineraryData)
      setDays(daysData)
      setActivities(activitiesData)
    } catch (err: any) {
      setError(err.message || 'Failed to fetch itinerary')
    } finally {
      setLoading(false)
    }
  }, [itineraryId])

  useEffect(() => {
    fetchItinerary()
  }, [fetchItinerary])

  const updateItinerary = async (data: UpdateItineraryData): Promise<boolean> => {
    if (!itineraryId) return false

    try {
      setError(null)
      const updated = await itineraryService.update(itineraryId, data)
      setItinerary(updated)
      return true
    } catch (err: any) {
      setError(err.message || 'Failed to update itinerary')
      return false
    }
  }

  const deleteItinerary = async (): Promise<boolean> => {
    if (!itineraryId) return false

    try {
      setError(null)
      await itineraryService.delete(itineraryId)
      return true
    } catch (err: any) {
      setError(err.message || 'Failed to delete itinerary')
      return false
    }
  }

  // Get activities for a specific day
  const getActivitiesForDay = (dayId: string): ItineraryActivity[] => {
    return activities.filter((a) => a.day_id === dayId)
  }

  // Get the full itinerary with nested days and activities
  const getFullItinerary = (): ItineraryWithDetails | null => {
    if (!itinerary) return null

    return {
      ...itinerary,
      days: days.map((day) => ({
        ...day,
        activities: getActivitiesForDay(day.id),
      })),
    }
  }

  return {
    itinerary,
    days,
    activities,
    loading,
    error,
    refetch: fetchItinerary,
    updateItinerary,
    deleteItinerary,
    getActivitiesForDay,
    getFullItinerary,
  }
}
