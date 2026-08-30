'use client'

import { useState, useEffect, useCallback, useRef, Suspense } from 'react'
import { useRouter, useSearchParams } from 'next/navigation'
import { Search, X, Clock, TrendingUp, ArrowLeft, Loader2, MapPin, Star } from 'lucide-react'
import { searchService, SearchFilters } from '@/features/search/services/searchService'
import SearchFiltersComponent from '@/features/search/components/SearchFilters'
import { DiscoverPlace } from '@/features/planner/services/placeService'
import AddToTripModal from '@/features/planner/components/AddToTripModal'
import { useLocalizedTrip } from '@/hooks/useLocalizedTrip'
import { AppShell } from '@/components/layout'

const POPULAR_SEARCHES = [
  'Boracay',
  'Palawan',
  'Siargao',
  'Bohol',
  'Cebu',
  'Batanes',
]

function SearchPageContent() {
  const router = useRouter()
  const searchParams = useSearchParams()
  const t = useLocalizedTrip()
  const inputRef = useRef<HTMLInputElement>(null)

  const [query, setQuery] = useState(searchParams.get('q') || '')
  const [filters, setFilters] = useState<SearchFilters>({})
  const [results, setResults] = useState<DiscoverPlace[]>([])
  const [loading, setLoading] = useState(false)
  const [hasSearched, setHasSearched] = useState(false)
  const [recentSearches, setRecentSearches] = useState<string[]>([])
  const [showAddModal, setShowAddModal] = useState(false)
  const [selectedPlace, setSelectedPlace] = useState<DiscoverPlace | null>(null)

  // Load recent searches
  useEffect(() => {
    setRecentSearches(searchService.getSearchHistory())
  }, [])

  // Auto-focus input
  useEffect(() => {
    inputRef.current?.focus()
  }, [])

  // Search when query changes from URL
  useEffect(() => {
    const q = searchParams.get('q')
    if (q && q !== query) {
      setQuery(q)
      handleSearch(q)
    }
  }, [searchParams])

  const handleSearch = useCallback(async (searchQuery?: string) => {
    const q = searchQuery ?? query
    if (!q.trim() && !filters.category && !filters.destination) {
      setResults([])
      setHasSearched(false)
      return
    }

    setLoading(true)
    setHasSearched(true)

    // Save to history
    if (q.trim()) {
      searchService.addToSearchHistory(q)
      setRecentSearches(searchService.getSearchHistory())
    }

    const result = await searchService.search({ ...filters, query: q })
    setResults(result.places)
    setLoading(false)
  }, [query, filters])

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault()
    handleSearch()
    // Update URL
    if (query.trim()) {
      router.push(`/search?q=${encodeURIComponent(query)}`, { scroll: false })
    }
  }

  const handleRecentClick = (search: string) => {
    setQuery(search)
    handleSearch(search)
    router.push(`/search?q=${encodeURIComponent(search)}`, { scroll: false })
  }

  const handleRemoveRecent = (search: string, e: React.MouseEvent) => {
    e.stopPropagation()
    searchService.removeFromSearchHistory(search)
    setRecentSearches(searchService.getSearchHistory())
  }

  const handleClearHistory = () => {
    searchService.clearSearchHistory()
    setRecentSearches([])
  }

  const handleFilterChange = (newFilters: SearchFilters) => {
    setFilters(newFilters)
    // Re-search with new filters
    setTimeout(() => handleSearch(), 100)
  }

  const handleClearFilters = () => {
    setFilters({})
    handleSearch()
  }

  const handlePlaceClick = (place: DiscoverPlace) => {
    setSelectedPlace(place)
    setShowAddModal(true)
  }

  return (
    <AppShell>
    <div className="min-h-screen bg-gray-50 dark:bg-gray-950">
      {/* Header */}
      <div className="sticky top-0 z-40 bg-white dark:bg-gray-900 border-b border-gray-200 dark:border-gray-800">
        <div className="max-w-3xl mx-auto px-4 py-3">
          <form onSubmit={handleSubmit} className="flex items-center gap-3">
            <button
              type="button"
              onClick={() => router.back()}
              className="p-2 text-gray-500 hover:text-gray-700 dark:hover:text-gray-300"
            >
              <ArrowLeft className="w-5 h-5" />
            </button>
            <div className="flex-1 relative">
              <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-5 h-5 text-gray-400" />
              <input
                ref={inputRef}
                type="text"
                value={query}
                onChange={(e) => setQuery(e.target.value)}
                placeholder="Search places, destinations..."
                className="w-full pl-10 pr-10 py-2.5 bg-gray-100 dark:bg-gray-800 border-0 rounded-xl text-gray-900 dark:text-white placeholder-gray-500 focus:outline-none focus:ring-2 focus:ring-teal-500"
              />
              {query && (
                <button
                  type="button"
                  onClick={() => {
                    setQuery('')
                    setResults([])
                    setHasSearched(false)
                    inputRef.current?.focus()
                  }}
                  className="absolute right-3 top-1/2 -translate-y-1/2 p-1 text-gray-400 hover:text-gray-600"
                >
                  <X className="w-4 h-4" />
                </button>
              )}
            </div>
            <button
              type="submit"
              className="px-4 py-2.5 bg-teal-600 text-white rounded-xl font-medium hover:bg-teal-700 transition-colors"
            >
              Search
            </button>
          </form>
        </div>
      </div>

      <div className="max-w-3xl mx-auto px-4 py-6">
        {/* Filters */}
        <SearchFiltersComponent
          filters={filters}
          onChange={handleFilterChange}
          onClear={handleClearFilters}
        />

        {/* Loading State */}
        {loading && (
          <div className="flex items-center justify-center py-16">
            <Loader2 className="w-8 h-8 text-teal-600 animate-spin" />
          </div>
        )}

        {/* Results */}
        {!loading && hasSearched && (
          <div className="mt-6">
            <p className="text-sm text-gray-500 dark:text-gray-400 mb-4">
              {results.length} {results.length === 1 ? 'result' : 'results'} found
            </p>

            {results.length === 0 ? (
              <div className="text-center py-12">
                <div className="w-16 h-16 bg-gray-100 dark:bg-gray-800 rounded-full flex items-center justify-center mx-auto mb-4">
                  <Search className="w-8 h-8 text-gray-400" />
                </div>
                <h3 className="text-lg font-semibold text-gray-900 dark:text-white mb-2">
                  No results found
                </h3>
                <p className="text-gray-500 dark:text-gray-400">
                  Try adjusting your search or filters
                </p>
              </div>
            ) : (
              <div className="space-y-3">
                {results.map((place) => (
                  <div
                    key={place.id}
                    onClick={() => handlePlaceClick(place)}
                    className="bg-white dark:bg-gray-900 rounded-xl border border-gray-200 dark:border-gray-800 p-4 flex gap-4 cursor-pointer hover:shadow-md transition-shadow"
                  >
                    {/* Image */}
                    <div className="w-24 h-24 rounded-lg overflow-hidden bg-gray-100 dark:bg-gray-800 flex-shrink-0">
                      {place.photos[0] ? (
                        <img
                          src={place.photos[0]}
                          alt={place.name}
                          className="w-full h-full object-cover"
                        />
                      ) : (
                        <div className="w-full h-full flex items-center justify-center text-gray-400">
                          <MapPin className="w-8 h-8" />
                        </div>
                      )}
                    </div>

                    {/* Info */}
                    <div className="flex-1 min-w-0">
                      <h3 className="font-semibold text-gray-900 dark:text-white truncate">
                        {place.name}
                      </h3>
                      <p className="text-sm text-gray-500 dark:text-gray-400 flex items-center gap-1 mt-0.5">
                        <MapPin className="w-3 h-3" />
                        {place.location}
                      </p>
                      <div className="flex items-center gap-3 mt-2">
                        {place.rating > 0 && (
                          <span className="flex items-center gap-1 text-sm text-gray-600 dark:text-gray-300">
                            <Star className="w-4 h-4 text-yellow-400 fill-yellow-400" />
                            {place.rating.toFixed(1)}
                          </span>
                        )}
                        {place.estimatedCost && (
                          <span className="text-sm text-teal-600 dark:text-teal-400 font-medium">
                            P{place.estimatedCost.toLocaleString()}
                          </span>
                        )}
                        <span className="text-xs px-2 py-0.5 bg-gray-100 dark:bg-gray-800 rounded-full text-gray-600 dark:text-gray-400 capitalize">
                          {place.category}
                        </span>
                      </div>
                    </div>
                  </div>
                ))}
              </div>
            )}
          </div>
        )}

        {/* Empty State - Show before searching */}
        {!loading && !hasSearched && (
          <div className="mt-6 space-y-8">
            {/* Recent Searches */}
            {recentSearches.length > 0 && (
              <div>
                <div className="flex items-center justify-between mb-3">
                  <h3 className="text-sm font-medium text-gray-500 dark:text-gray-400 flex items-center gap-2">
                    <Clock className="w-4 h-4" />
                    Recent Searches
                  </h3>
                  <button
                    onClick={handleClearHistory}
                    className="text-xs text-gray-400 hover:text-gray-600 dark:hover:text-gray-300"
                  >
                    Clear all
                  </button>
                </div>
                <div className="space-y-1">
                  {recentSearches.map((search) => (
                    <div
                      key={search}
                      onClick={() => handleRecentClick(search)}
                      className="flex items-center justify-between px-3 py-2 rounded-lg hover:bg-gray-100 dark:hover:bg-gray-800 cursor-pointer group"
                    >
                      <span className="text-gray-700 dark:text-gray-300">{search}</span>
                      <button
                        onClick={(e) => handleRemoveRecent(search, e)}
                        className="p-1 text-gray-400 opacity-0 group-hover:opacity-100 hover:text-gray-600 transition-opacity"
                      >
                        <X className="w-4 h-4" />
                      </button>
                    </div>
                  ))}
                </div>
              </div>
            )}

            {/* Popular Searches */}
            <div>
              <h3 className="text-sm font-medium text-gray-500 dark:text-gray-400 flex items-center gap-2 mb-3">
                <TrendingUp className="w-4 h-4" />
                Popular Destinations
              </h3>
              <div className="flex flex-wrap gap-2">
                {POPULAR_SEARCHES.map((search) => (
                  <button
                    key={search}
                    onClick={() => handleRecentClick(search)}
                    className="px-4 py-2 bg-white dark:bg-gray-900 border border-gray-200 dark:border-gray-700 rounded-full text-sm text-gray-700 dark:text-gray-300 hover:border-teal-500 hover:text-teal-600 transition-colors"
                  >
                    {search}
                  </button>
                ))}
              </div>
            </div>
          </div>
        )}
      </div>

      {/* Add to Trip Modal */}
      <AddToTripModal
        isOpen={showAddModal}
        onClose={() => setShowAddModal(false)}
        place={selectedPlace}
        onSuccess={() => setShowAddModal(false)}
      />
    </div>
    </AppShell>
  )
}

export default function SearchPage() {
  return (
    <Suspense fallback={
      <div className="min-h-screen bg-gray-50 dark:bg-gray-950 flex items-center justify-center">
        <Loader2 className="w-8 h-8 text-teal-600 animate-spin" />
      </div>
    }>
      <SearchPageContent />
    </Suspense>
  )
}
