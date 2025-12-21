'use client'

import { useState, useEffect } from 'react'
import Link from 'next/link'
import { X, MapPin, Sparkles } from 'lucide-react'
import { Sidebar, MobileNav } from '@/components/layout'
import Header from '@/components/layout/Header'
import PlaceCard from '@/features/discover/components/PlaceCard'
import BucketIcon from '@/components/icons/BucketIcon'
import { supabase } from '@/lib/supabase'
import { useBucketList } from '@/features/planner/hooks/useBucketList'
import { fetchTaraPlaces, DiscoverPlace } from '@/features/planner/services/placeService'

export default function HomePage() {
  const [user, setUser] = useState<any>(null)
  const [showLoginPrompt, setShowLoginPrompt] = useState(false)
  const [selectedCategory, setSelectedCategory] = useState('all')
  const [places, setPlaces] = useState<DiscoverPlace[]>([])
  const [loading, setLoading] = useState(true)
  const [featuredPlace, setFeaturedPlace] = useState<DiscoverPlace | null>(null)

  const bucketList = useBucketList()

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
    loadPlaces()
  }, [selectedCategory])

  const loadPlaces = async () => {
    setLoading(true)
    try {
      const data = await fetchTaraPlaces(50)
      // Filter by category if not 'all'
      let filtered = data
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
        filtered = data.filter(p =>
          categories.some(c => p.category?.toLowerCase().includes(c) || p.tags?.some(t => t.toLowerCase().includes(c)))
        )
      }

      // Pick a featured place
      const featured = filtered.find(p => p.isFeatured) || filtered[0]
      setFeaturedPlace(featured)

      // Rest of places (excluding featured)
      setPlaces(filtered.filter(p => p.id !== featured?.id))
    } catch (err) {
      console.error('Failed to load places:', err)
    } finally {
      setLoading(false)
    }
  }

  const handleAddToBucketList = async (place: DiscoverPlace) => {
    try {
      await bucketList.addPlace(place)
    } catch (err: any) {
      if (err.message?.includes('logged in')) {
        setShowLoginPrompt(true)
      }
    }
  }

  const handleRemoveFromBucketList = async (placeId: string) => {
    const item = bucketList.getItemByPlaceId(placeId)
    if (item) {
      await bucketList.removeItem(item.id)
    }
  }

  return (
    <div className="min-h-screen bg-gray-50 dark:bg-gray-950">
      {/* Sidebar - Desktop */}
      <Sidebar user={user} />

      {/* Main Content */}
      <div className="lg:ml-[260px]">
        {/* Header */}
        <Header
          selectedCategory={selectedCategory}
          onCategoryChange={setSelectedCategory}
        />

        {/* Content */}
        <main className="px-4 py-6 max-w-7xl mx-auto">
          {loading ? (
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-6">
              {[...Array(8)].map((_, i) => (
                <div key={i} className="bg-white dark:bg-gray-900 rounded-2xl overflow-hidden">
                  <div className="aspect-[4/3] bg-gray-200 dark:bg-gray-800 animate-pulse" />
                  <div className="p-4 space-y-3">
                    <div className="h-4 bg-gray-200 dark:bg-gray-800 rounded animate-pulse w-1/2" />
                    <div className="h-5 bg-gray-200 dark:bg-gray-800 rounded animate-pulse" />
                    <div className="h-4 bg-gray-200 dark:bg-gray-800 rounded animate-pulse w-3/4" />
                  </div>
                </div>
              ))}
            </div>
          ) : (
            <>
              {/* Featured Place */}
              {featuredPlace && (
                <div className="mb-8">
                  <div className="flex items-center gap-2 mb-4">
                    <Sparkles className="w-5 h-5 text-teal-500" />
                    <h2 className="text-lg font-semibold text-gray-900 dark:text-white">Featured Destination</h2>
                  </div>
                  <PlaceCard
                    place={featuredPlace}
                    variant="featured"
                    isInBucketList={bucketList.isInBucketList(featuredPlace.id)}
                    onAddToBucketList={() => handleAddToBucketList(featuredPlace)}
                    onRemoveFromBucketList={() => handleRemoveFromBucketList(featuredPlace.id)}
                  />
                </div>
              )}

              {/* Section Title */}
              <div className="flex items-center justify-between mb-6">
                <div className="flex items-center gap-2">
                  <MapPin className="w-5 h-5 text-teal-500" />
                  <h2 className="text-lg font-semibold text-gray-900 dark:text-white">
                    {selectedCategory === 'all' ? 'Explore Philippines' : `${selectedCategory.charAt(0).toUpperCase() + selectedCategory.slice(1)}`}
                  </h2>
                </div>
                <span className="text-sm text-gray-500 dark:text-gray-400">
                  {places.length} places
                </span>
              </div>

              {/* Places Grid */}
              <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-6">
                {places.map((place) => (
                  <PlaceCard
                    key={place.id}
                    place={place}
                    isInBucketList={bucketList.isInBucketList(place.id)}
                    onAddToBucketList={() => handleAddToBucketList(place)}
                    onRemoveFromBucketList={() => handleRemoveFromBucketList(place.id)}
                  />
                ))}
              </div>

              {/* Empty State */}
              {places.length === 0 && !featuredPlace && (
                <div className="text-center py-16">
                  <div className="w-20 h-20 bg-gray-100 dark:bg-gray-800 rounded-full flex items-center justify-center mx-auto mb-4">
                    <MapPin className="w-10 h-10 text-gray-400" />
                  </div>
                  <h3 className="text-lg font-semibold text-gray-900 dark:text-white mb-2">No places found</h3>
                  <p className="text-gray-500 dark:text-gray-400">Try selecting a different category</p>
                </div>
              )}
            </>
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
                <BucketIcon className="w-8 h-8 text-teal-600 dark:text-teal-400" />
              </div>
              <h2 className="text-xl font-bold text-gray-900 dark:text-white mb-2">
                Add to Bucket List
              </h2>
              <p className="text-gray-600 dark:text-gray-400">
                Sign in to save places and plan your dream trip to the Philippines!
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
    </div>
  )
}
