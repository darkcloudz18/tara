'use client'

export const dynamic = 'force-dynamic'

import { useEffect, useState } from 'react'
import { useParams, useRouter } from 'next/navigation'
import Link from 'next/link'
import { supabase, getUserSafe } from '@/lib/supabase'
import { ArrowLeft, Loader2, Plus, Image, Play, Map, X } from 'lucide-react'
import { AppShell } from '@/components/layout'
import ProfileHeader from '@/features/profile/components/ProfileHeader'
import ProfileContentGrid from '@/features/profile/components/ProfileContentGrid'
import EditProfileModal from '@/features/profile/components/EditProfileModal'
import CreatePostModal from '@/features/profile/components/CreatePostModal'
import CreateVideoModal from '@/features/profile/components/CreateVideoModal'
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

  const [user, setUser] = useState<any>(null)
  const [profile, setProfile] = useState<UserProfile | null>(null)
  const [content, setContent] = useState<ProfileContent | null>(null)
  const [currentUserId, setCurrentUserId] = useState<string | null>(null)
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState('')
  const [followLoading, setFollowLoading] = useState(false)
  const [showEditModal, setShowEditModal] = useState(false)
  const [showCreateMenu, setShowCreateMenu] = useState(false)
  const [showPostModal, setShowPostModal] = useState(false)
  const [showVideoModal, setShowVideoModal] = useState(false)

  useEffect(() => {
    loadProfile()
  }, [username])

  const loadProfile = async () => {
    setLoading(true)
    setError('')

    try {
      // Get current user
      const authUser = await getUserSafe()
      setUser(authUser)
      setCurrentUserId(authUser?.id || null)

      // Fetch profile
      const profileData = await fetchUserProfile(username, authUser?.id)

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

  const handleContentCreated = () => {
    // Refresh content after creating new post/video
    if (profile) {
      fetchUserContent(profile.id).then(setContent)
    }
    // Update posts count
    setProfile((prev) =>
      prev ? { ...prev, postsCount: prev.postsCount + 1 } : null
    )
  }

  if (loading) {
    return (
      <AppShell user={user}>
        <div className="flex items-center justify-center min-h-screen">
          <Loader2 className="w-8 h-8 text-teal-500 animate-spin" />
        </div>
      </AppShell>
    )
  }

  if (error || !profile) {
    return (
      <AppShell user={user}>
        <div className="flex flex-col items-center justify-center min-h-screen p-4">
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
            Go home
          </Link>
        </div>
      </AppShell>
    )
  }

  const isOwnProfile = currentUserId === profile.id

  return (
    <AppShell user={user}>
      {/* Main Content */}
      <div className="pb-20 lg:pb-8">
        {/* Top Bar (Mobile) */}
        <div className="sticky top-0 z-30 bg-white dark:bg-black border-b border-gray-200 dark:border-gray-800 lg:hidden">
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

        {/* Create Content Section - Only for own profile */}
        {isOwnProfile && (
          <div className="border-t border-b border-gray-200 dark:border-gray-800 px-4 py-4">
            <div className="max-w-4xl mx-auto">
              <h3 className="text-sm font-semibold text-gray-500 dark:text-gray-400 uppercase tracking-wider mb-3">
                Create
              </h3>
              <div className="flex gap-3 overflow-x-auto pb-2">
                <button
                  onClick={() => setShowPostModal(true)}
                  className="flex items-center gap-2 px-4 py-2.5 bg-gradient-to-r from-pink-500 to-orange-500 text-white rounded-xl font-medium hover:opacity-90 transition-opacity whitespace-nowrap"
                >
                  <Image className="w-5 h-5" />
                  New Post
                </button>
                <button
                  onClick={() => setShowVideoModal(true)}
                  className="flex items-center gap-2 px-4 py-2.5 bg-gradient-to-r from-purple-500 to-blue-500 text-white rounded-xl font-medium hover:opacity-90 transition-opacity whitespace-nowrap"
                >
                  <Play className="w-5 h-5" />
                  Add Video
                </button>
                <Link
                  href="/trip/new"
                  className="flex items-center gap-2 px-4 py-2.5 bg-gradient-to-r from-teal-500 to-green-500 text-white rounded-xl font-medium hover:opacity-90 transition-opacity whitespace-nowrap"
                >
                  <Map className="w-5 h-5" />
                  Plan Trip
                </Link>
              </div>
            </div>
          </div>
        )}

        {/* Content Grid */}
        {content && (
          <ProfileContentGrid
            content={content}
            username={profile.username}
            isOwnProfile={isOwnProfile}
          />
        )}
      </div>

      {/* Floating Action Button - Only for own profile */}
      {isOwnProfile && (
        <>
          {/* FAB */}
          <button
            onClick={() => setShowCreateMenu(!showCreateMenu)}
            className={`fixed bottom-24 right-4 md:bottom-8 md:right-8 w-14 h-14 bg-teal-500 text-white rounded-full shadow-lg flex items-center justify-center z-40 transition-transform ${
              showCreateMenu ? 'rotate-45' : ''
            }`}
          >
            <Plus className="w-7 h-7" />
          </button>

          {/* FAB Menu */}
          {showCreateMenu && (
            <>
              <div
                className="fixed inset-0 z-30"
                onClick={() => setShowCreateMenu(false)}
              />
              <div className="fixed bottom-44 right-4 md:bottom-28 md:right-8 flex flex-col gap-3 z-40">
                <button
                  onClick={() => {
                    setShowCreateMenu(false)
                    setShowPostModal(true)
                  }}
                  className="flex items-center gap-3 px-4 py-3 bg-white dark:bg-gray-800 rounded-xl shadow-lg hover:bg-gray-50 dark:hover:bg-gray-700 transition-colors"
                >
                  <div className="w-10 h-10 bg-gradient-to-r from-pink-500 to-orange-500 rounded-full flex items-center justify-center">
                    <Image className="w-5 h-5 text-white" />
                  </div>
                  <span className="font-medium text-gray-900 dark:text-white">New Post</span>
                </button>
                <button
                  onClick={() => {
                    setShowCreateMenu(false)
                    setShowVideoModal(true)
                  }}
                  className="flex items-center gap-3 px-4 py-3 bg-white dark:bg-gray-800 rounded-xl shadow-lg hover:bg-gray-50 dark:hover:bg-gray-700 transition-colors"
                >
                  <div className="w-10 h-10 bg-gradient-to-r from-purple-500 to-blue-500 rounded-full flex items-center justify-center">
                    <Play className="w-5 h-5 text-white" />
                  </div>
                  <span className="font-medium text-gray-900 dark:text-white">Add Video</span>
                </button>
                <Link
                  href="/trip/new"
                  onClick={() => setShowCreateMenu(false)}
                  className="flex items-center gap-3 px-4 py-3 bg-white dark:bg-gray-800 rounded-xl shadow-lg hover:bg-gray-50 dark:hover:bg-gray-700 transition-colors"
                >
                  <div className="w-10 h-10 bg-gradient-to-r from-teal-500 to-green-500 rounded-full flex items-center justify-center">
                    <Map className="w-5 h-5 text-white" />
                  </div>
                  <span className="font-medium text-gray-900 dark:text-white">Plan Trip</span>
                </Link>
              </div>
            </>
          )}
        </>
      )}

      {/* Edit Profile Modal */}
      {showEditModal && (
        <EditProfileModal
          profile={profile}
          onClose={() => setShowEditModal(false)}
          onSave={handleSaveProfile}
        />
      )}

      {/* Create Post Modal */}
      {showPostModal && currentUserId && (
        <CreatePostModal
          userId={currentUserId}
          onClose={() => setShowPostModal(false)}
          onSuccess={handleContentCreated}
        />
      )}

      {/* Create Video Modal */}
      {showVideoModal && currentUserId && (
        <CreateVideoModal
          userId={currentUserId}
          onClose={() => setShowVideoModal(false)}
          onSuccess={handleContentCreated}
        />
      )}

    </AppShell>
  )
}
