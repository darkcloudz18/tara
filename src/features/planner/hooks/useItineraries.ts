'use client'

import { useState, useEffect, useCallback } from 'react'
import { supabase } from '@/lib/supabase'
import { Itinerary } from '@/types/database'
import { itineraryService, CreateItineraryData } from '../services/itineraryService'
import { dayService } from '../services/dayService'
import { addDays, differenceInDays, format } from 'date-fns'

export function useItineraries() {
  const [itineraries, setItineraries] = useState<Itinerary[]>([])
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState<string | null>(null)

  const fetchItineraries = useCallback(async () => {
    try {
      setLoading(true)
      setError(null)

      const {
        data: { user },
      } = await supabase.auth.getUser()

      if (!user) {
        setItineraries([])
        return
      }

      const data = await itineraryService.getAll(user.id)
      setItineraries(data)
    } catch (err: any) {
      setError(err.message || 'Failed to fetch itineraries')
    } finally {
      setLoading(false)
    }
  }, [])

  useEffect(() => {
    fetchItineraries()
  }, [fetchItineraries])

  const createItinerary = async (data: CreateItineraryData): Promise<Itinerary | null> => {
    try {
      setError(null)

      const {
        data: { user },
      } = await supabase.auth.getUser()

      if (!user) {
        setError('You must be logged in to create an itinerary')
        return null
      }

      // Create the itinerary
      const itinerary = await itineraryService.create(user.id, data)

      // Auto-generate days based on date range
      const startDate = new Date(data.start_date)
      const endDate = new Date(data.end_date)
      const numDays = differenceInDays(endDate, startDate) + 1

      if (numDays > 0 && numDays <= 30) {
        const daysToCreate = Array.from({ length: numDays }, (_, i) => ({
          itinerary_id: itinerary.id,
          day_number: i + 1,
          date: format(addDays(startDate, i), 'yyyy-MM-dd'),
          title: `Day ${i + 1}`,
        }))

        await dayService.bulkCreate(daysToCreate)
      }

      // Refresh the list
      await fetchItineraries()

      return itinerary
    } catch (err: any) {
      setError(err.message || 'Failed to create itinerary')
      return null
    }
  }

  const deleteItinerary = async (id: string): Promise<boolean> => {
    try {
      setError(null)
      await itineraryService.delete(id)
      setItineraries((prev) => prev.filter((it) => it.id !== id))
      return true
    } catch (err: any) {
      setError(err.message || 'Failed to delete itinerary')
      return false
    }
  }

  return {
    itineraries,
    loading,
    error,
    refetch: fetchItineraries,
    createItinerary,
    deleteItinerary,
  }
}
