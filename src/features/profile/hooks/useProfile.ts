'use client'

import { useState, useEffect, useCallback } from 'react'
import { supabase } from '@/lib/supabase'
import {
  UserProfile,
  ProfileContent,
  fetchUserProfile,
  fetchUserContent,
  followUser,
  unfollowUser,
  updateProfile,
} from '../services/profileService'

interface UseProfileOptions {
  username: string
}

interface UseProfileReturn {
  profile: UserProfile | null
  content: ProfileContent | null
  currentUserId: string | null
  isOwnProfile: boolean
  loading: boolean
  error: string | null
  followLoading: boolean
  handleFollow: () => Promise<void>
  handleUnfollow: () => Promise<void>
  updateProfileData: (updates: Partial<UserProfile>) => Promise<boolean>
  refreshProfile: () => Promise<void>
}

export function useProfile({ username }: UseProfileOptions): UseProfileReturn {
  const [profile, setProfile] = useState<UserProfile | null>(null)
  const [content, setContent] = useState<ProfileContent | null>(null)
  const [currentUserId, setCurrentUserId] = useState<string | null>(null)
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState<string | null>(null)
  const [followLoading, setFollowLoading] = useState(false)

  const loadProfile = useCallback(async () => {
    setLoading(true)
    setError(null)

    try {
      const { data: { user } } = await supabase.auth.getUser()
      setCurrentUserId(user?.id || null)

      const profileData = await fetchUserProfile(username, user?.id)

      if (!profileData) {
        setError('User not found')
        setLoading(false)
        return
      }

      setProfile(profileData)

      const contentData = await fetchUserContent(profileData.id)
      setContent(contentData)
    } catch (err) {
      console.error('Error loading profile:', err)
      setError('Failed to load profile')
    } finally {
      setLoading(false)
    }
  }, [username])

  useEffect(() => {
    loadProfile()
  }, [loadProfile])

  const handleFollow = useCallback(async () => {
    if (!currentUserId || !profile) return

    setFollowLoading(true)
    const result = await followUser(currentUserId, profile.id)

    if (result.success) {
      setProfile((prev) =>
        prev
          ? {
              ...prev,
              isFollowing: true,
              followersCount: prev.followersCount + 1,
            }
          : null
      )
    }

    setFollowLoading(false)
  }, [currentUserId, profile])

  const handleUnfollow = useCallback(async () => {
    if (!currentUserId || !profile) return

    setFollowLoading(true)
    const result = await unfollowUser(currentUserId, profile.id)

    if (result.success) {
      setProfile((prev) =>
        prev
          ? {
              ...prev,
              isFollowing: false,
              followersCount: Math.max(0, prev.followersCount - 1),
            }
          : null
      )
    }

    setFollowLoading(false)
  }, [currentUserId, profile])

  const updateProfileData = useCallback(
    async (updates: Partial<UserProfile>): Promise<boolean> => {
      if (!profile) return false

      const result = await updateProfile(profile.id, updates)

      if (result.success) {
        setProfile((prev) => (prev ? { ...prev, ...updates } : null))
        return true
      }

      return false
    },
    [profile]
  )

  return {
    profile,
    content,
    currentUserId,
    isOwnProfile: currentUserId === profile?.id,
    loading,
    error,
    followLoading,
    handleFollow,
    handleUnfollow,
    updateProfileData,
    refreshProfile: loadProfile,
  }
}

/**
 * Hook to get the current user's profile
 */
export function useCurrentUserProfile() {
  const [profile, setProfile] = useState<UserProfile | null>(null)
  const [loading, setLoading] = useState(true)

  useEffect(() => {
    const loadCurrentUser = async () => {
      try {
        const { data: { user } } = await supabase.auth.getUser()

        if (!user) {
          setLoading(false)
          return
        }

        const profileData = await fetchUserProfile(user.id, user.id)
        setProfile(profileData)
      } catch (error) {
        console.error('Error loading current user profile:', error)
      } finally {
        setLoading(false)
      }
    }

    loadCurrentUser()

    // Subscribe to auth changes
    const { data: { subscription } } = supabase.auth.onAuthStateChange(
      async (event, session) => {
        if (event === 'SIGNED_IN' && session?.user) {
          const profileData = await fetchUserProfile(session.user.id, session.user.id)
          setProfile(profileData)
        } else if (event === 'SIGNED_OUT') {
          setProfile(null)
        }
      }
    )

    return () => {
      subscription.unsubscribe()
    }
  }, [])

  return { profile, loading }
}
