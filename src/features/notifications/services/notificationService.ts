import { supabase } from '@/lib/supabase'
import { Notification, NotificationCreateInput } from '../types'

export const notificationService = {
  // Fetch all notifications for a user
  async getAll(userId: string): Promise<Notification[]> {
    try {
      const { data, error } = await supabase
        .from('notifications')
        .select('*')
        .eq('user_id', userId)
        .order('created_at', { ascending: false })
        .limit(50)

      if (error) throw error
      return data || []
    } catch (err) {
      console.error('Error fetching notifications:', err)
      return []
    }
  },

  // Get unread count
  async getUnreadCount(userId: string): Promise<number> {
    try {
      const { count, error } = await supabase
        .from('notifications')
        .select('*', { count: 'exact', head: true })
        .eq('user_id', userId)
        .eq('is_read', false)

      if (error) throw error
      return count || 0
    } catch (err) {
      console.error('Error fetching unread count:', err)
      return 0
    }
  },

  // Mark a notification as read
  async markAsRead(notificationId: string): Promise<boolean> {
    try {
      const { error } = await supabase
        .from('notifications')
        .update({ is_read: true })
        .eq('id', notificationId)

      if (error) throw error
      return true
    } catch (err) {
      console.error('Error marking notification as read:', err)
      return false
    }
  },

  // Mark all notifications as read for a user
  async markAllAsRead(userId: string): Promise<boolean> {
    try {
      const { error } = await supabase
        .from('notifications')
        .update({ is_read: true })
        .eq('user_id', userId)
        .eq('is_read', false)

      if (error) throw error
      return true
    } catch (err) {
      console.error('Error marking all notifications as read:', err)
      return false
    }
  },

  // Delete a notification
  async delete(notificationId: string): Promise<boolean> {
    try {
      const { error } = await supabase
        .from('notifications')
        .delete()
        .eq('id', notificationId)

      if (error) throw error
      return true
    } catch (err) {
      console.error('Error deleting notification:', err)
      return false
    }
  },

  // Clear all notifications for a user
  async clearAll(userId: string): Promise<boolean> {
    try {
      const { error } = await supabase
        .from('notifications')
        .delete()
        .eq('user_id', userId)

      if (error) throw error
      return true
    } catch (err) {
      console.error('Error clearing notifications:', err)
      return false
    }
  },

  // Create a notification (typically called from server-side or other services)
  async create(input: NotificationCreateInput): Promise<Notification | null> {
    try {
      const { data, error } = await supabase
        .from('notifications')
        .insert({
          user_id: input.user_id,
          type: input.type,
          title: input.title,
          message: input.message,
          data: input.data || {},
          is_read: false,
        })
        .select()
        .single()

      if (error) throw error
      return data
    } catch (err) {
      console.error('Error creating notification:', err)
      return null
    }
  },

  // Subscribe to real-time notifications
  subscribeToNotifications(
    userId: string,
    onNotification: (notification: Notification) => void
  ) {
    const subscription = supabase
      .channel(`notifications:${userId}`)
      .on(
        'postgres_changes',
        {
          event: 'INSERT',
          schema: 'public',
          table: 'notifications',
          filter: `user_id=eq.${userId}`,
        },
        (payload) => {
          onNotification(payload.new as Notification)
        }
      )
      .subscribe()

    return () => {
      supabase.removeChannel(subscription)
    }
  },
}
