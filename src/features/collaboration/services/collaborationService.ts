import { supabase } from '@/lib/supabase'
import { Collaborator, CollaboratorRole, InviteCollaboratorInput, PresenceState } from '../types'

export const collaborationService = {
  // Get all collaborators for an itinerary
  async getCollaborators(itineraryId: string): Promise<Collaborator[]> {
    try {
      const { data, error } = await supabase
        .from('trip_collaborators')
        .select(`
          *,
          user:profiles!trip_collaborators_user_id_fkey (
            id, email, username, first_name, last_name, photo_url
          )
        `)
        .eq('itinerary_id', itineraryId)
        .order('created_at', { ascending: true })

      if (error) throw error
      return data || []
    } catch (err) {
      console.error('Error fetching collaborators:', err)
      return []
    }
  },

  // Invite a collaborator by email
  async inviteByEmail(input: InviteCollaboratorInput): Promise<{ success: boolean; error?: string }> {
    try {
      const { data: { user } } = await supabase.auth.getUser()
      if (!user) return { success: false, error: 'Not authenticated' }

      // Find user by email
      const { data: profile, error: profileError } = await supabase
        .from('profiles')
        .select('id')
        .eq('email', input.email)
        .single()

      if (profileError || !profile) {
        return { success: false, error: 'User not found with this email' }
      }

      // Check if already a collaborator
      const { data: existing } = await supabase
        .from('trip_collaborators')
        .select('id')
        .eq('itinerary_id', input.itinerary_id)
        .eq('user_id', profile.id)
        .single()

      if (existing) {
        return { success: false, error: 'User is already a collaborator' }
      }

      // Check if user is the owner
      const { data: itinerary } = await supabase
        .from('itineraries')
        .select('user_id')
        .eq('id', input.itinerary_id)
        .single()

      if (itinerary?.user_id === profile.id) {
        return { success: false, error: 'Cannot invite the trip owner' }
      }

      // Create the invitation
      const { error: insertError } = await supabase
        .from('trip_collaborators')
        .insert({
          itinerary_id: input.itinerary_id,
          user_id: profile.id,
          role: input.role,
          invited_by: user.id,
          status: 'pending',
        })

      if (insertError) throw insertError
      return { success: true }
    } catch (err) {
      console.error('Error inviting collaborator:', err)
      return { success: false, error: 'Failed to send invitation' }
    }
  },

  // Accept an invitation
  async acceptInvitation(collaboratorId: string): Promise<boolean> {
    try {
      const { error } = await supabase
        .from('trip_collaborators')
        .update({
          status: 'accepted',
          accepted_at: new Date().toISOString(),
        })
        .eq('id', collaboratorId)

      if (error) throw error
      return true
    } catch (err) {
      console.error('Error accepting invitation:', err)
      return false
    }
  },

  // Decline an invitation
  async declineInvitation(collaboratorId: string): Promise<boolean> {
    try {
      const { error } = await supabase
        .from('trip_collaborators')
        .update({ status: 'declined' })
        .eq('id', collaboratorId)

      if (error) throw error
      return true
    } catch (err) {
      console.error('Error declining invitation:', err)
      return false
    }
  },

  // Remove a collaborator
  async removeCollaborator(collaboratorId: string): Promise<boolean> {
    try {
      const { error } = await supabase
        .from('trip_collaborators')
        .delete()
        .eq('id', collaboratorId)

      if (error) throw error
      return true
    } catch (err) {
      console.error('Error removing collaborator:', err)
      return false
    }
  },

  // Update collaborator role
  async updateRole(collaboratorId: string, role: CollaboratorRole): Promise<boolean> {
    try {
      const { error } = await supabase
        .from('trip_collaborators')
        .update({ role })
        .eq('id', collaboratorId)

      if (error) throw error
      return true
    } catch (err) {
      console.error('Error updating role:', err)
      return false
    }
  },

  // Get pending invitations for current user
  async getPendingInvitations(): Promise<Collaborator[]> {
    try {
      const { data: { user } } = await supabase.auth.getUser()
      if (!user) return []

      const { data, error } = await supabase
        .from('trip_collaborators')
        .select(`
          *,
          itinerary:itineraries (
            id, title, destinations, start_date, end_date
          ),
          inviter:profiles!trip_collaborators_invited_by_fkey (
            id, username, first_name, photo_url
          )
        `)
        .eq('user_id', user.id)
        .eq('status', 'pending')

      if (error) throw error
      return data || []
    } catch (err) {
      console.error('Error fetching invitations:', err)
      return []
    }
  },

  // Check if user can edit trip
  async canEditTrip(itineraryId: string, userId: string): Promise<boolean> {
    try {
      // Check if owner
      const { data: itinerary } = await supabase
        .from('itineraries')
        .select('user_id')
        .eq('id', itineraryId)
        .single()

      if (itinerary?.user_id === userId) return true

      // Check if collaborator with edit rights
      const { data: collab } = await supabase
        .from('trip_collaborators')
        .select('role, status')
        .eq('itinerary_id', itineraryId)
        .eq('user_id', userId)
        .single()

      return collab?.status === 'accepted' && (collab?.role === 'editor' || collab?.role === 'owner')
    } catch (err) {
      return false
    }
  },

  // Subscribe to presence for real-time collaboration
  subscribeToPresence(
    itineraryId: string,
    userId: string,
    userInfo: { username: string; photo_url?: string },
    onPresenceChange: (presences: PresenceState[]) => void
  ) {
    const channel = supabase.channel(`trip:${itineraryId}`)

    channel
      .on('presence', { event: 'sync' }, () => {
        const state = channel.presenceState()
        const presences: PresenceState[] = Object.values(state)
          .flat()
          .map((p: any) => ({
            user_id: p.user_id,
            username: p.username,
            photo_url: p.photo_url,
            cursor: p.cursor,
            last_seen: p.last_seen,
          }))
          .filter((p) => p.user_id !== userId) // Exclude self
        onPresenceChange(presences)
      })
      .subscribe(async (status) => {
        if (status === 'SUBSCRIBED') {
          await channel.track({
            user_id: userId,
            username: userInfo.username,
            photo_url: userInfo.photo_url,
            last_seen: new Date().toISOString(),
          })
        }
      })

    return () => {
      supabase.removeChannel(channel)
    }
  },

  // Update cursor position (for real-time cursors)
  async updateCursor(
    channel: ReturnType<typeof supabase.channel>,
    userId: string,
    cursor: { x: number; y: number }
  ) {
    await channel.track({
      user_id: userId,
      cursor,
      last_seen: new Date().toISOString(),
    })
  },
}
