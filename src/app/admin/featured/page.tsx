'use client'

import { useState, useEffect } from 'react'
import {
  Sparkles,
  Star,
  StarOff,
  MapPin,
  Loader2,
  Search,
  GripVertical,
} from 'lucide-react'
import { adminService } from '@/features/admin/services/adminService'
import { useToast } from '@/contexts/ToastContext'

interface Place {
  id: string
  name: string
  description: string
  category: string
  location: string
  image_url: string
  is_featured: boolean
}

export default function AdminFeaturedPage() {
  const { success, error } = useToast()
  const [places, setPlaces] = useState<Place[]>([])
  const [featuredPlaces, setFeaturedPlaces] = useState<Place[]>([])
  const [loading, setLoading] = useState(true)
  const [search, setSearch] = useState('')

  useEffect(() => {
    loadPlaces()
  }, [])

  const loadPlaces = async () => {
    setLoading(true)
    const result = await adminService.getPlaces(1, 100)
    const all = result.places
    setPlaces(all.filter(p => !p.is_featured))
    setFeaturedPlaces(all.filter(p => p.is_featured))
    setLoading(false)
  }

  const handleToggleFeatured = async (place: Place, featured: boolean) => {
    const ok = await adminService.toggleFeatured(place.id, featured)
    if (ok) {
      success(featured ? `${place.name} is now featured` : `${place.name} removed from featured`)
      loadPlaces()
    } else {
      error('Failed to update place')
    }
  }

  const filteredPlaces = places.filter(p =>
    p.name.toLowerCase().includes(search.toLowerCase()) ||
    p.location?.toLowerCase().includes(search.toLowerCase())
  )

  return (
    <div className="p-6 lg:p-8">
      {/* Header */}
      <div className="mb-6">
        <h1 className="text-2xl font-bold text-gray-900 dark:text-white">Featured Places</h1>
        <p className="text-gray-500 dark:text-gray-400">Curate featured destinations for the homepage</p>
      </div>

      {loading ? (
        <div className="flex justify-center py-12">
          <Loader2 className="w-8 h-8 text-teal-600 animate-spin" />
        </div>
      ) : (
        <div className="grid lg:grid-cols-2 gap-6">
          {/* Featured places */}
          <div className="bg-white dark:bg-gray-900 rounded-xl border border-gray-200 dark:border-gray-800 overflow-hidden">
            <div className="px-4 py-4 border-b border-gray-200 dark:border-gray-800 flex items-center gap-2">
              <Sparkles className="w-5 h-5 text-yellow-500" />
              <h2 className="font-semibold text-gray-900 dark:text-white">
                Featured ({featuredPlaces.length})
              </h2>
            </div>
            <div className="divide-y divide-gray-100 dark:divide-gray-800 max-h-[600px] overflow-y-auto">
              {featuredPlaces.length === 0 ? (
                <div className="py-12 text-center text-gray-500 dark:text-gray-400">
                  No featured places yet
                </div>
              ) : (
                featuredPlaces.map((place) => (
                  <div
                    key={place.id}
                    className="p-4 flex items-center gap-3 hover:bg-gray-50 dark:hover:bg-gray-800/50"
                  >
                    <GripVertical className="w-5 h-5 text-gray-300 dark:text-gray-600 cursor-grab" />
                    {place.image_url ? (
                      <img
                        src={place.image_url}
                        alt=""
                        className="w-12 h-12 rounded-lg object-cover"
                      />
                    ) : (
                      <div className="w-12 h-12 rounded-lg bg-gray-200 dark:bg-gray-700 flex items-center justify-center">
                        <MapPin className="w-5 h-5 text-gray-400" />
                      </div>
                    )}
                    <div className="flex-1 min-w-0">
                      <p className="font-medium text-gray-900 dark:text-white truncate">
                        {place.name}
                      </p>
                      <p className="text-sm text-gray-500 dark:text-gray-400 truncate">
                        {place.location || 'No location'}
                      </p>
                    </div>
                    <button
                      onClick={() => handleToggleFeatured(place, false)}
                      className="p-2 text-yellow-500 hover:bg-yellow-50 dark:hover:bg-yellow-900/20 rounded-lg"
                      title="Remove from featured"
                    >
                      <Star className="w-5 h-5 fill-yellow-500" />
                    </button>
                  </div>
                ))
              )}
            </div>
          </div>

          {/* All places */}
          <div className="bg-white dark:bg-gray-900 rounded-xl border border-gray-200 dark:border-gray-800 overflow-hidden">
            <div className="px-4 py-4 border-b border-gray-200 dark:border-gray-800">
              <h2 className="font-semibold text-gray-900 dark:text-white mb-3">
                All Places
              </h2>
              <div className="relative">
                <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-gray-400" />
                <input
                  type="text"
                  value={search}
                  onChange={(e) => setSearch(e.target.value)}
                  placeholder="Search places..."
                  className="w-full pl-9 pr-4 py-2 bg-gray-100 dark:bg-gray-800 rounded-lg border-0 focus:outline-none focus:ring-2 focus:ring-teal-500 text-sm"
                />
              </div>
            </div>
            <div className="divide-y divide-gray-100 dark:divide-gray-800 max-h-[600px] overflow-y-auto">
              {filteredPlaces.length === 0 ? (
                <div className="py-12 text-center text-gray-500 dark:text-gray-400">
                  {search ? 'No places match your search' : 'All places are featured'}
                </div>
              ) : (
                filteredPlaces.map((place) => (
                  <div
                    key={place.id}
                    className="p-4 flex items-center gap-3 hover:bg-gray-50 dark:hover:bg-gray-800/50"
                  >
                    {place.image_url ? (
                      <img
                        src={place.image_url}
                        alt=""
                        className="w-12 h-12 rounded-lg object-cover"
                      />
                    ) : (
                      <div className="w-12 h-12 rounded-lg bg-gray-200 dark:bg-gray-700 flex items-center justify-center">
                        <MapPin className="w-5 h-5 text-gray-400" />
                      </div>
                    )}
                    <div className="flex-1 min-w-0">
                      <p className="font-medium text-gray-900 dark:text-white truncate">
                        {place.name}
                      </p>
                      <p className="text-sm text-gray-500 dark:text-gray-400 truncate">
                        {place.location || 'No location'}
                      </p>
                    </div>
                    <button
                      onClick={() => handleToggleFeatured(place, true)}
                      className="p-2 text-gray-300 dark:text-gray-600 hover:text-yellow-500 hover:bg-yellow-50 dark:hover:bg-yellow-900/20 rounded-lg"
                      title="Add to featured"
                    >
                      <StarOff className="w-5 h-5" />
                    </button>
                  </div>
                ))
              )}
            </div>
          </div>
        </div>
      )}

      {/* Info */}
      <div className="mt-6 p-4 bg-blue-50 dark:bg-blue-900/20 rounded-xl border border-blue-200 dark:border-blue-800">
        <p className="text-sm text-blue-700 dark:text-blue-300">
          Featured places appear on the homepage carousel and in search results with priority.
          Drag to reorder (coming soon) or click the star icon to toggle featured status.
        </p>
      </div>
    </div>
  )
}
