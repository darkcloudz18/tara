'use client'

import { useState } from 'react'
import Link from 'next/link'
import { Search, SlidersHorizontal, MapPin, X } from 'lucide-react'

const categories = [
  { id: 'all', label: 'All', emoji: '🌴' },
  { id: 'beaches', label: 'Beaches', emoji: '🏖️' },
  { id: 'islands', label: 'Islands', emoji: '🏝️' },
  { id: 'mountains', label: 'Mountains', emoji: '⛰️' },
  { id: 'food', label: 'Food Spots', emoji: '🍜' },
  { id: 'heritage', label: 'Heritage', emoji: '🏛️' },
  { id: 'adventure', label: 'Adventure', emoji: '🏄' },
  { id: 'stays', label: 'Stays', emoji: '🏨' },
]

interface HeaderProps {
  selectedCategory: string
  onCategoryChange: (category: string) => void
  onSearch?: (query: string) => void
}

export default function Header({ selectedCategory, onCategoryChange, onSearch }: HeaderProps) {
  const [searchQuery, setSearchQuery] = useState('')
  const [showSearch, setShowSearch] = useState(false)

  const handleSearch = (e: React.FormEvent) => {
    e.preventDefault()
    onSearch?.(searchQuery)
  }

  return (
    <header className="sticky top-0 z-40 bg-white dark:bg-gray-950 border-b border-gray-200 dark:border-gray-800">
      {/* Top Bar */}
      <div className="px-4 py-3">
        <div className="max-w-7xl mx-auto flex items-center justify-between gap-4">
          {/* Logo */}
          <Link href="/" className="flex items-center gap-2 flex-shrink-0">
            <span className="text-2xl">🌴</span>
            <span className="text-xl font-bold text-teal-600 dark:text-teal-400">
              Tara
            </span>
          </Link>

          {/* Search Bar - Desktop */}
          <form onSubmit={handleSearch} className="hidden md:flex flex-1 max-w-xl">
            <div className="relative w-full">
              <MapPin className="absolute left-4 top-1/2 -translate-y-1/2 w-5 h-5 text-gray-400" />
              <input
                type="text"
                placeholder="Where in the Philippines?"
                value={searchQuery}
                onChange={(e) => setSearchQuery(e.target.value)}
                className="w-full pl-12 pr-12 py-3 bg-gray-100 dark:bg-gray-900 border border-gray-200 dark:border-gray-700 rounded-full text-gray-900 dark:text-white placeholder-gray-500 focus:outline-none focus:ring-2 focus:ring-teal-500 focus:border-transparent"
              />
              <button
                type="submit"
                className="absolute right-2 top-1/2 -translate-y-1/2 p-2 bg-teal-500 hover:bg-teal-600 rounded-full transition-colors"
              >
                <Search className="w-4 h-4 text-white" />
              </button>
            </div>
          </form>

          {/* Mobile Search Toggle */}
          <button
            onClick={() => setShowSearch(!showSearch)}
            className="md:hidden p-2 hover:bg-gray-100 dark:hover:bg-gray-800 rounded-full"
          >
            {showSearch ? (
              <X className="w-6 h-6 text-gray-600 dark:text-gray-300" />
            ) : (
              <Search className="w-6 h-6 text-gray-600 dark:text-gray-300" />
            )}
          </button>

          {/* Filter Button */}
          <button className="hidden md:flex items-center gap-2 px-4 py-2 border border-gray-300 dark:border-gray-600 rounded-full hover:bg-gray-50 dark:hover:bg-gray-800 transition-colors">
            <SlidersHorizontal className="w-4 h-4 text-gray-600 dark:text-gray-300" />
            <span className="text-sm font-medium text-gray-700 dark:text-gray-300">Filters</span>
          </button>
        </div>

        {/* Mobile Search - Expanded */}
        {showSearch && (
          <form onSubmit={handleSearch} className="mt-3 md:hidden">
            <div className="relative">
              <MapPin className="absolute left-4 top-1/2 -translate-y-1/2 w-5 h-5 text-gray-400" />
              <input
                type="text"
                placeholder="Where in the Philippines?"
                value={searchQuery}
                onChange={(e) => setSearchQuery(e.target.value)}
                className="w-full pl-12 pr-4 py-3 bg-gray-100 dark:bg-gray-900 border border-gray-200 dark:border-gray-700 rounded-xl text-gray-900 dark:text-white placeholder-gray-500 focus:outline-none focus:ring-2 focus:ring-teal-500"
                autoFocus
              />
            </div>
          </form>
        )}
      </div>

      {/* Category Tabs */}
      <div className="px-4 pb-3 overflow-x-auto scrollbar-hide">
        <div className="flex gap-2 max-w-7xl mx-auto" style={{ scrollbarWidth: 'none' }}>
          {categories.map((cat) => (
            <button
              key={cat.id}
              onClick={() => onCategoryChange(cat.id)}
              className={`flex items-center gap-2 px-4 py-2 rounded-full whitespace-nowrap transition-all ${
                selectedCategory === cat.id
                  ? 'bg-teal-500 text-white shadow-md'
                  : 'bg-gray-100 dark:bg-gray-800 text-gray-700 dark:text-gray-300 hover:bg-gray-200 dark:hover:bg-gray-700'
              }`}
            >
              <span>{cat.emoji}</span>
              <span className="text-sm font-medium">{cat.label}</span>
            </button>
          ))}
        </div>
      </div>
    </header>
  )
}
