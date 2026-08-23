import Link from 'next/link'
import { MapPin, ArrowRight, Sparkles } from 'lucide-react'
import ErrorRouteFlag from '@/components/pwa/ErrorRouteFlag'

export default function TripNotFound() {
  return (
    <div className="min-h-screen bg-gray-50 dark:bg-black flex items-center justify-center p-4">
      <ErrorRouteFlag />
      <div className="max-w-md w-full text-center">
        {/* Icon */}
        <div className="w-20 h-20 bg-gray-100 dark:bg-gray-800 rounded-full flex items-center justify-center mx-auto mb-6">
          <MapPin className="w-10 h-10 text-gray-400" />
        </div>

        {/* Message */}
        <h1 className="text-2xl font-bold text-gray-900 dark:text-white mb-2">
          Lakad not found
        </h1>
        <p className="text-gray-500 dark:text-gray-400 mb-8">
          This trip may have been deleted or made private by its owner.
        </p>

        {/* CTAs */}
        <div className="space-y-3">
          <Link
            href="/trip/new"
            className="flex items-center justify-center gap-2 w-full py-3 bg-teal-500 text-white font-semibold rounded-xl hover:bg-teal-600 transition-colors"
          >
            Plan your own lakad
            <ArrowRight className="w-5 h-5" />
          </Link>
          <Link
            href="/"
            className="flex items-center justify-center gap-2 w-full py-3 bg-gray-100 dark:bg-gray-800 text-gray-700 dark:text-gray-300 font-semibold rounded-xl hover:bg-gray-200 dark:hover:bg-gray-700 transition-colors"
          >
            <Sparkles className="w-5 h-5" />
            Explore destinations
          </Link>
        </div>

        {/* Footer */}
        <p className="mt-8 text-sm text-gray-400">
          <Link href="/" className="hover:text-teal-500 transition-colors">
            Tara
          </Link>
          {' '}&mdash; The free trip planner for the Philippines
        </p>
      </div>
    </div>
  )
}
