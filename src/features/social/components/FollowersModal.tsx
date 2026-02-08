'use client'

import { useState, useEffect } from 'react'
import { X, Loader2, Users } from 'lucide-react'
import Link from 'next/link'
import { followService, FollowUser } from '../services/followService'
import FollowButton from './FollowButton'

interface FollowersModalProps {
  isOpen: boolean
  onClose: () => void
  userId: string
  type: 'followers' | 'following'
  currentUserId?: string
}

export default function FollowersModal({
  isOpen,
  onClose,
  userId,
  type,
  currentUserId,
}: FollowersModalProps) {
  const [users, setUsers] = useState<FollowUser[]>([])
  const [loading, setLoading] = useState(true)

  useEffect(() => {
    if (isOpen) {
      loadUsers()
    }
  }, [isOpen, userId, type])

  const loadUsers = async () => {
    setLoading(true)
    const data = type === 'followers'
      ? await followService.getFollowers(userId)
      : await followService.getFollowing(userId)
    setUsers(data)
    setLoading(false)
  }

  const handleFollowChange = (targetUserId: string, isFollowing: boolean) => {
    setUsers(prev =>
      prev.map(u =>
        u.id === targetUserId ? { ...u, is_following: isFollowing } : u
      )
    )
  }

  if (!isOpen) return null

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/60 backdrop-blur-sm animate-fade-in">
      <div className="relative w-full max-w-md mx-4 bg-white dark:bg-gray-900 rounded-2xl shadow-2xl overflow-hidden animate-scale-in max-h-[80vh] flex flex-col">
        {/* Header */}
        <div className="flex items-center justify-between px-6 py-4 border-b border-gray-200 dark:border-gray-800">
          <h2 className="text-lg font-semibold text-gray-900 dark:text-white capitalize">
            {type}
          </h2>
          <button
            onClick={onClose}
            className="p-2 text-gray-400 hover:text-gray-600 dark:hover:text-gray-300 rounded-lg hover:bg-gray-100 dark:hover:bg-gray-800"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        {/* Content */}
        <div className="flex-1 overflow-y-auto">
          {loading ? (
            <div className="flex items-center justify-center py-12">
              <Loader2 className="w-8 h-8 text-teal-600 animate-spin" />
            </div>
          ) : users.length === 0 ? (
            <div className="text-center py-12 px-6">
              <div className="w-16 h-16 bg-gray-100 dark:bg-gray-800 rounded-full flex items-center justify-center mx-auto mb-4">
                <Users className="w-8 h-8 text-gray-400" />
              </div>
              <p className="text-gray-500 dark:text-gray-400">
                {type === 'followers'
                  ? 'No followers yet'
                  : 'Not following anyone yet'}
              </p>
            </div>
          ) : (
            <div className="divide-y divide-gray-100 dark:divide-gray-800">
              {users.map((user) => (
                <div
                  key={user.id}
                  className="flex items-center justify-between px-6 py-3 hover:bg-gray-50 dark:hover:bg-gray-800/50"
                >
                  <Link
                    href={`/profile/${user.username || user.id}`}
                    onClick={onClose}
                    className="flex items-center gap-3 flex-1 min-w-0"
                  >
                    {user.photo_url ? (
                      <img
                        src={user.photo_url}
                        alt=""
                        className="w-10 h-10 rounded-full object-cover"
                      />
                    ) : (
                      <div className="w-10 h-10 rounded-full bg-gradient-to-br from-teal-400 to-blue-500 flex items-center justify-center text-white font-bold">
                        {(user.first_name?.[0] || user.username?.[0] || 'U').toUpperCase()}
                      </div>
                    )}
                    <div className="flex-1 min-w-0">
                      <p className="font-medium text-gray-900 dark:text-white truncate">
                        {user.first_name && user.last_name
                          ? `${user.first_name} ${user.last_name}`
                          : user.username || 'User'}
                      </p>
                      {user.username && (
                        <p className="text-sm text-gray-500 dark:text-gray-400 truncate">
                          @{user.username}
                        </p>
                      )}
                    </div>
                  </Link>

                  {/* Follow button - don't show for self */}
                  {currentUserId && user.id !== currentUserId && (
                    <FollowButton
                      userId={user.id}
                      isFollowing={user.is_following || false}
                      onFollowChange={(isFollowing) => handleFollowChange(user.id, isFollowing)}
                      size="sm"
                    />
                  )}
                </div>
              ))}
            </div>
          )}
        </div>
      </div>
    </div>
  )
}
