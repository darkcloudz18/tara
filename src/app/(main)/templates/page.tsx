'use client'

import { useState, useMemo } from 'react'
import { useRouter } from 'next/navigation'
import {
  ArrowLeft,
  MapPin,
  Calendar,
  Users,
  DollarSign,
  Filter,
  ChevronDown,
  Sparkles,
} from 'lucide-react'
import { TRIP_TEMPLATES, TripTemplate } from '@/features/planner/data/tripTemplates'
import TemplatePreviewModal from '@/features/planner/components/TemplatePreviewModal'
import { useItineraries } from '@/features/planner/hooks/useItineraries'
import { useLocalizedTrip } from '@/hooks/useLocalizedTrip'
import { useToast } from '@/contexts/ToastContext'
import { AppShell } from '@/components/layout'

const DESTINATIONS = ['All', ...new Set(TRIP_TEMPLATES.map((t) => t.destination))]
const DURATIONS = [
  { label: 'Any Duration', min: 0, max: 100 },
  { label: '2-3 Days', min: 2, max: 3 },
  { label: '4-5 Days', min: 4, max: 5 },
  { label: '6+ Days', min: 6, max: 100 },
]
const BUDGETS = [
  { label: 'Any Budget', min: 0, max: 100000 },
  { label: 'Under P10,000', min: 0, max: 10000 },
  { label: 'P10,000 - P15,000', min: 10000, max: 15000 },
  { label: 'P15,000+', min: 15000, max: 100000 },
]

function TemplateCard({
  template,
  onClick,
}: {
  template: TripTemplate
  onClick: () => void
}) {
  return (
    <div
      onClick={onClick}
      className="bg-white dark:bg-gray-900 rounded-xl border border-gray-200 dark:border-gray-800 overflow-hidden cursor-pointer hover:shadow-lg transition-all group"
    >
      {/* Image */}
      <div className="relative h-48">
        <img
          src={template.image}
          alt={template.title}
          className="w-full h-full object-cover group-hover:scale-105 transition-transform duration-300"
        />
        <div className="absolute inset-0 bg-gradient-to-t from-black/60 via-transparent to-transparent" />
        <div className="absolute top-3 right-3 px-2 py-1 bg-white/90 dark:bg-gray-900/90 rounded-full text-xs font-medium text-teal-600 dark:text-teal-400">
          {template.duration} Days
        </div>
        <div className="absolute bottom-3 left-3 right-3">
          <h3 className="text-lg font-bold text-white">{template.title}</h3>
          <p className="text-white/80 flex items-center gap-1 text-sm">
            <MapPin className="w-3 h-3" />
            {template.destination}
          </p>
        </div>
      </div>

      {/* Content */}
      <div className="p-4">
        <p className="text-sm text-gray-600 dark:text-gray-400 line-clamp-2 mb-3">
          {template.description}
        </p>

        {/* Highlights */}
        <div className="flex flex-wrap gap-1 mb-4">
          {template.highlights.slice(0, 3).map((highlight, idx) => (
            <span
              key={idx}
              className="px-2 py-0.5 bg-gray-100 dark:bg-gray-800 text-gray-600 dark:text-gray-400 rounded text-xs"
            >
              {highlight}
            </span>
          ))}
          {template.highlights.length > 3 && (
            <span className="px-2 py-0.5 text-gray-400 text-xs">
              +{template.highlights.length - 3} more
            </span>
          )}
        </div>

        {/* Stats */}
        <div className="flex items-center justify-between pt-3 border-t border-gray-100 dark:border-gray-800">
          <div className="flex items-center gap-4">
            <span className="flex items-center gap-1 text-xs text-gray-500 dark:text-gray-400">
              <DollarSign className="w-3 h-3" />
              P{template.estimatedBudget.toLocaleString()}
            </span>
            <span className="flex items-center gap-1 text-xs text-gray-500 dark:text-gray-400 capitalize">
              <Users className="w-3 h-3" />
              {template.bestFor[0]}
            </span>
          </div>
          <span className="text-xs font-medium text-teal-600 dark:text-teal-400">
            View Details
          </span>
        </div>
      </div>
    </div>
  )
}

