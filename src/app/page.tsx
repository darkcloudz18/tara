'use client'

import { useState, useEffect } from 'react'
import Link from 'next/link'
import { X, Loader2, CalendarPlus, MapPin, ChevronDown, Check } from 'lucide-react'
import { Sidebar, MobileNav } from '@/components/layout'
import Header from '@/components/layout/Header'
import { HeroSection } from '@/features/home/components'
import PlaceCard from '@/features/discover/components/PlaceCard'
import CuratedVideoCard from '@/features/discover/components/CuratedVideoCard'
import AddToTripModal from '@/features/planner/components/AddToTripModal'
import { supabase } from '@/lib/supabase'
import { fetchTaraPlaces, DiscoverPlace } from '@/features/planner/services/placeService'
import { fetchCuratedVideos, FeedVideo } from '@/features/discover/services/videoService'
import { Itinerary } from '@/types/database'
import { useLocalizedTrip } from '@/hooks/useLocalizedTrip'

// Union type for feed items
type FeedItem =
  | { type: 'place'; data: DiscoverPlace }
  | { type: 'video'; data: FeedVideo }

export default function HomePage() {
  const [user, setUser] = useState<any>(null)
  const [showLoginPrompt, setShowLoginPrompt] = useState(false)
  const [selectedCategory, setSelectedCategory] = useState('all')
  const [feedItems, setFeedItems] = useState<FeedItem[]>([])
  const [loading, setLoading] = useState(true)
  const [showAddToTripModal, setShowAddToTripModal] = useState(false)
  const [selectedPlace, setSelectedPlace] = useState<DiscoverPlace | null>(null)

  // Active trip state
  const [userTrips, setUserTrips] = useState<Itinerary[]>([])
  const [activeTrip, setActiveTrip] = useState<Itinerary | null>(null)
  const [showTripSelector, setShowTripSelector] = useState(false)
  const [recentlyAdded, setRecentlyAdded] = useState<string | null>(null)

  // Localized strings
  const t = useLocalizedTrip()

  useEffect(() => {
    supabase.auth.getUser().then(({ data: { user } }) => {
      setUser(user)
    })

    const { data: { subscription } } = supabase.auth.onAuthStateChange((event, session) => {
      setUser(session?.user || null)
    })

    return () => subscription.unsubscribe()
  }, [])

  // Fetch user's trips
  useEffect(() => {
    if (user) {
      supabase
        .from('itineraries')
        .select('*')
        .eq('user_id', user.id)
        .order('updated_at', { ascending: false })
        .limit(5)
        .then(({ data }) => {
          if (data && data.length > 0) {
            setUserTrips(data)
            setActiveTrip(data[0]) // Most recent trip is active by default
          }
        })
    } else {
      setUserTrips([])
      setActiveTrip(null)
    }
  }, [user])

  useEffect(() => {
    loadFeed()
  }, [selectedCategory])

  const loadFeed = async () => {
    setLoading(true)
    try {
      // Fetch both places and videos in parallel
      const [placesData, videosData] = await Promise.all([
        fetchTaraPlaces(30),
        fetchCuratedVideos(10),
      ])

      // Filter places by category if not 'all'
      let filteredPlaces = placesData
      if (selectedCategory !== 'all') {
        const categoryMap: Record<string, string[]> = {
          beaches: ['beach', 'see'],
          islands: ['island', 'see'],
          mountains: ['mountain', 'see', 'do'],
          food: ['eat', 'restaurant', 'cafe'],
          heritage: ['heritage', 'see', 'landmark'],
          adventure: ['do', 'activity', 'adventure'],
          stays: ['stay', 'hotel', 'resort'],
        }
        const categories = categoryMap[selectedCategory] || []
        filteredPlaces = placesData.filter(p =>
          categories.some(c => p.category?.toLowerCase().includes(c) || p.tags?.some(t => t.toLowerCase().includes(c)))
        )
      }

      // Convert to feed items
      const placeItems: FeedItem[] = filteredPlaces.map(p => ({ type: 'place', data: p }))
      const videoItems: FeedItem[] = videosData.map(v => ({ type: 'video', data: v }))

      // Interleave videos with places (insert video every 3-4 places)
      const mixed: FeedItem[] = []
      let videoIndex = 0

      placeItems.forEach((place, index) => {
        mixed.push(place)
        // Insert a video after every 3 places
        if ((index + 1) % 3 === 0 && videoIndex < videoItems.length) {
          mixed.push(videoItems[videoIndex])
          videoIndex++
        }
      })

      // Add remaining videos at the end
      while (videoIndex < videoItems.length) {
        mixed.push(videoItems[videoIndex])
        videoIndex++
      }

      setFeedItems(mixed)
    } catch (err) {
      console.error('Failed to load feed:', err)
    } finally {
      setLoading(false)
    }
  }

  const handleAddToTrip = (place: DiscoverPlace) => {
    if (!user) {
      setShowLoginPrompt(true)
      return
    }
    setSelectedPlace(place)
    setShowAddToTripModal(true)
  }

  const handleTripAddSuccess = (tripId: string) => {
    if (selectedPlace) {
      setRecentlyAdded(selectedPlace.id)
      setTimeout(() => setRecentlyAdded(null), 3000)
    }
  }

  return (
    <div className="min-h-screen bg-white dark:bg-black">
      {/* Sidebar - Desktop */}
      <Sidebar user={user} />

      {/* Main Content */}
      <div className="lg:ml-[260px]">
        {/* Hero Section */}
        <HeroSection user={user} />

        {/* Header with Categories */}
        <Header
          selectedCategory={selectedCategory}
          onCategoryChange={setSelectedCategory}
        />

        {/* Active Trip Banner - Sticky */}
        {user && activeTrip && (
          <div className="sticky top-0 z-40 bg-teal-500 dark:bg-teal-600 shadow-md">
            <div className="max-w-[470px] mx-auto px-4 py-2">
              <div className="flex items-center justify-between">
                <div className="flex items-center gap-2 text-white">
                  <CalendarPlus className="w-4 h-4" />
                  <span className="text-sm">Adding to:</span>
                  <button
                    onClick={() => setShowTripSelector(!showTripSelector)}
                    className="font-semibold text-sm flex items-center gap-1 hover:underline"
                  >
                    {activeTrip.title}
                    <ChevronDown className={`w-4 h-4 transition-transform ${showTripSelector ? 'rotate-180' : ''}`} />
                  </button>
                </div>
                <Link
                  href={`/planner/${activeTrip.id}`}
                  className="text-xs text-white/80 hover:text-white underline"
                >
                  {t.viewTrip}
                </Link>
              </div>

              {/* Trip Selector Dropdown */}
              {showTripSelector && (
                <div className="mt-2 bg-white dark:bg-gray-800 rounded-lg shadow-lg overflow-hidden">
                  {userTrips.map((trip) => (
                    <button
                      key={trip.id}
                      onClick={() => {
                        setActiveTrip(trip)
                        setShowTripSelector(false)
                      }}
                      className={`w-full flex items-center gap-3 px-3 py-2 hover:bg-gray-50 dark:hover:bg-gray-700 transition-colors ${
                        activeTrip.id === trip.id ? 'bg-teal-50 dark:bg-teal-900/30' : ''
                      }`}
                    >
                      <MapPin className="w-4 h-4 text-gray-400" />
                      <div className="flex-1 text-left">
                        <p className="text-sm font-medium text-gray-900 dark:text-white">{trip.title}</p>
                        <p className="text-xs text-gray-500">{trip.destinations?.slice(0, 2).join(', ')}</p>
                      </div>
                      {activeTrip.id === trip.id && (
                        <Check className="w-4 h-4 text-teal-500" />
                      )}
                    </button>
                  ))}
                  <Link
                    href="/planner/new"
                    className="block w-full px-3 py-2 text-sm text-teal-600 dark:text-teal-400 font-medium hover:bg-gray-50 dark:hover:bg-gray-700 border-t border-gray-100 dark:border-gray-700"
                  >
                    + Create New {t.trip}
                  </Link>
                </div>
              )}
            </div>
          </div>
        )}

        {/* Section Title */}
        <div className="max-w-[470px] mx-auto px-4 pt-6 pb-2">
          <h2 className="text-lg font-bold text-gray-900 dark:text-white">
            {user ? `Add Places to Your ${t.trip}` : 'Discover & Plan'}
          </h2>
          <p className="text-sm text-gray-500 dark:text-gray-400">
            {user
              ? 'Tap the + button to add places to your itinerary'
              : `Browse destinations and start building your ${t.trip.toLowerCase()}`}
          </p>
        </div>

        {/* Vertical Feed */}
        <main className="max-w-[470px] mx-auto pb-20 lg:pb-8">
          {loading ? (
            <div className="flex flex-col items-center justify-center py-20">
              <Loader2 className="w-8 h-8 text-teal-500 animate-spin mb-4" />
              <p className="text-gray-500 dark:text-gray-400">Finding amazing places...</p>
            </div>
          ) : feedItems.length === 0 ? (
            <div className="flex flex-col items-center justify-center py-20 px-4">
              <div className="w-20 h-20 bg-gray-100 dark:bg-gray-800 rounded-full flex items-center justify-center mb-4">
                <MapPin className="w-10 h-10 text-gray-400" />
              </div>
              <h3 className="text-lg font-semibold text-gray-900 dark:text-white mb-2">No places found</h3>
              <p className="text-gray-500 dark:text-gray-400 text-center">Try selecting a different category</p>
            </div>
          ) : (
            <div>
              {feedItems.map((item) => (
                <div key={item.type === 'place' ? item.data.id : item.data.id} className="border-b border-gray-100 dark:border-gray-800 relative">
                  {item.type === 'place' ? (
                    <>
                      <PlaceCard
                        place={item.data}
                        onAddToTrip={() => handleAddToTrip(item.data)}
                      />
                      {/* Recently Added Indicator */}
                      {recentlyAdded === item.data.id && (
                        <div className="absolute top-4 right-4 bg-teal-500 text-white text-xs font-semibold px-2 py-1 rounded-full flex items-center gap-1 animate-fade-in">
                          <Check className="w-3 h-3" />
                          Added!
                        </div>
                      )}
                    </>
                  ) : (
                    <CuratedVideoCard video={item.data} />
                  )}
                </div>
              ))}

              {/* Load More */}
              <div className="text-center py-8">
                <button
                  onClick={loadFeed}
                  className="px-6 py-3 text-teal-600 dark:text-teal-400 font-semibold hover:text-teal-700 dark:hover:text-teal-300 transition-colors"
                >
                  Load More
                </button>
              </div>
            </div>
          )}
        </main>
      </div>

      {/* Mobile Navigation */}
      <MobileNav user={user} />

      {/* Login Prompt Modal */}
      {showLoginPrompt && (
        <div className="fixed inset-0 z-[100] flex items-center justify-center bg-black/50 backdrop-blur-sm p-4">
          <div className="bg-white dark:bg-gray-900 rounded-2xl max-w-sm w-full p-6 relative">
            <button
              onClick={() => setShowLoginPrompt(false)}
              className="absolute top-4 right-4 p-2 hover:bg-gray-100 dark:hover:bg-gray-800 rounded-full"
            >
              <X className="w-5 h-5 text-gray-500" />
            </button>

            <div className="text-center mb-6">
              <div className="w-16 h-16 bg-teal-100 dark:bg-teal-900 rounded-2xl flex items-center justify-center mx-auto mb-4">
                <CalendarPlus className="w-8 h-8 text-teal-600 dark:text-teal-400" />
              </div>
              <h2 className="text-xl font-bold text-gray-900 dark:text-white mb-2">
                Start Building Your {t.trip}
              </h2>
              <p className="text-gray-600 dark:text-gray-400">
                Create a free account to save places and build shareable itineraries!
              </p>
            </div>

            <div className="space-y-3">
              <Link
                href="/register"
                className="block w-full py-3 bg-teal-500 text-white text-center rounded-xl font-semibold hover:bg-teal-600 transition-colors"
              >
                Create Free Account
              </Link>
              <Link
                href="/login"
                className="block w-full py-3 bg-gray-100 dark:bg-gray-800 text-gray-700 dark:text-gray-300 text-center rounded-xl font-semibold hover:bg-gray-200 dark:hover:bg-gray-700 transition-colors"
              >
                Sign In
              </Link>
            </div>
          </div>
        </div>
      )}

      {/* Add to Trip Modal */}
      <AddToTripModal
        isOpen={showAddToTripModal}
        onClose={() => setShowAddToTripModal(false)}
        place={selectedPlace}
        onSuccess={handleTripAddSuccess}
      />
    </div>
  )
}
