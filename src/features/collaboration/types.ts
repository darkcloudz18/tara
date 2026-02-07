export type CollaboratorRole = 'owner' | 'editor' | 'viewer'
export type CollaboratorStatus = 'pending' | 'accepted' | 'declined'

export interface Collaborator {
  id: string
  itinerary_id: string
  user_id: string
  role: CollaboratorRole
  invited_by: string
  invited_at: string
  accepted_at: string | null
  status: CollaboratorStatus
  created_at: string
  // Joined profile data
  user?: {
    id: string
    email: string
    username?: string
    first_name?: string
    last_name?: string
    photo_url?: string
  }
}

export interface InviteCollaboratorInput {
  itinerary_id: string
  email: string
  role: CollaboratorRole
}

export interface PresenceState {
  user_id: string
  username: string
  photo_url?: string
  cursor?: { x: number; y: number }
  last_seen: string
}
