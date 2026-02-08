'use client'

export const dynamic = 'force-dynamic'

import { useEffect, useState } from 'react'
import { useRouter } from 'next/navigation'
import Link from 'next/link'
import { supabase } from '@/lib/supabase'
import { Profile, Creator, Supplier } from '@/types/database'
import {
  MapPin,
  Plus,
  Calendar,
  Users,
  TrendingUp,
  Star,
  ChevronRight,
  Plane,
  Hotel,
  Compass,
  Clock,
  Heart,
  Settings,
  Bell,
  Sparkles,
  Camera,
  Loader2,
  CheckCircle,
  AlertCircle,
} from 'lucide-react'

interface Trip {
  id: string
  title: string
  destination: string
  start_date: string | null
  end_date: string | null
  cover_image: string | null
  is_public: boolean
  created_at: string
}

interface DashboardData {
  profile: Profile | null
  creator: Creator | null
  supplier: Supplier | null
  recentTrips: Trip[]
  upcomingTrips: Trip[]
  stats: {
    totalTrips: number
    publicTrips: number
    totalLikes: number
    followers: number
  }
}

export default function DashboardPage() {
  const router = useRouter()
  const [data, setData] = useState<DashboardData>({
    profile: null,
    creator: null,
    supplier: null,
    recentTrips: [],
    upcomingTrips: [],
    stats: { totalTrips: 0, publicTrips: 0, totalLikes: 0, followers: 0 }
  })
  const [loading, setLoading] = useState(true)

  useEffect(() => {
    loadDashboard()
  }, [])

  const loadDashboard = async () => {
    try {
      const { data: { user } } = await supabase.auth.getUser()

      if (!user) {
        router.push('/login')
        return
      }

      // Fetch all data in parallel
      const [
        profileResult,
        creatorResult,
        supplierResult,
        tripsResult,
        statsResult,
      ] = await Promise.all([
        supabase.from('profiles').select('*').eq('id', user.id).single(),
        supabase.from('creators').select('*').eq('id', user.id).single(),
        supabase.from('suppliers').select('*').eq('id', user.id).single(),
        supabase.from('itineraries').select('*').eq('user_id', user.id).order('created_at', { ascending: false }).limit(6),
        supabase.from('itineraries').select('id, is_public', { count: 'exact' }).eq('user_id', user.id),
      ])

      const profile = profileResult.data
      const trips = tripsResult.data || []
      const now = new Date().toISOString()

      // Separate upcoming and recent trips
      const upcomingTrips = trips.filter(t => t.start_date && t.start_date > now).slice(0, 3)
      const recentTrips = trips.filter(t => !t.start_date || t.start_date <= now).slice(0, 3)

      // Calculate stats
      const totalTrips = statsResult.count || 0
      const publicTrips = (statsResult.data || []).filter(t => t.is_public).length

      setData({
        profile,
        creator: creatorResult.data,
        supplier: supplierResult.data,
        recentTrips,
        upcomingTrips,
        stats: {
          totalTrips,
          publicTrips,
          totalLikes: 0,
          followers: profile?.followers_count || 0,
        }
      })
    } catch (error) {
      console.error('Error loading dashboard:', error)
    } finally {
      setLoading(false)
    }
  }

  const getProfileCompletion = () => {
    if (!data.profile) return 0
    const fields = ['first_name', 'last_name', 'bio', 'photo_url', 'location']
    const filled = fields.filter(f => data.profile?.[f as keyof Profile]).length
    return Math.round((filled / fields.length) * 100)
  }

  const profileCompletion = getProfileCompletion()

  if (loading) {
    return (
      <div className="min-h-screen bg-gray-50 dark:bg-gray-950 flex items-center justify-center">
        <Loader2 className="w-8 h-8 text-teal-600 animate-spin" />
      </div>
    )
  }

  const { profile, creator, supplier, recentTrips, upcomingTrips, stats } = data

  return (
    <div className="min-h-screen bg-gray-50 dark:bg-gray-950 pb-20 lg:pb-8">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-6">
        {/* Header */}
        <div className="flex items-start justify-between mb-8">
          <div>
            <h1 className="text-2xl lg:text-3xl font-bold text-gray-900 dark:text-white">
              Welcome back, {profile?.first_name || 'Traveler'}!
            </h1>
            <p className="text-gray-500 dark:text-gray-400 mt-1">
              Ready for your next adventure?
            </p>
          </div>
          <div className="flex items-center gap-3">
            <Link
              href="/notifications"
              className="p-2 bg-white dark:bg-gray-800 rounded-xl shadow-sm hover:shadow-md transition-shadow relative"
            >
              <Bell className="w-5 h-5 text-gray-600 dark:text-gray-400" />
            </Link>
            <Link
              href="/profile"
              className="p-2 bg-white dark:bg-gray-800 rounded-xl shadow-sm hover:shadow-md transition-shadow"
            >
              <Settings className="w-5 h-5 text-gray-600 dark:text-gray-400" />
            </Link>
          </div>
        </div>

        {/* Profile Completion Card */}
        {profileCompletion < 100 && (
          <div className="mb-6 p-4 bg-gradient-to-r from-teal-500 to-blue-500 rounded-2xl text-white">
            <div className="flex items-center justify-between">
              <div className="flex items-center gap-4">
                <div className="w-12 h-12 bg-white/20 rounded-xl flex items-center justify-center">
                  <AlertCircle className="w-6 h-6" />
                </div>
                <div>
                  <p className="font-semibold">Complete your profile</p>
                  <p className="text-sm text-white/80">Add more details to personalize your experience</p>
                </div>
              </div>
              <div className="flex items-center gap-4">
                <div className="text-right">
                  <p className="text-2xl font-bold">{profileCompletion}%</p>
                  <p className="text-xs text-white/80">Complete</p>
                </div>
                <Link
                  href="/profile"
                  className="px-4 py-2 bg-white text-teal-600 font-medium rounded-xl hover:bg-white/90 transition-colors"
                >
                  Complete
                </Link>
              </div>
            </div>
          </div>
        )}

        {/* Stats Grid */}
        <div className="grid grid-cols-2 lg:grid-cols-4 gap-4 mb-8">
          <div className="bg-white dark:bg-gray-900 rounded-2xl p-5 shadow-sm">
            <div className="flex items-center justify-between mb-3">
              <div className="w-10 h-10 bg-teal-100 dark:bg-teal-900/30 rounded-xl flex items-center justify-center">
                <Plane className="w-5 h-5 text-teal-600" />
              </div>
              <span className="text-xs text-green-600 bg-green-100 dark:bg-green-900/30 px-2 py-1 rounded-full">
                +2 this month
              </span>
            </div>
            <p className="text-2xl font-bold text-gray-900 dark:text-white">{stats.totalTrips}</p>
            <p className="text-sm text-gray-500 dark:text-gray-400">Total Trips</p>
          </div>

          <div className="bg-white dark:bg-gray-900 rounded-2xl p-5 shadow-sm">
            <div className="flex items-center justify-between mb-3">
              <div className="w-10 h-10 bg-purple-100 dark:bg-purple-900/30 rounded-xl flex items-center justify-center">
                <Compass className="w-5 h-5 text-purple-600" />
              </div>
            </div>
            <p className="text-2xl font-bold text-gray-900 dark:text-white">{stats.publicTrips}</p>
            <p className="text-sm text-gray-500 dark:text-gray-400">Public Trips</p>
          </div>

          <div className="bg-white dark:bg-gray-900 rounded-2xl p-5 shadow-sm">
            <div className="flex items-center justify-between mb-3">
              <div className="w-10 h-10 bg-red-100 dark:bg-red-900/30 rounded-xl flex items-center justify-center">
                <Heart className="w-5 h-5 text-red-500" />
              </div>
            </div>
            <p className="text-2xl font-bold text-gray-900 dark:text-white">{stats.totalLikes}</p>
            <p className="text-sm text-gray-500 dark:text-gray-400">Total Likes</p>
          </div>

          <div className="bg-white dark:bg-gray-900 rounded-2xl p-5 shadow-sm">
            <div className="flex items-center justify-between mb-3">
              <div className="w-10 h-10 bg-blue-100 dark:bg-blue-900/30 rounded-xl flex items-center justify-center">
                <Users className="w-5 h-5 text-blue-600" />
              </div>
            </div>
            <p className="text-2xl font-bold text-gray-900 dark:text-white">{stats.followers}</p>
            <p className="text-sm text-gray-500 dark:text-gray-400">Followers</p>
          </div>
        </div>

        {/* Quick Actions */}
        <div className="mb-8">
          <h2 className="text-lg font-semibold text-gray-900 dark:text-white mb-4">Quick Actions</h2>
          <div className="grid grid-cols-2 lg:grid-cols-4 gap-4">
            <Link
              href="/trip/new"
              className="group bg-gradient-to-br from-teal-500 to-teal-600 rounded-2xl p-5 text-white hover:shadow-lg transition-all"
            >
              <div className="w-12 h-12 bg-white/20 rounded-xl flex items-center justify-center mb-3 group-hover:scale-110 transition-transform">
                <Plus className="w-6 h-6" />
              </div>
              <p className="font-semibold">Plan a Trip</p>
              <p className="text-sm text-white/80">Create new itinerary</p>
            </Link>

            <Link
              href="/search"
              className="group bg-white dark:bg-gray-900 rounded-2xl p-5 shadow-sm hover:shadow-md transition-all"
            >
              <div className="w-12 h-12 bg-purple-100 dark:bg-purple-900/30 rounded-xl flex items-center justify-center mb-3 group-hover:scale-110 transition-transform">
                <Compass className="w-6 h-6 text-purple-600" />
              </div>
              <p className="font-semibold text-gray-900 dark:text-white">Explore</p>
              <p className="text-sm text-gray-500 dark:text-gray-400">Discover places</p>
            </Link>

            <Link
              href="/templates"
              className="group bg-white dark:bg-gray-900 rounded-2xl p-5 shadow-sm hover:shadow-md transition-all"
            >
              <div className="w-12 h-12 bg-orange-100 dark:bg-orange-900/30 rounded-xl flex items-center justify-center mb-3 group-hover:scale-110 transition-transform">
                <Sparkles className="w-6 h-6 text-orange-600" />
              </div>
              <p className="font-semibold text-gray-900 dark:text-white">Templates</p>
              <p className="text-sm text-gray-500 dark:text-gray-400">Quick start trips</p>
            </Link>

            <Link
              href="/ai-planner"
              className="group bg-white dark:bg-gray-900 rounded-2xl p-5 shadow-sm hover:shadow-md transition-all"
            >
              <div className="w-12 h-12 bg-blue-100 dark:bg-blue-900/30 rounded-xl flex items-center justify-center mb-3 group-hover:scale-110 transition-transform">
                <Sparkles className="w-6 h-6 text-blue-600" />
              </div>
              <p className="font-semibold text-gray-900 dark:text-white">AI Planner</p>
              <p className="text-sm text-gray-500 dark:text-gray-400">Smart suggestions</p>
            </Link>
          </div>
        </div>

        <div className="grid lg:grid-cols-2 gap-6">
          {/* Upcoming Trips */}
          <div className="bg-white dark:bg-gray-900 rounded-2xl shadow-sm overflow-hidden">
            <div className="px-5 py-4 border-b border-gray-100 dark:border-gray-800 flex items-center justify-between">
              <h2 className="font-semibold text-gray-900 dark:text-white flex items-center gap-2">
                <Calendar className="w-5 h-5 text-teal-600" />
                Upcoming Trips
              </h2>
            </div>
            <div className="p-5">
              {upcomingTrips.length > 0 ? (
                <div className="space-y-4">
                  {upcomingTrips.map((trip) => (
                    <Link
                      key={trip.id}
                      href={`/trip/${trip.id}/edit`}
                      className="flex items-center gap-4 p-3 rounded-xl hover:bg-gray-50 dark:hover:bg-gray-800 transition-colors"
                    >
                      <div className="w-14 h-14 rounded-xl bg-gradient-to-br from-teal-400 to-blue-500 flex items-center justify-center flex-shrink-0 overflow-hidden">
                        {trip.cover_image ? (
                          <img src={trip.cover_image} alt="" className="w-full h-full object-cover" />
                        ) : (
                          <MapPin className="w-6 h-6 text-white" />
                        )}
                      </div>
                      <div className="flex-1 min-w-0">
                        <p className="font-medium text-gray-900 dark:text-white truncate">
                          {trip.title || 'Untitled Trip'}
                        </p>
                        <p className="text-sm text-gray-500 dark:text-gray-400 flex items-center gap-1">
                          <MapPin className="w-3 h-3" />
                          {trip.destination || 'No destination'}
                        </p>
                        {trip.start_date && (
                          <p className="text-xs text-teal-600 mt-1">
                            {new Date(trip.start_date).toLocaleDateString('en-US', { month: 'short', day: 'numeric' })}
                            {trip.end_date && ` - ${new Date(trip.end_date).toLocaleDateString('en-US', { month: 'short', day: 'numeric' })}`}
                          </p>
                        )}
                      </div>
                      <ChevronRight className="w-5 h-5 text-gray-400" />
                    </Link>
                  ))}
                </div>
              ) : (
                <div className="text-center py-8">
                  <div className="w-16 h-16 bg-gray-100 dark:bg-gray-800 rounded-full flex items-center justify-center mx-auto mb-4">
                    <Calendar className="w-8 h-8 text-gray-400" />
                  </div>
                  <p className="text-gray-500 dark:text-gray-400 mb-4">No upcoming trips</p>
                  <Link
                    href="/trip/new"
                    className="inline-flex items-center gap-2 px-4 py-2 bg-teal-600 text-white rounded-xl hover:bg-teal-700 transition-colors"
                  >
                    <Plus className="w-4 h-4" />
                    Plan a Trip
                  </Link>
                </div>
              )}
            </div>
          </div>

          {/* Recent Trips */}
          <div className="bg-white dark:bg-gray-900 rounded-2xl shadow-sm overflow-hidden">
            <div className="px-5 py-4 border-b border-gray-100 dark:border-gray-800 flex items-center justify-between">
              <h2 className="font-semibold text-gray-900 dark:text-white flex items-center gap-2">
                <Clock className="w-5 h-5 text-purple-600" />
                Recent Trips
              </h2>
            </div>
            <div className="p-5">
              {recentTrips.length > 0 ? (
                <div className="space-y-4">
                  {recentTrips.map((trip) => (
                    <Link
                      key={trip.id}
                      href={`/trip/${trip.id}/edit`}
                      className="flex items-center gap-4 p-3 rounded-xl hover:bg-gray-50 dark:hover:bg-gray-800 transition-colors"
                    >
                      <div className="w-14 h-14 rounded-xl bg-gradient-to-br from-purple-400 to-pink-500 flex items-center justify-center flex-shrink-0 overflow-hidden">
                        {trip.cover_image ? (
                          <img src={trip.cover_image} alt="" className="w-full h-full object-cover" />
                        ) : (
                          <MapPin className="w-6 h-6 text-white" />
                        )}
                      </div>
                      <div className="flex-1 min-w-0">
                        <p className="font-medium text-gray-900 dark:text-white truncate">
                          {trip.title || 'Untitled Trip'}
                        </p>
                        <p className="text-sm text-gray-500 dark:text-gray-400 flex items-center gap-1">
                          <MapPin className="w-3 h-3" />
                          {trip.destination || 'No destination'}
                        </p>
                        <p className="text-xs text-gray-400 mt-1">
                          Created {new Date(trip.created_at).toLocaleDateString()}
                        </p>
                      </div>
                      <ChevronRight className="w-5 h-5 text-gray-400" />
                    </Link>
                  ))}
                </div>
              ) : (
                <div className="text-center py-8">
                  <div className="w-16 h-16 bg-gray-100 dark:bg-gray-800 rounded-full flex items-center justify-center mx-auto mb-4">
                    <Plane className="w-8 h-8 text-gray-400" />
                  </div>
                  <p className="text-gray-500 dark:text-gray-400 mb-4">No trips yet</p>
                  <Link
                    href="/trip/new"
                    className="inline-flex items-center gap-2 px-4 py-2 bg-teal-600 text-white rounded-xl hover:bg-teal-700 transition-colors"
                  >
                    <Plus className="w-4 h-4" />
                    Create Your First Trip
                  </Link>
                </div>
              )}
            </div>
          </div>
        </div>

        {/* Creator/Supplier Sections - Coming Soon */}
        {(creator || supplier) && (
          <div className="mt-6 grid lg:grid-cols-2 gap-6">
            {creator && (
              <div className="bg-gradient-to-br from-purple-500 to-pink-500 rounded-2xl p-6 text-white">
                <div className="flex items-center gap-3 mb-4">
                  <div className="w-12 h-12 bg-white/20 rounded-xl flex items-center justify-center">
                    <Camera className="w-6 h-6" />
                  </div>
                  <div>
                    <h3 className="font-semibold text-lg">Creator Dashboard</h3>
                    <p className="text-sm text-white/80">
                      {creator.verified ? 'Verified Creator' : 'Pending Verification'}
                    </p>
                  </div>
                </div>
                <div className="grid grid-cols-3 gap-4 mb-4">
                  <div>
                    <p className="text-2xl font-bold">{creator.total_followers}</p>
                    <p className="text-xs text-white/70">Followers</p>
                  </div>
                  <div>
                    <p className="text-2xl font-bold">{creator.total_posts}</p>
                    <p className="text-xs text-white/70">Posts</p>
                  </div>
                  <div>
                    <p className="text-2xl font-bold">₱{creator.total_earnings.toLocaleString()}</p>
                    <p className="text-xs text-white/70">Earnings</p>
                  </div>
                </div>
                <div className="w-full py-2 bg-white/20 rounded-xl text-center font-medium opacity-70">
                  Creator Hub Coming Soon
                </div>
              </div>
            )}

            {supplier && (
              <div className="bg-gradient-to-br from-green-500 to-teal-500 rounded-2xl p-6 text-white">
                <div className="flex items-center gap-3 mb-4">
                  <div className="w-12 h-12 bg-white/20 rounded-xl flex items-center justify-center">
                    <Hotel className="w-6 h-6" />
                  </div>
                  <div>
                    <h3 className="font-semibold text-lg">{supplier.business_name}</h3>
                    <p className="text-sm text-white/80 capitalize">
                      {supplier.business_type} • {supplier.verified ? 'Verified' : 'Pending'}
                    </p>
                  </div>
                </div>
                <div className="grid grid-cols-3 gap-4 mb-4">
                  <div>
                    <p className="text-2xl font-bold">{supplier.total_bookings}</p>
                    <p className="text-xs text-white/70">Bookings</p>
                  </div>
                  <div>
                    <p className="text-2xl font-bold">{supplier.average_rating.toFixed(1)}</p>
                    <p className="text-xs text-white/70">Rating</p>
                  </div>
                  <div>
                    <p className="text-2xl font-bold">₱{supplier.total_revenue.toLocaleString()}</p>
                    <p className="text-xs text-white/70">Revenue</p>
                  </div>
                </div>
                <div className="w-full py-2 bg-white/20 rounded-xl text-center font-medium opacity-70">
                  Supplier Portal Coming Soon
                </div>
              </div>
            )}
          </div>
        )}

        {/* Popular Destinations */}
        <div className="mt-8">
          <div className="flex items-center justify-between mb-4">
            <h2 className="text-lg font-semibold text-gray-900 dark:text-white">Popular Destinations</h2>
            <Link href="/search" className="text-sm text-teal-600 hover:text-teal-700 flex items-center gap-1">
              Explore all <ChevronRight className="w-4 h-4" />
            </Link>
          </div>
          <div className="grid grid-cols-2 lg:grid-cols-4 gap-4">
            {[
              { name: 'Boracay', image: '🏖️', color: 'from-blue-400 to-cyan-400' },
              { name: 'Palawan', image: '🏝️', color: 'from-green-400 to-teal-400' },
              { name: 'Siargao', image: '🏄', color: 'from-cyan-400 to-blue-500' },
              { name: 'Cebu', image: '🏛️', color: 'from-orange-400 to-pink-400' },
            ].map((place) => (
              <Link
                key={place.name}
                href={`/search?q=${place.name}`}
                className={`bg-gradient-to-br ${place.color} rounded-2xl p-5 text-white hover:shadow-lg transition-all group`}
              >
                <span className="text-3xl mb-2 block group-hover:scale-110 transition-transform">{place.image}</span>
                <p className="font-semibold">{place.name}</p>
                <p className="text-sm text-white/80">Explore →</p>
              </Link>
            ))}
          </div>
        </div>
      </div>
    </div>
  )
}
