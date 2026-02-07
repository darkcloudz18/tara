'use client'

import { Bell, BellOff, Check } from 'lucide-react'

interface NoNotificationsProps {
  className?: string
}

export default function NoNotifications({ className = '' }: NoNotificationsProps) {
  return (
    <div className={`flex flex-col items-center ${className}`}>
      <div className="relative">
        {/* Main bell */}
        <div className="w-28 h-28 bg-gradient-to-br from-teal-50 to-teal-100 dark:from-teal-900/20 dark:to-teal-800/20 rounded-full flex items-center justify-center">
          <Bell className="w-12 h-12 text-teal-400 dark:text-teal-500" />
        </div>

        {/* Checkmark badge */}
        <div className="absolute -top-1 -right-1 w-10 h-10 bg-green-100 dark:bg-green-900/30 rounded-full flex items-center justify-center">
          <Check className="w-5 h-5 text-green-500" />
        </div>

        {/* Sound waves (muted) */}
        <div className="absolute top-1/2 -translate-y-1/2 -right-6 space-y-1.5 opacity-30">
          <div className="w-3 h-0.5 bg-gray-400 dark:bg-gray-600 rounded-full" />
          <div className="w-4 h-0.5 bg-gray-400 dark:bg-gray-600 rounded-full" />
          <div className="w-2 h-0.5 bg-gray-400 dark:bg-gray-600 rounded-full" />
        </div>
        <div className="absolute top-1/2 -translate-y-1/2 -left-6 space-y-1.5 opacity-30">
          <div className="w-3 h-0.5 bg-gray-400 dark:bg-gray-600 rounded-full" />
          <div className="w-4 h-0.5 bg-gray-400 dark:bg-gray-600 rounded-full" />
          <div className="w-2 h-0.5 bg-gray-400 dark:bg-gray-600 rounded-full" />
        </div>

        {/* Sparkles */}
        <div className="absolute -top-3 left-4 text-yellow-400 text-sm">*</div>
        <div className="absolute bottom-0 -right-4 text-yellow-400 text-xs">*</div>
      </div>
    </div>
  )
}
