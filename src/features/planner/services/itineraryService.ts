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
}
