'use client'

import { useState } from 'react'
import {
  X,
  MapPin,
  Calendar,
  Users,
  DollarSign,
  Clock,
  ChevronDown,
  ChevronUp,
  Utensils,
  Camera,
  Activity,
  Hotel,
} from 'lucide-react'
import { TripTemplate, TemplateDay, TemplateActivity } from '../data/tripTemplates'

interface TemplatePreviewModalProps {
  isOpen: boolean
  onClose: () => void
  template: TripTemplate | null
  onUseTemplate: (template: TripTemplate) => void
}

const CATEGORY_ICONS: Record<string, React.ReactNode> = {
  see: <Camera className="w-4 h-4 text-blue-500" />,
  eat: <Utensils className="w-4 h-4 text-orange-500" />,
  do: <Activity className="w-4 h-4 text-green-500" />,
  stay: <Hotel className="w-4 h-4 text-purple-500" />,
}

const CATEGORY_COLORS: Record<string, string> = {
  see: 'bg-blue-50 dark:bg-blue-900/20 border-blue-200 dark:border-blue-800',
  eat: 'bg-orange-50 dark:bg-orange-900/20 border-orange-200 dark:border-orange-800',
  do: 'bg-green-50 dark:bg-green-900/20 border-green-200 dark:border-green-800',
  stay: 'bg-purple-50 dark:bg-purple-900/20 border-purple-200 dark:border-purple-800',
}

function DayCard({ day, isExpanded, onToggle }: { day: TemplateDay; isExpanded: boolean; onToggle: () => void }) {
  const dayCost = day.activities.reduce((sum, a) => sum + a.cost, 0)

  return (
    <div className="border border-gray-200 dark:border-gray-700 rounded-xl overflow-hidden">
      <button
        onClick={onToggle}
        className="w-full px-4 py-3 flex items-center justify-between bg-gray-50 dark:bg-gray-800/50 hover:bg-gray-100 dark:hover:bg-gray-800 transition-colors"
      >
        <div className="flex items-center gap-3">
          <span className="w-8 h-8 bg-teal-100 dark:bg-teal-900/50 text-teal-600 dark:text-teal-400 rounded-full flex items-center justify-center text-sm font-bold">
            {day.dayNumber}
          </span>
          <span className="font-medium text-gray-900 dark:text-white">{day.title}</span>
        </div>
        <div className="flex items-center gap-3">
          <span className="text-sm text-gray-500 dark:text-gray-400">
            P{dayCost.toLocaleString()}
          </span>
          {isExpanded ? (
            <ChevronUp className="w-5 h-5 text-gray-400" />
          ) : (
            <ChevronDown className="w-5 h-5 text-gray-400" />
          )}
        </div>
      </button>

      {isExpanded && (
        <div className="px-4 py-3 space-y-3 animate-fade-in">
          {day.activities.map((activity, idx) => (
            <ActivityCard key={idx} activity={activity} />
          ))}
        </div>
      )}
    </div>
  )
}

function ActivityCard({ activity }: { activity: TemplateActivity }) {
  return (
    <div className={`p-3 rounded-lg border ${CATEGORY_COLORS[activity.category]}`}>
      <div className="flex items-start gap-3">
        <div className="flex-shrink-0 mt-0.5">
          {CATEGORY_ICONS[activity.category]}
        </div>
        <div className="flex-1 min-w-0">
          <div className="flex items-start justify-between gap-2">
            <h4 className="font-medium text-gray-900 dark:text-white text-sm">
              {activity.name}
            </h4>
            {activity.cost > 0 && (
              <span className="text-xs font-medium text-teal-600 dark:text-teal-400 whitespace-nowrap">
                P{activity.cost.toLocaleString()}
              </span>
            )}
          </div>
          <div className="flex items-center gap-3 mt-1 text-xs text-gray-500 dark:text-gray-400">
            <span className="flex items-center gap-1">
              <Clock className="w-3 h-3" />
              {activity.time}
            </span>
            <span>{activity.duration}</span>
          </div>
          {activity.description && (
            <p className="text-xs text-gray-600 dark:text-gray-400 mt-1">
              {activity.description}
            </p>
          )}
        </div>
      </div>
    </div>
  )
}

