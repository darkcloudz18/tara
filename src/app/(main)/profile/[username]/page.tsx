'use client'

export const dynamic = 'force-dynamic'

import { useEffect, useState } from 'react'
import { useParams, useRouter } from 'next/navigation'
import Link from 'next/link'
import { supabase } from '@/lib/supabase'
import { ArrowLeft, Loader2 } from 'lucide-react'
import ProfileHeader from '@/features/profile/components/ProfileHeader'
import ProfileContentGrid from '@/features/profile/components/ProfileContentGrid'
import EditProfileModal from '@/features/profile/components/EditProfileModal'
import {
  UserProfile,
  ProfileContent,
  fetchUserProfile,
  fetchUserContent,
  followUser,
  unfollowUser,
} from '@/features/profile/services/profileService'

export default function ProfilePage() {
  const params = useParams()
  const router = useRouter()
  const username = params.username as string

  const [profile, setProfile] = useState<UserProfile | null>(null)
  const [content, setContent] = useState<ProfileContent | null>(null)
  const [currentUserId, setCurrentUserId] = useState<string | null>(null)
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState('')
  const [followLoading, setFollowLoading] = useState(false)
  const [showEditModal, setShowEditModal] = useState(false)

  useEffect(() => {
    loadProfile()
  }, [username])

  const loadProfile = async () => {
    setLoading(true)
    setError('')

    try {
      // Get current user
      const { data: { user } } = await supabase.auth.getUser()
      setCurrentUserId(user?.id || null)

      // Fetch profile
      const profileData = await fetchUserProfile(username, user?.id)

      if (!profileData) {
        setError('User not found')
        setLoading(false)
        return
      }

      setProfile(profileData)

      // Fetch content
      const contentData = await fetchUserContent(profileData.id)
      setContent(contentData)
    } catch (err) {
      console.error('Error loading profile:', err)
      setError('Failed to load profile')
    } finally {
      setLoading(false)
    }
  }

  const handleFollow = async () => {
    if (!currentUserId || !profile) {
      router.push('/login')
      return
    }

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
  }

  const handleUnfollow = async () => {
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
  }

  const handleEditProfile = () => {
    setShowEditModal(true)
  }

  const handleSaveProfile = (updates: Partial<UserProfile>) => {
    setProfile((prev) => (prev ? { ...prev, ...updates } : null))
  }

  if (loading) {
    return (
      <div className="min-h-screen bg-white dark:bg-black flex items-center justify-center">
        <Loader2 className="w-8 h-8 text-teal-500 animate-spin" />
      </div>
    )
  }

  if (error || !profile) {
    return (
      <div className="min-h-screen bg-white dark:bg-black flex flex-col items-center justify-center p-4">
        <h1 className="text-2xl font-bold text-gray-900 dark:text-white mb-2">
          {error || 'User not found'}
        </h1>
        <p className="text-gray-500 dark:text-gray-400 mb-6">
          The user you're looking for doesn't exist or may have been removed.
        </p>
        <Link
          href="/"
          className="px-6 py-2.5 bg-teal-500 text-white font-semibold rounded-lg hover:bg-teal-600 transition-colors"
        >
          Go Home
        </Link>
      </div>
    )
  }

  const isOwnProfile = currentUserId === profile.id

  return (
    <div className="min-h-screen bg-white dark:bg-black">
      {/* Top Bar (Mobile) */}
      <div className="sticky top-0 z-30 bg-white dark:bg-black border-b border-gray-200 dark:border-gray-800 md:hidden">
        <div className="flex items-center justify-between px-4 py-3">
          <button
            onClick={() => router.back()}
            className="p-2 -ml-2 hover:bg-gray-100 dark:hover:bg-gray-800 rounded-full"
          >
            <ArrowLeft className="w-6 h-6 text-gray-900 dark:text-white" />
          </button>
          <h1 className="font-semibold text-gray-900 dark:text-white">
            {profile.username || 'Profile'}
          </h1>
          <div className="w-10" />
        </div>
      </div>

      {/* Profile Header */}
      <ProfileHeader
        profile={profile}
        isOwnProfile={isOwnProfile}
        onFollow={handleFollow}
        onUnfollow={handleUnfollow}
        onEditProfile={handleEditProfile}
        isFollowLoading={followLoading}
      />

      {/* Content Grid */}
      {content && (
        <ProfileContentGrid content={content} username={profile.username} />
      )}

      {/* Edit Profile Modal */}
      {showEditModal && (
        <EditProfileModal
          profile={profile}
          onClose={() => setShowEditModal(false)}
          onSave={handleSaveProfile}
        />
      )}
    </div>
  )
}
