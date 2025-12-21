'use client'

import { MapPin, X, Check, Bookmark, Loader2, Trash2 } from 'lucide-react'
import { BucketListItem } from '../../services/bucketListService'

interface BucketListScreenProps {
  items: BucketListItem[]
  loading: boolean
  groupedByLocation: Record<string, BucketListItem[]>
  onRemoveItem: (itemId: string) => void
  onToggleVisited: (itemId: string, visited: boolean) => void
  onCreateTrip: () => void
}

export default function BucketListScreen({
  items,
  loading,
  groupedByLocation,
  onRemoveItem,
  onToggleVisited,
  onCreateTrip,
}: BucketListScreenProps) {
  const totalEstimatedCost = items.reduce(
    (sum, item) => sum + (item.place_estimated_cost || 0),
    0
  )

  const unvisitedItems = items.filter((i) => !i.is_visited)

  if (loading) {
    return (
      <div className="flex-1 flex items-center justify-center bg-gray-50">
        <div className="text-center">
          <Loader2 className="w-8 h-8 animate-spin text-primary-600 mx-auto mb-3" />
          <p className="text-gray-500">Loading bucket list...</p>
        </div>
      </div>
    )
  }

  return (
    <div className="flex flex-col h-full bg-gray-50">
      {/* Header */}
      <div className="bg-white border-b border-gray-100 px-4 pt-4 pb-3">
        <div className="flex items-center justify-between">
          <div className="flex items-center gap-2">
            <Bookmark className="w-6 h-6 text-primary-600" />
            <h1 className="text-xl font-bold text-gray-900">Bucket List</h1>
          </div>
          <span className="text-sm text-gray-500">
            {unvisitedItems.length} {unvisitedItems.length === 1 ? 'place' : 'places'}
          </span>
        </div>
      </div>

      {/* Content */}
      <div className="flex-1 overflow-y-auto px-4 py-4">
        {items.length === 0 ? (
          <div className="flex flex-col items-center justify-center h-full text-center px-6">
            <div className="w-16 h-16 bg-gray-100 rounded-full flex items-center justify-center mb-4">
              <Bookmark className="w-8 h-8 text-gray-400" />
            </div>
            <h3 className="text-lg font-semibold text-gray-900 mb-2">
              Your bucket list is empty
            </h3>
            <p className="text-gray-500">
              Tap the heart on places you'd love to visit and they'll appear
              here!
            </p>
          </div>
        ) : (
          <div className="space-y-6">
            {Object.entries(groupedByLocation).map(([location, locationItems]) => (
              <div key={location}>
                {/* Location Header */}
                <div className="flex items-center gap-2 mb-3">
                  <MapPin className="w-4 h-4 text-primary-600" />
                  <h2 className="font-semibold text-gray-900 uppercase text-sm tracking-wide">
                    {location}
                  </h2>
                  <span className="text-xs text-gray-400">
                    ({locationItems.length})
                  </span>
                </div>

                {/* Places */}
                <div className="space-y-2">
                  {locationItems.map((item) => (
                    <div
                      key={item.id}
                      className={`bg-white rounded-xl p-3 shadow-sm border border-gray-100 flex items-center gap-3 ${
                        item.is_visited ? 'opacity-60' : ''
                      }`}
                    >
                      {/* Image */}
                      <div className="w-16 h-16 rounded-lg overflow-hidden flex-shrink-0 bg-gray-100">
                        {item.place_image_url ? (
                          <img
                            src={item.place_image_url}
                            alt={item.place_name}
                            className="w-full h-full object-cover"
                          />
                        ) : (
                          <div className="w-full h-full flex items-center justify-center">
                            <MapPin className="w-6 h-6 text-gray-300" />
                          </div>
                        )}
                      </div>

                      {/* Info */}
                      <div className="flex-1 min-w-0">
                        <h3
                          className={`font-medium text-gray-900 truncate ${
                            item.is_visited ? 'line-through' : ''
                          }`}
                        >
                          {item.place_name}
                        </h3>
                        <p className="text-sm text-gray-500 truncate">
                          {item.place_category}
                        </p>
                        {item.place_estimated_cost && item.place_estimated_cost > 0 && (
                          <p className="text-sm font-medium text-primary-600">
                            ~₱{item.place_estimated_cost.toLocaleString()}
                          </p>
                        )}
                      </div>

                      {/* Actions */}
                      <div className="flex items-center gap-1">
                        {/* Mark as visited */}
                        <button
                          onClick={() => onToggleVisited(item.id, !item.is_visited)}
                          className={`p-2 rounded-full transition-colors ${
                            item.is_visited
                              ? 'bg-green-100 text-green-600'
                              : 'bg-gray-100 text-gray-400 hover:bg-green-50 hover:text-green-500'
                          }`}
                          title={item.is_visited ? 'Mark as not visited' : 'Mark as visited'}
                        >
                          <Check className="w-4 h-4" />
                        </button>

                        {/* Remove */}
                        <button
                          onClick={() => onRemoveItem(item.id)}
                          className="p-2 rounded-full bg-gray-100 text-gray-400 hover:bg-red-50 hover:text-red-500 transition-colors"
                          title="Remove from bucket list"
                        >
                          <Trash2 className="w-4 h-4" />
                        </button>
                      </div>
                    </div>
                  ))}
                </div>
              </div>
            ))}
          </div>
        )}
      </div>

      {/* Bottom Bar */}
      {unvisitedItems.length > 0 && (
        <div className="bg-white border-t border-gray-100 px-4 py-4">
          {/* Estimated Cost */}
          {totalEstimatedCost > 0 && (
            <div className="flex items-center justify-between mb-3 text-sm">
              <span className="text-gray-500">Estimated total</span>
              <span className="font-semibold text-gray-900">
                ~₱{totalEstimatedCost.toLocaleString()}
              </span>
            </div>
          )}

          {/* Create Trip Button */}
          <button
            onClick={onCreateTrip}
            className="w-full py-4 bg-primary-600 text-white rounded-xl font-semibold text-lg flex items-center justify-center gap-2 hover:bg-primary-700 transition-colors"
          >
            Plan a Trip
          </button>
        </div>
      )}
    </div>
  )
}
