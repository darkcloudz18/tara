'use client'

import { useState } from 'react'
import { UserProfile } from '../services/profileService'
import { Settings, BadgeCheck, MapPin, Link as LinkIcon, Grid3X3, Play, Bookmark, MoreHorizontal } from 'lucide-react'

interface ProfileHeaderProps {
  profile: UserProfile
  isOwnProfile: boolean
  onFollow: () => void
  onUnfollow: () => void
  onEditProfile: () => void
  isFollowLoading?: boolean
}

export default function ProfileHeader({
  profile,
  isOwnProfile,
  onFollow,
  onUnfollow,
  onEditProfile,
  isFollowLoading,
}: ProfileHeaderProps) {
  const displayName = profile.first_name && profile.last_name
    ? `${profile.first_name} ${profile.last_name}`
    : profile.first_name || profile.username || 'User'

  const initials = displayName
    .split(' ')
    .map((n) => n[0])
    .join('')
    .toUpperCase()
    .slice(0, 2)

  return (
    <header className="px-4 md:px-8 pt-8 pb-4">
      {/* Mobile Layout */}
      <div className="md:hidden">
        <div className="flex items-center gap-4 mb-4">
          {/* Avatar */}
          <div className="relative flex-shrink-0">
            {profile.photo_url ? (
              <img
                src={profile.photo_url}
                alt={displayName}
                className="w-20 h-20 rounded-full object-cover border-2 border-gray-200 dark:border-gray-700"
              />
            ) : (
              <div className="w-20 h-20 rounded-full bg-gradient-to-br from-teal-400 to-blue-500 flex items-center justify-center text-white text-2xl font-bold">
                {initials}
              </div>
            )}
            {profile.creator?.verified && (
              <div className="absolute -bottom-1 -right-1 bg-white dark:bg-gray-900 rounded-full p-0.5">
                <BadgeCheck className="w-5 h-5 text-teal-500" />
              </div>
            )}
          </div>

          {/* Stats */}
          <div className="flex-1 flex justify-around">
            <div className="text-center">
              <div className="font-bold text-gray-900 dark:text-white">{profile.postsCount}</div>
              <div className="text-xs text-gray-500 dark:text-gray-400">posts</div>
            </div>
            <div className="text-center">
              <div className="font-bold text-gray-900 dark:text-white">{profile.followersCount.toLocaleString()}</div>
              <div className="text-xs text-gray-500 dark:text-gray-400">followers</div>
            </div>
            <div className="text-center">
              <div className="font-bold text-gray-900 dark:text-white">{profile.followingCount.toLocaleString()}</div>
              <div className="text-xs text-gray-500 dark:text-gray-400">following</div>
            </div>
          </div>
        </div>

        {/* Name & Bio */}
        <div className="mb-4">
          <h1 className="font-bold text-gray-900 dark:text-white flex items-center gap-1">
            {displayName}
            {profile.creator?.verified && <BadgeCheck className="w-4 h-4 text-teal-500" />}
          </h1>
          {profile.username && (
            <p className="text-sm text-gray-500 dark:text-gray-400">@{profile.username}</p>
          )}
          {profile.bio && (
            <p className="text-sm text-gray-800 dark:text-gray-200 mt-2 whitespace-pre-wrap">{profile.bio}</p>
          )}
          {profile.location && (
            <p className="text-sm text-gray-500 dark:text-gray-400 mt-1 flex items-center gap-1">
              <MapPin className="w-3 h-3" />
              {profile.location}
            </p>
          )}
        </div>

        {/* Action Buttons */}
        <div className="flex gap-2">
          {isOwnProfile ? (
            <>
              <button
                onClick={onEditProfile}
                className="flex-1 py-2 px-4 bg-gray-100 dark:bg-gray-800 text-gray-900 dark:text-white text-sm font-semibold rounded-lg hover:bg-gray-200 dark:hover:bg-gray-700 transition-colors"
              >
                Edit Profile
              </button>
              <button className="py-2 px-4 bg-gray-100 dark:bg-gray-800 rounded-lg hover:bg-gray-200 dark:hover:bg-gray-700 transition-colors">
                <Settings className="w-5 h-5 text-gray-900 dark:text-white" />
              </button>
            </>
          ) : (
            <>
              <button
                onClick={profile.isFollowing ? onUnfollow : onFollow}
                disabled={isFollowLoading}
                className={`flex-1 py-2 px-4 text-sm font-semibold rounded-lg transition-colors disabled:opacity-50 ${
                  profile.isFollowing
                    ? 'bg-gray-100 dark:bg-gray-800 text-gray-900 dark:text-white hover:bg-gray-200 dark:hover:bg-gray-700'
                    : 'bg-teal-500 text-white hover:bg-teal-600'
                }`}
              >
                {isFollowLoading ? '...' : profile.isFollowing ? 'Following' : 'Follow'}
              </button>
              <button className="py-2 px-4 bg-gray-100 dark:bg-gray-800 text-gray-900 dark:text-white text-sm font-semibold rounded-lg hover:bg-gray-200 dark:hover:bg-gray-700 transition-colors">
                Message
              </button>
              <button className="py-2 px-3 bg-gray-100 dark:bg-gray-800 rounded-lg hover:bg-gray-200 dark:hover:bg-gray-700 transition-colors">
                <MoreHorizontal className="w-5 h-5 text-gray-900 dark:text-white" />
              </button>
            </>
          )}
        </div>
      </div>

      {/* Desktop Layout */}
      <div className="hidden md:flex gap-8 max-w-4xl mx-auto">
        {/* Avatar */}
        <div className="relative flex-shrink-0">
          {profile.photo_url ? (
            <img
              src={profile.photo_url}
              alt={displayName}
              className="w-36 h-36 rounded-full object-cover border-4 border-gray-200 dark:border-gray-700"
            />
          ) : (
            <div className="w-36 h-36 rounded-full bg-gradient-to-br from-teal-400 to-blue-500 flex items-center justify-center text-white text-5xl font-bold">
              {initials}
            </div>
          )}
          {profile.creator?.verified && (
            <div className="absolute bottom-2 right-2 bg-white dark:bg-gray-900 rounded-full p-1">
              <BadgeCheck className="w-6 h-6 text-teal-500" />
            </div>
          )}
        </div>

        {/* Info */}
        <div className="flex-1">
          {/* Username & Actions */}
          <div className="flex items-center gap-4 mb-4">
            <h1 className="text-xl text-gray-900 dark:text-white">
              {profile.username || displayName}
            </h1>
            {isOwnProfile ? (
              <>
                <button
                  onClick={onEditProfile}
                  className="py-1.5 px-4 bg-gray-100 dark:bg-gray-800 text-gray-900 dark:text-white text-sm font-semibold rounded-lg hover:bg-gray-200 dark:hover:bg-gray-700 transition-colors"
                >
                  Edit Profile
                </button>
                <button className="p-1.5 hover:bg-gray-100 dark:hover:bg-gray-800 rounded-lg transition-colors">
                  <Settings className="w-6 h-6 text-gray-900 dark:text-white" />
                </button>
              </>
            ) : (
              <>
                <button
                  onClick={profile.isFollowing ? onUnfollow : onFollow}
                  disabled={isFollowLoading}
                  className={`py-1.5 px-6 text-sm font-semibold rounded-lg transition-colors disabled:opacity-50 ${
                    profile.isFollowing
                      ? 'bg-gray-100 dark:bg-gray-800 text-gray-900 dark:text-white hover:bg-gray-200 dark:hover:bg-gray-700'
                      : 'bg-teal-500 text-white hover:bg-teal-600'
                  }`}
                >
                  {isFollowLoading ? '...' : profile.isFollowing ? 'Following' : 'Follow'}
                </button>
                <button className="py-1.5 px-4 bg-gray-100 dark:bg-gray-800 text-gray-900 dark:text-white text-sm font-semibold rounded-lg hover:bg-gray-200 dark:hover:bg-gray-700 transition-colors">
                  Message
                </button>
                <button className="p-1.5 hover:bg-gray-100 dark:hover:bg-gray-800 rounded-lg transition-colors">
                  <MoreHorizontal className="w-6 h-6 text-gray-900 dark:text-white" />
                </button>
              </>
            )}
          </div>

          {/* Stats */}
          <div className="flex gap-8 mb-4">
            <div>
              <span className="font-bold text-gray-900 dark:text-white">{profile.postsCount}</span>{' '}
              <span className="text-gray-600 dark:text-gray-400">posts</span>
            </div>
            <div>
              <span className="font-bold text-gray-900 dark:text-white">{profile.followersCount.toLocaleString()}</span>{' '}
              <span className="text-gray-600 dark:text-gray-400">followers</span>
            </div>
            <div>
              <span className="font-bold text-gray-900 dark:text-white">{profile.followingCount.toLocaleString()}</span>{' '}
              <span className="text-gray-600 dark:text-gray-400">following</span>
            </div>
          </div>

          {/* Name & Bio */}
          <div>
            <h2 className="font-bold text-gray-900 dark:text-white">{displayName}</h2>
            {profile.creator && (
              <p className="text-sm text-gray-500 dark:text-gray-400">Travel Creator</p>
            )}
            {profile.bio && (
              <p className="text-gray-800 dark:text-gray-200 mt-2 whitespace-pre-wrap">{profile.bio}</p>
            )}
            {profile.location && (
              <p className="text-gray-500 dark:text-gray-400 mt-1 flex items-center gap-1">
                <MapPin className="w-4 h-4" />
                {profile.location}
              </p>
            )}
          </div>
        </div>
      </div>
    </header>
  )
}
