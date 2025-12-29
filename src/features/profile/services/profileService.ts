import { supabase } from '@/lib/supabase'
import { Profile, Creator, Post } from '@/types/database'
import { CreatorVideo } from '@/features/discover/services/creatorVideoService'

export interface UserProfile extends Profile {
  creator?: Creator
  followersCount: number
  followingCount: number
  postsCount: number
  isFollowing?: boolean
}

export interface ProfileContent {
  posts: Post[]
  videos: CreatorVideo[]
  itineraries: {
    id: string
    title: string
    cover_image_url: string | null
    destinations: string[]
    start_date: string
    end_date: string
    is_public: boolean
  }[]
}

/**
 * Fetch a user profile by username or ID
 */
export async function fetchUserProfile(
  usernameOrId: string,
  currentUserId?: string
): Promise<UserProfile | null> {
  // Try to find by username first, then by ID
  let { data: profile, error } = await supabase
    .from('profiles')
    .select('*')
    .eq('username', usernameOrId)
    .single()

  if (error || !profile) {
    // Try by ID
    const result = await supabase
      .from('profiles')
      .select('*')
      .eq('id', usernameOrId)
      .single()

    profile = result.data
    error = result.error
  }

  if (error || !profile) {
    console.error('Error fetching profile:', error)
    return null
  }

  // Get creator data if exists
  const { data: creator } = await supabase
    .from('creators')
    .select('*')
    .eq('id', profile.id)
    .single()

  // Get followers count
  const { count: followersCount } = await supabase
    .from('follows')
    .select('*', { count: 'exact', head: true })
    .eq('following_id', profile.id)

  // Get following count
  const { count: followingCount } = await supabase
    .from('follows')
    .select('*', { count: 'exact', head: true })
    .eq('follower_id', profile.id)

  // Get posts count
  const { count: postsCount } = await supabase
    .from('posts')
    .select('*', { count: 'exact', head: true })
    .eq('user_id', profile.id)

  // Check if current user is following
  let isFollowing = false
  if (currentUserId && currentUserId !== profile.id) {
    const { data: followRecord } = await supabase
      .from('follows')
      .select('id')
      .eq('follower_id', currentUserId)
      .eq('following_id', profile.id)
      .single()

    isFollowing = !!followRecord
  }

  return {
    ...profile,
    creator: creator || undefined,
    followersCount: followersCount || 0,
    followingCount: followingCount || 0,
    postsCount: postsCount || 0,
    isFollowing,
  }
}

/**
 * Fetch user's content (posts, videos, itineraries)
 */
export async function fetchUserContent(userId: string): Promise<ProfileContent> {
  // Fetch posts
  const { data: posts } = await supabase
    .from('posts')
    .select('*')
    .eq('user_id', userId)
    .order('created_at', { ascending: false })
    .limit(30)

  // Fetch creator videos
  const { data: videos } = await supabase
    .from('creator_videos')
    .select('*')
    .eq('creator_id', userId)
    .eq('is_active', true)
    .order('created_at', { ascending: false })
    .limit(30)

  // Fetch public itineraries
  const { data: itineraries } = await supabase
    .from('itineraries')
    .select('id, title, cover_image_url, destinations, start_date, end_date, is_public')
    .eq('user_id', userId)
    .eq('is_public', true)
    .order('created_at', { ascending: false })
    .limit(20)

  return {
    posts: posts || [],
    videos: videos || [],
    itineraries: itineraries || [],
  }
}

/**
 * Follow a user
 */
export async function followUser(
  followerId: string,
  followingId: string
): Promise<{ success: boolean; error?: string }> {
  if (followerId === followingId) {
    return { success: false, error: 'Cannot follow yourself' }
  }

  const { error } = await supabase
    .from('follows')
    .insert({ follower_id: followerId, following_id: followingId })

  if (error) {
    if (error.code === '23505') {
      return { success: false, error: 'Already following this user' }
    }
    console.error('Error following user:', error)
    return { success: false, error: 'Failed to follow user' }
  }

  // Update creator's follower count if they have a creator profile
  await supabase.rpc('increment_creator_followers', { creator_id: followingId })

  return { success: true }
}

/**
 * Unfollow a user
 */
export async function unfollowUser(
  followerId: string,
  followingId: string
): Promise<{ success: boolean; error?: string }> {
  const { error } = await supabase
    .from('follows')
    .delete()
    .eq('follower_id', followerId)
    .eq('following_id', followingId)

  if (error) {
    console.error('Error unfollowing user:', error)
    return { success: false, error: 'Failed to unfollow user' }
  }

  // Decrement creator's follower count
  await supabase.rpc('decrement_creator_followers', { creator_id: followingId })

  return { success: true }
}

/**
 * Update user profile
 */
export async function updateProfile(
  userId: string,
  updates: Partial<Pick<Profile, 'username' | 'first_name' | 'last_name' | 'bio' | 'location' | 'photo_url'>>
): Promise<{ success: boolean; error?: string }> {
  // Check username uniqueness if updating username
  if (updates.username) {
    const { data: existing } = await supabase
      .from('profiles')
      .select('id')
      .eq('username', updates.username)
      .neq('id', userId)
      .single()

    if (existing) {
      return { success: false, error: 'Username already taken' }
    }
  }

  const { error } = await supabase
    .from('profiles')
    .update({
      ...updates,
      updated_at: new Date().toISOString(),
    })
    .eq('id', userId)

  if (error) {
    console.error('Error updating profile:', error)
    return { success: false, error: 'Failed to update profile' }
  }

  return { success: true }
}

/**
 * Fetch user's followers
 */
export async function fetchFollowers(
  userId: string,
  limit = 50
): Promise<Profile[]> {
  const { data, error } = await supabase
    .from('follows')
    .select(`
      follower:profiles!follows_follower_id_fkey(*)
    `)
    .eq('following_id', userId)
    .limit(limit)

  if (error) {
    console.error('Error fetching followers:', error)
    return []
  }

  return data?.map((d: any) => d.follower).filter(Boolean) || []
}

/**
 * Fetch users that this user is following
 */
export async function fetchFollowing(
  userId: string,
  limit = 50
): Promise<Profile[]> {
  const { data, error } = await supabase
    .from('follows')
    .select(`
      following:profiles!follows_following_id_fkey(*)
    `)
    .eq('follower_id', userId)
    .limit(limit)

  if (error) {
    console.error('Error fetching following:', error)
    return []
  }

  return data?.map((d: any) => d.following).filter(Boolean) || []
}

/**
 * Search users by name or username
 */
export async function searchUsers(
  query: string,
  limit = 20
): Promise<Profile[]> {
  const { data, error } = await supabase
    .from('profiles')
    .select('*')
    .or(`username.ilike.%${query}%,first_name.ilike.%${query}%,last_name.ilike.%${query}%`)
    .limit(limit)

  if (error) {
    console.error('Error searching users:', error)
    return []
  }

  return data || []
}