export default function TemplatePreviewModal({
  isOpen,
  onClose,
  template,
  onUseTemplate,
}: TemplatePreviewModalProps) {
  const [expandedDays, setExpandedDays] = useState<number[]>([1])

  if (!isOpen || !template) return null

  const toggleDay = (dayNumber: number) => {
    setExpandedDays((prev) =>
      prev.includes(dayNumber)
        ? prev.filter((d) => d !== dayNumber)
        : [...prev, dayNumber]
    )
  }

  const totalCost = template.suggestedDays?.reduce(
    (sum, day) => sum + day.activities.reduce((s, a) => s + a.cost, 0),
    0
  ) || template.estimatedBudget

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/60 backdrop-blur-sm">
      <div className="relative w-full max-w-2xl max-h-[90vh] mx-4 bg-white dark:bg-gray-900 rounded-2xl shadow-2xl overflow-hidden flex flex-col">
        {/* Header Image */}
        <div className="relative h-48 flex-shrink-0">
          <img
            src={template.image}
            alt={template.title}
            className="w-full h-full object-cover"
          />
          <div className="absolute inset-0 bg-gradient-to-t from-black/60 to-transparent" />
          <button
            onClick={onClose}
            className="absolute top-4 right-4 p-2 bg-black/30 hover:bg-black/50 text-white rounded-full backdrop-blur-sm transition-colors"
          >
            <X className="w-5 h-5" />
          </button>
          <div className="absolute bottom-4 left-4 right-4">
            <h2 className="text-2xl font-bold text-white">{template.title}</h2>
            <p className="text-white/80 flex items-center gap-2 mt-1">
              <MapPin className="w-4 h-4" />
              {template.destination}
            </p>
          </div>
        </div>

        {/* Content */}
        <div className="flex-1 overflow-y-auto p-6">
          {/* Quick Stats */}
          <div className="grid grid-cols-3 gap-4 mb-6">
            <div className="text-center p-3 bg-gray-50 dark:bg-gray-800 rounded-xl">
              <Calendar className="w-5 h-5 text-teal-500 mx-auto mb-1" />
              <p className="text-sm font-semibold text-gray-900 dark:text-white">
                {template.duration} Days
              </p>
              <p className="text-xs text-gray-500">Duration</p>
            </div>
            <div className="text-center p-3 bg-gray-50 dark:bg-gray-800 rounded-xl">
              <DollarSign className="w-5 h-5 text-teal-500 mx-auto mb-1" />
              <p className="text-sm font-semibold text-gray-900 dark:text-white">
                P{totalCost.toLocaleString()}
              </p>
              <p className="text-xs text-gray-500">Est. Budget</p>
            </div>
            <div className="text-center p-3 bg-gray-50 dark:bg-gray-800 rounded-xl">
              <Users className="w-5 h-5 text-teal-500 mx-auto mb-1" />
              <p className="text-sm font-semibold text-gray-900 dark:text-white capitalize">
                {template.bestFor[0]}
              </p>
              <p className="text-xs text-gray-500">Best For</p>
            </div>
          </div>

          {/* Description */}
          <p className="text-gray-600 dark:text-gray-400 mb-6">
            {template.description}
          </p>

          {/* Highlights */}
          <div className="mb-6">
            <h3 className="font-semibold text-gray-900 dark:text-white mb-3">
              Highlights
            </h3>
            <div className="flex flex-wrap gap-2">
              {template.highlights.map((highlight, idx) => (
                <span
                  key={idx}
                  className="px-3 py-1 bg-teal-50 dark:bg-teal-900/30 text-teal-700 dark:text-teal-300 rounded-full text-sm"
                >
                  {highlight}
                </span>
              ))}
            </div>
          </div>

          {/* Day-by-Day Itinerary */}
          {template.suggestedDays && template.suggestedDays.length > 0 && (
            <div>
              <h3 className="font-semibold text-gray-900 dark:text-white mb-3">
                Day-by-Day Itinerary
              </h3>
              <div className="space-y-3">
                {template.suggestedDays.map((day) => (
                  <DayCard
                    key={day.dayNumber}
                    day={day}
                    isExpanded={expandedDays.includes(day.dayNumber)}
                    onToggle={() => toggleDay(day.dayNumber)}
                  />
                ))}
              </div>
            </div>
          )}
        </div>

        {/* Footer */}
        <div className="flex-shrink-0 px-6 py-4 border-t border-gray-200 dark:border-gray-800 bg-gray-50 dark:bg-gray-800/50">
          <div className="flex items-center justify-between">
            <div>
              <p className="text-sm text-gray-500 dark:text-gray-400">
                Best time to visit
              </p>
              <p className="font-medium text-gray-900 dark:text-white">
                {template.bestMonths.slice(0, 3).join(', ')}
              </p>
            </div>
            <button
              onClick={() => onUseTemplate(template)}
              className="px-6 py-2.5 bg-teal-600 hover:bg-teal-700 text-white font-medium rounded-xl transition-colors"
            >
              Use This Template
            </button>
          </div>
        </div>
      </div>
    </div>
  )
}
