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
}
