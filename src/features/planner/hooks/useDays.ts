'use client'

import { useState, useCallback } from 'react'
import { ItineraryDay } from '@/types/database'
import { dayService, CreateDayData, UpdateDayData } from '../services/dayService'

export function useDays(itineraryId: string | null) {
  const [days, setDays] = useState<ItineraryDay[]>([])
  const [loading, setLoading] = useState(false)
  const [error, setError] = useState<string | null>(null)

  const fetchDays = useCallback(async () => {
    if (!itineraryId) return

    try {
      setLoading(true)
      setError(null)
      const data = await dayService.getByItinerary(itineraryId)
      setDays(data)
    } catch (err: any) {
      setError(err.message || 'Failed to fetch days')
    } finally {
      setLoading(false)
    }
  }, [itineraryId])

  const createDay = async (
    data: Omit<CreateDayData, 'itinerary_id'>
  ): Promise<ItineraryDay | null> => {
    if (!itineraryId) return null

    try {
      setError(null)
      const day = await dayService.create({
        ...data,
        itinerary_id: itineraryId,
      })
      setDays((prev) => [...prev, day].sort((a, b) => a.day_number - b.day_number))
      return day
    } catch (err: any) {
      setError(err.message || 'Failed to create day')
      return null
    }
  }

  const updateDay = async (dayId: string, data: UpdateDayData): Promise<boolean> => {
    try {
      setError(null)
      const updated = await dayService.update(dayId, data)
      setDays((prev) => prev.map((d) => (d.id === dayId ? updated : d)))
      return true
    } catch (err: any) {
      setError(err.message || 'Failed to update day')
      return false
    }
  }

  const deleteDay = async (dayId: string): Promise<boolean> => {
    try {
      setError(null)
      await dayService.delete(dayId)
      setDays((prev) => prev.filter((d) => d.id !== dayId))
      return true
    } catch (err: any) {
      setError(err.message || 'Failed to delete day')
      return false
    }
  }

  const reorderDays = async (dayIds: string[]): Promise<boolean> => {
    if (!itineraryId) return false

    try {
      setError(null)
      await dayService.reorder(itineraryId, dayIds)
      // Optimistically update local state
      const reorderedDays = dayIds
        .map((id, index) => {
          const day = days.find((d) => d.id === id)
          return day ? { ...day, day_number: index + 1 } : null
        })
        .filter((d): d is ItineraryDay => d !== null)
      setDays(reorderedDays)
      return true
    } catch (err: any) {
      setError(err.message || 'Failed to reorder days')
      return false
    }
  }

  const getNextDayNumber = (): number => {
    if (days.length === 0) return 1
    return Math.max(...days.map((d) => d.day_number)) + 1
  }

  return {
    days,
    loading,
    error,
    setDays,
    fetchDays,
    createDay,
    updateDay,
    deleteDay,
    reorderDays,
    getNextDayNumber,
  }
}
