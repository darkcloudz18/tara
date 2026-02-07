export type NotificationType =
  | 'trip_shared'
  | 'collaborator_joined'
  | 'trip_reminder'
  | 'place_recommendation'
  | 'trip_comment'
  | 'system'

export interface Notification {
  id: string
  user_id: string
  type: NotificationType
  title: string
  message: string
  is_read: boolean
  data?: {
    trip_id?: string
    place_id?: string
    from_user_id?: string
    from_user_name?: string
    from_user_photo?: string
    action_url?: string
  }
  created_at: string
}

export interface NotificationCreateInput {
  user_id: string
  type: NotificationType
  title: string
  message: string
  data?: Notification['data']
}
