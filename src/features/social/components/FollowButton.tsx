'use client'

import { useState } from 'react'
import { UserPlus, UserMinus, Loader2 } from 'lucide-react'
import { followService } from '../services/followService'
import { useToast } from '@/contexts/ToastContext'

interface FollowButtonProps {
  userId: string
  isFollowing: boolean
  onFollowChange?: (isFollowing: boolean) => void
  size?: 'sm' | 'md' | 'lg'
  showIcon?: boolean
}

export default function FollowButton({
  userId,
  isFollowing: initialIsFollowing,
  onFollowChange,
  size = 'md',
  showIcon = true,
}: FollowButtonProps) {
  const [isFollowing, setIsFollowing] = useState(initialIsFollowing)
  const [loading, setLoading] = useState(false)
  const { success, error } = useToast()

  const handleClick = async () => {
    setLoading(true)

    try {
      const result = await followService.toggleFollow(userId)
      setIsFollowing(result.isFollowing)
      onFollowChange?.(result.isFollowing)

      if (result.isFollowing) {
        success('Following!')
      } else {
        success('Unfollowed')
      }
    } catch (err) {
      error('Failed to update follow status')
    } finally {
      setLoading(false)
    }
  }

  const sizeClasses = {
    sm: 'px-3 py-1 text-xs',
    md: 'px-4 py-2 text-sm',
    lg: 'px-6 py-2.5 text-base',
  }

  const iconSizes = {
    sm: 'w-3 h-3',
    md: 'w-4 h-4',
    lg: 'w-5 h-5',
  }

  return (
    <button
      onClick={handleClick}
      disabled={loading}
      className={`
        inline-flex items-center justify-center gap-2 font-medium rounded-lg transition-colors
        ${sizeClasses[size]}
        ${
          isFollowing
            ? 'bg-gray-100 dark:bg-gray-800 text-gray-700 dark:text-gray-300 hover:bg-red-100 dark:hover:bg-red-900/30 hover:text-red-600 dark:hover:text-red-400'
            : 'bg-teal-600 hover:bg-teal-700 text-white'
        }
        disabled:opacity-50 disabled:cursor-not-allowed
      `}
    >
      {loading ? (
        <Loader2 className={`${iconSizes[size]} animate-spin`} />
      ) : showIcon ? (
        isFollowing ? (
          <UserMinus className={iconSizes[size]} />
        ) : (
          <UserPlus className={iconSizes[size]} />
        )
      ) : null}
      {isFollowing ? 'Following' : 'Follow'}
    </button>
  )
}
