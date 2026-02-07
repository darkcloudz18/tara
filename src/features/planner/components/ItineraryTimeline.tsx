'use client'

import { useState } from 'react'
import {
  Plane,
  Bus,
  Ship,
  Car,
  Hotel,
  UtensilsCrossed,
  Camera,
  Moon,
  Clock,
  MapPin,
  Star,
  ChevronDown,
  ChevronUp,
  Check,
  Plus,
  Sparkles,
  BadgeCheck,
} from 'lucide-react'
import {
  DaySuggestion,
  TimeSlotSuggestion,
  TransportSuggestion,
  AccommodationSuggestion,
  ActivitySuggestion,
} from '../services/suggestionService'

interface ItineraryTimelineProps {
  days: DaySuggestion[]
  onSelectSuggestion: (
    dayIndex: number,
    slotIndex: number,
    suggestion: TransportSuggestion | AccommodationSuggestion | ActivitySuggestion
  ) => void
  onBookItem: (
    item: TransportSuggestion | AccommodationSuggestion | ActivitySuggestion
  ) => void
}

export default function ItineraryTimeline({
  days,
  onSelectSuggestion,
  onBookItem,
}: ItineraryTimelineProps) {
  const [expandedDay, setExpandedDay] = useState<number>(0)
  const [expandedSlot, setExpandedSlot] = useState<{ day: number; slot: number } | null>(null)

  const getSlotIcon = (type: TimeSlotSuggestion['type']) => {
    switch (type) {
      case 'transport':
        return Plane
      case 'accommodation':
        return Hotel
      case 'meal':
        return UtensilsCrossed
      case 'activity':
        return Camera
      case 'free_time':
        return Moon
      default:
        return Clock
    }
  }

  const getSlotColor = (type: TimeSlotSuggestion['type']) => {
    switch (type) {
      case 'transport':
        return 'bg-blue-500'
      case 'accommodation':
        return 'bg-purple-500'
      case 'meal':
        return 'bg-orange-500'
      case 'activity':
        return 'bg-teal-500'
      case 'free_time':
        return 'bg-gray-400'
      default:
        return 'bg-gray-500'
    }
  }

  const getTransportIcon = (type: TransportSuggestion['type']) => {
    switch (type) {
      case 'flight':
        return Plane
      case 'bus':
        return Bus
      case 'ferry':
        return Ship
      case 'van':
      case 'car_rental':
        return Car
      default:
        return Car
    }
  }

  const formatDuration = (minutes: number) => {
    const hours = Math.floor(minutes / 60)
    const mins = minutes % 60
    if (hours === 0) return `${mins}m`
    if (mins === 0) return `${hours}h`
    return `${hours}h ${mins}m`
  }

  const formatDate = (dateStr: string) => {
    const date = new Date(dateStr)
    return date.toLocaleDateString('en-US', {
      weekday: 'short',
      month: 'short',
      day: 'numeric',
    })
  }

  return (
    <div className="space-y-4">
      {days.map((day, dayIndex) => (
        <div
          key={day.day_number}
          className="bg-white dark:bg-gray-900 rounded-2xl overflow-hidden shadow-sm border border-gray-200 dark:border-gray-800"
        >
          {/* Day Header */}
          <button
            onClick={() => setExpandedDay(expandedDay === dayIndex ? -1 : dayIndex)}
            className="w-full px-6 py-4 flex items-center justify-between hover:bg-gray-50 dark:hover:bg-gray-800 transition-colors"
          >
            <div className="flex items-center gap-4">
              <div className="w-12 h-12 bg-teal-100 dark:bg-teal-900 rounded-xl flex items-center justify-center">
                <span className="text-teal-600 dark:text-teal-400 font-bold text-lg">
                  {day.day_number}
                </span>
              </div>
              <div className="text-left">
                <h3 className="font-semibold text-gray-900 dark:text-white">
                  {day.title}
                </h3>
                <p className="text-sm text-gray-500 dark:text-gray-400">
                  {formatDate(day.date)} • {day.activities.length} activities
                </p>
              </div>
            </div>
            {expandedDay === dayIndex ? (
              <ChevronUp className="w-5 h-5 text-gray-400" />
            ) : (
              <ChevronDown className="w-5 h-5 text-gray-400" />
            )}
          </button>

          {/* Day Timeline */}
          {expandedDay === dayIndex && (
            <div className="px-6 pb-6">
              <div className="relative">
                {/* Timeline Line */}
                <div className="absolute left-6 top-0 bottom-0 w-0.5 bg-gray-200 dark:bg-gray-700" />

                {/* Time Slots */}
                <div className="space-y-4">
                  {day.activities.map((slot, slotIndex) => {
                    const SlotIcon = getSlotIcon(slot.type)
                    const isExpanded =
                      expandedSlot?.day === dayIndex && expandedSlot?.slot === slotIndex

                    return (
                      <div key={slotIndex} className="relative pl-16">
                        {/* Time Marker */}
                        <div className="absolute left-0 top-0 flex items-center">
                          <span className="text-sm font-medium text-gray-500 dark:text-gray-400 w-12">
                            {slot.time}
                          </span>
                          <div
                            className={`w-4 h-4 rounded-full ${getSlotColor(slot.type)} ring-4 ring-white dark:ring-gray-900`}
                          />
                        </div>

                        {/* Slot Card */}
                        <div
                          className={`bg-gray-50 dark:bg-gray-800 rounded-xl overflow-hidden transition-all ${
                            isExpanded ? 'ring-2 ring-teal-500' : ''
                          }`}
                        >
                          {/* Slot Header */}
                          <button
                            onClick={() =>
                              setExpandedSlot(
                                isExpanded ? null : { day: dayIndex, slot: slotIndex }
                              )
                            }
                            className="w-full p-4 flex items-center justify-between hover:bg-gray-100 dark:hover:bg-gray-700 transition-colors"
                          >
                            <div className="flex items-center gap-3">
                              <div
                                className={`w-10 h-10 rounded-lg ${getSlotColor(slot.type)} bg-opacity-20 flex items-center justify-center`}
                              >
                                <SlotIcon
                                  className={`w-5 h-5 ${getSlotColor(slot.type).replace('bg-', 'text-')}`}
                                />
                              </div>
                              <div className="text-left">
                                <h4 className="font-medium text-gray-900 dark:text-white">
                                  {slot.title}
                                </h4>
                                <p className="text-sm text-gray-500 dark:text-gray-400">
                                  {slot.description} • {formatDuration(slot.duration_minutes)}
                                </p>
                              </div>
                            </div>
                            <div className="flex items-center gap-2">
                              {slot.selected && (
                                <span className="px-2 py-1 bg-teal-100 dark:bg-teal-900 text-teal-700 dark:text-teal-300 text-xs font-medium rounded-full">
                                  Selected
                                </span>
                              )}
                              {slot.suggestions.length > 0 && (
                                <span className="text-sm text-gray-400">
                                  {slot.suggestions.length} options
                                </span>
                              )}
                              {isExpanded ? (
                                <ChevronUp className="w-5 h-5 text-gray-400" />
                              ) : (
                                <ChevronDown className="w-5 h-5 text-gray-400" />
                              )}
                            </div>
                          </button>

                          {/* Suggestions */}
                          {isExpanded && slot.suggestions.length > 0 && (
                            <div className="px-4 pb-4 space-y-3">
                              <div className="flex items-center gap-2 text-sm text-gray-500 dark:text-gray-400">
                                <Sparkles className="w-4 h-4" />
                                <span>Suggestions for you</span>
                              </div>

                              {slot.type === 'transport' && (
                                <TransportSuggestions
                                  suggestions={slot.suggestions as TransportSuggestion[]}
                                  onSelect={(s) => onSelectSuggestion(dayIndex, slotIndex, s)}
                                  onBook={onBookItem}
                                  selected={slot.selected as TransportSuggestion}
                                />
                              )}

                              {slot.type === 'accommodation' && (
                                <AccommodationSuggestions
                                  suggestions={slot.suggestions as AccommodationSuggestion[]}
                                  onSelect={(s) => onSelectSuggestion(dayIndex, slotIndex, s)}
                                  onBook={onBookItem}
                                  selected={slot.selected as AccommodationSuggestion}
                                />
                              )}

                              {(slot.type === 'activity' || slot.type === 'meal') && (
                                <ActivitySuggestions
                                  suggestions={slot.suggestions as ActivitySuggestion[]}
                                  onSelect={(s) => onSelectSuggestion(dayIndex, slotIndex, s)}
                                  onBook={onBookItem}
                                  selected={slot.selected as ActivitySuggestion}
                                />
                              )}
                            </div>
                          )}
                        </div>
                      </div>
                    )
                  })}
                </div>
              </div>
            </div>
          )}
        </div>
      ))}
    </div>
  )
}

