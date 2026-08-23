'use client'

import { useState, useEffect } from 'react'
import { Heart, Loader2 } from 'lucide-react'
import { socialService } from '../services/socialService'
import { supabase, getUserSafe } from '@/lib/supabase'
import { motion, AnimatePresence } from 'framer-motion'

interface LikeButtonProps {
  itineraryId: string
  className?: string
  showCount?: boolean
  size?: 'sm' | 'md' | 'lg'
}

export default function LikeButton({
  itineraryId,
  className = '',
  showCount = true,
  size = 'md',
}: LikeButtonProps) {
  const [liked, setLiked] = useState(false)
  const [count, setCount] = useState(0)
  const [loading, setLoading] = useState(true)
  const [animating, setAnimating] = useState(false)
  const [user, setUser] = useState<any>(null)

  const sizeClasses = {
    sm: 'w-4 h-4',
    md: 'w-5 h-5',
    lg: 'w-6 h-6',
  }

  useEffect(() => {
    getUserSafe().then(setUser)

    loadLikes()
  }, [itineraryId])

  const loadLikes = async () => {
    setLoading(true)
    const data = await socialService.getLikes(itineraryId)
    setCount(data.count)
    setLiked(data.userLiked)
    setLoading(false)
  }

  const handleClick = async () => {
    if (!user) {
      window.location.href = `/login?redirect=/trip/${itineraryId}`
      return
    }

    // Optimistic update
    setLiked(!liked)
    setCount((prev) => (liked ? prev - 1 : prev + 1))
    setAnimating(true)

    const result = await socialService.toggleLike(itineraryId, user.id)
    setLiked(result.liked)
    setCount(result.count)

    setTimeout(() => setAnimating(false), 300)
  }

  if (loading) {
    return (
      <button disabled className={`flex items-center gap-2 ${className}`}>
        <Loader2 className={`${sizeClasses[size]} animate-spin text-gray-400`} />
        {showCount && <span className="text-gray-400">-</span>}
      </button>
    )
  }

  return (
    <button
      onClick={handleClick}
      className={`flex items-center gap-2 group transition-colors ${className}`}
    >
      <motion.div
        animate={animating ? { scale: [1, 1.2, 1] } : {}}
        transition={{ duration: 0.3 }}
      >
        <Heart
          className={`${sizeClasses[size]} transition-all ${
            liked
              ? 'fill-red-500 text-red-500'
              : 'text-gray-500 dark:text-gray-400 group-hover:text-red-500'
          }`}
        />
      </motion.div>
      {showCount && (
        <span
          className={`text-sm font-medium ${
            liked ? 'text-red-500' : 'text-gray-600 dark:text-gray-400'
          }`}
        >
          {count}
        </span>
      )}

      {/* Heart burst animation */}
      <AnimatePresence>
        {animating && liked && (
          <motion.div
            initial={{ scale: 0, opacity: 1 }}
            animate={{ scale: 2, opacity: 0 }}
            exit={{ opacity: 0 }}
            transition={{ duration: 0.4 }}
            className="absolute"
          >
            <Heart className={`${sizeClasses[size]} fill-red-500 text-red-500`} />
          </motion.div>
        )}
      </AnimatePresence>
    </button>
  )
}
