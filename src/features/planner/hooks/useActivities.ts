'use client'

import { useState, useCallback } from 'react'
import { ItineraryActivity } from '@/types/database'
import { activityService, CreateActivityData, UpdateActivityData } from '../services/activityService'

export function useActivities(dayId: string | null) {
  const [activities, setActivities] = useState<ItineraryActivity[]>([])
  const [loading, setLoading] = useState(false)
  const [error, setError] = useState<string | null>(null)

  const fetchActivities = useCallback(async () => {
    if (!dayId) return

    try {
      setLoading(true)
      setError(null)
      const data = await activityService.getByDay(dayId)
      setActivities(data)
    } catch (err: any) {
      setError(err.message || 'Failed to fetch activities')
    } finally {
      setLoading(false)
    }
  }, [dayId])

  const createActivity = async (
    data: Omit<CreateActivityData, 'day_id'>
  ): Promise<ItineraryActivity | null> => {
    if (!dayId) return null

    try {
      setError(null)
      const activity = await activityService.create({
        ...data,
        day_id: dayId,
      })
      setActivities((prev) => [...prev, activity].sort((a, b) => a.order_index - b.order_index))
      return activity
    } catch (err: any) {
      setError(err.message || 'Failed to create activity')
      return null
    }
  }

  const updateActivity = async (activityId: string, data: UpdateActivityData): Promise<boolean> => {
    try {
      setError(null)
      const updated = await activityService.update(activityId, data)
      setActivities((prev) => prev.map((a) => (a.id === activityId ? updated : a)))
      return true
    } catch (err: any) {
      setError(err.message || 'Failed to update activity')
      return false
    }
  }

  const deleteActivity = async (activityId: string): Promise<boolean> => {
    try {
      setError(null)
      await activityService.delete(activityId)
      setActivities((prev) => prev.filter((a) => a.id !== activityId))
      return true
    } catch (err: any) {
      setError(err.message || 'Failed to delete activity')
      return false
    }
  }

  const reorderActivities = async (activityIds: string[]): Promise<boolean> => {
    if (!dayId) return false

    try {
      setError(null)
      await activityService.reorder(dayId, activityIds)
      // Optimistically update local state
      const reorderedActivities = activityIds
        .map((id, index) => {
          const activity = activities.find((a) => a.id === id)
          return activity ? { ...activity, order_index: index } : null
        })
        .filter((a): a is ItineraryActivity => a !== null)
      setActivities(reorderedActivities)
      return true
    } catch (err: any) {
      setError(err.message || 'Failed to reorder activities')
      return false
    }
  }

  const moveToDay = async (activityId: string, newDayId: string): Promise<boolean> => {
    try {
      setError(null)
      await activityService.moveToDay(activityId, newDayId)
      setActivities((prev) => prev.filter((a) => a.id !== activityId))
      return true
    } catch (err: any) {
      setError(err.message || 'Failed to move activity')
      return false
    }
  }

  return {
    activities,
    loading,
    error,
    setActivities,
    fetchActivities,
    createActivity,
    updateActivity,
    deleteActivity,
    reorderActivities,
    moveToDay,
  }
}
