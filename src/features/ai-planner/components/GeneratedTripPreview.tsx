'use client'

import { useState } from 'react'
import {
  MapPin,
  Calendar,
  Wallet,
  ChevronDown,
  ChevronUp,
  Utensils,
  Camera,
  Bed,
  Compass,
  Lightbulb,
  Sparkles,
  PlusCircle,
  Edit3,
} from 'lucide-react'
import { GeneratedTrip, GeneratedDay, GeneratedActivity } from '../services/aiTripService'

interface GeneratedTripPreviewProps {
  trip: GeneratedTrip
  onCreateTrip: () => void
  onCustomize?: () => void
}

const CATEGORY_ICONS: Record<string, React.ReactNode> = {
  see: <Camera className="w-4 h-4" />,
  eat: <Utensils className="w-4 h-4" />,
  do: <Compass className="w-4 h-4" />,
  stay: <Bed className="w-4 h-4" />,
}

const CATEGORY_COLORS: Record<string, string> = {
  see: 'bg-blue-100 dark:bg-blue-900/30 text-blue-600 dark:text-blue-400',
  eat: 'bg-orange-100 dark:bg-orange-900/30 text-orange-600 dark:text-orange-400',
  do: 'bg-green-100 dark:bg-green-900/30 text-green-600 dark:text-green-400',
  stay: 'bg-purple-100 dark:bg-purple-900/30 text-purple-600 dark:text-purple-400',
}

function DayCard({ day, isExpanded, onToggle }: { day: GeneratedDay; isExpanded: boolean; onToggle: () => void }) {
  return (
    <div className="bg-white dark:bg-gray-900 rounded-xl border border-gray-200 dark:border-gray-800 overflow-hidden">
      {/* Day Header */}
      <button
        onClick={onToggle}
        className="w-full px-4 py-3 flex items-center justify-between hover:bg-gray-50 dark:hover:bg-gray-800/50 transition-colors"
      >
        <div className="flex items-center gap-3">
          <div className="w-8 h-8 bg-teal-100 dark:bg-teal-900/30 rounded-full flex items-center justify-center text-teal-600 dark:text-teal-400 font-bold text-sm">
            {day.dayNumber}
          </div>
          <div className="text-left">
            <h4 className="font-medium text-gray-900 dark:text-white">{day.title}</h4>
            <p className="text-xs text-gray-500 dark:text-gray-400">
              {day.activities.length} activities • ₱{day.dailyBudget.toLocaleString()}
            </p>
          </div>
        </div>
        {isExpanded ? (
          <ChevronUp className="w-5 h-5 text-gray-400" />
        ) : (
          <ChevronDown className="w-5 h-5 text-gray-400" />
        )}
      </button>

      {/* Activities */}
      {isExpanded && (
        <div className="px-4 pb-4 space-y-3">
          {day.activities.map((activity, idx) => (
            <ActivityItem key={idx} activity={activity} />
          ))}
        </div>
      )}
    </div>
  )
}

function ActivityItem({ activity }: { activity: GeneratedActivity }) {
  return (
    <div className="flex gap-3 pl-4 border-l-2 border-gray-200 dark:border-gray-700">
      <div className="flex-1">
        <div className="flex items-center gap-2">
          <span className="text-xs text-gray-500 dark:text-gray-400 font-mono">
            {activity.time}
          </span>
          <span className={`p-1 rounded ${CATEGORY_COLORS[activity.category]}`}>
            {CATEGORY_ICONS[activity.category]}
          </span>
        </div>
        <h5 className="font-medium text-gray-900 dark:text-white mt-1">
          {activity.name}
        </h5>
        {activity.description && (
          <p className="text-xs text-gray-500 dark:text-gray-400 mt-0.5">
            {activity.description}
          </p>
        )}
        <div className="flex items-center gap-3 mt-1 text-xs text-gray-500 dark:text-gray-400">
          <span>{activity.duration}</span>
          {activity.cost > 0 && (
            <span className="text-teal-600 dark:text-teal-400">
              ₱{activity.cost.toLocaleString()}
            </span>
          )}
        </div>
      </div>
    </div>
  )
}

