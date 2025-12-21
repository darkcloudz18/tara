import { supabase } from '@/lib/supabase'
import { DiscoverPlace } from './placeService'

export interface BucketListItem {
  id: string
  user_id: string
  place_id: string | null
  external_place_id: string | null
  place_name: string
  place_location: string | null
  place_category: string | null
  place_image_url: string | null
  place_estimated_cost: number | null
  notes: string | null
  is_visited: boolean
  visited_at: string | null
  created_at: string
  updated_at: string
}

export async function getBucketList(): Promise<BucketListItem[]> {
  const { data, error } = await supabase
    .from('bucket_list')
    .select('*')
    .order('created_at', { ascending: false })

  if (error) {
    console.error('Error fetching bucket list:', error)
    throw error
  }

  return data || []
}

export async function addToBucketList(place: DiscoverPlace): Promise<BucketListItem> {
  const { data: { user } } = await supabase.auth.getUser()
  if (!user) throw new Error('Must be logged in to add to bucket list')

  const bucketItem = {
    user_id: user.id,
    place_id: place.source === 'tara' ? place.id : null,
    external_place_id: place.source !== 'tara' ? place.id : null,
    place_name: place.name,
    place_location: place.location,
    place_category: place.category,
    place_image_url: place.photos?.[0] || null,
    place_estimated_cost: place.estimatedCost,
  }

  const { data, error } = await supabase
    .from('bucket_list')
    .upsert(bucketItem, {
      onConflict: place.source === 'tara' ? 'user_id,place_id' : 'user_id,external_place_id',
    })
    .select()
    .single()

  if (error) {
    console.error('Error adding to bucket list:', error)
    throw error
  }

  return data
}

export async function removeFromBucketList(itemId: string): Promise<void> {
  const { error } = await supabase
    .from('bucket_list')
    .delete()
    .eq('id', itemId)

  if (error) {
    console.error('Error removing from bucket list:', error)
    throw error
  }
}

export async function markAsVisited(itemId: string, visited: boolean): Promise<void> {
  const { error } = await supabase
    .from('bucket_list')
    .update({
      is_visited: visited,
      visited_at: visited ? new Date().toISOString() : null,
      updated_at: new Date().toISOString(),
    })
    .eq('id', itemId)

  if (error) {
    console.error('Error updating bucket list item:', error)
    throw error
  }
}

export async function getBucketListByLocation(location: string): Promise<BucketListItem[]> {
  const { data, error } = await supabase
    .from('bucket_list')
    .select('*')
    .ilike('place_location', `%${location}%`)
    .eq('is_visited', false)
    .order('created_at', { ascending: false })

  if (error) {
    console.error('Error fetching bucket list by location:', error)
    throw error
  }

  return data || []
}

export async function isInBucketList(placeId: string, source: string): Promise<boolean> {
  const { data: { user } } = await supabase.auth.getUser()
  if (!user) return false

  let query = supabase
    .from('bucket_list')
    .select('id')
    .eq('user_id', user.id)

  if (source === 'tara') {
    query = query.eq('place_id', placeId)
  } else {
    query = query.eq('external_place_id', placeId)
  }

  const { data, error } = await query.single()

  if (error && error.code !== 'PGRST116') { // PGRST116 = no rows returned
    console.error('Error checking bucket list:', error)
  }

  return !!data
}
