import { supabase, getUserSafe } from '@/lib/supabase'

export interface UserFollow {
  id: string
  follower_id: string
  following_id: string
  created_at: string
}

export interface FollowStats {
  followers_count: number
  following_count: number
  is_following: boolean
}

export interface FollowUser {
  id: string
  username: string | null
  first_name: string | null
  last_name: string | null
  photo_url: string | null
  is_following?: boolean
}

export const followService = {
  /**
   * Follow a user
   */
  async follow(userId: string): Promise<boolean> {
    const user = await getUserSafe()
    if (!user) return false

    const { error } = await supabase
      .from('user_follows')
      .insert({
        follower_id: user.id,
        following_id: userId,
      })

    return !error
  },

  /**
   * Unfollow a user
   */
  async unfollow(userId: string): Promise<boolean> {
    const user = await getUserSafe()
    if (!user) return false

    const { error } = await supabase
      .from('user_follows')
      .delete()
      .eq('follower_id', user.id)
      .eq('following_id', userId)

    return !error
  },

  /**
   * Toggle follow status
   */
  async toggleFollow(userId: string): Promise<{ isFollowing: boolean }> {
    const isCurrentlyFollowing = await this.isFollowing(userId)

    if (isCurrentlyFollowing) {
      await this.unfollow(userId)
      return { isFollowing: false }
    } else {
      await this.follow(userId)
      return { isFollowing: true }
    }
  },

  /**
   * Check if current user is following another user
   */
  async isFollowing(userId: string): Promise<boolean> {
    const user = await getUserSafe()
    if (!user) return false

    const { data, error } = await supabase
      .from('user_follows')
      .select('id')
      .eq('follower_id', user.id)
      .eq('following_id', userId)
      .maybeSingle()

    return !error && !!data
  },

  /**
   * Get follow stats for a user
   */
  async getFollowStats(userId: string): Promise<FollowStats> {
    const { data: profile } = await supabase
      .from('profiles')
      .select('followers_count, following_count')
      .eq('id', userId)
      .single()

    const isFollowing = await this.isFollowing(userId)

    return {
      followers_count: profile?.followers_count || 0,
      following_count: profile?.following_count || 0,
      is_following: isFollowing,
    }
  },

  /**
   * Get followers of a user
   */
  async getFollowers(userId: string): Promise<FollowUser[]> {
    const currentUser = await getUserSafe()

    const { data, error } = await supabase
      .from('user_follows')
      .select(`
        follower:profiles!user_follows_follower_id_fkey(
          id, username, first_name, last_name, photo_url
        )
      `)
      .eq('following_id', userId)
      .order('created_at', { ascending: false })

    if (error) {
      console.error('Error fetching followers:', error)
      return []
    }

    const followers = (data || []).map((item: any) => ({
      ...item.follower,
    })) as FollowUser[]

    // Check if current user is following each follower
    if (currentUser) {
      const followingIds = await this.getFollowingIds(currentUser.id)
      return followers.map(f => ({
        ...f,
        is_following: followingIds.includes(f.id),
      }))
    }

    return followers
  },

  /**
   * Get users that a user is following
   */
  async getFollowing(userId: string): Promise<FollowUser[]> {
    const currentUser = await getUserSafe()

    const { data, error } = await supabase
      .from('user_follows')
      .select(`
        following:profiles!user_follows_following_id_fkey(
          id, username, first_name, last_name, photo_url
        )
      `)
      .eq('follower_id', userId)
      .order('created_at', { ascending: false })

    if (error) {
      console.error('Error fetching following:', error)
      return []
    }

    const following = (data || []).map((item: any) => ({
      ...item.following,
    })) as FollowUser[]

    // Check if current user is following each user
    if (currentUser) {
      const followingIds = await this.getFollowingIds(currentUser.id)
      return following.map(f => ({
        ...f,
        is_following: followingIds.includes(f.id),
      }))
    }

    return following
  },

  /**
   * Get IDs of users that a user is following
   */
  async getFollowingIds(userId: string): Promise<string[]> {
    const { data, error } = await supabase
      .from('user_follows')
      .select('following_id')
      .eq('follower_id', userId)

    if (error) return []
    return (data || []).map(d => d.following_id)
  },

  /**
   * Get suggested users to follow
   */
  async getSuggestedUsers(limit: number = 5): Promise<FollowUser[]> {
    const user = await getUserSafe()
    if (!user) return []

    // Get users the current user is already following
    const followingIds = await this.getFollowingIds(user.id)

    // Get users with public trips, excluding already followed and self
    const { data, error } = await supabase
      .from('profiles')
      .select('id, username, first_name, last_name, photo_url, followers_count')
      .not('id', 'in', `(${[user.id, ...followingIds].join(',')})`)
      .order('followers_count', { ascending: false })
      .limit(limit)

    if (error) {
      console.error('Error fetching suggested users:', error)
      return []
    }

    return (data || []).map(u => ({
      ...u,
      is_following: false,
    }))
  },
}
