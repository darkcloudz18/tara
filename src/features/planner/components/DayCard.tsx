'use client'

import { useState } from 'react'
import { ItineraryDay, ItineraryActivity } from '@/types/database'
import { format } from 'date-fns'
import { formatCurrency } from '../hooks/useBudgetCalculations'
import { getDayColor } from '@/lib/google-maps'
import ActivityCard from './ActivityCard'
import ActivityForm, { ActivityFormData } from './ActivityForm'
import DayForm, { DayFormData } from './DayForm'
import { NoActivitiesState } from './EmptyState'

interface DayCardProps {
  day: ItineraryDay
  activities: ItineraryActivity[]
  onUpdateDay: (data: DayFormData) => Promise<void>
  onDeleteDay: () => void
  onAddActivity: (data: ActivityFormData) => Promise<void>
  onUpdateActivity: (activityId: string, data: ActivityFormData) => Promise<void>
  onDeleteActivity: (activityId: string) => void
  defaultExpanded?: boolean
}

export default function DayCard({
  day,
  activities,
  onUpdateDay,
  onDeleteDay,
  onAddActivity,
  onUpdateActivity,
  onDeleteActivity,
  defaultExpanded = false,
}: DayCardProps) {
  const [expanded, setExpanded] = useState(defaultExpanded)
  const [editingDay, setEditingDay] = useState(false)
  const [addingActivity, setAddingActivity] = useState(false)
  const [editingActivityId, setEditingActivityId] = useState<string | null>(null)
  const [loading, setLoading] = useState(false)

  const dayColor = getDayColor(day.day_number)
  const totalEstimated = activities.reduce((sum, a) => sum + (a.estimated_cost || 0), 0)
  const totalActual = activities.reduce((sum, a) => sum + (a.actual_cost || 0), 0)

  const handleUpdateDay = async (data: DayFormData) => {
    setLoading(true)
    try {
      await onUpdateDay(data)
      setEditingDay(false)
    } finally {
      setLoading(false)
    }
  }

  const handleAddActivity = async (data: ActivityFormData) => {
    setLoading(true)
    try {
      await onAddActivity(data)
      setAddingActivity(false)
    } finally {
      setLoading(false)
    }
  }

  const handleUpdateActivity = async (activityId: string, data: ActivityFormData) => {
    setLoading(true)
    try {
      await onUpdateActivity(activityId, data)
      setEditingActivityId(null)
    } finally {
      setLoading(false)
    }
  }

  return (
    <div className="card overflow-hidden">
      {/* Header */}
      <div
        className="flex items-center gap-4 cursor-pointer -mx-6 -mt-6 px-6 py-4 hover:bg-gray-50 transition-colors"
        onClick={() => setExpanded(!expanded)}
      >
        {/* Day Number Badge */}
        <div
          className="w-12 h-12 rounded-full flex items-center justify-center text-white font-bold text-lg flex-shrink-0"
          style={{ backgroundColor: dayColor }}
        >
          {day.day_number}
        </div>

        {/* Day Info */}
        <div className="flex-1 min-w-0">
          <div className="flex items-center gap-2">
            <h3 className="font-semibold text-gray-900">
              {day.title || `Day ${day.day_number}`}
            </h3>
            <span className="text-sm text-gray-500">
              {format(new Date(day.date), 'EEE, MMM d')}
            </span>
          </div>
          <div className="flex items-center gap-4 text-sm text-gray-600 mt-0.5">
            <span>{activities.length} activities</span>
            {totalEstimated > 0 && (
              <span>Est: {formatCurrency(totalEstimated)}</span>
            )}
            {totalActual > 0 && (
              <span className="text-primary-600">
                Spent: {formatCurrency(totalActual)}
              </span>
            )}
          </div>
        </div>

        {/* Expand Icon */}
        <svg
          className={`w-5 h-5 text-gray-400 transition-transform ${expanded ? 'rotate-180' : ''}`}
          fill="none"
          stroke="currentColor"
          viewBox="0 0 24 24"
        >
          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 9l-7 7-7-7" />
        </svg>
      </div>

      {/* Expanded Content */}
      {expanded && (
        <div className="mt-4 pt-4 border-t border-gray-100">
          {/* Day Notes */}
          {day.notes && !editingDay && (
            <p className="text-sm text-gray-600 mb-4 italic">{day.notes}</p>
          )}

          {/* Edit Day Form */}
          {editingDay ? (
            <div className="mb-4 p-4 bg-gray-50 rounded-lg">
              <h4 className="font-medium text-gray-900 mb-3">Edit Day</h4>
              <DayForm
                initialData={day}
                onSubmit={handleUpdateDay}
                onCancel={() => setEditingDay(false)}
                loading={loading}
                submitLabel="Save Changes"
              />
            </div>
          ) : (
            <div className="flex gap-2 mb-4">
              <button
                onClick={() => setEditingDay(true)}
                className="text-sm text-gray-600 hover:text-primary-600"
              >
                Edit day
              </button>
              <span className="text-gray-300">|</span>
              <button
                onClick={onDeleteDay}
                className="text-sm text-gray-600 hover:text-red-600"
              >
                Delete day
              </button>
            </div>
          )}

          {/* Activities */}
          <div className="space-y-3">
            {activities.length === 0 && !addingActivity ? (
              <NoActivitiesState onAddActivity={() => setAddingActivity(true)} />
            ) : (
              <>
                {activities.map((activity) =>
                  editingActivityId === activity.id ? (
                    <div key={activity.id} className="p-4 bg-gray-50 rounded-lg">
                      <h4 className="font-medium text-gray-900 mb-3">Edit Activity</h4>
                      <ActivityForm
                        initialData={activity}
                        onSubmit={(data) => handleUpdateActivity(activity.id, data)}
                        onCancel={() => setEditingActivityId(null)}
                        loading={loading}
                        submitLabel="Save Changes"
                      />
                    </div>
                  ) : (
                    <ActivityCard
                      key={activity.id}
                      activity={activity}
                      onEdit={() => setEditingActivityId(activity.id)}
                      onDelete={() => onDeleteActivity(activity.id)}
                    />
                  )
                )}
              </>
            )}
          </div>

          {/* Add Activity */}
          {addingActivity ? (
            <div className="mt-4 p-4 bg-primary-50 rounded-lg">
              <h4 className="font-medium text-gray-900 mb-3">Add Activity</h4>
              <ActivityForm
                onSubmit={handleAddActivity}
                onCancel={() => setAddingActivity(false)}
                loading={loading}
                submitLabel="Add Activity"
              />
            </div>
          ) : (
            <button
              onClick={() => setAddingActivity(true)}
              className="mt-4 w-full py-2 border-2 border-dashed border-gray-300 rounded-lg text-gray-600 hover:border-primary-400 hover:text-primary-600 transition-colors flex items-center justify-center gap-2"
            >
              <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 4v16m8-8H4" />
              </svg>
              Add Activity
            </button>
          )}
        </div>
      )}
    </div>
  )
}
