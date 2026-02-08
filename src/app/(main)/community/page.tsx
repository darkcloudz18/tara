'use client'

import { useState, useEffect } from 'react'
import { Search, Filter, MapPin, Calendar, Users, Eye, Copy, Loader2 } from 'lucide-react'
import Link from 'next/link'
import { supabase } from '@/lib/supabase'

interface PublicTrip {
  id: string
  title: string
  description?: string
  destinations: string[]
  start_date: string
  end_date: string
  total_budget?: number
  cover_image_url?: string
  views_count: number
  copies_count: number
  likes_count: number
  owner: {
    username?: string
    first_name?: string
    photo_url?: string
  }
}

export default function CommunityPage() {
  const [trips, setTrips] = useState<PublicTrip[]>([])
  const [loading, setLoading] = useState(true)
  const [search, setSearch] = useState('')
  const [destination, setDestination] = useState('')
  const [sortBy, setSortBy] = useState<'popular' | 'recent' | 'copies'>('popular')

  useEffect(() => {
    loadTrips()
  }, [sortBy])

  const loadTrips = async () => {
    setLoading(true)

    let query = supabase
      .from('itineraries')
      .select(`
        id, title, description, destinations, start_date, end_date,
        total_budget, cover_image_url, views_count, copies_count, likes_count,
        owner:profiles!itineraries_user_id_fkey(username, first_name, photo_url)
      `)
      .eq('is_public', true)

    // Apply sorting
    switch (sortBy) {
      case 'popular':
        query = query.order('views_count', { ascending: false })
        break
      case 'recent':
        query = query.order('created_at', { ascending: false })
        break
      case 'copies':
        query = query.order('copies_count', { ascending: false })
        break
    }

    query = query.limit(24)

    const { data, error } = await query

    if (error) {
      console.error('Error loading trips:', error)
    } else {
      // Transform data to handle owner as single object
      const trips = (data || []).map((trip: any) => ({
        ...trip,
        owner: Array.isArray(trip.owner) ? trip.owner[0] : trip.owner,
      }))
      setTrips(trips)
    }

    setLoading(false)
  }

  const filteredTrips = trips.filter((trip) => {
    const matchesSearch = !search ||
      trip.title.toLowerCase().includes(search.toLowerCase()) ||
      trip.description?.toLowerCase().includes(search.toLowerCase())

    const matchesDestination = !destination ||
      trip.destinations.some((d) => d.toLowerCase().includes(destination.toLowerCase()))

    return matchesSearch && matchesDestination
  })

  const getDuration = (start: string, end: string) => {
    const days = Math.ceil(
      (new Date(end).getTime() - new Date(start).getTime()) / (1000 * 60 * 60 * 24)
    ) + 1
    return `${days} day${days > 1 ? 's' : ''}`
  }

  return (
    <div className="min-h-screen bg-gray-50 dark:bg-black">
      {/* Header */}
      <div className="bg-gradient-to-br from-teal-500 to-blue-600 text-white py-12">
        <div className="max-w-6xl mx-auto px-4">
          <h1 className="text-3xl md:text-4xl font-bold mb-2">Community Trips</h1>
          <p className="text-teal-100">
            Discover trips shared by the Tara community. Find inspiration and copy any trip to customize it for yourself.
          </p>
        </div>
      </div>

      {/* Filters */}
      <div className="bg-white dark:bg-gray-900 border-b border-gray-200 dark:border-gray-800 sticky top-0 z-10">
        <div className="max-w-6xl mx-auto px-4 py-4">
          <div className="flex flex-col md:flex-row gap-4">
            {/* Search */}
            <div className="relative flex-1">
              <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-5 h-5 text-gray-400" />
              <input
                type="text"
                value={search}
                onChange={(e) => setSearch(e.target.value)}
                placeholder="Search trips..."
                className="w-full pl-10 pr-4 py-2 border border-gray-300 dark:border-gray-600 rounded-lg bg-white dark:bg-gray-800 text-gray-900 dark:text-white"
              />
            </div>

            {/* Destination filter */}
            <div className="relative">
              <MapPin className="absolute left-3 top-1/2 -translate-y-1/2 w-5 h-5 text-gray-400" />
              <input
                type="text"
                value={destination}
                onChange={(e) => setDestination(e.target.value)}
                placeholder="Destination..."
                className="w-full md:w-48 pl-10 pr-4 py-2 border border-gray-300 dark:border-gray-600 rounded-lg bg-white dark:bg-gray-800 text-gray-900 dark:text-white"
              />
            </div>

            {/* Sort */}
            <select
              value={sortBy}
              onChange={(e) => setSortBy(e.target.value as any)}
              className="px-4 py-2 border border-gray-300 dark:border-gray-600 rounded-lg bg-white dark:bg-gray-800 text-gray-900 dark:text-white"
            >
              <option value="popular">Most Viewed</option>
              <option value="recent">Most Recent</option>
              <option value="copies">Most Copied</option>
            </select>
          </div>
        </div>
      </div>

      {/* Trips Grid */}
      <div className="max-w-6xl mx-auto px-4 py-8">
        {loading ? (
          <div className="flex justify-center py-12">
            <Loader2 className="w-8 h-8 text-teal-500 animate-spin" />
          </div>
        ) : filteredTrips.length === 0 ? (
          <div className="text-center py-12">
            <p className="text-gray-500 dark:text-gray-400">No trips found matching your criteria.</p>
          </div>
        ) : (
          <div className="grid md:grid-cols-2 lg:grid-cols-3 gap-6">
            {filteredTrips.map((trip) => (
              <Link
                key={trip.id}
                href={`/trip/${trip.id}`}
                className="bg-white dark:bg-gray-800 rounded-xl border border-gray-200 dark:border-gray-700 overflow-hidden hover:shadow-lg transition-shadow"
              >
                {/* Cover Image */}
                <div className="aspect-video bg-gradient-to-br from-teal-400 to-blue-500 relative">
                  {trip.cover_image_url && (
                    <img
                      src={trip.cover_image_url}
                      alt={trip.title}
                      className="w-full h-full object-cover"
                    />
                  )}
                  <div className="absolute inset-0 bg-gradient-to-t from-black/50 to-transparent" />
                  <div className="absolute bottom-3 left-3 right-3">
                    <div className="flex items-center gap-2 text-white/90 text-sm">
                      <MapPin className="w-4 h-4" />
                      {trip.destinations[0] || 'Philippines'}
                    </div>
                  </div>
                </div>

                {/* Content */}
                <div className="p-4">
                  <h3 className="font-semibold text-gray-900 dark:text-white mb-1 line-clamp-1">
                    {trip.title}
                  </h3>

                  <div className="flex items-center gap-3 text-sm text-gray-500 dark:text-gray-400 mb-3">
                    <span className="flex items-center gap-1">
                      <Calendar className="w-4 h-4" />
                      {getDuration(trip.start_date, trip.end_date)}
                    </span>
                    {trip.total_budget && (
                      <span>₱{trip.total_budget.toLocaleString()}</span>
                    )}
                  </div>

                  {/* Stats */}
                  <div className="flex items-center justify-between pt-3 border-t border-gray-100 dark:border-gray-700">
                    <div className="flex items-center gap-2">
                      {trip.owner?.photo_url ? (
                        <img
                          src={trip.owner.photo_url}
                          alt=""
                          className="w-6 h-6 rounded-full"
                        />
                      ) : (
                        <div className="w-6 h-6 rounded-full bg-teal-500 flex items-center justify-center text-white text-xs">
                          {(trip.owner?.first_name?.[0] || trip.owner?.username?.[0] || 'T').toUpperCase()}
                        </div>
                      )}
                      <span className="text-sm text-gray-600 dark:text-gray-400">
                        {trip.owner?.first_name || trip.owner?.username || 'Traveler'}
                      </span>
                    </div>

                    <div className="flex items-center gap-3 text-xs text-gray-400">
                      <span className="flex items-center gap-1">
                        <Eye className="w-3 h-3" />
                        {trip.views_count || 0}
                      </span>
                      <span className="flex items-center gap-1">
                        <Copy className="w-3 h-3" />
                        {trip.copies_count || 0}
                      </span>
                    </div>
                  </div>
                </div>
              </Link>
            ))}
          </div>
        )}
      </div>
    </div>
  )
}
