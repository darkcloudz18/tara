'use client'

import { useState, useEffect, useRef } from 'react'
import Link from 'next/link'
import { X, CalendarPlus, MapPin, ChevronDown, Check, AlertCircle } from 'lucide-react'
import { Sidebar, MobileNav } from '@/components/layout'
import Header from '@/components/layout/Header'
import { HeroSection } from '@/features/home/components'
import PlaceCard from '@/features/discover/components/PlaceCard'
import CuratedVideoCard from '@/features/discover/components/CuratedVideoCard'
import AddToTripModal from '@/features/planner/components/AddToTripModal'
import { PlaceCardSkeleton } from '@/components/ui/Skeleton'
import { NoResults } from '@/components/illustrations'
import { supabase } from '@/lib/supabase'
import { fetchTaraPlaces, DiscoverPlace } from '@/features/planner/services/placeService'
import { fetchCuratedVideos, FeedVideo } from '@/features/discover/services/videoService'
import { Itinerary } from '@/types/database'
import { useLocalizedTrip } from '@/hooks/useLocalizedTrip'

export type FeedItem =
  | { type: 'place'; data: DiscoverPlace }
  | { type: 'video'; data: FeedVideo }

interface HomeClientProps {
  initialItems: FeedItem[]
  initialError: boolean
}

