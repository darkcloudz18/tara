'use client'

import Link from 'next/link'

interface EmptyStateProps {
  title: string
  description: string
  actionLabel?: string
  actionHref?: string
  onAction?: () => void
  icon?: React.ReactNode
}

export default function EmptyState({
  title,
  description,
  actionLabel,
  actionHref,
  onAction,
  icon,
}: EmptyStateProps) {
  return (
    <div className="flex flex-col items-center justify-center py-16 px-4 text-center">
      {icon ? (
        <div className="mb-4">{icon}</div>
      ) : (
        <div className="w-24 h-24 mb-4 bg-primary-50 rounded-full flex items-center justify-center">
          <span className="text-5xl">🗺️</span>
        </div>
      )}

      <h3 className="text-xl font-semibold text-gray-900 mb-2">{title}</h3>
      <p className="text-gray-600 mb-6 max-w-md">{description}</p>

      {(actionLabel && actionHref) && (
        <Link href={actionHref} className="btn-primary">
          {actionLabel}
        </Link>
      )}

      {(actionLabel && onAction && !actionHref) && (
        <button onClick={onAction} className="btn-primary">
          {actionLabel}
        </button>
      )}
    </div>
  )
}

// Pre-configured empty states
export function NoItinerariesState() {
  return (
    <EmptyState
      title="No trips planned yet"
      description="Start planning your next adventure! Create your first itinerary and organize your perfect Philippine getaway."
      actionLabel="Create Your First Trip"
      actionHref="/planner/new"
    />
  )
}

export function NoDaysState({ onAddDay }: { onAddDay: () => void }) {
  return (
    <EmptyState
      title="No days added"
      description="Add days to your itinerary to start planning activities."
      actionLabel="Add Day"
      onAction={onAddDay}
      icon={
        <div className="w-16 h-16 bg-blue-50 rounded-full flex items-center justify-center">
          <span className="text-3xl">📅</span>
        </div>
      }
    />
  )
}

export function NoActivitiesState({ onAddActivity }: { onAddActivity: () => void }) {
  return (
    <EmptyState
      title="No activities yet"
      description="Add activities to plan out your day."
      actionLabel="Add Activity"
      onAction={onAddActivity}
      icon={
        <div className="w-16 h-16 bg-green-50 rounded-full flex items-center justify-center">
          <span className="text-3xl">📍</span>
        </div>
      }
    />
  )
}
