'use client'

import { useState, useEffect, useCallback } from 'react'
import {
  BucketListItem,
  getBucketList,
  addToBucketList,
  removeFromBucketList,
  markAsVisited,
  getBucketListByLocation,
} from '../services/bucketListService'
import { DiscoverPlace } from '../services/placeService'

export function useBucketList() {
  const [items, setItems] = useState<BucketListItem[]>([])
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState<string | null>(null)

  const fetchBucketList = useCallback(async () => {
    try {
      setLoading(true)
      setError(null)
      const data = await getBucketList()
      setItems(data)
    } catch (err: any) {
      setError(err.message || 'Failed to load bucket list')
    } finally {
      setLoading(false)
    }
  }, [])

  useEffect(() => {
    fetchBucketList()
  }, [fetchBucketList])

  const addPlace = useCallback(async (
    place: DiscoverPlace,
    referredByCreatorId?: string | null,
    referredFromVideoId?: string | null
  ) => {
    try {
      const newItem = await addToBucketList(place, referredByCreatorId, referredFromVideoId)
      setItems((prev) => [newItem, ...prev])
      return newItem
    } catch (err: any) {
      setError(err.message || 'Failed to add to bucket list')
      throw err
    }
  }, [])

  const removeItem = useCallback(async (itemId: string) => {
    try {
      await removeFromBucketList(itemId)
      setItems((prev) => prev.filter((item) => item.id !== itemId))
    } catch (err: any) {
      setError(err.message || 'Failed to remove from bucket list')
      throw err
    }
  }, [])

  const toggleVisited = useCallback(async (itemId: string, visited: boolean) => {
    try {
      await markAsVisited(itemId, visited)
      setItems((prev) =>
        prev.map((item) =>
          item.id === itemId
            ? {
                ...item,
                is_visited: visited,
                visited_at: visited ? new Date().toISOString() : null,
              }
            : item
        )
      )
    } catch (err: any) {
      setError(err.message || 'Failed to update item')
      throw err
    }
  }, [])

  const isInBucketList = useCallback(
    (placeId: string) => {
      // placeId format is "tara-uuid" or "partner-uuid" or "google-id"
      // Extract the actual ID for comparison
      const parts = placeId.split('-')
      const source = parts[0]
      const actualId = parts.slice(1).join('-') // Handle UUIDs with dashes

      return items.some((item) => {
        if (source === 'tara') {
          return item.place_id === actualId
        } else {
          return item.external_place_id === placeId
        }
      })
    },
    [items]
  )

  const getItemByPlaceId = useCallback(
    (placeId: string) => {
      const parts = placeId.split('-')
      const source = parts[0]
      const actualId = parts.slice(1).join('-')

      return items.find((item) => {
        if (source === 'tara') {
          return item.place_id === actualId
        } else {
          return item.external_place_id === placeId
        }
      })
    },
    [items]
  )

  // Group items by location
  const groupedByLocation = useCallback(() => {
    const grouped: Record<string, BucketListItem[]> = {}
    items.forEach((item) => {
      const location = item.place_location || 'Other'
      if (!grouped[location]) {
        grouped[location] = []
      }
      grouped[location].push(item)
    })
    return grouped
  }, [items])

  // Get items for specific locations (for trip suggestions)
  const getItemsForLocations = useCallback(
    (locations: string[]) => {
      return items.filter((item) => {
        if (!item.place_location) return false
        return locations.some(
          (loc) =>
            item.place_location?.toLowerCase().includes(loc.toLowerCase()) ||
            loc.toLowerCase().includes(item.place_location?.toLowerCase() || '')
        )
      })
    },
    [items]
  )

  return {
    items,
    loading,
    error,
    addPlace,
    removeItem,
    toggleVisited,
    isInBucketList,
    getItemByPlaceId,
    groupedByLocation,
    getItemsForLocations,
    refresh: fetchBucketList,
    itemCount: items.length,
    unvisitedCount: items.filter((i) => !i.is_visited).length,
  }
}

// Hook for getting bucket list items by location (for trip creation)
export function useBucketListByLocation(locations: string[]) {
  const [items, setItems] = useState<BucketListItem[]>([])
  const [loading, setLoading] = useState(false)

  useEffect(() => {
    if (locations.length === 0) {
      setItems([])
      return
    }

    const fetchItems = async () => {
      setLoading(true)
      try {
        const allItems: BucketListItem[] = []
        for (const location of locations) {
          const locationItems = await getBucketListByLocation(location)
          allItems.push(...locationItems)
        }
        // Remove duplicates
        const unique = allItems.filter(
          (item, index, self) => self.findIndex((i) => i.id === item.id) === index
        )
        setItems(unique)
      } catch (err) {
        console.error('Error fetching bucket list by location:', err)
      } finally {
        setLoading(false)
      }
    }

    fetchItems()
  }, [locations.join(',')])

  return { items, loading }
}
