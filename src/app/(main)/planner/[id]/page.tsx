'use client'

import { useState, useEffect } from 'react'
import { useRouter, useParams } from 'next/navigation'
import Link from 'next/link'
import { format } from 'date-fns'
import { useItinerary } from '@/features/planner/hooks/useItinerary'
import { useBudgetCalculations } from '@/features/planner/hooks/useBudgetCalculations'
import { dayService } from '@/features/planner/services/dayService'
import { activityService } from '@/features/planner/services/activityService'
import DayCard from '@/features/planner/components/DayCard'
import BudgetSummary from '@/features/planner/components/BudgetSummary'
import ItineraryMap from '@/features/planner/components/ItineraryMap'
import ItineraryForm, { ItineraryFormData } from '@/features/planner/components/ItineraryForm'
import DeleteConfirmModal from '@/features/planner/components/DeleteConfirmModal'
import { NoDaysState } from '@/features/planner/components/EmptyState'
import { DayFormData } from '@/features/planner/components/DayForm'
import { ActivityFormData } from '@/features/planner/components/ActivityForm'

export default function ItineraryDetailPage() {
  const router = useRouter()
  const params = useParams()
  const itineraryId = params.id as string

  const {
    itinerary,
    days,
    activities,
    loading,
    error,
    refetch,
    updateItinerary,
    deleteItinerary,
    getActivitiesForDay,
  } = useItinerary(itineraryId)

  const budget = useBudgetCalculations(itinerary, days, activities)

  const [activeTab, setActiveTab] = useState<'itinerary' | 'map'>('itinerary')
  const [editingItinerary, setEditingItinerary] = useState(false)
  const [showDeleteModal, setShowDeleteModal] = useState(false)
  const [deleteTarget, setDeleteTarget] = useState<{ type: 'itinerary' | 'day' | 'activity'; id: string } | null>(null)
  const [savingItinerary, setSavingItinerary] = useState(false)

  // Handle itinerary update
  const handleUpdateItinerary = async (data: ItineraryFormData) => {
    setSavingItinerary(true)
    try {
      const destinations = data.destinations
        .split(',')
        .map((d) => d.trim())
        .filter((d) => d.length > 0)

      await updateItinerary({
        title: data.title.trim(),
        description: data.description.trim() || undefined,
        start_date: data.start_date,
        end_date: data.end_date,
        destinations,
        total_budget: data.total_budget ? parseFloat(data.total_budget) : undefined,
      })
      setEditingItinerary(false)
    } finally {
      setSavingItinerary(false)
    }
  }

  // Handle day update
  const handleUpdateDay = async (dayId: string, data: DayFormData) => {
    await dayService.update(dayId, {
      title: data.title || undefined,
      notes: data.notes || undefined,
      estimated_budget: data.estimated_budget ? parseFloat(data.estimated_budget) : undefined,
    })
    await refetch()
  }

  // Handle day delete
  const handleDeleteDay = (dayId: string) => {
    setDeleteTarget({ type: 'day', id: dayId })
    setShowDeleteModal(true)
  }

  // Handle activity add
  const handleAddActivity = async (dayId: string, data: ActivityFormData) => {
    await activityService.create({
      day_id: dayId,
      title: data.title.trim(),
      description: data.description.trim() || undefined,
      start_time: data.start_time || undefined,
      end_time: data.end_time || undefined,
      location: data.location.trim(),
      coordinates: data.coordinates,
      place_type: data.place_type,
      estimated_cost: data.estimated_cost ? parseFloat(data.estimated_cost) : undefined,
      actual_cost: data.actual_cost ? parseFloat(data.actual_cost) : undefined,
      notes: data.notes.trim() || undefined,
    })
    await refetch()
  }

  // Handle activity update
  const handleUpdateActivity = async (activityId: string, data: ActivityFormData) => {
    await activityService.update(activityId, {
      title: data.title.trim(),
      description: data.description.trim() || undefined,
      start_time: data.start_time || undefined,
      end_time: data.end_time || undefined,
      location: data.location.trim(),
      coordinates: data.coordinates,
      place_type: data.place_type,
      estimated_cost: data.estimated_cost ? parseFloat(data.estimated_cost) : undefined,
      actual_cost: data.actual_cost ? parseFloat(data.actual_cost) : undefined,
      notes: data.notes.trim() || undefined,
    })
    await refetch()
  }

  // Handle activity delete
  const handleDeleteActivity = (activityId: string) => {
    setDeleteTarget({ type: 'activity', id: activityId })
    setShowDeleteModal(true)
  }

  // Handle delete confirmation
  const handleDeleteConfirm = async () => {
    if (!deleteTarget) return

    try {
      if (deleteTarget.type === 'itinerary') {
        await deleteItinerary()
        router.push('/planner')
      } else if (deleteTarget.type === 'day') {
        await dayService.delete(deleteTarget.id)
        await refetch()
      } else if (deleteTarget.type === 'activity') {
        await activityService.delete(deleteTarget.id)
        await refetch()
      }
    } finally {
      setShowDeleteModal(false)
      setDeleteTarget(null)
    }
  }

  if (loading) {
    return (
      <div className="min-h-screen bg-gray-50">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
          <div className="animate-pulse">
            <div className="h-8 bg-gray-200 rounded w-64 mb-4" />
            <div className="h-4 bg-gray-200 rounded w-32 mb-8" />
            <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
              <div className="lg:col-span-2 space-y-4">
                {[1, 2, 3].map((i) => (
                  <div key={i} className="h-32 bg-gray-200 rounded-lg" />
                ))}
              </div>
              <div className="h-64 bg-gray-200 rounded-lg" />
            </div>
          </div>
        </div>
      </div>
    )
  }

  if (error || !itinerary) {
    return (
      <div className="min-h-screen bg-gray-50 flex items-center justify-center">
        <div className="text-center">
          <h2 className="text-xl font-semibold text-gray-900 mb-2">
            {error || 'Itinerary not found'}
          </h2>
          <Link href="/planner" className="text-primary-600 hover:text-primary-700">
            Back to My Trips
          </Link>
        </div>
      </div>
    )
  }

  return (
    <div className="min-h-screen bg-gray-50">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
        {/* Back Link */}
        <Link
          href="/planner"
          className="inline-flex items-center text-gray-600 hover:text-gray-900 mb-6"
        >
          <svg className="w-5 h-5 mr-1" fill="none" stroke="currentColor" viewBox="0 0 24 24">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 19l-7-7 7-7" />
          </svg>
          Back to My Trips
        </Link>

        {/* Header */}
        {editingItinerary ? (
          <div className="card mb-8">
            <h2 className="font-semibold text-gray-900 mb-4">Edit Trip Details</h2>
            <ItineraryForm
              initialData={itinerary}
              onSubmit={handleUpdateItinerary}
              onCancel={() => setEditingItinerary(false)}
              loading={savingItinerary}
              submitLabel="Save Changes"
            />
          </div>
        ) : (
          <div className="mb-8">
            <div className="flex items-start justify-between gap-4">
              <div>
                <h1 className="text-2xl font-bold text-gray-900">{itinerary.title}</h1>
                <div className="flex items-center gap-2 text-gray-600 mt-1">
                  <span>
                    {format(new Date(itinerary.start_date), 'MMM d')} -{' '}
                    {format(new Date(itinerary.end_date), 'MMM d, yyyy')}
                  </span>
                  <span className="text-gray-400">•</span>
                  <span>{days.length} days</span>
                </div>
                {itinerary.description && (
                  <p className="text-gray-600 mt-2">{itinerary.description}</p>
                )}
                <div className="flex flex-wrap gap-1 mt-3">
                  {itinerary.destinations.map((dest, i) => (
                    <span
                      key={i}
                      className="px-2 py-0.5 bg-primary-50 text-primary-700 text-sm rounded-full"
                    >
                      {dest}
                    </span>
                  ))}
                </div>
              </div>
              <div className="flex items-center gap-2">
                <button
                  onClick={() => setEditingItinerary(true)}
                  className="btn-secondary flex items-center gap-1"
                >
                  <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15.232 5.232l3.536 3.536m-2.036-5.036a2.5 2.5 0 113.536 3.536L6.5 21.036H3v-3.572L16.732 3.732z" />
                  </svg>
                  Edit
                </button>
                <button
                  onClick={() => {
                    setDeleteTarget({ type: 'itinerary', id: itinerary.id })
                    setShowDeleteModal(true)
                  }}
                  className="p-2 text-gray-400 hover:text-red-600 hover:bg-red-50 rounded-lg transition-colors"
                  title="Delete itinerary"
                >
                  <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 7l-.867 12.142A2 2 0 0116.138 21H7.862a2 2 0 01-1.995-1.858L5 7m5 4v6m4-6v6m1-10V4a1 1 0 00-1-1h-4a1 1 0 00-1 1v3M4 7h16" />
                  </svg>
                </button>
              </div>
            </div>
          </div>
        )}

        {/* Tabs */}
        <div className="flex gap-4 border-b border-gray-200 mb-6">
          <button
            onClick={() => setActiveTab('itinerary')}
            className={`pb-3 px-1 font-medium border-b-2 transition-colors ${
              activeTab === 'itinerary'
                ? 'border-primary-600 text-primary-600'
                : 'border-transparent text-gray-500 hover:text-gray-700'
            }`}
          >
            Itinerary
          </button>
          <button
            onClick={() => setActiveTab('map')}
            className={`pb-3 px-1 font-medium border-b-2 transition-colors ${
              activeTab === 'map'
                ? 'border-primary-600 text-primary-600'
                : 'border-transparent text-gray-500 hover:text-gray-700'
            }`}
          >
            Map View
          </button>
        </div>

        {/* Content */}
        {activeTab === 'itinerary' ? (
          <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
            {/* Days */}
            <div className="lg:col-span-2 space-y-4">
              {days.length === 0 ? (
                <NoDaysState onAddDay={() => {}} />
              ) : (
                days.map((day, index) => (
                  <DayCard
                    key={day.id}
                    day={day}
                    activities={getActivitiesForDay(day.id)}
                    onUpdateDay={(data) => handleUpdateDay(day.id, data)}
                    onDeleteDay={() => handleDeleteDay(day.id)}
                    onAddActivity={(data) => handleAddActivity(day.id, data)}
                    onUpdateActivity={handleUpdateActivity}
                    onDeleteActivity={handleDeleteActivity}
                    defaultExpanded={index === 0}
                  />
                ))
              )}
            </div>

            {/* Sidebar */}
            <div className="space-y-6">
              <BudgetSummary budget={budget} />

              {/* Mini Map */}
              <div className="card">
                <h3 className="font-semibold text-gray-900 mb-3">Overview Map</h3>
                <ItineraryMap
                  days={days}
                  activities={activities}
                  height="250px"
                />
              </div>
            </div>
          </div>
        ) : (
          <div className="card">
            <ItineraryMap
              days={days}
              activities={activities}
              height="600px"
            />
          </div>
        )}
      </div>

      {/* Delete Modal */}
      <DeleteConfirmModal
        isOpen={showDeleteModal}
        onClose={() => {
          setShowDeleteModal(false)
          setDeleteTarget(null)
        }}
        onConfirm={handleDeleteConfirm}
        title={
          deleteTarget?.type === 'itinerary'
            ? 'Delete Itinerary'
            : deleteTarget?.type === 'day'
            ? 'Delete Day'
            : 'Delete Activity'
        }
        message={
          deleteTarget?.type === 'itinerary'
            ? 'Are you sure you want to delete this itinerary? This will also delete all days and activities. This action cannot be undone.'
            : deleteTarget?.type === 'day'
            ? 'Are you sure you want to delete this day? All activities for this day will also be deleted.'
            : 'Are you sure you want to delete this activity?'
        }
      />
    </div>
  )
}
