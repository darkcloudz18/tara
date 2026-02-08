'use client'

import { WifiOff, RefreshCcw, Home } from 'lucide-react'
import Link from 'next/link'

export default function OfflinePage() {
  return (
    <div className="min-h-screen bg-gray-50 dark:bg-gray-900 flex items-center justify-center px-4">
      <div className="max-w-md w-full text-center">
        {/* Offline Icon */}
        <div className="mb-6 inline-flex items-center justify-center w-20 h-20 rounded-full bg-gray-200 dark:bg-gray-800">
          <WifiOff className="w-10 h-10 text-gray-500 dark:text-gray-400" />
        </div>

        {/* Message */}
        <h1 className="text-2xl font-bold text-gray-900 dark:text-white mb-2">
          You're Offline
        </h1>
        <p className="text-gray-600 dark:text-gray-400 mb-8">
          It looks like you've lost your internet connection. Some features may be unavailable until you're back online.
        </p>

        {/* What you can still do */}
        <div className="bg-white dark:bg-gray-800 rounded-xl p-6 mb-8 text-left border border-gray-200 dark:border-gray-700">
          <h3 className="font-semibold text-gray-900 dark:text-white mb-3">
            While offline, you can:
          </h3>
          <ul className="space-y-2 text-sm text-gray-600 dark:text-gray-400">
            <li className="flex items-center gap-2">
              <span className="w-1.5 h-1.5 bg-teal-500 rounded-full" />
              View previously loaded trips
            </li>
            <li className="flex items-center gap-2">
              <span className="w-1.5 h-1.5 bg-teal-500 rounded-full" />
              Browse cached places and destinations
            </li>
            <li className="flex items-center gap-2">
              <span className="w-1.5 h-1.5 bg-teal-500 rounded-full" />
              View downloaded PDFs
            </li>
          </ul>
        </div>

        {/* Actions */}
        <div className="flex flex-col sm:flex-row gap-3 justify-center">
          <button
            onClick={() => window.location.reload()}
            className="inline-flex items-center justify-center gap-2 px-6 py-3 bg-teal-600 text-white font-semibold rounded-xl hover:bg-teal-700 transition-colors"
          >
            <RefreshCcw className="w-5 h-5" />
            Try Again
          </button>
          <Link
            href="/"
            className="inline-flex items-center justify-center gap-2 px-6 py-3 bg-gray-200 dark:bg-gray-700 text-gray-900 dark:text-white font-semibold rounded-xl hover:bg-gray-300 dark:hover:bg-gray-600 transition-colors"
          >
            <Home className="w-5 h-5" />
            Go Home
          </Link>
        </div>

        {/* Status indicator */}
        <div className="mt-8 flex items-center justify-center gap-2 text-sm text-gray-500 dark:text-gray-400">
          <span className="w-2 h-2 bg-red-500 rounded-full animate-pulse" />
          Waiting for connection...
        </div>
      </div>
    </div>
  )
}
