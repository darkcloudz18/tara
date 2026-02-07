'use client'

import { useState, useEffect } from 'react'
import { useRouter } from 'next/navigation'
import { X, Plus, MapPin, Calendar, Check, ChevronRight, Loader2 } from 'lucide-react'
import { useTripDrafts, TripWithDays } from '../hooks/useTripDrafts'
import { DiscoverPlace } from '../services/placeService'
import { ItineraryDay } from '@/types/database'
import { useLocalizedTrip } from '@/hooks/useLocalizedTrip'

interface AddToTripModalProps {
  isOpen: boolean
  onClose: () => void
  place: DiscoverPlace | null
  onSuccess?: (tripId: string) => void
}

type ModalStep = 'select-trip' | 'select-day' | 'success'

export default function AddToTripModal({
  isOpen,
  onClose,
  place,
  onSuccess,
}: AddToTripModalProps) {
  const router = useRouter()
  const { trips, loading, fetchUserTrips, fetchTripDays, addPlaceToTrip } = useTripDrafts()
  const t = useLocalizedTrip()

  const [step, setStep] = useState<ModalStep>('select-trip')
  const [selectedTrip, setSelectedTrip] = useState<TripWithDays | null>(null)
  const [days, setDays] = useState<ItineraryDay[]>([])
  const [loadingDays, setLoadingDays] = useState(false)
  const [saving, setSaving] = useState(false)
  const [addedTripId, setAddedTripId] = useState<string | null>(null)

  useEffect(() => {
    if (isOpen) {
      fetchUserTrips(10)
      setStep('select-trip')
      setSelectedTrip(null)
      setDays([])
      setAddedTripId(null)
    }
  }, [isOpen, fetchUserTrips])

  const handleSelectTrip = async (trip: TripWithDays) => {
    setSelectedTrip(trip)
    setLoadingDays(true)

    try {
      const tripDays = await fetchTripDays(trip.id)
      setDays(tripDays)
      setStep('select-day')
    } catch (err) {
      console.error('Failed to fetch trip days:', err)
    } finally {
      setLoadingDays(false)
    }
  }

  const handleSelectDay = async (day: ItineraryDay) => {
    if (!place || !selectedTrip) return

    setSaving(true)
    try {
      await addPlaceToTrip(day.id, place)
      setAddedTripId(selectedTrip.id)
      setStep('success')
      onSuccess?.(selectedTrip.id)
    } catch (err) {
      console.error('Failed to add place to trip:', err)
    } finally {
      setSaving(false)
    }
  }

  const handleCreateNewTrip = () => {
    if (!place) return
    // Redirect to planner with place ID as query param
    router.push(`/planner/new?place=${place.id}`)
    onClose()
  }

  const handleViewTrip = () => {
    if (addedTripId) {
      router.push(`/planner/${addedTripId}`)
    }
    onClose()
  }

  const formatDate = (dateString: string) => {
    return new Date(dateString).toLocaleDateString('en-US', {
      month: 'short',
      day: 'numeric',
    })
  }

  const formatDayTitle = (day: ItineraryDay) => {
    const dateStr = formatDate(day.date)
    return day.title ? `Day ${day.day_number} - ${dateStr} (${day.title})` : `Day ${day.day_number} - ${dateStr}`
  }

  if (!isOpen || !place) return null

  return (
    <div className="fixed inset-0 z-[100] flex items-center justify-center bg-black/50 backdrop-blur-sm p-4">
      <div className="bg-white dark:bg-gray-900 rounded-2xl max-w-md w-full max-h-[80vh] overflow-hidden relative">
        {/* Header */}
        <div className="flex items-center justify-between p-4 border-b border-gray-100 dark:border-gray-800">
          <h2 className="text-lg font-bold text-gray-900 dark:text-white">
            {step === 'select-trip' && t.addToTrip}
            {step === 'select-day' && 'Select Day'}
            {step === 'success' && 'Added!'}
          </h2>
          <button
            onClick={onClose}
            className="p-2 hover:bg-gray-100 dark:hover:bg-gray-800 rounded-full transition-colors"
          >
            <X className="w-5 h-5 text-gray-500" />
          </button>
        </div>

        {/* Place Preview */}
        {step !== 'success' && (
          <div className="p-4 border-b border-gray-100 dark:border-gray-800 bg-gray-50 dark:bg-gray-800/50">
            <div className="flex items-center gap-3">
              <div className="w-14 h-14 rounded-lg overflow-hidden bg-gray-200 dark:bg-gray-700 flex-shrink-0">
                <img
                  src={place.photos?.[0] || 'https://images.unsplash.com/photo-1518509562904-e7ef99cdcc86?w=200'}
                  alt={place.name}
                  className="w-full h-full object-cover"
                />
              </div>
              <div className="flex-1 min-w-0">
                <h3 className="font-semibold text-gray-900 dark:text-white truncate">{place.name}</h3>
                <p className="text-sm text-gray-500 dark:text-gray-400 flex items-center gap-1">
                  <MapPin className="w-3.5 h-3.5" />
                  {place.location}
                </p>
              </div>
            </div>
          </div>
        )}

        {/* Content */}
        <div className="overflow-y-auto" style={{ maxHeight: 'calc(80vh - 180px)' }}>
          {/* Step 1: Select Trip */}
          {step === 'select-trip' && (
            <div className="p-4 space-y-2">
              {/* Create New Trip Option */}
              <button
                onClick={handleCreateNewTrip}
                className="w-full flex items-center gap-3 p-4 rounded-xl border-2 border-dashed border-teal-300 dark:border-teal-700 hover:bg-teal-50 dark:hover:bg-teal-900/20 transition-colors"
              >
                <div className="w-10 h-10 rounded-full bg-teal-100 dark:bg-teal-900 flex items-center justify-center">
                  <Plus className="w-5 h-5 text-teal-600 dark:text-teal-400" />
                </div>
                <div className="text-left">
                  <p className="font-semibold text-teal-600 dark:text-teal-400">Create New {t.trip}</p>
                  <p className="text-sm text-gray-500 dark:text-gray-400">Start planning a new adventure</p>
                </div>
              </button>

              {/* Loading State */}
              {loading && (
                <div className="flex items-center justify-center py-8">
                  <Loader2 className="w-6 h-6 text-teal-500 animate-spin" />
                </div>
              )}

              {/* Existing Trips */}
              {!loading && trips.length > 0 && (
                <>
                  <p className="text-sm text-gray-500 dark:text-gray-400 pt-2 pb-1">Your {t.trips}</p>
                  {trips.slice(0, 5).map((trip) => (
                    <button
                      key={trip.id}
                      onClick={() => handleSelectTrip(trip)}
                      className="w-full flex items-center gap-3 p-4 rounded-xl bg-gray-50 dark:bg-gray-800 hover:bg-gray-100 dark:hover:bg-gray-700 transition-colors"
                    >
                      {/* Trip Thumbnail */}
                      <div className="w-12 h-12 rounded-lg overflow-hidden bg-gray-200 dark:bg-gray-700 flex-shrink-0">
                        {trip.cover_image_url ? (
                          <img
                            src={trip.cover_image_url}
                            alt={trip.title}
                            className="w-full h-full object-cover"
                          />
                        ) : (
                          <div className="w-full h-full flex items-center justify-center bg-gradient-to-br from-teal-400 to-teal-600">
                            <MapPin className="w-5 h-5 text-white" />
                          </div>
                        )}
                      </div>
                      {/* Trip Info */}
                      <div className="flex-1 min-w-0 text-left">
                        <p className="font-semibold text-gray-900 dark:text-white truncate">{trip.title}</p>
                        <p className="text-sm text-gray-500 dark:text-gray-400 flex items-center gap-1">
                          <Calendar className="w-3.5 h-3.5" />
                          {formatDate(trip.start_date)} - {formatDate(trip.end_date)}
                        </p>
                      </div>
                      <ChevronRight className="w-5 h-5 text-gray-400" />
                    </button>
                  ))}
                </>
              )}

              {/* Empty State */}
              {!loading && trips.length === 0 && (
                <div className="text-center py-8">
                  <p className="text-gray-500 dark:text-gray-400">No {t.trips.toLowerCase()} yet. Create your first {t.trip.toLowerCase()}!</p>
                </div>
              )}
            </div>
          )}

          {/* Step 2: Select Day */}
          {step === 'select-day' && selectedTrip && (
            <div className="p-4 space-y-2">
              {/* Back Button */}
              <button
                onClick={() => setStep('select-trip')}
                className="text-sm text-teal-600 dark:text-teal-400 hover:underline mb-2"
              >
                ← Back to {t.trips.toLowerCase()}
              </button>

              <p className="text-sm text-gray-500 dark:text-gray-400 pb-1">
                Select a day for <span className="font-medium">{selectedTrip.title}</span>
              </p>

              {loadingDays ? (
                <div className="flex items-center justify-center py-8">
                  <Loader2 className="w-6 h-6 text-teal-500 animate-spin" />
                </div>
              ) : days.length > 0 ? (
                days.map((day) => (
                  <button
                    key={day.id}
                    onClick={() => handleSelectDay(day)}
                    disabled={saving}
                    className="w-full flex items-center gap-3 p-4 rounded-xl bg-gray-50 dark:bg-gray-800 hover:bg-gray-100 dark:hover:bg-gray-700 transition-colors disabled:opacity-50"
                  >
                    <div className="w-10 h-10 rounded-full bg-teal-100 dark:bg-teal-900 flex items-center justify-center">
                      <span className="font-bold text-teal-600 dark:text-teal-400">{day.day_number}</span>
                    </div>
                    <div className="flex-1 text-left">
                      <p className="font-medium text-gray-900 dark:text-white">{formatDayTitle(day)}</p>
                    </div>
                    {saving && (
                      <Loader2 className="w-5 h-5 text-teal-500 animate-spin" />
                    )}
                  </button>
                ))
              ) : (
                <div className="text-center py-8">
                  <p className="text-gray-500 dark:text-gray-400">No days in this {t.trip.toLowerCase()} yet.</p>
                  <button
                    onClick={() => router.push(`/planner/${selectedTrip.id}`)}
                    className="mt-2 text-teal-600 dark:text-teal-400 hover:underline"
                  >
                    Go to {t.trip.toLowerCase()} to add days
                  </button>
                </div>
              )}
            </div>
          )}

          {/* Step 3: Success */}
          {step === 'success' && (
            <div className="p-8 text-center">
              <div className="w-16 h-16 bg-green-100 dark:bg-green-900 rounded-full flex items-center justify-center mx-auto mb-4">
                <Check className="w-8 h-8 text-green-600 dark:text-green-400" />
              </div>
              <h3 className="text-lg font-bold text-gray-900 dark:text-white mb-2">
                Added to {t.trip}!
              </h3>
              <p className="text-gray-600 dark:text-gray-400 mb-6">
                <span className="font-medium">{place.name}</span> has been added to your {t.trip.toLowerCase()}.
              </p>
              <div className="space-y-3">
                <button
                  onClick={handleViewTrip}
                  className="w-full py-3 bg-teal-500 text-white rounded-xl font-semibold hover:bg-teal-600 transition-colors"
                >
                  {t.viewTrip}
                </button>
                <button
                  onClick={onClose}
                  className="w-full py-3 bg-gray-100 dark:bg-gray-800 text-gray-700 dark:text-gray-300 rounded-xl font-semibold hover:bg-gray-200 dark:hover:bg-gray-700 transition-colors"
                >
                  Keep Browsing
                </button>
              </div>
            </div>
          )}
        </div>
      </div>
    </div>
  )
}
