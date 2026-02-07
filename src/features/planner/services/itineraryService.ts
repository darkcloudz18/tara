import { supabase } from '@/lib/supabase'
import { Itinerary } from '@/types/database'

export type CreateItineraryData = {
  title: string
  description?: string
  start_date: string
  end_date: string
  destinations: string[]
  total_budget?: number
  cover_image_url?: string
  is_public?: boolean
}

export type UpdateItineraryData = Partial<CreateItineraryData> & {
  actual_spent?: number
}

export const itineraryService = {
  async getAll(userId: string): Promise<Itinerary[]> {
    const { data, error } = await supabase
      .from('itineraries')
      .select('*')
      .eq('user_id', userId)
      .order('created_at', { ascending: false })

    if (error) throw error
    return data || []
  },

  async getById(id: string): Promise<Itinerary | null> {
    const { data, error } = await supabase
      .from('itineraries')
      .select('*')
      .eq('id', id)
      .single()

    if (error) {
      if (error.code === 'PGRST116') return null
      throw error
    }
    return data
  },

  async create(userId: string, data: CreateItineraryData): Promise<Itinerary> {
    const { data: itinerary, error } = await supabase
      .from('itineraries')
      .insert({
        user_id: userId,
        title: data.title,
        description: data.description,
        start_date: data.start_date,
        end_date: data.end_date,
        destinations: data.destinations,
        total_budget: data.total_budget,
        cover_image_url: data.cover_image_url,
        is_public: data.is_public ?? false,
        actual_spent: 0,
        views_count: 0,
        copies_count: 0,
      })
      .select()
      .single()

    if (error) throw error
    return itinerary
  },

  async update(id: string, data: UpdateItineraryData): Promise<Itinerary> {
    const { data: itinerary, error } = await supabase
      .from('itineraries')
      .update({
        ...data,
        updated_at: new Date().toISOString(),
      })
      .eq('id', id)
      .select()
      .single()

    if (error) throw error
    return itinerary
  },

  async delete(id: string): Promise<void> {
    const { error } = await supabase
      .from('itineraries')
      .delete()
      .eq('id', id)

    if (error) throw error
  },

  async incrementViews(id: string): Promise<void> {
    const { error } = await supabase.rpc('increment_itinerary_views', {
      itinerary_id: id,
    })

    // Fallback if RPC doesn't exist
    if (error) {
      await supabase
        .from('itineraries')
        .update({ views_count: supabase.rpc('views_count + 1') as any })
        .eq('id', id)
    }
  },

  // Get a public itinerary (for shared links)
  async getPublicById(id: string): Promise<Itinerary | null> {
    const { data, error } = await supabase
      .from('itineraries')
      .select('*')
      .eq('id', id)
      .eq('is_public', true)
      .single()

    if (error) {
      if (error.code === 'PGRST116') return null
      throw error
    }
    return data
  },

  // Get full itinerary with days and activities (for share page)
  async getFullItinerary(id: string, requirePublic: boolean = false): Promise<{
    itinerary: Itinerary
    days: any[]
    activities: any[]
    owner: { username?: string; first_name?: string; photo_url?: string } | null
  } | null> {
    // Build the query
    let query = supabase
      .from('itineraries')
      .select(`
        *,
        owner:profiles!itineraries_user_id_fkey(username, first_name, photo_url)
      `)
      .eq('id', id)

    if (requirePublic) {
      query = query.eq('is_public', true)
    }

    const { data: itinerary, error: itinError } = await query.single()

    if (itinError || !itinerary) {
      return null
    }

    // Get days
    const { data: days } = await supabase
      .from('itinerary_days')
      .select('*')
      .eq('itinerary_id', id)
      .order('day_number', { ascending: true })

    // Get activities for all days
    const dayIds = (days || []).map(d => d.id)
    const { data: activities } = await supabase
      .from('itinerary_activities')
      .select('*')
      .in('day_id', dayIds)
      .order('order_index', { ascending: true })

    return {
      itinerary,
      days: days || [],
      activities: activities || [],
      owner: itinerary.owner,
    }
  },

  // Make an itinerary public and return the share URL
  async makePublic(id: string): Promise<string> {
    const { error } = await supabase
      .from('itineraries')
      .update({ is_public: true, updated_at: new Date().toISOString() })
      .eq('id', id)

    if (error) throw error
    return `/trip/${id}`
  },

  // Make an itinerary private
  async makePrivate(id: string): Promise<void> {
    const { error } = await supabase
      .from('itineraries')
      .update({ is_public: false, updated_at: new Date().toISOString() })
      .eq('id', id)

    if (error) throw error
  },

  // Copy an itinerary (with all days and activities)
  async copyItinerary(sourceId: string, newOwnerId: string): Promise<Itinerary | null> {
    try {
      // Get the source itinerary with all data
      const source = await this.getFullItinerary(sourceId, false)
      if (!source) return null

      const { itinerary, days, activities } = source

      // Calculate new dates (start from today)
      const today = new Date()
      const sourceDuration = Math.ceil(
        (new Date(itinerary.end_date).getTime() - new Date(itinerary.start_date).getTime()) /
        (1000 * 60 * 60 * 24)
      )
      const newEndDate = new Date(today)
      newEndDate.setDate(today.getDate() + sourceDuration)

      // Create the new itinerary
      const { data: newItinerary, error: createError } = await supabase
        .from('itineraries')
        .insert({
          user_id: newOwnerId,
          title: `Copy of ${itinerary.title}`,
          description: itinerary.description,
          start_date: today.toISOString().split('T')[0],
          end_date: newEndDate.toISOString().split('T')[0],
          destinations: itinerary.destinations,
          total_budget: itinerary.total_budget,
          cover_image_url: itinerary.cover_image_url,
          is_public: false,
          actual_spent: 0,
          views_count: 0,
          copies_count: 0,
        })
        .select()
        .single()

      if (createError || !newItinerary) throw createError

      // Increment copies count on original
      await supabase
        .from('itineraries')
        .update({ copies_count: (itinerary.copies_count || 0) + 1 })
        .eq('id', sourceId)

      // Copy days
      const dayIdMap: Record<string, string> = {}

      for (const day of days) {
        const newDate = new Date(today)
        newDate.setDate(today.getDate() + day.day_number - 1)

        const { data: newDay, error: dayError } = await supabase
          .from('itinerary_days')
          .insert({
            itinerary_id: newItinerary.id,
            day_number: day.day_number,
            date: newDate.toISOString().split('T')[0],
            title: day.title,
            notes: day.notes,
          })
          .select()
          .single()

        if (!dayError && newDay) {
          dayIdMap[day.id] = newDay.id
        }
      }

      // Copy activities
      for (const activity of activities) {
        const newDayId = dayIdMap[activity.day_id]
        if (!newDayId) continue

        await supabase.from('itinerary_activities').insert({
          day_id: newDayId,
          title: activity.title,
          description: activity.description,
          location: activity.location,
          start_time: activity.start_time,
          end_time: activity.end_time,
          estimated_cost: activity.estimated_cost,
          actual_cost: 0,
          place_type: activity.place_type,
          place_id: activity.place_id,
          order_index: activity.order_index,
          notes: activity.notes,
        })
      }

      return newItinerary
    } catch (err) {
      console.error('Error copying itinerary:', err)
      return null
    }
  },
}