// Transport Suggestions Component
function TransportSuggestions({
  suggestions,
  onSelect,
  onBook,
  selected,
}: {
  suggestions: TransportSuggestion[]
  onSelect: (s: TransportSuggestion) => void
  onBook: (s: TransportSuggestion) => void
  selected?: TransportSuggestion
}) {
  return (
    <div className="space-y-2">
      {suggestions.slice(0, 5).map((transport) => {
        const Icon = transport.type === 'flight' ? Plane :
                    transport.type === 'bus' ? Bus :
                    transport.type === 'ferry' ? Ship : Car
        const isSelected = selected?.id === transport.id

        return (
          <div
            key={transport.id}
            className={`p-4 bg-white dark:bg-gray-900 rounded-xl border-2 transition-all ${
              isSelected
                ? 'border-teal-500'
                : 'border-gray-200 dark:border-gray-700 hover:border-gray-300 dark:hover:border-gray-600'
            }`}
          >
            <div className="flex items-center justify-between">
              <div className="flex items-center gap-4">
                <div className={`w-12 h-12 rounded-xl flex items-center justify-center ${
                  transport.type === 'flight' ? 'bg-blue-100 dark:bg-blue-900' :
                  transport.type === 'bus' ? 'bg-green-100 dark:bg-green-900' :
                  transport.type === 'ferry' ? 'bg-cyan-100 dark:bg-cyan-900' :
                  'bg-gray-100 dark:bg-gray-800'
                }`}>
                  <Icon className={`w-6 h-6 ${
                    transport.type === 'flight' ? 'text-blue-600 dark:text-blue-400' :
                    transport.type === 'bus' ? 'text-green-600 dark:text-green-400' :
                    transport.type === 'ferry' ? 'text-cyan-600 dark:text-cyan-400' :
                    'text-gray-600 dark:text-gray-400'
                  }`} />
                </div>
                <div>
                  <div className="flex items-center gap-2">
                    <span className="font-semibold text-gray-900 dark:text-white">
                      {transport.provider}
                    </span>
                    {transport.is_supplier && (
                      <span className="flex items-center gap-1 px-2 py-0.5 bg-amber-100 dark:bg-amber-900 text-amber-700 dark:text-amber-300 text-xs font-medium rounded-full">
                        <BadgeCheck className="w-3 h-3" />
                        Partner
                      </span>
                    )}
                  </div>
                  <div className="flex items-center gap-3 text-sm text-gray-500 dark:text-gray-400">
                    <span>{transport.departure_time} - {transport.arrival_time}</span>
                    <span>•</span>
                    <span>{Math.floor(transport.duration_minutes / 60)}h {transport.duration_minutes % 60}m</span>
                  </div>
                </div>
              </div>
              <div className="text-right">
                <p className="text-lg font-bold text-gray-900 dark:text-white">
                  ₱{transport.price.toLocaleString()}
                </p>
                <div className="flex gap-2 mt-2">
                  <button
                    onClick={() => onSelect(transport)}
                    className={`px-3 py-1.5 text-sm font-medium rounded-lg transition-colors ${
                      isSelected
                        ? 'bg-teal-500 text-white'
                        : 'bg-gray-100 dark:bg-gray-800 text-gray-700 dark:text-gray-300 hover:bg-gray-200 dark:hover:bg-gray-700'
                    }`}
                  >
                    {isSelected ? <Check className="w-4 h-4" /> : 'Select'}
                  </button>
                  {transport.is_supplier && (
                    <button
                      onClick={() => onBook(transport)}
                      className="px-3 py-1.5 text-sm font-medium bg-teal-500 text-white rounded-lg hover:bg-teal-600 transition-colors"
                    >
                      Book
                    </button>
                  )}
                </div>
              </div>
            </div>
          </div>
        )
      })}
    </div>
  )
}

