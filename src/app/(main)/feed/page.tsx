'use client'

import { useState, useEffect } from 'react'
import { useRouter } from 'next/navigation'
import Link from 'next/link'
import {
  ArrowLeft,
  Loader2,
  MapPin,
  Calendar,
  Users,
  Heart,
  MessageCircle,
  Share2,
  Compass,
} from 'lucide-react'
import { supabase } from '@/lib/supabase'
import { followService } from '@/features/social/services/followService'
import { formatDistanceToNow } from 'date-fns'
import { LikeButton } from '@/features/social'
import { useLocalizedTrip } from '@/hooks/useLocalizedTrip'

interface FeedItem {
  id: string
  type: 'trip_created' | 'trip_shared' | 'trip_liked'
  user: {
    id: string
    username: string | null
    first_name: string | null
    photo_url: string | null
  }
  trip?: {
    id: string
    title: string
    destinations: string[]
    cover_image_url: string | null
    duration: number
  }
  created_at: string
}

export default function FeedPage() {
  const router = useRouter()
  const t = useLocalizedTrip()
  const [feedItems, setFeedItems] = useState<FeedItem[]>([])
  const [loading, setLoading] = useState(true)
  const [userId, setUserId] = useState<string | null>(null)

  useEffect(() => {
    const init = async () => {
      const { data: { user } } = await supabase.auth.getUser()
      if (user) {
        setUserId(user.id)
        loadFeed(user.id)
      } else {
        setLoading(false)
      }
    }
    init()
  }, [])

  const loadFeed = async (uid: string) => {
    setLoading(true)

    // Get users being followed
    const followingIds = await followService.getFollowingIds(uid)

    if (followingIds.length === 0) {
      // Show discover content if not following anyone
      await loadDiscoverContent()
    } else {
      // Get recent public trips from followed users
      const { data: trips } = await supabase
        .from('itineraries')
        .select(`
          id, title, destinations, cover_image_url, start_date, end_date, created_at,
          user:profiles!itineraries_user_id_fkey(id, username, first_name, photo_url)
        `)
        .in('user_id', followingIds)
        .eq('is_public', true)
        .order('created_at', { ascending: false })
        .limit(20)

      const items: FeedItem[] = (trips || []).map((trip: any) => {
        const startDate = new Date(trip.start_date)
        const endDate = new Date(trip.end_date)
        const duration = Math.ceil((endDate.getTime() - startDate.getTime()) / (1000 * 60 * 60 * 24)) + 1

        return {
          id: trip.id,
          type: 'trip_created' as const,
          user: Array.isArray(trip.user) ? trip.user[0] : trip.user,
          trip: {
            id: trip.id,
            title: trip.title,
            destinations: trip.destinations,
            cover_image_url: trip.cover_image_url,
            duration,
          },
          created_at: trip.created_at,
        }
      })

      setFeedItems(items)
    }

    setLoading(false)
  }

  const loadDiscoverContent = async () => {
    // Show popular public trips
    const { data: trips } = await supabase
      .from('itineraries')
      .select(`
        id, title, destinations, cover_image_url, start_date, end_date, created_at, views_count,
        user:profiles!itineraries_user_id_fkey(id, username, first_name, photo_url)
      `)
      .eq('is_public', true)
      .order('views_count', { ascending: false })
      .limit(20)

    const items: FeedItem[] = (trips || []).map((trip: any) => {
      const startDate = new Date(trip.start_date)
      const endDate = new Date(trip.end_date)
      const duration = Math.ceil((endDate.getTime() - startDate.getTime()) / (1000 * 60 * 60 * 24)) + 1

      return {
        id: trip.id,
        type: 'trip_created' as const,
        user: Array.isArray(trip.user) ? trip.user[0] : trip.user,
        trip: {
          id: trip.id,
          title: trip.title,
          destinations: trip.destinations,
          cover_image_url: trip.cover_image_url,
          duration,
        },
        created_at: trip.created_at,
      }
    })

    setFeedItems(items)
  }

  if (!userId && !loading) {
    return (
      <div className="min-h-screen bg-gray-50 dark:bg-gray-950 flex items-center justify-center">
        <div className="text-center px-4">
          <Compass className="w-16 h-16 text-gray-300 mx-auto mb-4" />
          <h2 className="text-xl font-bold text-gray-900 dark:text-white mb-2">
            Sign in to see your feed
          </h2>
          <p className="text-gray-500 dark:text-gray-400 mb-6">
            Follow travelers and see their trips in your feed
          </p>
          <Link
            href="/login"
            className="inline-flex px-6 py-3 bg-teal-600 text-white font-semibold rounded-xl hover:bg-teal-700"
          >
            Sign In
          </Link>
        </div>
      </div>
    )
  }

  return (
    <div className="min-h-screen bg-gray-50 dark:bg-gray-950">
      {/* Header */}
      <div className="sticky top-0 z-40 bg-white dark:bg-gray-900 border-b border-gray-200 dark:border-gray-800">
        <div className="max-w-2xl mx-auto px-4 py-4">
          <div className="flex items-center gap-3">
            <button
              onClick={() => router.back()}
              className="p-2 text-gray-500 hover:text-gray-700 dark:hover:text-gray-300 -ml-2"
            >
              <ArrowLeft className="w-5 h-5" />
            </button>
            <h1 className="text-xl font-bold text-gray-900 dark:text-white">
              Activity Feed
            </h1>
          </div>
        </div>
      </div>

      {/* Content */}
      <div className="max-w-2xl mx-auto px-4 py-6">
        {loading ? (
          <div className="flex justify-center py-12">
            <Loader2 className="w-8 h-8 text-teal-600 animate-spin" />
          </div>
        ) : feedItems.length === 0 ? (
          <div className="text-center py-12">
            <Users className="w-16 h-16 text-gray-300 mx-auto mb-4" />
            <h3 className="text-lg font-semibold text-gray-900 dark:text-white mb-2">
              Your feed is empty
            </h3>
            <p className="text-gray-500 dark:text-gray-400 mb-6">
              Follow travelers to see their trips here
            </p>
            <Link
              href="/community"
              className="text-teal-600 dark:text-teal-400 font-medium hover:underline"
            >
              Discover travelers to follow
            </Link>
          </div>
        ) : (
          <div className="space-y-4">
            {feedItems.map((item) => (
              <FeedCard key={item.id} item={item} t={t} />
            ))}
          </div>
        )}
      </div>
    </div>
  )
}

