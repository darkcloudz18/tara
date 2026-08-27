'use client'

import { useState, useEffect } from 'react'
import Link from 'next/link'
import { useRouter } from 'next/navigation'
import {
  Search,
  SlidersHorizontal,
  MapPin,
  X,
  Bell,
  Palmtree,
  Waves,
  Mountain,
  UtensilsCrossed,
  Landmark,
  Compass,
  Hotel,
  Sunrise
} from 'lucide-react'
import TaraLogo from '@/components/icons/TaraLogo'
import { useUser } from '@/contexts/UserContext'
import { notificationService } from '@/features/notifications/services/notificationService'

const categories = [
  { id: 'all', label: 'All', icon: Compass },
  { id: 'beaches', label: 'Beaches', icon: Waves },
  { id: 'islands', label: 'Islands', icon: Sunrise },
  { id: 'mountains', label: 'Mountains', icon: Mountain },
  { id: 'food', label: 'Food Spots', icon: UtensilsCrossed },
  { id: 'heritage', label: 'Heritage', icon: Landmark },
  { id: 'adventure', label: 'Adventure', icon: Palmtree },
  { id: 'stays', label: 'Stays', icon: Hotel },
]

interface HeaderProps {
  selectedCategory: string
  onCategoryChange: (category: string) => void
  onSearch?: (query: string) => void
}

export default function Header({ selectedCategory, onCategoryChange, onSearch }: HeaderProps) {
  const { user } = useUser()
  const router = useRouter()
  const [searchQuery, setSearchQuery] = useState('')
  const [showSearch, setShowSearch] = useState(false)
  const [unreadCount, setUnreadCount] = useState(0)

  useEffect(() => {
    if (!user) {
      setUnreadCount(0)
      return
    }
    notificationService.getUnreadCount(user.id).then(setUnreadCount)
    const unsubscribe = notificationService.subscribeToNotifications(user.id, () => {
      notificationService.getUnreadCount(user.id).then(setUnreadCount)
    })
    return () => unsubscribe()
  }, [user])

  const handleSearch = (e: React.FormEvent) => {
    e.preventDefault()
    if (searchQuery.trim()) {
      router.push(`/search?q=${encodeURIComponent(searchQuery.trim())}`)
    } else {
      router.push('/search')
    }
  }

  return (
    <header className="sticky top-0 z-40 bg-white dark:bg-gray-950 border-b border-gray-200 dark:border-gray-800">
      {/* Top Bar */}
      <div className="px-4 py-3">
        <div className="max-w-7xl mx-auto flex items-center justify-between gap-4">
          {/* Logo */}
          <Link href="/" className="flex items-center gap-2 flex-shrink-0">
            <TaraLogo className="w-8 h-8 text-teal-500" />
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
                aria-label="Search"
                className="absolute right-2 top-1/2 -translate-y-1/2 p-2 bg-gray-200 hover:bg-gray-300 dark:bg-gray-700 dark:hover:bg-gray-600 rounded-full transition-colors"
              >
                <Search className="w-4 h-4 text-gray-700 dark:text-gray-200" />
              </button>
            </div>
          </form>

          {/* Mobile Search Toggle + optional Bell */}
          <div className="md:hidden flex items-center gap-1">
            <button
              onClick={() => setShowSearch(!showSearch)}
              aria-label={showSearch ? 'Close search' : 'Open search'}
              className="p-2 hover:bg-gray-100 dark:hover:bg-gray-800 rounded-full"
            >
              {showSearch ? (
                <X className="w-6 h-6 text-gray-600 dark:text-gray-300" />
              ) : (
                <Search className="w-6 h-6 text-gray-600 dark:text-gray-300" />
              )}
            </button>
            {user && (
              <Link
                href="/notifications"
                aria-label={`Notifications${unreadCount > 0 ? ` (${unreadCount} unread)` : ''}`}
                className="relative p-2 hover:bg-gray-100 dark:hover:bg-gray-800 rounded-full"
              >
                <Bell className="w-6 h-6 text-gray-600 dark:text-gray-300" />
                {unreadCount > 0 && (
                  <span className="absolute top-1 right-1 min-w-[18px] h-[18px] bg-coral-500 text-white text-[10px] font-bold rounded-full flex items-center justify-center px-1">
                    {unreadCount > 9 ? '9+' : unreadCount}
                  </span>
                )}
              </Link>
            )}
          </div>

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
          {categories.map((cat) => {
            const Icon = cat.icon
            return (
              <button
                key={cat.id}
                onClick={() => onCategoryChange(cat.id)}
                className={`flex items-center gap-2 px-4 py-2 rounded-full whitespace-nowrap transition-all ${
                  selectedCategory === cat.id
                    ? 'bg-teal-500 text-white shadow-md'
                    : 'bg-gray-100 dark:bg-gray-800 text-gray-700 dark:text-gray-300 hover:bg-gray-200 dark:hover:bg-gray-700'
                }`}
              >
                <Icon className="w-4 h-4" />
                <span className="text-sm font-medium">{cat.label}</span>
              </button>
            )
          })}
        </div>
      </div>
    </header>
  )
}
