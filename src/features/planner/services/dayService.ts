import { supabase } from '@/lib/supabase'
import { ItineraryDay } from '@/types/database'

export type CreateDayData = {
  itinerary_id: string
  day_number: number
  date: string
  title?: string
  notes?: string
  estimated_budget?: number
}

export type UpdateDayData = Partial<Omit<CreateDayData, 'itinerary_id'>> & {
  actual_spent?: number
}

export const dayService = {
  async getByItinerary(itineraryId: string): Promise<ItineraryDay[]> {
    const { data, error } = await supabase
      .from('itinerary_days')
      .select('*')
      .eq('itinerary_id', itineraryId)
      .order('day_number', { ascending: true })

    if (error) throw error
    return data || []
  },

  async getById(id: string): Promise<ItineraryDay | null> {
    const { data, error } = await supabase
      .from('itinerary_days')
      .select('*')
      .eq('id', id)
      .single()

    if (error) {
      if (error.code === 'PGRST116') return null
      throw error
    }
    return data
  },

  async create(data: CreateDayData): Promise<ItineraryDay> {
    const { data: day, error } = await supabase
      .from('itinerary_days')
      .insert({
        itinerary_id: data.itinerary_id,
        day_number: data.day_number,
        date: data.date,
        title: data.title,
        notes: data.notes,
        estimated_budget: data.estimated_budget,
        actual_spent: 0,
      })
      .select()
      .single()

    if (error) throw error
    return day
  },

  async update(id: string, data: UpdateDayData): Promise<ItineraryDay> {
    const { data: day, error } = await supabase
      .from('itinerary_days')
      .update(data)
      .eq('id', id)
      .select()
      .single()

    if (error) throw error
    return day
  },

  async delete(id: string): Promise<void> {
    const { error } = await supabase
      .from('itinerary_days')
      .delete()
      .eq('id', id)

    if (error) throw error
  },

  async bulkCreate(days: CreateDayData[]): Promise<ItineraryDay[]> {
    const insertData = days.map((day) => ({
      itinerary_id: day.itinerary_id,
      day_number: day.day_number,
      date: day.date,
      title: day.title,
      notes: day.notes,
      estimated_budget: day.estimated_budget,
      actual_spent: 0,
    }))

    const { data, error } = await supabase
      .from('itinerary_days')
      .insert(insertData)
      .select()

    if (error) throw error
    return data || []
  },

  async reorder(itineraryId: string, dayIds: string[]): Promise<void> {
    // Update day_number for each day based on new order
    const updates = dayIds.map((id, index) =>
      supabase
        .from('itinerary_days')
        .update({ day_number: index + 1 })
        .eq('id', id)
        .eq('itinerary_id', itineraryId)
    )

    await Promise.all(updates)
  },
}
