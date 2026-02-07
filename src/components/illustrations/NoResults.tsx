'use client'

import { Search, MapPin } from 'lucide-react'

interface NoResultsProps {
  className?: string
}

export default function NoResults({ className = '' }: NoResultsProps) {
  return (
    <div className={`flex flex-col items-center ${className}`}>
      <div className="relative">
        {/* Main circle with search icon */}
        <div className="w-28 h-28 bg-gradient-to-br from-gray-100 to-gray-200 dark:from-gray-800/50 dark:to-gray-700/50 rounded-full flex items-center justify-center">
          <Search className="w-12 h-12 text-gray-400 dark:text-gray-500" />
        </div>

        {/* Question marks floating around */}
        <div className="absolute -top-1 right-2 text-2xl text-gray-300 dark:text-gray-600 animate-pulse">
          ?
        </div>
        <div className="absolute top-4 -left-4 text-xl text-gray-300 dark:text-gray-600 animate-pulse" style={{ animationDelay: '0.3s' }}>
          ?
        </div>
        <div className="absolute -bottom-2 right-0 text-lg text-gray-300 dark:text-gray-600 animate-pulse" style={{ animationDelay: '0.6s' }}>
          ?
        </div>

        {/* Crossed out location pin */}
        <div className="absolute -bottom-3 -left-2">
          <div className="relative w-10 h-10 bg-red-100 dark:bg-red-900/30 rounded-full flex items-center justify-center">
            <MapPin className="w-5 h-5 text-red-400" />
            <div className="absolute inset-0 flex items-center justify-center">
              <div className="w-8 h-0.5 bg-red-400 rotate-45 rounded-full" />
            </div>
          </div>
        </div>
      </div>
    </div>
  )
}