// Accommodation Suggestions Component
function AccommodationSuggestions({
  suggestions,
  onSelect,
  onBook,
  selected,
}: {
  suggestions: AccommodationSuggestion[]
  onSelect: (s: AccommodationSuggestion) => void
  onBook: (s: AccommodationSuggestion) => void
  selected?: AccommodationSuggestion
}) {
  return (
    <div className="space-y-2">
      {suggestions.slice(0, 5).map((accom) => {
        const isSelected = selected?.id === accom.id

        return (
          <div
            key={accom.id}
            className={`p-4 bg-white dark:bg-gray-900 rounded-xl border-2 transition-all ${
              isSelected
                ? 'border-teal-500'
                : 'border-gray-200 dark:border-gray-700 hover:border-gray-300 dark:hover:border-gray-600'
            }`}
          >
            <div className="flex gap-4">
              {/* Image */}
              <div className="w-24 h-24 rounded-lg overflow-hidden bg-gray-200 dark:bg-gray-700 flex-shrink-0">
                {accom.photos?.[0] ? (
                  <img
                    src={accom.photos[0]}
                    alt={accom.name}
                    className="w-full h-full object-cover"
                  />
                ) : (
                  <div className="w-full h-full flex items-center justify-center">
                    <Hotel className="w-8 h-8 text-gray-400" />
                  </div>
                )}
              </div>

              {/* Details */}
              <div className="flex-1 min-w-0">
                <div className="flex items-start justify-between">
                  <div>
                    <div className="flex items-center gap-2">
                      <h4 className="font-semibold text-gray-900 dark:text-white truncate">
                        {accom.name}
                      </h4>
                      {accom.is_supplier && (
                        <span className="flex items-center gap-1 px-2 py-0.5 bg-amber-100 dark:bg-amber-900 text-amber-700 dark:text-amber-300 text-xs font-medium rounded-full">
                          <BadgeCheck className="w-3 h-3" />
                          Partner
                        </span>
                      )}
                    </div>
                    <p className="text-sm text-gray-500 dark:text-gray-400 capitalize">
                      {accom.type} • {accom.location}
                    </p>
                    <div className="flex items-center gap-1 mt-1">
                      <Star className="w-4 h-4 text-yellow-500 fill-yellow-500" />
                      <span className="text-sm font-medium text-gray-900 dark:text-white">
                        {accom.rating.toFixed(1)}
                      </span>
                      <span className="text-sm text-gray-500 dark:text-gray-400">
                        ({accom.review_count} reviews)
                      </span>
                    </div>
                  </div>
                  <div className="text-right">
                    <p className="text-lg font-bold text-gray-900 dark:text-white">
                      ₱{accom.price_per_night.toLocaleString()}
                    </p>
                    <p className="text-xs text-gray-500 dark:text-gray-400">per night</p>
                  </div>
                </div>

                {/* Amenities */}
                {accom.amenities?.length > 0 && (
                  <div className="flex flex-wrap gap-1 mt-2">
                    {accom.amenities.slice(0, 4).map((amenity) => (
                      <span
                        key={amenity}
                        className="px-2 py-0.5 bg-gray-100 dark:bg-gray-800 text-gray-600 dark:text-gray-400 text-xs rounded"
                      >
                        {amenity}
                      </span>
                    ))}
                  </div>
                )}

                {/* Actions */}
                <div className="flex gap-2 mt-3">
                  <button
                    onClick={() => onSelect(accom)}
                    className={`px-3 py-1.5 text-sm font-medium rounded-lg transition-colors ${
                      isSelected
                        ? 'bg-teal-500 text-white'
                        : 'bg-gray-100 dark:bg-gray-800 text-gray-700 dark:text-gray-300 hover:bg-gray-200 dark:hover:bg-gray-700'
                    }`}
                  >
                    {isSelected ? <Check className="w-4 h-4" /> : 'Select'}
                  </button>
                  {accom.is_supplier && (
                    <button
                      onClick={() => onBook(accom)}
                      className="px-3 py-1.5 text-sm font-medium bg-teal-500 text-white rounded-lg hover:bg-teal-600 transition-colors"
                    >
                      Book Now
                    </button>
                  )}
                </div>
              </div>
            </div>
          </div>
        )
      })}
    </div>
  )
}

