'use client'

import { useState, useEffect, Suspense } from 'react'
import { useRouter, useSearchParams } from 'next/navigation'
import Link from 'next/link'
import { ArrowLeft, Loader2, Save, Share2, Download } from 'lucide-react'
import { Sidebar, MobileNav } from '@/components/layout'
import { supabase } from '@/lib/supabase'
import TripWizard, { TripWizardData } from '@/features/planner/components/TripWizard'
import ItineraryTimeline from '@/features/planner/components/ItineraryTimeline'
import {
  generateItinerarySuggestion,
  DaySuggestion,
  TransportSuggestion,
  AccommodationSuggestion,
  ActivitySuggestion,
} from '@/features/planner/services/suggestionService'
import { useItineraries } from '@/features/planner/hooks/useItineraries'
import { getTemplateBySlug } from '@/features/planner/data/tripTemplates'
import BudgetBreakdown from '@/features/planner/components/BudgetBreakdown'
import { BudgetSummary, CategoryBudget } from '@/features/planner/hooks/useBudgetCalculations'

type ViewMode = 'wizard' | 'itinerary'

// Wrapper component to handle Suspense for useSearchParams
export default function NewItineraryPage() {
  return (
    <Suspense fallback={<PageLoading />}>
      <NewItineraryContent />
    </Suspense>
  )
}

function PageLoading() {
  return (
    <div className="min-h-screen bg-gray-50 dark:bg-black flex items-center justify-center">
      <Loader2 className="w-8 h-8 text-teal-500 animate-spin" />
    </div>
  )
}

