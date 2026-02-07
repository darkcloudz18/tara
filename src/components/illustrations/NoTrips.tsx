'use client'

import { MapPin, Compass } from 'lucide-react'

interface NoTripsProps {
  className?: string
}

export default function NoTrips({ className = '' }: NoTripsProps) {
  return (
    <div className={`flex flex-col items-center ${className}`}>
      <div className="relative">
        {/* Main circle */}
        <div className="w-32 h-32 bg-gradient-to-br from-teal-100 to-teal-200 dark:from-teal-900/30 dark:to-teal-800/30 rounded-full flex items-center justify-center">
          <Compass className="w-14 h-14 text-teal-500 dark:text-teal-400" />
        </div>

        {/* Floating pins */}
        <div className="absolute -top-2 -right-2 w-10 h-10 bg-coral-100 dark:bg-coral-900/30 rounded-full flex items-center justify-center animate-bounce" style={{ animationDelay: '0s', animationDuration: '2s' }}>
          <MapPin className="w-5 h-5 text-coral-500" />
        </div>
        <div className="absolute -bottom-1 -left-3 w-8 h-8 bg-blue-100 dark:bg-blue-900/30 rounded-full flex items-center justify-center animate-bounce" style={{ animationDelay: '0.5s', animationDuration: '2.5s' }}>
          <MapPin className="w-4 h-4 text-blue-500" />
        </div>
        <div className="absolute top-1/2 -right-6 w-6 h-6 bg-amber-100 dark:bg-amber-900/30 rounded-full flex items-center justify-center animate-bounce" style={{ animationDelay: '1s', animationDuration: '3s' }}>
          <MapPin className="w-3 h-3 text-amber-500" />
        </div>

        {/* Dashed path */}
        <svg className="absolute inset-0 w-full h-full" viewBox="0 0 128 128">
          <path
            d="M 20 100 Q 40 60 64 64 Q 88 68 100 40"
            stroke="currentColor"
            strokeWidth="2"
            strokeDasharray="4 4"
            fill="none"
            className="text-gray-300 dark:text-gray-700"
          />
        </svg>
      </div>
    </div>
  )
}