// Activity Suggestions Component
function ActivitySuggestions({
  suggestions,
  onSelect,
  onBook,
  selected,
}: {
  suggestions: ActivitySuggestion[]
  onSelect: (s: ActivitySuggestion) => void
  onBook: (s: ActivitySuggestion) => void
  selected?: ActivitySuggestion
}) {
  return (
    <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
      {suggestions.slice(0, 6).map((activity) => {
        const isSelected = selected?.id === activity.id

        return (
          <div
            key={activity.id}
            className={`p-3 bg-white dark:bg-gray-900 rounded-xl border-2 transition-all ${
              isSelected
                ? 'border-teal-500'
                : 'border-gray-200 dark:border-gray-700 hover:border-gray-300 dark:hover:border-gray-600'
            }`}
          >
            <div className="flex gap-3">
              {/* Image */}
              <div className="w-16 h-16 rounded-lg overflow-hidden bg-gray-200 dark:bg-gray-700 flex-shrink-0">
                {activity.photos?.[0] ? (
                  <img
                    src={activity.photos[0]}
                    alt={activity.name}
                    className="w-full h-full object-cover"
                  />
                ) : (
                  <div className="w-full h-full flex items-center justify-center">
                    <Camera className="w-6 h-6 text-gray-400" />
                  </div>
                )}
              </div>

              {/* Details */}
              <div className="flex-1 min-w-0">
                <div className="flex items-center gap-1">
                  <h4 className="font-medium text-gray-900 dark:text-white text-sm truncate">
                    {activity.name}
                  </h4>
                  {activity.is_supplier && (
                    <BadgeCheck className="w-4 h-4 text-amber-500 flex-shrink-0" />
                  )}
                </div>
                <div className="flex items-center gap-1 mt-0.5">
                  <Star className="w-3 h-3 text-yellow-500 fill-yellow-500" />
                  <span className="text-xs text-gray-600 dark:text-gray-400">
                    {activity.rating.toFixed(1)}
                  </span>
                  {activity.price !== undefined && activity.price > 0 && (
                    <>
                      <span className="text-gray-300 dark:text-gray-600">•</span>
                      <span className="text-xs font-medium text-gray-900 dark:text-white">
                        ₱{activity.price.toLocaleString()}
                      </span>
                    </>
                  )}
                </div>
                <div className="flex gap-1 mt-2">
                  <button
                    onClick={() => onSelect(activity)}
                    className={`px-2 py-1 text-xs font-medium rounded transition-colors ${
                      isSelected
                        ? 'bg-teal-500 text-white'
                        : 'bg-gray-100 dark:bg-gray-800 text-gray-600 dark:text-gray-400'
                    }`}
                  >
                    {isSelected ? '✓' : 'Add'}
                  </button>
                  {activity.is_supplier && (
                    <button
                      onClick={() => onBook(activity)}
                      className="px-2 py-1 text-xs font-medium bg-teal-500 text-white rounded hover:bg-teal-600"
                    >
                      Book
                    </button>
                  )}
                </div>
              </div>
            </div>
          </div>
        )
      })}
    </div>
  )
}