export default function GeneratedTripPreview({ trip, onCreateTrip, onCustomize }: GeneratedTripPreviewProps) {
  const [expandedDays, setExpandedDays] = useState<number[]>([1])

  const toggleDay = (dayNumber: number) => {
    setExpandedDays((prev) =>
      prev.includes(dayNumber)
        ? prev.filter((d) => d !== dayNumber)
        : [...prev, dayNumber]
    )
  }

  const expandAll = () => setExpandedDays(trip.days.map((d) => d.dayNumber))
  const collapseAll = () => setExpandedDays([])

  return (
    <div className="bg-gray-50 dark:bg-gray-950 rounded-xl overflow-hidden">
      {/* Header */}
      <div className="bg-gradient-to-br from-teal-500 to-blue-600 p-6 text-white">
        <div className="flex items-center gap-2 text-teal-100 text-sm mb-2">
          <Sparkles className="w-4 h-4" />
          AI Generated Itinerary
        </div>
        <h2 className="text-2xl font-bold mb-2">{trip.title}</h2>
        <p className="text-teal-100 text-sm mb-4">{trip.description}</p>

        {/* Stats */}
        <div className="flex flex-wrap gap-4">
          <div className="flex items-center gap-2">
            <MapPin className="w-4 h-4 text-teal-200" />
            <span>{trip.destination}</span>
          </div>
          <div className="flex items-center gap-2">
            <Calendar className="w-4 h-4 text-teal-200" />
            <span>{trip.duration} days</span>
          </div>
          <div className="flex items-center gap-2">
            <Wallet className="w-4 h-4 text-teal-200" />
            <span>₱{trip.estimatedBudget.toLocaleString()}</span>
          </div>
        </div>
      </div>

      {/* Highlights */}
      <div className="p-4 bg-white dark:bg-gray-900 border-b border-gray-200 dark:border-gray-800">
        <h3 className="text-sm font-medium text-gray-500 dark:text-gray-400 mb-2">
          Trip Highlights
        </h3>
        <div className="flex flex-wrap gap-2">
          {trip.highlights.map((highlight, idx) => (
            <span
              key={idx}
              className="px-3 py-1 bg-teal-50 dark:bg-teal-900/20 text-teal-700 dark:text-teal-400 rounded-full text-sm"
            >
              {highlight}
            </span>
          ))}
        </div>
      </div>

      {/* Itinerary */}
      <div className="p-4">
        <div className="flex items-center justify-between mb-4">
          <h3 className="font-semibold text-gray-900 dark:text-white">
            Day-by-Day Itinerary
          </h3>
          <div className="flex gap-2">
            <button
              onClick={expandAll}
              className="text-xs text-teal-600 dark:text-teal-400 hover:underline"
            >
              Expand all
            </button>
            <span className="text-gray-300 dark:text-gray-600">|</span>
            <button
              onClick={collapseAll}
              className="text-xs text-teal-600 dark:text-teal-400 hover:underline"
            >
              Collapse all
            </button>
          </div>
        </div>

        <div className="space-y-3">
          {trip.days.map((day) => (
            <DayCard
              key={day.dayNumber}
              day={day}
              isExpanded={expandedDays.includes(day.dayNumber)}
              onToggle={() => toggleDay(day.dayNumber)}
            />
          ))}
        </div>
      </div>

      {/* Tips */}
      <div className="p-4 bg-amber-50 dark:bg-amber-900/20 border-t border-amber-200 dark:border-amber-800/30">
        <div className="flex items-center gap-2 text-amber-700 dark:text-amber-400 mb-2">
          <Lightbulb className="w-4 h-4" />
          <h3 className="font-medium text-sm">Travel Tips</h3>
        </div>
        <ul className="space-y-1">
          {trip.tips.map((tip, idx) => (
            <li key={idx} className="text-sm text-amber-800 dark:text-amber-300 flex items-start gap-2">
              <span className="text-amber-500">•</span>
              {tip}
            </li>
          ))}
        </ul>
      </div>

      {/* Actions */}
      <div className="p-4 bg-white dark:bg-gray-900 border-t border-gray-200 dark:border-gray-800 flex gap-3">
        <button
          onClick={onCreateTrip}
          className="flex-1 flex items-center justify-center gap-2 px-4 py-3 bg-teal-600 hover:bg-teal-700 text-white font-semibold rounded-xl transition-colors"
        >
          <PlusCircle className="w-5 h-5" />
          Create This Trip
        </button>
        {onCustomize && (
          <button
            onClick={onCustomize}
            className="flex items-center justify-center gap-2 px-4 py-3 bg-gray-100 dark:bg-gray-800 text-gray-700 dark:text-gray-300 font-medium rounded-xl hover:bg-gray-200 dark:hover:bg-gray-700 transition-colors"
          >
            <Edit3 className="w-5 h-5" />
            Customize
          </button>
        )}
      </div>
    </div>
  )
}
