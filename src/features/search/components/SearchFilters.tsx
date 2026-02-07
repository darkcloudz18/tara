'use client'

import { useState, useEffect } from 'react'
import { X, ChevronDown, Star, MapPin, Wallet, Filter } from 'lucide-react'
import { PlaceCategory } from '@/features/planner/services/placeService'
import { searchService, SearchFilters as Filters } from '../services/searchService'

interface SearchFiltersProps {
  filters: Filters
  onChange: (filters: Filters) => void
  onClear: () => void
}

const CATEGORIES: { value: PlaceCategory | 'all'; label: string; icon: string }[] = [
  { value: 'all', label: 'All', icon: '🌍' },
  { value: 'stay', label: 'Stay', icon: '🏨' },
  { value: 'eat', label: 'Eat', icon: '🍽️' },
  { value: 'see', label: 'See', icon: '👀' },
  { value: 'do', label: 'Do', icon: '🎯' },
]

const RATING_OPTIONS = [
  { value: 0, label: 'Any rating' },
  { value: 3, label: '3+ stars' },
  { value: 4, label: '4+ stars' },
  { value: 4.5, label: '4.5+ stars' },
]

const PRICE_RANGES = [
  { min: 0, max: 0, label: 'Any price' },
  { min: 0, max: 500, label: 'Under P500' },
  { min: 500, max: 1500, label: 'P500 - P1,500' },
  { min: 1500, max: 5000, label: 'P1,500 - P5,000' },
  { min: 5000, max: 0, label: 'P5,000+' },
]

export default function SearchFilters({ filters, onChange, onClear }: SearchFiltersProps) {
  const [destinations, setDestinations] = useState<string[]>([])
  const [showFilters, setShowFilters] = useState(false)

  useEffect(() => {
    searchService.getDestinations().then(setDestinations)
  }, [])

  const activeFiltersCount = [
    filters.category && filters.category !== 'all',
    filters.destination && filters.destination !== 'all',
    filters.minRating && filters.minRating > 0,
    (filters.minPrice && filters.minPrice > 0) || (filters.maxPrice && filters.maxPrice > 0),
  ].filter(Boolean).length

  const handleCategoryChange = (category: PlaceCategory | 'all') => {
    onChange({ ...filters, category: category === 'all' ? undefined : category })
  }

  const handleDestinationChange = (destination: string) => {
    onChange({ ...filters, destination: destination === 'all' ? undefined : destination })
  }

  const handleRatingChange = (minRating: number) => {
    onChange({ ...filters, minRating: minRating === 0 ? undefined : minRating })
  }

  const handlePriceChange = (min: number, max: number) => {
    onChange({
      ...filters,
      minPrice: min === 0 ? undefined : min,
      maxPrice: max === 0 ? undefined : max,
    })
  }

  return (
    <div className="space-y-4">
      {/* Category Pills */}
      <div className="flex gap-2 overflow-x-auto pb-2 scrollbar-hide">
        {CATEGORIES.map((cat) => (
          <button
            key={cat.value}
            onClick={() => handleCategoryChange(cat.value)}
            className={`flex items-center gap-1.5 px-4 py-2 rounded-full text-sm font-medium whitespace-nowrap transition-colors ${
              (filters.category || 'all') === cat.value
                ? 'bg-teal-600 text-white'
                : 'bg-gray-100 dark:bg-gray-800 text-gray-700 dark:text-gray-300 hover:bg-gray-200 dark:hover:bg-gray-700'
            }`}
          >
            <span>{cat.icon}</span>
            {cat.label}
          </button>
        ))}
      </div>

      {/* Filter Toggle Button */}
      <button
        onClick={() => setShowFilters(!showFilters)}
        className="flex items-center gap-2 px-3 py-2 bg-gray-100 dark:bg-gray-800 rounded-lg text-sm text-gray-700 dark:text-gray-300 hover:bg-gray-200 dark:hover:bg-gray-700 transition-colors"
      >
        <Filter className="w-4 h-4" />
        Filters
        {activeFiltersCount > 0 && (
          <span className="px-1.5 py-0.5 bg-teal-600 text-white text-xs rounded-full">
            {activeFiltersCount}
          </span>
        )}
        <ChevronDown className={`w-4 h-4 transition-transform ${showFilters ? 'rotate-180' : ''}`} />
      </button>

      {/* Expanded Filters */}
      {showFilters && (
        <div className="bg-white dark:bg-gray-900 border border-gray-200 dark:border-gray-700 rounded-xl p-4 space-y-4 animate-fade-in">
          {/* Destination Filter */}
          <div>
            <label className="flex items-center gap-2 text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
              <MapPin className="w-4 h-4" />
              Destination
            </label>
            <select
              value={filters.destination || 'all'}
              onChange={(e) => handleDestinationChange(e.target.value)}
              className="w-full px-3 py-2 bg-gray-50 dark:bg-gray-800 border border-gray-200 dark:border-gray-700 rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-teal-500"
            >
              <option value="all">All destinations</option>
              {destinations.map((dest) => (
                <option key={dest} value={dest}>
                  {dest}
                </option>
              ))}
            </select>
          </div>

          {/* Rating Filter */}
          <div>
            <label className="flex items-center gap-2 text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
              <Star className="w-4 h-4" />
              Rating
            </label>
            <div className="flex gap-2 flex-wrap">
              {RATING_OPTIONS.map((option) => (
                <button
                  key={option.value}
                  onClick={() => handleRatingChange(option.value)}
                  className={`px-3 py-1.5 rounded-lg text-sm transition-colors ${
                    (filters.minRating || 0) === option.value
                      ? 'bg-teal-600 text-white'
                      : 'bg-gray-100 dark:bg-gray-800 text-gray-700 dark:text-gray-300 hover:bg-gray-200 dark:hover:bg-gray-700'
                  }`}
                >
                  {option.label}
                </button>
              ))}
            </div>
          </div>

          {/* Price Range Filter */}
          <div>
            <label className="flex items-center gap-2 text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
              <Wallet className="w-4 h-4" />
              Price Range
            </label>
            <div className="flex gap-2 flex-wrap">
              {PRICE_RANGES.map((range, idx) => {
                const isActive =
                  (filters.minPrice || 0) === range.min &&
                  (filters.maxPrice || 0) === range.max
                return (
                  <button
                    key={idx}
                    onClick={() => handlePriceChange(range.min, range.max)}
                    className={`px-3 py-1.5 rounded-lg text-sm transition-colors ${
                      isActive
                        ? 'bg-teal-600 text-white'
                        : 'bg-gray-100 dark:bg-gray-800 text-gray-700 dark:text-gray-300 hover:bg-gray-200 dark:hover:bg-gray-700'
                    }`}
                  >
                    {range.label}
                  </button>
                )
              })}
            </div>
          </div>

          {/* Clear Filters */}
          {activeFiltersCount > 0 && (
            <button
              onClick={onClear}
              className="flex items-center gap-2 px-3 py-2 text-sm text-red-600 dark:text-red-400 hover:bg-red-50 dark:hover:bg-red-900/20 rounded-lg transition-colors"
            >
              <X className="w-4 h-4" />
              Clear all filters
            </button>
          )}
        </div>
      )}
    </div>
  )
}
