import { supabase, getUserSafe } from '@/lib/supabase'

export interface TripComment {
  id: string
  itinerary_id: string
  user_id: string
  content: string
  created_at: string
  user?: {
    username: string
    first_name?: string
    photo_url?: string
  }
}

export interface TripLike {
  id: string
  itinerary_id: string
  user_id: string
  created_at: string
}

export const socialService = {
  // Comments
  async getComments(itineraryId: string): Promise<TripComment[]> {
    const { data, error } = await supabase
      .from('trip_comments')
      .select(`
        *,
        user:profiles!trip_comments_user_id_fkey(username, first_name, photo_url)
      `)
      .eq('itinerary_id', itineraryId)
      .order('created_at', { ascending: true })

    if (error) {
      console.error('Error fetching comments:', error)
      return []
    }

    return data || []
  },

  async addComment(itineraryId: string, userId: string, content: string): Promise<TripComment | null> {
    const { data, error } = await supabase
      .from('trip_comments')
      .insert({
        itinerary_id: itineraryId,
        user_id: userId,
        content: content.trim(),
      })
      .select(`
        *,
        user:profiles!trip_comments_user_id_fkey(username, first_name, photo_url)
      `)
      .single()

    if (error) {
      console.error('Error adding comment:', error)
      return null
    }

    return data
  },

  async deleteComment(commentId: string): Promise<boolean> {
    const { error } = await supabase
      .from('trip_comments')
      .delete()
      .eq('id', commentId)

    if (error) {
      console.error('Error deleting comment:', error)
      return false
    }

    return true
  },

  // Likes
  async getLikes(itineraryId: string): Promise<{ count: number; userLiked: boolean }> {
    const user = await getUserSafe()

    const { count, error: countError } = await supabase
      .from('trip_likes')
      .select('*', { count: 'exact', head: true })
      .eq('itinerary_id', itineraryId)

    if (countError) {
      console.error('Error fetching likes count:', countError)
    }

    let userLiked = false
    if (user) {
      const { data: likeData } = await supabase
        .from('trip_likes')
        .select('id')
        .eq('itinerary_id', itineraryId)
        .eq('user_id', user.id)
        .single()

      userLiked = !!likeData
    }

    return { count: count || 0, userLiked }
  },

  async toggleLike(itineraryId: string, userId: string): Promise<{ liked: boolean; count: number }> {
    // Check if already liked
    const { data: existing } = await supabase
      .from('trip_likes')
      .select('id')
      .eq('itinerary_id', itineraryId)
      .eq('user_id', userId)
      .single()

    if (existing) {
      // Unlike
      await supabase
        .from('trip_likes')
        .delete()
        .eq('id', existing.id)

      const { count } = await supabase
        .from('trip_likes')
        .select('*', { count: 'exact', head: true })
        .eq('itinerary_id', itineraryId)

      return { liked: false, count: count || 0 }
    } else {
      // Like
      await supabase
        .from('trip_likes')
        .insert({
          itinerary_id: itineraryId,
          user_id: userId,
        })

      const { count } = await supabase
        .from('trip_likes')
        .select('*', { count: 'exact', head: true })
        .eq('itinerary_id', itineraryId)

      return { liked: true, count: count || 0 }
    }
  },

  // Saved trips
  async getSavedTrips(userId: string): Promise<string[]> {
    const { data, error } = await supabase
      .from('saved_trips')
      .select('itinerary_id')
      .eq('user_id', userId)

    if (error) {
      console.error('Error fetching saved trips:', error)
      return []
    }

    return data.map(d => d.itinerary_id)
  },

  async toggleSave(itineraryId: string, userId: string): Promise<boolean> {
    // Check if already saved
    const { data: existing } = await supabase
      .from('saved_trips')
      .select('id')
      .eq('itinerary_id', itineraryId)
      .eq('user_id', userId)
      .single()

    if (existing) {
      // Unsave
      await supabase
        .from('saved_trips')
        .delete()
        .eq('id', existing.id)

      return false
    } else {
      // Save
      await supabase
        .from('saved_trips')
        .insert({
          itinerary_id: itineraryId,
          user_id: userId,
        })

      return true
    }
  },

  // Subscribe to comments in real-time
  subscribeToComments(
    itineraryId: string,
    onNewComment: (comment: TripComment) => void
  ): () => void {
    const channel = supabase
      .channel(`comments:${itineraryId}`)
      .on(
        'postgres_changes',
        {
          event: 'INSERT',
          schema: 'public',
          table: 'trip_comments',
          filter: `itinerary_id=eq.${itineraryId}`,
        },
        async (payload) => {
          // Fetch the full comment with user info
          const { data } = await supabase
            .from('trip_comments')
            .select(`
              *,
              user:profiles!trip_comments_user_id_fkey(username, first_name, photo_url)
            `)
            .eq('id', payload.new.id)
            .single()

          if (data) {
            onNewComment(data)
          }
        }
      )
      .subscribe()

    return () => {
      supabase.removeChannel(channel)
    }
  },
}
