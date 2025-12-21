'use client'

import { useState, useEffect } from 'react'
import Link from 'next/link'
import { X, Loader2 } from 'lucide-react'
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
      setPlaces(filtered)
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
    <div className="min-h-screen bg-white dark:bg-black">
      {/* Sidebar - Desktop */}
      <Sidebar user={user} />

      {/* Main Content */}
      <div className="lg:ml-[260px]">
        {/* Header */}
        <Header
          selectedCategory={selectedCategory}
          onCategoryChange={setSelectedCategory}
        />

        {/* Vertical Feed */}
        <main className="max-w-[470px] mx-auto pb-20 lg:pb-8">
          {loading ? (
            <div className="flex flex-col items-center justify-center py-20">
              <Loader2 className="w-8 h-8 text-teal-500 animate-spin mb-4" />
              <p className="text-gray-500 dark:text-gray-400">Discovering places...</p>
            </div>
          ) : places.length === 0 ? (
            <div className="flex flex-col items-center justify-center py-20 px-4">
              <div className="w-20 h-20 bg-gray-100 dark:bg-gray-800 rounded-full flex items-center justify-center mb-4">
                <BucketIcon className="w-10 h-10 text-gray-400" />
              </div>
              <h3 className="text-lg font-semibold text-gray-900 dark:text-white mb-2">No places found</h3>
              <p className="text-gray-500 dark:text-gray-400 text-center">Try selecting a different category</p>
            </div>
          ) : (
            <div>
              {places.map((place) => (
                <div key={place.id} className="border-b border-gray-100 dark:border-gray-800">
                  <PlaceCard
                    place={place}
                    isInBucketList={bucketList.isInBucketList(place.id)}
                    onAddToBucketList={() => handleAddToBucketList(place)}
                    onRemoveFromBucketList={() => handleRemoveFromBucketList(place.id)}
                  />
                </div>
              ))}

              {/* Load More */}
              <div className="text-center py-8">
                <button
                  onClick={loadPlaces}
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