export default function HomeClient({ initialItems, initialError }: HomeClientProps) {
  const [user, setUser] = useState<any>(null)
  const [showLoginPrompt, setShowLoginPrompt] = useState(false)
  const [selectedCategory, setSelectedCategory] = useState('all')
  const [feedItems, setFeedItems] = useState<FeedItem[]>(initialItems)
  const [loading, setLoading] = useState(false)
  const [hasError, setHasError] = useState(initialError)
  const [showAddToTripModal, setShowAddToTripModal] = useState(false)
  const [selectedPlace, setSelectedPlace] = useState<DiscoverPlace | null>(null)
  const isFirstFilterRun = useRef(true)

  const [userTrips, setUserTrips] = useState<Itinerary[]>([])
  const [activeTrip, setActiveTrip] = useState<Itinerary | null>(null)
  const [showTripSelector, setShowTripSelector] = useState(false)
  const [recentlyAdded, setRecentlyAdded] = useState<string | null>(null)

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
            setActiveTrip(data[0])
          }
        })
    } else {
      setUserTrips([])
      setActiveTrip(null)
    }
  }, [user])

  useEffect(() => {
    if (isFirstFilterRun.current) {
      isFirstFilterRun.current = false
      return
    }
    loadFeed()
  }, [selectedCategory])

  const loadFeed = async () => {
    setLoading(true)
    setHasError(false)
    try {
      const [placesData, videosData] = await Promise.all([
        fetchTaraPlaces(30),
        fetchCuratedVideos(10),
      ])

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

      const placeItems: FeedItem[] = filteredPlaces.map(p => ({ type: 'place', data: p }))
      const videoItems: FeedItem[] = videosData.map(v => ({ type: 'video', data: v }))

      const mixed: FeedItem[] = []
      let videoIndex = 0

      placeItems.forEach((place, index) => {
        mixed.push(place)
        if ((index + 1) % 3 === 0 && videoIndex < videoItems.length) {
          mixed.push(videoItems[videoIndex])
          videoIndex++
        }
      })

      while (videoIndex < videoItems.length) {
        mixed.push(videoItems[videoIndex])
        videoIndex++
      }

      if (placesData.length === 0 && videosData.length === 0) {
        setHasError(true)
      } else {
        setFeedItems(mixed)
      }
    } catch (err) {
      console.error('Failed to load feed:', err)
      setHasError(true)
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
      <Sidebar user={user} />

      <div className="lg:ml-[260px]">
        <HeroSection user={user} />

        <Header
          selectedCategory={selectedCategory}
          onCategoryChange={setSelectedCategory}
        />

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
                  href={`/trip/${activeTrip.id}/edit`}
                  className="text-xs text-white/80 hover:text-white underline"
                >
                  {t.viewTrip}
                </Link>
              </div>

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
                    href="/trip/new"
                    className="block w-full px-3 py-2 text-sm text-teal-600 dark:text-teal-400 font-medium hover:bg-gray-50 dark:hover:bg-gray-700 border-t border-gray-100 dark:border-gray-700"
                  >
                    + Create New {t.trip}
                  </Link>
                </div>
              )}
            </div>
          </div>
        )}

        <div className="max-w-[470px] mx-auto px-4 pt-6 pb-2">
          <h2 className="text-lg font-bold text-gray-900 dark:text-white">
            {user ? `Add places to your ${t.trip.toLowerCase()}` : 'Discover & plan'}
          </h2>
          <p className="text-sm text-gray-500 dark:text-gray-400">
            {user
              ? 'Tap the + button to add places to your itinerary'
              : `Browse destinations and start building your ${t.trip.toLowerCase()}`}
          </p>
        </div>

        <main className="max-w-[470px] mx-auto pb-20 lg:pb-8">
          {hasError ? (
            <div className="flex flex-col items-center justify-center py-20 px-4">
              <div className="w-16 h-16 bg-red-50 dark:bg-red-900/20 rounded-2xl flex items-center justify-center mb-4">
                <AlertCircle className="w-8 h-8 text-red-500" />
              </div>
              <h3 className="text-lg font-semibold text-gray-900 dark:text-white mb-2">
                Couldn&rsquo;t load destinations
              </h3>
              <p className="text-gray-500 dark:text-gray-400 text-center mb-4">
                Check your connection and try again.
              </p>
              <button
                onClick={loadFeed}
                className="px-6 py-3 bg-teal-500 text-white rounded-xl font-semibold hover:bg-teal-600 transition-colors"
              >
                Try again
              </button>
            </div>
          ) : loading ? (
            <div className="px-4 space-y-4 py-4">
              {[1, 2, 3].map((i) => (
                <PlaceCardSkeleton key={i} />
              ))}
            </div>
          ) : feedItems.length === 0 ? (
            <div className="flex flex-col items-center justify-center py-20 px-4">
              <NoResults className="mb-6" />
              <h3 className="text-lg font-semibold text-gray-900 dark:text-white mb-2">No places found</h3>
              <p className="text-gray-500 dark:text-gray-400 text-center mb-4">Try selecting a different category</p>
              <button
                onClick={() => setSelectedCategory('all')}
                className="text-teal-600 dark:text-teal-400 font-medium hover:underline"
              >
                Show all places
              </button>
            </div>
          ) : (
            <div>
              {feedItems.map((item) => (
                <div key={item.type === 'place' ? item.data.id : item.data.id} className="border-b border-gray-100 dark:border-gray-800">
                  {item.type === 'place' ? (
                    <PlaceCard
                      place={item.data}
                      onAddToTrip={() => handleAddToTrip(item.data)}
                      activeTripTitle={activeTrip?.title}
                      wasJustAdded={recentlyAdded === item.data.id}
                    />
                  ) : (
                    <CuratedVideoCard video={item.data} />
                  )}
                </div>
              ))}

              <div className="text-center py-8">
                <button
                  onClick={loadFeed}
                  className="px-6 py-3 text-teal-600 dark:text-teal-400 font-semibold hover:text-teal-700 dark:hover:text-teal-300 transition-colors"
                >
                  Load more
                </button>
              </div>
            </div>
          )}
        </main>
      </div>

      <MobileNav user={user} />

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
                Start building your {t.trip.toLowerCase()}
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
                Create free account
              </Link>
              <Link
                href="/login"
                className="block w-full py-3 bg-gray-100 dark:bg-gray-800 text-gray-700 dark:text-gray-300 text-center rounded-xl font-semibold hover:bg-gray-200 dark:hover:bg-gray-700 transition-colors"
              >
                Sign in
              </Link>
            </div>
          </div>
        </div>
      )}

      <AddToTripModal
        isOpen={showAddToTripModal}
        onClose={() => setShowAddToTripModal(false)}
        place={selectedPlace}
        onSuccess={handleTripAddSuccess}
      />
    </div>
  )
}
