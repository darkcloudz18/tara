import { supabase } from '@/lib/supabase'

export interface AdminStats {
  totalUsers: number
  totalTrips: number
  totalPlaces: number
  publicTrips: number
  pendingReports: number
  newUsersThisWeek: number
  newTripsThisWeek: number
}

export interface ContentReport {
  id: string
  reporter_id: string
  content_type: 'trip' | 'comment' | 'review' | 'user'
  content_id: string
  reason: string
  details?: string
  status: 'pending' | 'reviewed' | 'resolved' | 'dismissed'
  reviewed_by?: string
  reviewed_at?: string
  action_taken?: string
  created_at: string
  reporter?: {
    username: string | null
    email: string | null
  }
}

export interface AdminUser {
  id: string
  email: string
  username: string | null
  first_name: string | null
  last_name: string | null
  photo_url: string | null
  is_admin: boolean
  is_moderator: boolean
  is_banned: boolean
  ban_reason?: string
  created_at: string
  trips_count?: number
}

export const adminService = {
  /**
   * Check if current user is admin
   */
  async isAdmin(): Promise<boolean> {
    const { data: { user } } = await supabase.auth.getUser()
    if (!user) return false

    const { data } = await supabase
      .from('profiles')
      .select('is_admin, is_moderator')
      .eq('id', user.id)
      .single()

    return data?.is_admin || data?.is_moderator || false
  },

  /**
   * Get dashboard stats
   */
  async getStats(): Promise<AdminStats> {
    const oneWeekAgo = new Date()
    oneWeekAgo.setDate(oneWeekAgo.getDate() - 7)

    const [
      usersResult,
      tripsResult,
      placesResult,
      publicTripsResult,
      reportsResult,
      newUsersResult,
      newTripsResult,
    ] = await Promise.all([
      supabase.from('profiles').select('id', { count: 'exact', head: true }),
      supabase.from('itineraries').select('id', { count: 'exact', head: true }),
      supabase.from('places').select('id', { count: 'exact', head: true }),
      supabase.from('itineraries').select('id', { count: 'exact', head: true }).eq('is_public', true),
      supabase.from('content_reports').select('id', { count: 'exact', head: true }).eq('status', 'pending'),
      supabase.from('profiles').select('id', { count: 'exact', head: true }).gte('created_at', oneWeekAgo.toISOString()),
      supabase.from('itineraries').select('id', { count: 'exact', head: true }).gte('created_at', oneWeekAgo.toISOString()),
    ])

    return {
      totalUsers: usersResult.count || 0,
      totalTrips: tripsResult.count || 0,
      totalPlaces: placesResult.count || 0,
      publicTrips: publicTripsResult.count || 0,
      pendingReports: reportsResult.count || 0,
      newUsersThisWeek: newUsersResult.count || 0,
      newTripsThisWeek: newTripsResult.count || 0,
    }
  },

  /**
   * Get all users with pagination
   */
  async getUsers(page: number = 1, limit: number = 20, search?: string): Promise<{ users: AdminUser[]; total: number }> {
    let query = supabase
      .from('profiles')
      .select('*', { count: 'exact' })
      .order('created_at', { ascending: false })
      .range((page - 1) * limit, page * limit - 1)

    if (search) {
      query = query.or(`username.ilike.%${search}%,first_name.ilike.%${search}%,email.ilike.%${search}%`)
    }

    const { data, count, error } = await query

    if (error) {
      console.error('Error fetching users:', error)
      return { users: [], total: 0 }
    }

    return { users: data || [], total: count || 0 }
  },

  /**
   * Update user admin status
   */
  async updateUserRole(userId: string, role: 'admin' | 'moderator' | 'user'): Promise<boolean> {
    const updates: any = {
      is_admin: role === 'admin',
      is_moderator: role === 'moderator',
    }

    const { error } = await supabase
      .from('profiles')
      .update(updates)
      .eq('id', userId)

    if (!error) {
      await this.logActivity('update_role', 'user', userId, { newRole: role })
    }

    return !error
  },

  /**
   * Ban/unban user
   */
  async toggleBan(userId: string, ban: boolean, reason?: string): Promise<boolean> {
    const updates: any = {
      is_banned: ban,
      ban_reason: ban ? reason : null,
      banned_at: ban ? new Date().toISOString() : null,
    }

    const { error } = await supabase
      .from('profiles')
      .update(updates)
      .eq('id', userId)

    if (!error) {
      await this.logActivity(ban ? 'ban_user' : 'unban_user', 'user', userId, { reason })
    }

    return !error
  },

  /**
   * Get content reports
   */
  async getReports(status?: string): Promise<ContentReport[]> {
    let query = supabase
      .from('content_reports')
      .select(`
        *,
        reporter:profiles!content_reports_reporter_id_fkey(username, email)
      `)
      .order('created_at', { ascending: false })

    if (status) {
      query = query.eq('status', status)
    }

    const { data, error } = await query

    if (error) {
      console.error('Error fetching reports:', error)
      return []
    }

    return (data || []).map((r: any) => ({
      ...r,
      reporter: Array.isArray(r.reporter) ? r.reporter[0] : r.reporter,
    }))
  },

  /**
   * Update report status
   */
  async updateReport(reportId: string, status: string, actionTaken?: string): Promise<boolean> {
    const { data: { user } } = await supabase.auth.getUser()

    const { error } = await supabase
      .from('content_reports')
      .update({
        status,
        reviewed_by: user?.id,
        reviewed_at: new Date().toISOString(),
        action_taken: actionTaken,
      })
      .eq('id', reportId)

    if (!error) {
      await this.logActivity('review_report', 'report', reportId, { status, actionTaken })
    }

    return !error
  },

  /**
   * Get all trips for moderation
   */
  async getTrips(page: number = 1, limit: number = 20, publicOnly?: boolean): Promise<{ trips: any[]; total: number }> {
    let query = supabase
      .from('itineraries')
      .select(`
        *,
        user:profiles!itineraries_user_id_fkey(username, first_name, email)
      `, { count: 'exact' })
      .order('created_at', { ascending: false })
      .range((page - 1) * limit, page * limit - 1)

    if (publicOnly) {
      query = query.eq('is_public', true)
    }

    const { data, count, error } = await query

    if (error) {
      console.error('Error fetching trips:', error)
      return { trips: [], total: 0 }
    }

    const trips = (data || []).map((t: any) => ({
      ...t,
      user: Array.isArray(t.user) ? t.user[0] : t.user,
    }))

    return { trips, total: count || 0 }
  },

  /**
   * Delete trip (admin action)
   */
  async deleteTrip(tripId: string): Promise<boolean> {
    const { error } = await supabase
      .from('itineraries')
      .delete()
      .eq('id', tripId)

    if (!error) {
      await this.logActivity('delete_trip', 'trip', tripId, {})
    }

    return !error
  },

  /**
   * Get all places
   */
  async getPlaces(page: number = 1, limit: number = 20): Promise<{ places: any[]; total: number }> {
    const { data, count, error } = await supabase
      .from('places')
      .select('*', { count: 'exact' })
      .order('created_at', { ascending: false })
      .range((page - 1) * limit, page * limit - 1)

    if (error) {
      console.error('Error fetching places:', error)
      return { places: [], total: 0 }
    }

    return { places: data || [], total: count || 0 }
  },

  /**
   * Create/update place
   */
  async savePlace(place: any): Promise<boolean> {
    if (place.id) {
      const { error } = await supabase
        .from('places')
        .update(place)
        .eq('id', place.id)

      if (!error) {
        await this.logActivity('update_place', 'place', place.id, {})
      }
      return !error
    } else {
      const { error } = await supabase
        .from('places')
        .insert(place)

      if (!error) {
        await this.logActivity('create_place', 'place', 'new', { name: place.name })
      }
      return !error
    }
  },

  /**
   * Delete place
   */
  async deletePlace(placeId: string): Promise<boolean> {
    const { error } = await supabase
      .from('places')
      .delete()
      .eq('id', placeId)

    if (!error) {
      await this.logActivity('delete_place', 'place', placeId, {})
    }

    return !error
  },

  /**
   * Toggle place featured status
   */
  async toggleFeatured(placeId: string, featured: boolean): Promise<boolean> {
    const { error } = await supabase
      .from('places')
      .update({ is_featured: featured })
      .eq('id', placeId)

    return !error
  },

  /**
   * Log admin activity
   */
  async logActivity(action: string, targetType?: string, targetId?: string, details?: any): Promise<void> {
    const { data: { user } } = await supabase.auth.getUser()
    if (!user) return

    await supabase.from('admin_activity_log').insert({
      admin_id: user.id,
      action,
      target_type: targetType,
      target_id: targetId,
      details,
    })
  },

  /**
   * Get activity log
   */
  async getActivityLog(limit: number = 50): Promise<any[]> {
    const { data, error } = await supabase
      .from('admin_activity_log')
      .select(`
        *,
        admin:profiles!admin_activity_log_admin_id_fkey(username, first_name)
      `)
      .order('created_at', { ascending: false })
      .limit(limit)

    if (error) {
      console.error('Error fetching activity log:', error)
      return []
    }

    return (data || []).map((l: any) => ({
      ...l,
      admin: Array.isArray(l.admin) ? l.admin[0] : l.admin,
    }))
  },
}