function NewItineraryContent() {
  const router = useRouter()
  const searchParams = useSearchParams()
  const templateSlug = searchParams.get('template')

  const [user, setUser] = useState<any>(null)
  const [viewMode, setViewMode] = useState<ViewMode>('wizard')
  const [tripData, setTripData] = useState<TripWizardData | null>(null)
  const [itinerary, setItinerary] = useState<DaySuggestion[]>([])
  const [loading, setLoading] = useState(false)
  const [saving, setSaving] = useState(false)
  const [error, setError] = useState<string | null>(null)
  const [selectedTemplate, setSelectedTemplate] = useState<ReturnType<typeof getTemplateBySlug>>(undefined)

  const { createItinerary } = useItineraries()

  useEffect(() => {
    supabase.auth.getUser().then(({ data: { user } }) => {
      setUser(user)
    })
  }, [])

  // Load template if specified in URL
  useEffect(() => {
    if (templateSlug) {
      const template = getTemplateBySlug(templateSlug)
      if (template) {
        setSelectedTemplate(template)
      }
    }
  }, [templateSlug])

  const handleWizardComplete = async (data: TripWizardData) => {
    setTripData(data)
    setLoading(true)
    setError(null)

    try {
      // Generate itinerary suggestions
      const suggestions = await generateItinerarySuggestion(
        data.origin,
        data.destination,
        data.startDate,
        data.endDate
      )

      setItinerary(suggestions)
      setViewMode('itinerary')
    } catch (err: any) {
      console.error('Error generating itinerary:', err)
      setError('Failed to generate itinerary. Please try again.')
    } finally {
      setLoading(false)
    }
  }

  const handleSelectSuggestion = (
    dayIndex: number,
    slotIndex: number,
    suggestion: TransportSuggestion | AccommodationSuggestion | ActivitySuggestion
  ) => {
    setItinerary((prev) => {
      const updated = [...prev]
      updated[dayIndex] = {
        ...updated[dayIndex],
        activities: updated[dayIndex].activities.map((slot, idx) =>
          idx === slotIndex ? { ...slot, selected: suggestion } : slot
        ),
      }
      return updated
    })
  }

  const handleBookItem = (
    item: TransportSuggestion | AccommodationSuggestion | ActivitySuggestion
  ) => {
    // Handle booking - could open a modal or redirect
    if ('listing_id' in item && item.listing_id) {
      // Navigate to booking page or open booking modal
      console.log('Book item:', item)
      // For now, just alert
      alert(`Booking ${item.is_supplier ? 'partner' : ''} item: ${'name' in item ? item.name : item.provider}`)
    }
  }

  const handleSaveItinerary = async () => {
    if (!tripData || !user) {
      router.push('/login')
      return
    }

    setSaving(true)
    setError(null)

    try {
      // Create the itinerary
      const newItinerary = await createItinerary({
        title: `${tripData.origin} to ${tripData.destination}`,
        description: `${getTotalDays()} day ${tripData.tripType} trip`,
        start_date: tripData.startDate,
        end_date: tripData.endDate,
        destinations: [tripData.destination],
      })

      if (newItinerary) {
        // Save activities to each day
        for (const day of itinerary) {
          // Get the day ID from the created itinerary
          const { data: dayData } = await supabase
            .from('itinerary_days')
            .select('id')
            .eq('itinerary_id', newItinerary.id)
            .eq('day_number', day.day_number)
            .single()

          if (dayData) {
            // Create activities for this day
            const activities = day.activities
              .filter((slot) => slot.selected || slot.type !== 'free_time')
              .map((slot, index) => ({
                day_id: dayData.id,
                title: slot.selected
                  ? 'name' in slot.selected
                    ? slot.selected.name
                    : slot.selected.provider
                  : slot.title,
                description: slot.description,
                start_time: slot.time,
                location: slot.location || tripData.destination,
                place_type: slot.type,
                estimated_cost:
                  slot.selected && 'price' in slot.selected
                    ? slot.selected.price
                    : slot.selected && 'price_per_night' in slot.selected
                    ? slot.selected.price_per_night
                    : null,
                order_index: index,
              }))

            if (activities.length > 0) {
              await supabase.from('itinerary_activities').insert(activities)
            }
          }
        }

        router.push(`/trip/${newItinerary.id}/edit`)
      } else {
        setError('Failed to save itinerary. Please try again.')
      }
    } catch (err: any) {
      console.error('Error saving itinerary:', err)
      setError(err.message || 'Failed to save itinerary')
    } finally {
      setSaving(false)
    }
  }

  const getTotalDays = () => {
    if (!tripData?.startDate || !tripData?.endDate) return 0
    const start = new Date(tripData.startDate)
    const end = new Date(tripData.endDate)
    return Math.ceil((end.getTime() - start.getTime()) / (1000 * 60 * 60 * 24)) + 1
  }

  const calculateTotalCost = () => {
    let total = 0
    itinerary.forEach((day) => {
      day.activities.forEach((slot) => {
        if (slot.selected) {
          if ('price' in slot.selected) {
            total += slot.selected.price || 0
          } else if ('price_per_night' in slot.selected) {
            total += slot.selected.price_per_night || 0
          }
        }
      })
    })
    return total
  }

  // Calculate budget breakdown for the generated itinerary
  const calculateBudgetBreakdown = (): BudgetSummary => {
    const categoryTotals: Record<string, { estimated: number; actual: number; count: number }> = {}
    const byDay: any[] = []

    const categoryConfig: Record<string, { label: string; icon: string; color: string }> = {
      transport: { label: 'Transport', icon: 'plane', color: '#3B82F6' },
      accommodation: { label: 'Accommodation', icon: 'hotel', color: '#8B5CF6' },
      activity: { label: 'Activities', icon: 'camera', color: '#14B8A6' },
      meal: { label: 'Food & Dining', icon: 'utensils', color: '#F97316' },
      free_time: { label: 'Other', icon: 'circle', color: '#6B7280' },
    }

    itinerary.forEach((day) => {
      let dayTotal = 0

      day.activities.forEach((slot) => {
        let cost = 0
        if (slot.selected) {
          if ('price' in slot.selected) {
            cost = slot.selected.price || 0
          } else if ('price_per_night' in slot.selected) {
            cost = slot.selected.price_per_night || 0
          }
        }

        const category = slot.type || 'other'
        if (!categoryTotals[category]) {
          categoryTotals[category] = { estimated: 0, actual: 0, count: 0 }
        }
        categoryTotals[category].estimated += cost
        categoryTotals[category].count += 1
        dayTotal += cost
      })

      byDay.push({
        dayId: `day-${day.day_number}`,
        dayNumber: day.day_number,
        date: day.date,
        estimated: dayTotal,
        actual: 0,
        difference: dayTotal,
      })
    })

    const totalEstimated = Object.values(categoryTotals).reduce((sum, c) => sum + c.estimated, 0)
    const travelers = tripData?.travelers || 1

    const byCategory: CategoryBudget[] = Object.entries(categoryTotals)
      .filter(([_, data]) => data.estimated > 0)
      .map(([category, data]) => {
        const config = categoryConfig[category] || { label: 'Other', icon: 'circle', color: '#6B7280' }
        return {
          category,
          label: config.label,
          icon: config.icon,
          color: config.color,
          estimated: data.estimated,
          actual: data.actual,
          percentage: totalEstimated > 0 ? (data.estimated / totalEstimated) * 100 : 0,
          itemCount: data.count,
        }
      })
      .sort((a, b) => b.estimated - a.estimated)

    return {
      totalBudget: totalEstimated,
      totalEstimated,
      totalActual: 0,
      difference: totalEstimated,
      percentUsed: 0,
      perPersonCost: totalEstimated / travelers,
      travelers,
      byDay,
      byCategory,
    }
  }

  return (
    <div className="min-h-screen bg-gray-50 dark:bg-black">
      {/* Sidebar */}
      <Sidebar user={user} />

      {/* Main Content */}
      <div className="lg:ml-[260px] pb-20 lg:pb-8">
        {/* Header */}
        <header className="sticky top-0 z-30 bg-white dark:bg-gray-900 border-b border-gray-200 dark:border-gray-800">
          <div className="px-4 md:px-8 py-4">
            <div className="flex items-center justify-between">
              <div className="flex items-center gap-4">
                <Link
                  href="/dashboard"
                  className="p-2 hover:bg-gray-100 dark:hover:bg-gray-800 rounded-lg transition-colors"
                >
                  <ArrowLeft className="w-5 h-5 text-gray-600 dark:text-gray-400" />
                </Link>
                <div>
                  <h1 className="text-xl font-bold text-gray-900 dark:text-white">
                    {viewMode === 'wizard' ? 'Plan Your Trip' : 'Your Itinerary'}
                  </h1>
                  {tripData && viewMode === 'itinerary' && (
                    <p className="text-sm text-gray-500 dark:text-gray-400">
                      {tripData.origin} → {tripData.destination} • {getTotalDays()} days
                    </p>
                  )}
                </div>
              </div>

              {viewMode === 'itinerary' && (
                <div className="flex items-center gap-3">
                  <button
                    onClick={handleSaveItinerary}
                    disabled={saving}
                    className="flex items-center gap-2 px-4 py-2 bg-teal-500 text-white font-medium rounded-lg hover:bg-teal-600 transition-colors disabled:opacity-50"
                  >
                    {saving ? (
                      <Loader2 className="w-4 h-4 animate-spin" />
                    ) : (
                      <Save className="w-4 h-4" />
                    )}
                    Save Trip
                  </button>
                </div>
              )}
            </div>
          </div>
        </header>

        {/* Content */}
        <main className="px-4 md:px-8 py-8">
          {error && (
            <div className="mb-6 p-4 bg-red-50 dark:bg-red-900/30 border border-red-200 dark:border-red-800 rounded-xl">
              <p className="text-red-600 dark:text-red-400">{error}</p>
            </div>
          )}

          {viewMode === 'wizard' && (
            <TripWizard
              onComplete={handleWizardComplete}
              initialTemplate={selectedTemplate}
            />
          )}

          {viewMode === 'itinerary' && tripData && (
            <div className="max-w-4xl mx-auto">
              {/* Trip Summary Card */}
              <div className="bg-gradient-to-r from-teal-500 to-blue-500 rounded-2xl p-6 mb-8 text-white">
                <div className="flex flex-col md:flex-row md:items-center md:justify-between gap-4">
                  <div>
                    <h2 className="text-2xl font-bold">
                      {tripData.origin} → {tripData.destination}
                    </h2>
                    <p className="text-teal-100 mt-1">
                      {new Date(tripData.startDate).toLocaleDateString('en-US', {
                        month: 'long',
                        day: 'numeric',
                      })}
                      {' - '}
                      {new Date(tripData.endDate).toLocaleDateString('en-US', {
                        month: 'long',
                        day: 'numeric',
                        year: 'numeric',
                      })}
                    </p>
                  </div>
                  <div className="flex gap-6">
                    <div className="text-center">
                      <p className="text-3xl font-bold">{getTotalDays()}</p>
                      <p className="text-sm text-teal-100">Days</p>
                    </div>
                    <div className="text-center">
                      <p className="text-3xl font-bold">{tripData.travelers}</p>
                      <p className="text-sm text-teal-100">Travelers</p>
                    </div>
                    <div className="text-center">
                      <p className="text-3xl font-bold">₱{calculateTotalCost().toLocaleString()}</p>
                      <p className="text-sm text-teal-100">Est. Cost</p>
                    </div>
                  </div>
                </div>
              </div>

              {/* Edit Button */}
              <div className="flex justify-end mb-4">
                <button
                  onClick={() => setViewMode('wizard')}
                  className="text-sm text-teal-600 dark:text-teal-400 hover:underline"
                >
                  Edit trip details
                </button>
              </div>

              {/* Timeline */}
              {loading ? (
                <div className="flex flex-col items-center justify-center py-20">
                  <Loader2 className="w-8 h-8 text-teal-500 animate-spin mb-4" />
                  <p className="text-gray-500 dark:text-gray-400">
                    Generating your perfect itinerary...
                  </p>
                </div>
              ) : (
                <>
                  <ItineraryTimeline
                    days={itinerary}
                    onSelectSuggestion={handleSelectSuggestion}
                    onBookItem={handleBookItem}
                  />

                  {/* Budget Breakdown */}
                  <div className="mt-8">
                    <h2 className="text-xl font-bold text-gray-900 dark:text-white mb-4">
                      Budget Breakdown
                    </h2>
                    <BudgetBreakdown
                      budget={calculateBudgetBreakdown()}
                      travelers={tripData?.travelers || 1}
                      showTips={true}
                    />
                  </div>
                </>
              )}

              {/* Bottom Actions */}
              <div className="mt-8 flex flex-col sm:flex-row gap-4">
                <button
                  onClick={handleSaveItinerary}
                  disabled={saving}
                  className="flex-1 flex items-center justify-center gap-2 py-3 bg-teal-500 text-white font-semibold rounded-xl hover:bg-teal-600 transition-colors disabled:opacity-50"
                >
                  {saving ? (
                    <Loader2 className="w-5 h-5 animate-spin" />
                  ) : (
                    <Save className="w-5 h-5" />
                  )}
                  Save Itinerary
                </button>
                <button className="flex-1 flex items-center justify-center gap-2 py-3 bg-gray-100 dark:bg-gray-800 text-gray-700 dark:text-gray-300 font-semibold rounded-xl hover:bg-gray-200 dark:hover:bg-gray-700 transition-colors">
                  <Share2 className="w-5 h-5" />
                  Share
                </button>
              </div>
            </div>
          )}
        </main>
      </div>

      {/* Mobile Navigation */}
      <MobileNav user={user} />
    </div>
  )
}