function FeedCard({ item, t }: { item: FeedItem; t: ReturnType<typeof useLocalizedTrip> }) {
  if (!item.trip) return null

  return (
    <div className="bg-white dark:bg-gray-900 rounded-xl border border-gray-200 dark:border-gray-800 overflow-hidden">
      {/* User info */}
      <div className="px-4 py-3 flex items-center gap-3">
        <Link href={`/profile/${item.user.username || item.user.id}`}>
          {item.user.photo_url ? (
            <img
              src={item.user.photo_url}
              alt=""
              className="w-10 h-10 rounded-full object-cover"
            />
          ) : (
            <div className="w-10 h-10 rounded-full bg-gradient-to-br from-teal-400 to-blue-500 flex items-center justify-center text-white font-bold">
              {(item.user.first_name?.[0] || item.user.username?.[0] || 'U').toUpperCase()}
            </div>
          )}
        </Link>
        <div className="flex-1 min-w-0">
          <Link
            href={`/profile/${item.user.username || item.user.id}`}
            className="font-medium text-gray-900 dark:text-white hover:underline"
          >
            {item.user.first_name || item.user.username || 'Traveler'}
          </Link>
          <p className="text-xs text-gray-500 dark:text-gray-400">
            shared a {t.trip} • {formatDistanceToNow(new Date(item.created_at), { addSuffix: true })}
          </p>
        </div>
      </div>

      {/* Trip card */}
      <Link href={`/trip/${item.trip.id}`}>
        <div className="relative aspect-video bg-gradient-to-br from-teal-400 to-blue-500">
          {item.trip.cover_image_url && (
            <img
              src={item.trip.cover_image_url}
              alt={item.trip.title}
              className="w-full h-full object-cover"
            />
          )}
          <div className="absolute inset-0 bg-gradient-to-t from-black/60 via-transparent to-transparent" />
          <div className="absolute bottom-4 left-4 right-4">
            <h3 className="text-lg font-bold text-white mb-1">{item.trip.title}</h3>
            <div className="flex items-center gap-3 text-white/80 text-sm">
              <span className="flex items-center gap-1">
                <MapPin className="w-4 h-4" />
                {item.trip.destinations[0] || 'Philippines'}
              </span>
              <span className="flex items-center gap-1">
                <Calendar className="w-4 h-4" />
                {item.trip.duration} days
              </span>
            </div>
          </div>
        </div>
      </Link>

      {/* Actions */}
      <div className="px-4 py-3 flex items-center gap-4 border-t border-gray-100 dark:border-gray-800">
        <LikeButton itineraryId={item.trip.id} size="sm" showCount />
        <Link
          href={`/trip/${item.trip.id}#comments`}
          className="flex items-center gap-1.5 text-gray-500 dark:text-gray-400 hover:text-teal-600 dark:hover:text-teal-400"
        >
          <MessageCircle className="w-5 h-5" />
          <span className="text-sm">Comment</span>
        </Link>
        <button className="flex items-center gap-1.5 text-gray-500 dark:text-gray-400 hover:text-teal-600 dark:hover:text-teal-400 ml-auto">
          <Share2 className="w-5 h-5" />
          <span className="text-sm">Share</span>
        </button>
      </div>
    </div>
  )
}
