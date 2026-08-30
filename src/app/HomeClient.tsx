'use client'

import { useState, useEffect, useRef } from 'react'
import { AlertCircle } from 'lucide-react'
import { AppShell } from '@/components/layout'
import Header from '@/components/layout/Header'
import { HeroSection } from '@/features/home/components'
import PlaceCard from '@/features/discover/components/PlaceCard'
import CuratedVideoCard from '@/features/discover/components/CuratedVideoCard'
import { PlaceCardSkeleton } from '@/components/ui/Skeleton'
import { NoResults } from '@/components/illustrations'
import { supabase } from '@/lib/supabase'
import { useUser } from '@/contexts/UserContext'
import { fetchTaraPlaces, DiscoverPlace } from '@/features/planner/services/placeService'
import { fetchCuratedVideos, FeedVideo } from '@/features/discover/services/videoService'
import { Itinerary } from '@/types/database'

export type FeedItem =
  | { type: 'place'; data: DiscoverPlace }
  | { type: 'video'; data: FeedVideo }

interface HomeClientProps {
  initialItems: FeedItem[]
  initialError: boolean
}

function withTimeout<T>(p: Promise<T>, ms: number): Promise<T> {
  return Promise.race([
    p,
    new Promise<T>((_, reject) =>
      setTimeout(() => reject(new Error('timeout')), ms)
    ),
  ])
}

export default function HomeClient({ initialItems, initialError }: HomeClientProps) {
  const { user } = useUser()
  const [selectedCategory, setSelectedCategory] = useState('all')
  const [feedItems, setFeedItems] = useState<FeedItem[]>(initialItems)
  const [loading, setLoading] = useState(false)
  const [hasError, setHasError] = useState(initialError)
  const isFirstFilterRun = useRef(true)

  const [userTrips, setUserTrips] = useState<Itinerary[]>([])

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
          }
        })
    } else {
      setUserTrips([])
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
      const [placesData, videosData] = await withTimeout(
        Promise.all([fetchTaraPlaces(30), fetchCuratedVideos(10)]),
        5000
      )

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

  const homepageState: 'anonymous' | 'no-trips' | 'has-trip' =
    !user ? 'anonymous'
    : userTrips.length === 0 ? 'no-trips'
    : 'has-trip'

  return (
    <AppShell>
      <HeroSection user={user} trips={userTrips} homepageState={homepageState} />

        <Header
          selectedCategory={selectedCategory}
          onCategoryChange={setSelectedCategory}
        />

        <div className="max-w-7xl mx-auto px-4 pt-6 pb-2">
          <h2 className="text-lg font-bold text-gray-900 dark:text-white">
            Discover
          </h2>
          <p className="text-sm text-gray-500 dark:text-gray-400">
            Tap the bookmark on any place to save it to your bucket list.
          </p>
        </div>

        <main className="max-w-7xl mx-auto px-4 pb-20 lg:pb-8">
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
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-4 py-4">
              {[1, 2, 3, 4, 5, 6].map((i) => (
                <PlaceCardSkeleton key={i} />
              ))}
            </div>
          ) : feedItems.length === 0 ? (
            <div className="flex flex-col items-center justify-center py-20 px-4">
              <NoResults className="mb-6" />
              <h3 className="text-lg font-semibold text-gray-900 dark:text-white mb-2">
                {selectedCategory === 'all'
                  ? 'No places yet'
                  : `No ${selectedCategory} match these filters`}
              </h3>
              <p className="text-gray-500 dark:text-gray-400 text-center mb-4">
                {selectedCategory === 'all'
                  ? 'Check back soon.'
                  : 'Try another category or clear filters.'}
              </p>
              {selectedCategory !== 'all' && (
                <button
                  onClick={() => setSelectedCategory('all')}
                  className="px-6 py-3 bg-teal-500 text-white rounded-xl font-semibold hover:bg-teal-600 transition-colors"
                >
                  Clear filters
                </button>
              )}
            </div>
          ) : (
            <>
              <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-4 py-4">
                {feedItems.map((item) => (
                  <div
                    key={item.type === 'place' ? item.data.id : item.data.id}
                    className="rounded-xl overflow-hidden border border-gray-200 dark:border-gray-800"
                  >
                    {item.type === 'place' ? (
                      <PlaceCard place={item.data} />
                    ) : (
                      <CuratedVideoCard video={item.data} />
                    )}
                  </div>
                ))}
              </div>

              <div className="text-center py-8">
                <button
                  onClick={loadFeed}
                  className="px-6 py-3 text-teal-600 dark:text-teal-400 font-semibold hover:text-teal-700 dark:hover:text-teal-300 transition-colors"
                >
                  Load more
                </button>
              </div>
            </>
          )}
        </main>

    </AppShell>
  )
}