export default function TemplatesPage() {
  const router = useRouter()
  const t = useLocalizedTrip()
  const { success } = useToast()
  const { createItinerary } = useItineraries()

  const [selectedDestination, setSelectedDestination] = useState('All')
  const [selectedDuration, setSelectedDuration] = useState(DURATIONS[0])
  const [selectedBudget, setSelectedBudget] = useState(BUDGETS[0])
  const [showFilters, setShowFilters] = useState(false)
  const [selectedTemplate, setSelectedTemplate] = useState<TripTemplate | null>(null)

  const filteredTemplates = useMemo(() => {
    return TRIP_TEMPLATES.filter((template) => {
      // Destination filter
      if (selectedDestination !== 'All' && template.destination !== selectedDestination) {
        return false
      }

      // Duration filter
      if (template.duration < selectedDuration.min || template.duration > selectedDuration.max) {
        return false
      }

      // Budget filter
      if (template.estimatedBudget < selectedBudget.min || template.estimatedBudget > selectedBudget.max) {
        return false
      }

      return true
    })
  }, [selectedDestination, selectedDuration, selectedBudget])

  const handleUseTemplate = async (template: TripTemplate) => {
    // Create a new trip from the template
    const startDate = new Date()
    const endDate = new Date()
    endDate.setDate(startDate.getDate() + template.duration - 1)

    const itinerary = await createItinerary({
      title: template.title,
      description: template.description,
      start_date: startDate.toISOString().split('T')[0],
      end_date: endDate.toISOString().split('T')[0],
      destinations: [template.destination],
      total_budget: template.estimatedBudget,
    })

    if (itinerary) {
      success(`${t.trip} created from template!`)
      router.push(`/trip/${itinerary.id}/edit`)
    }
  }

  const activeFiltersCount = [
    selectedDestination !== 'All',
    selectedDuration !== DURATIONS[0],
    selectedBudget !== BUDGETS[0],
  ].filter(Boolean).length

  return (
    <AppShell>
    <div className="min-h-screen bg-gray-50 dark:bg-gray-950">
      {/* Header */}
      <div className="sticky top-0 z-40 bg-white dark:bg-gray-900 border-b border-gray-200 dark:border-gray-800">
        <div className="max-w-5xl mx-auto px-4 py-4">
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-3">
              <button
                onClick={() => router.back()}
                className="p-2 text-gray-500 hover:text-gray-700 dark:hover:text-gray-300 -ml-2"
              >
                <ArrowLeft className="w-5 h-5" />
              </button>
              <div>
                <h1 className="text-xl font-bold text-gray-900 dark:text-white flex items-center gap-2">
                  <Sparkles className="w-5 h-5 text-teal-500" />
                  {t.trip} Templates
                </h1>
                <p className="text-sm text-gray-500 dark:text-gray-400">
                  {filteredTemplates.length} templates available
                </p>
              </div>
            </div>

            <button
              onClick={() => setShowFilters(!showFilters)}
              className="flex items-center gap-2 px-3 py-2 bg-gray-100 dark:bg-gray-800 rounded-lg text-sm text-gray-700 dark:text-gray-300"
            >
              <Filter className="w-4 h-4" />
              Filters
              {activeFiltersCount > 0 && (
                <span className="px-1.5 py-0.5 bg-teal-600 text-white text-xs rounded-full">
                  {activeFiltersCount}
                </span>
              )}
              <ChevronDown className={`w-4 h-4 transition-transform ${showFilters ? 'rotate-180' : ''}`} />
            </button>
          </div>

          {/* Filters */}
          {showFilters && (
            <div className="mt-4 pt-4 border-t border-gray-100 dark:border-gray-800 grid grid-cols-1 md:grid-cols-3 gap-4 animate-fade-in">
              {/* Destination */}
              <div>
                <label className="text-xs font-medium text-gray-500 dark:text-gray-400 mb-1 block">
                  Destination
                </label>
                <select
                  value={selectedDestination}
                  onChange={(e) => setSelectedDestination(e.target.value)}
                  className="w-full px-3 py-2 bg-gray-50 dark:bg-gray-800 border border-gray-200 dark:border-gray-700 rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-teal-500"
                >
                  {DESTINATIONS.map((dest) => (
                    <option key={dest} value={dest}>
                      {dest}
                    </option>
                  ))}
                </select>
              </div>

              {/* Duration */}
              <div>
                <label className="text-xs font-medium text-gray-500 dark:text-gray-400 mb-1 block">
                  Duration
                </label>
                <select
                  value={selectedDuration.label}
                  onChange={(e) => setSelectedDuration(DURATIONS.find((d) => d.label === e.target.value)!)}
                  className="w-full px-3 py-2 bg-gray-50 dark:bg-gray-800 border border-gray-200 dark:border-gray-700 rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-teal-500"
                >
                  {DURATIONS.map((dur) => (
                    <option key={dur.label} value={dur.label}>
                      {dur.label}
                    </option>
                  ))}
                </select>
              </div>

              {/* Budget */}
              <div>
                <label className="text-xs font-medium text-gray-500 dark:text-gray-400 mb-1 block">
                  Budget
                </label>
                <select
                  value={selectedBudget.label}
                  onChange={(e) => setSelectedBudget(BUDGETS.find((b) => b.label === e.target.value)!)}
                  className="w-full px-3 py-2 bg-gray-50 dark:bg-gray-800 border border-gray-200 dark:border-gray-700 rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-teal-500"
                >
                  {BUDGETS.map((bud) => (
                    <option key={bud.label} value={bud.label}>
                      {bud.label}
                    </option>
                  ))}
                </select>
              </div>
            </div>
          )}
        </div>
      </div>

      {/* Templates Grid */}
      <div className="max-w-5xl mx-auto px-4 py-6">
        {filteredTemplates.length === 0 ? (
          <div className="text-center py-16">
            <Sparkles className="w-12 h-12 text-gray-300 mx-auto mb-4" />
            <h3 className="text-lg font-semibold text-gray-900 dark:text-white mb-2">
              No templates match your filters
            </h3>
            <p className="text-gray-500 dark:text-gray-400 mb-4">
              Try adjusting your filters to see more options
            </p>
            <button
              onClick={() => {
                setSelectedDestination('All')
                setSelectedDuration(DURATIONS[0])
                setSelectedBudget(BUDGETS[0])
              }}
              className="text-teal-600 dark:text-teal-400 font-medium hover:underline"
            >
              Clear all filters
            </button>
          </div>
        ) : (
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
            {filteredTemplates.map((template) => (
              <TemplateCard
                key={template.id}
                template={template}
                onClick={() => setSelectedTemplate(template)}
              />
            ))}
          </div>
        )}
      </div>

      {/* Template Preview Modal */}
      <TemplatePreviewModal
        isOpen={!!selectedTemplate}
        onClose={() => setSelectedTemplate(null)}
        template={selectedTemplate}
        onUseTemplate={handleUseTemplate}
      />
    </div>
    </AppShell>
  )
}
