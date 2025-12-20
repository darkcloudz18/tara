import { supabase } from '@/lib/supabase'
import { ItineraryActivity } from '@/types/database'

export type CreateActivityData = {
  day_id: string
  title: string
  description?: string
  start_time?: string
  end_time?: string
  location: string
  coordinates?: { x: number; y: number }
  place_type?: string
  estimated_cost?: number
  actual_cost?: number
  notes?: string
  order_index?: number
}

export type UpdateActivityData = Partial<Omit<CreateActivityData, 'day_id'>> & {
  actual_cost?: number
  booking_id?: string
}

export const activityService = {
  async getByDay(dayId: string): Promise<ItineraryActivity[]> {
    const { data, error } = await supabase
      .from('itinerary_activities')
      .select('*')
      .eq('day_id', dayId)
      .order('order_index', { ascending: true })

    if (error) throw error
    return data || []
  },

  async getByItinerary(itineraryId: string): Promise<ItineraryActivity[]> {
    // First get all day IDs for this itinerary
    const { data: days, error: daysError } = await supabase
      .from('itinerary_days')
      .select('id')
      .eq('itinerary_id', itineraryId)

    if (daysError) throw daysError
    if (!days || days.length === 0) return []

    const dayIds = days.map((d) => d.id)

    const { data, error } = await supabase
      .from('itinerary_activities')
      .select('*')
      .in('day_id', dayIds)
      .order('order_index', { ascending: true })

    if (error) throw error
    return data || []
  },

  async getById(id: string): Promise<ItineraryActivity | null> {
    const { data, error } = await supabase
      .from('itinerary_activities')
      .select('*')
      .eq('id', id)
      .single()

    if (error) {
      if (error.code === 'PGRST116') return null
      throw error
    }
    return data
  },

  async create(data: CreateActivityData): Promise<ItineraryActivity> {
    // Get the highest order_index for this day
    const { data: existing } = await supabase
      .from('itinerary_activities')
      .select('order_index')
      .eq('day_id', data.day_id)
      .order('order_index', { ascending: false })
      .limit(1)

    const nextOrderIndex =
      data.order_index ?? (existing && existing.length > 0 ? existing[0].order_index + 1 : 0)

    const { data: activity, error } = await supabase
      .from('itinerary_activities')
      .insert({
        day_id: data.day_id,
        title: data.title,
        description: data.description,
        start_time: data.start_time,
        end_time: data.end_time,
        location: data.location,
        coordinates: data.coordinates,
        place_type: data.place_type,
        estimated_cost: data.estimated_cost,
        actual_cost: data.actual_cost,
        notes: data.notes,
        order_index: nextOrderIndex,
      })
      .select()
      .single()

    if (error) throw error
    return activity
  },

  async update(id: string, data: UpdateActivityData): Promise<ItineraryActivity> {
    const { data: activity, error } = await supabase
      .from('itinerary_activities')
      .update(data)
      .eq('id', id)
      .select()
      .single()

    if (error) throw error
    return activity
  },

  async delete(id: string): Promise<void> {
    const { error } = await supabase
      .from('itinerary_activities')
      .delete()
      .eq('id', id)

    if (error) throw error
  },

  async reorder(dayId: string, activityIds: string[]): Promise<void> {
    const updates = activityIds.map((id, index) =>
      supabase
        .from('itinerary_activities')
        .update({ order_index: index })
        .eq('id', id)
        .eq('day_id', dayId)
    )

    await Promise.all(updates)
  },

  async moveToDay(activityId: string, newDayId: string): Promise<ItineraryActivity> {
    // Get the highest order_index for the new day
    const { data: existing } = await supabase
      .from('itinerary_activities')
      .select('order_index')
      .eq('day_id', newDayId)
      .order('order_index', { ascending: false })
      .limit(1)

    const nextOrderIndex = existing && existing.length > 0 ? existing[0].order_index + 1 : 0

    const { data: activity, error } = await supabase
      .from('itinerary_activities')
      .update({
        day_id: newDayId,
        order_index: nextOrderIndex,
      })
      .eq('id', activityId)
      .select()
      .single()

    if (error) throw error
    return activity
  },
}
