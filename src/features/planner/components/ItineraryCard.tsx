'use client'

import { Itinerary } from '@/types/database'
import { format, differenceInDays } from 'date-fns'
import { formatCurrency } from '../hooks/useBudgetCalculations'
import Link from 'next/link'

interface ItineraryCardProps {
  itinerary: Itinerary
  onDelete?: (id: string) => void
}

export default function ItineraryCard({ itinerary, onDelete }: ItineraryCardProps) {
  const startDate = new Date(itinerary.start_date)
  const endDate = new Date(itinerary.end_date)
  const numDays = differenceInDays(endDate, startDate) + 1

  const handleDelete = (e: React.MouseEvent) => {
    e.preventDefault()
    e.stopPropagation()
    if (onDelete) {
      onDelete(itinerary.id)
    }
  }

  return (
    <Link href={`/planner/${itinerary.id}`}>
      <div className="card hover:shadow-lg transition-shadow cursor-pointer group">
        {/* Cover Image */}
        {itinerary.cover_image_url ? (
          <div className="h-40 -mx-6 -mt-6 mb-4 overflow-hidden rounded-t-lg">
            <img
              src={itinerary.cover_image_url}
              alt={itinerary.title}
              className="w-full h-full object-cover group-hover:scale-105 transition-transform"
            />
          </div>
        ) : (
          <div className="h-40 -mx-6 -mt-6 mb-4 bg-gradient-to-br from-primary-500 to-primary-700 rounded-t-lg flex items-center justify-center">
            <span className="text-6xl">🗺️</span>
          </div>
        )}

        {/* Content */}
        <div className="space-y-3">
          {/* Title */}
          <h3 className="font-semibold text-lg text-gray-900 line-clamp-1">
            {itinerary.title}
          </h3>

          {/* Destinations */}
          <div className="flex flex-wrap gap-1">
            {itinerary.destinations.slice(0, 3).map((dest, i) => (
              <span
                key={i}
                className="px-2 py-0.5 bg-primary-50 text-primary-700 text-xs rounded-full"
              >
                {dest}
              </span>
            ))}
            {itinerary.destinations.length > 3 && (
              <span className="px-2 py-0.5 bg-gray-100 text-gray-600 text-xs rounded-full">
                +{itinerary.destinations.length - 3}
              </span>
            )}
          </div>

          {/* Dates */}
          <div className="flex items-center text-sm text-gray-600">
            <svg
              className="w-4 h-4 mr-1.5"
              fill="none"
              stroke="currentColor"
              viewBox="0 0 24 24"
            >
              <path
                strokeLinecap="round"
                strokeLinejoin="round"
                strokeWidth={2}
                d="M8 7V3m8 4V3m-9 8h10M5 21h14a2 2 0 002-2V7a2 2 0 00-2-2H5a2 2 0 00-2 2v12a2 2 0 002 2z"
              />
            </svg>
            <span>
              {format(startDate, 'MMM d')} - {format(endDate, 'MMM d, yyyy')}
            </span>
            <span className="mx-2 text-gray-400">•</span>
            <span>{numDays} days</span>
          </div>

          {/* Budget */}
          {itinerary.total_budget && (
            <div className="flex items-center justify-between text-sm">
              <span className="text-gray-600">Budget</span>
              <span className="font-medium text-gray-900">
                {formatCurrency(itinerary.total_budget)}
              </span>
            </div>
          )}

          {/* Stats and Actions */}
          <div className="flex items-center justify-between pt-2 border-t border-gray-100">
            <div className="flex items-center gap-3 text-xs text-gray-500">
              {itinerary.is_public && (
                <span className="flex items-center gap-1">
                  <svg className="w-3.5 h-3.5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 12a3 3 0 11-6 0 3 3 0 016 0z" />
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M2.458 12C3.732 7.943 7.523 5 12 5c4.478 0 8.268 2.943 9.542 7-1.274 4.057-5.064 7-9.542 7-4.477 0-8.268-2.943-9.542-7z" />
                  </svg>
                  {itinerary.views_count}
                </span>
              )}
            </div>

            {onDelete && (
              <button
                onClick={handleDelete}
                className="p-1.5 text-gray-400 hover:text-red-500 hover:bg-red-50 rounded transition-colors opacity-0 group-hover:opacity-100"
                title="Delete itinerary"
              >
                <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 7l-.867 12.142A2 2 0 0116.138 21H7.862a2 2 0 01-1.995-1.858L5 7m5 4v6m4-6v6m1-10V4a1 1 0 00-1-1h-4a1 1 0 00-1 1v3M4 7h16" />
                </svg>
              </button>
            )}
          </div>
        </div>
      </div>
    </Link>
  )
}
