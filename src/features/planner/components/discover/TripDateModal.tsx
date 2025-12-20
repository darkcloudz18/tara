'use client'

import { useState } from 'react'
import { X, Calendar, Sparkles, Check, Loader2 } from 'lucide-react'
import { format, addDays, differenceInDays } from 'date-fns'

interface TripDateModalProps {
  isOpen: boolean
  onClose: () => void
  onCreateTrip: (data: {
    title: string
    startDate: string
    endDate: string
  }) => Promise<void>
  placeCount: number
  destinations: string[]
}

export default function TripDateModal({
  isOpen,
  onClose,
  onCreateTrip,
  placeCount,
  destinations,
}: TripDateModalProps) {
  const [startDate, setStartDate] = useState(
    format(addDays(new Date(), 7), 'yyyy-MM-dd')
  )
  const [endDate, setEndDate] = useState(
    format(addDays(new Date(), 10), 'yyyy-MM-dd')
  )
  const [tripName, setTripName] = useState(
    destinations.length > 0 ? `${destinations[0]} Adventure` : 'My Trip'
  )
  const [loading, setLoading] = useState(false)
  const [error, setError] = useState('')

  if (!isOpen) return null

  const dayCount = differenceInDays(new Date(endDate), new Date(startDate)) + 1

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()
    setError('')

    if (!tripName.trim()) {
      setError('Please enter a trip name')
      return
    }

    if (new Date(endDate) < new Date(startDate)) {
      setError('End date must be after start date')
      return
    }

    setLoading(true)
    try {
      await onCreateTrip({
        title: tripName,
        startDate,
        endDate,
      })
    } catch (err: any) {
      setError(err.message || 'Failed to create trip')
    } finally {
      setLoading(false)
    }
  }

  return (
    <div className="fixed inset-0 z-50 flex items-end sm:items-center justify-center">
      {/* Backdrop */}
      <div
        className="absolute inset-0 bg-black/50 backdrop-blur-sm"
        onClick={onClose}
      />

      {/* Modal */}
      <div className="relative w-full max-w-md bg-white rounded-t-3xl sm:rounded-2xl shadow-2xl animate-slide-up">
        {/* Close button */}
        <button
          onClick={onClose}
          className="absolute top-4 right-4 p-2 text-gray-400 hover:text-gray-600 rounded-full hover:bg-gray-100"
        >
          <X className="w-5 h-5" />
        </button>

        <form onSubmit={handleSubmit} className="p-6">
          {/* Header */}
          <div className="flex items-center gap-3 mb-6">
            <div className="p-2 bg-primary-100 rounded-xl">
              <Calendar className="w-6 h-6 text-primary-600" />
            </div>
            <h2 className="text-xl font-bold text-gray-900">
              When's your trip?
            </h2>
          </div>

          {error && (
            <div className="mb-4 p-3 bg-red-50 text-red-600 rounded-lg text-sm">
              {error}
            </div>
          )}

          {/* Start Date */}
          <div className="mb-4">
            <label className="block text-sm font-medium text-gray-700 mb-2">
              Start Date
            </label>
            <div className="relative">
              <Calendar className="absolute left-3 top-1/2 -translate-y-1/2 w-5 h-5 text-gray-400" />
              <input
                type="date"
                value={startDate}
                onChange={(e) => setStartDate(e.target.value)}
                min={format(new Date(), 'yyyy-MM-dd')}
                className="w-full pl-11 pr-4 py-3 border border-gray-200 rounded-xl focus:ring-2 focus:ring-primary-500 focus:border-primary-500 text-gray-900"
                required
              />
            </div>
          </div>

          {/* End Date */}
          <div className="mb-4">
            <label className="block text-sm font-medium text-gray-700 mb-2">
              End Date
            </label>
            <div className="relative">
              <Calendar className="absolute left-3 top-1/2 -translate-y-1/2 w-5 h-5 text-gray-400" />
              <input
                type="date"
                value={endDate}
                onChange={(e) => setEndDate(e.target.value)}
                min={startDate}
                className="w-full pl-11 pr-4 py-3 border border-gray-200 rounded-xl focus:ring-2 focus:ring-primary-500 focus:border-primary-500 text-gray-900"
                required
              />
            </div>
          </div>

          {/* Trip Name */}
          <div className="mb-6">
            <label className="block text-sm font-medium text-gray-700 mb-2">
              Trip Name
            </label>
            <input
              type="text"
              value={tripName}
              onChange={(e) => setTripName(e.target.value)}
              placeholder="My Amazing Trip"
              className="w-full px-4 py-3 border border-gray-200 rounded-xl focus:ring-2 focus:ring-primary-500 focus:border-primary-500 text-gray-900"
              required
            />
          </div>

          {/* Info Box */}
          <div className="mb-6 p-4 bg-primary-50 rounded-xl">
            <div className="flex items-start gap-3">
              <Sparkles className="w-5 h-5 text-primary-600 flex-shrink-0 mt-0.5" />
              <div>
                <p className="text-primary-900 font-medium">
                  We'll organize your {placeCount}{' '}
                  {placeCount === 1 ? 'place' : 'places'} into a {dayCount}-day
                  itinerary!
                </p>
                <p className="text-primary-700 text-sm mt-1">
                  You can always edit the details later.
                </p>
              </div>
            </div>
          </div>

          {/* Submit Button */}
          <button
            type="submit"
            disabled={loading}
            className="w-full flex items-center justify-center gap-2 px-6 py-4 bg-primary-600 text-white rounded-xl font-semibold text-lg transition-colors hover:bg-primary-700 disabled:opacity-50 disabled:cursor-not-allowed"
          >
            {loading ? (
              <>
                <Loader2 className="w-5 h-5 animate-spin" />
                Creating...
              </>
            ) : (
              <>
                <Check className="w-5 h-5" />
                Create My Trip
              </>
            )}
          </button>
        </form>
      </div>

      <style jsx>{`
        @keyframes slide-up {
          from {
            transform: translateY(100%);
            opacity: 0;
          }
          to {
            transform: translateY(0);
            opacity: 1;
          }
        }
        .animate-slide-up {
          animation: slide-up 0.3s ease-out;
        }
      `}</style>
    </div>
  )
}
