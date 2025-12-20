'use client'

import { ItineraryActivity } from '@/types/database'
import { formatCurrency } from '../hooks/useBudgetCalculations'
import { PLACE_TYPES, PlaceType } from '@/lib/google-maps'

interface ActivityCardProps {
  activity: ItineraryActivity
  onEdit: () => void
  onDelete: () => void
  showActions?: boolean
}

export default function ActivityCard({
  activity,
  onEdit,
  onDelete,
  showActions = true,
}: ActivityCardProps) {
  const placeType = (activity.place_type as PlaceType) || 'other'
  const placeInfo = PLACE_TYPES[placeType] || PLACE_TYPES.other

  return (
    <div className="flex items-start gap-3 p-3 bg-gray-50 rounded-lg group hover:bg-gray-100 transition-colors">
      {/* Icon */}
      <div className="w-10 h-10 flex items-center justify-center bg-white rounded-lg shadow-sm text-xl flex-shrink-0">
        {placeInfo.icon}
      </div>

      {/* Content */}
      <div className="flex-1 min-w-0">
        <div className="flex items-start justify-between gap-2">
          <div>
            <h4 className="font-medium text-gray-900 line-clamp-1">{activity.title}</h4>
            <p className="text-sm text-gray-600 line-clamp-1">{activity.location}</p>
          </div>

          {/* Time */}
          {activity.start_time && (
            <span className="text-xs text-gray-500 whitespace-nowrap">
              {activity.start_time.slice(0, 5)}
              {activity.end_time && ` - ${activity.end_time.slice(0, 5)}`}
            </span>
          )}
        </div>

        {/* Description */}
        {activity.description && (
          <p className="text-sm text-gray-500 mt-1 line-clamp-2">{activity.description}</p>
        )}

        {/* Cost */}
        <div className="flex items-center gap-4 mt-2 text-sm">
          {activity.estimated_cost !== undefined && activity.estimated_cost > 0 && (
            <span className="text-gray-600">
              Est: {formatCurrency(activity.estimated_cost)}
            </span>
          )}
          {activity.actual_cost !== undefined && activity.actual_cost > 0 && (
            <span className="text-primary-600 font-medium">
              Actual: {formatCurrency(activity.actual_cost)}
            </span>
          )}
        </div>

        {/* Notes */}
        {activity.notes && (
          <p className="text-xs text-gray-400 mt-1 italic line-clamp-1">
            Note: {activity.notes}
          </p>
        )}
      </div>

      {/* Actions */}
      {showActions && (
        <div className="flex items-center gap-1 opacity-0 group-hover:opacity-100 transition-opacity">
          <button
            onClick={onEdit}
            className="p-1.5 text-gray-400 hover:text-primary-600 hover:bg-primary-50 rounded transition-colors"
            title="Edit activity"
          >
            <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15.232 5.232l3.536 3.536m-2.036-5.036a2.5 2.5 0 113.536 3.536L6.5 21.036H3v-3.572L16.732 3.732z" />
            </svg>
          </button>
          <button
            onClick={onDelete}
            className="p-1.5 text-gray-400 hover:text-red-600 hover:bg-red-50 rounded transition-colors"
            title="Delete activity"
          >
            <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 7l-.867 12.142A2 2 0 0116.138 21H7.862a2 2 0 01-1.995-1.858L5 7m5 4v6m4-6v6m1-10V4a1 1 0 00-1-1h-4a1 1 0 00-1 1v3M4 7h16" />
            </svg>
          </button>
        </div>
      )}
    </div>
  )
}
