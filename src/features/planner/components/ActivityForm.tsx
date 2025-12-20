'use client'

import { useState } from 'react'
import { ItineraryActivity } from '@/types/database'
import PlacesAutocomplete, { PlaceResult, PlaceTypeSelector } from './PlacesAutocomplete'
import PlaceSuggestions from './PlaceSuggestions'
import { PlaceType, PLACE_TYPES } from '@/lib/google-maps'

export interface ActivityFormData {
  title: string
  description: string
  start_time: string
  end_time: string
  location: string
  coordinates?: { x: number; y: number }
  place_type: PlaceType
  estimated_cost: string
  actual_cost: string
  notes: string
}

interface ActivityFormProps {
  initialData?: Partial<ItineraryActivity>
  onSubmit: (data: ActivityFormData) => Promise<void>
  onCancel: () => void
  loading?: boolean
  submitLabel?: string
}

export default function ActivityForm({
  initialData,
  onSubmit,
  onCancel,
  loading = false,
  submitLabel = 'Add Activity',
}: ActivityFormProps) {
  const [formData, setFormData] = useState<ActivityFormData>({
    title: initialData?.title || '',
    description: initialData?.description || '',
    start_time: initialData?.start_time || '',
    end_time: initialData?.end_time || '',
    location: initialData?.location || '',
    coordinates: initialData?.coordinates,
    place_type: (initialData?.place_type as PlaceType) || 'other',
    estimated_cost: initialData?.estimated_cost?.toString() || '',
    actual_cost: initialData?.actual_cost?.toString() || '',
    notes: initialData?.notes || '',
  })

  const [error, setError] = useState('')

  const handleChange = (
    e: React.ChangeEvent<HTMLInputElement | HTMLTextAreaElement>
  ) => {
    const { name, value } = e.target
    setFormData((prev) => ({ ...prev, [name]: value }))
    setError('')
  }

  const handlePlaceSelect = (place: PlaceResult) => {
    setFormData((prev) => ({
      ...prev,
      title: prev.title || place.name,
      location: place.address || place.name,
      coordinates: place.coordinates,
    }))
  }

  const handleSuggestionSelect = (place: {
    name: string
    address: string
    coordinates: { x: number; y: number }
    types: string[]
  }) => {
    // Determine place type from Google types
    let placeType: PlaceType = 'activity'
    if (place.types.includes('restaurant') || place.types.includes('food')) placeType = 'restaurant'
    else if (place.types.includes('lodging')) placeType = 'hotel'
    else if (place.types.includes('tourist_attraction')) placeType = 'attraction'
    else if (place.types.includes('shopping_mall') || place.types.includes('store')) placeType = 'shopping'
    else if (place.types.includes('cafe')) placeType = 'restaurant'
    else if (place.types.includes('bar')) placeType = 'restaurant'

    setFormData((prev) => ({
      ...prev,
      title: place.name,
      location: place.address || place.name,
      coordinates: place.coordinates,
      place_type: placeType,
    }))
  }

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()
    setError('')

    if (!formData.title.trim()) {
      setError('Please enter an activity title')
      return
    }

    if (!formData.location.trim()) {
      setError('Please enter a location')
      return
    }

    try {
      await onSubmit(formData)
    } catch (err: any) {
      setError(err.message || 'Something went wrong')
    }
  }

  return (
    <form onSubmit={handleSubmit} className="space-y-4">
      {error && (
        <div className="p-3 bg-red-50 border border-red-200 rounded-lg text-red-700 text-sm">
          {error}
        </div>
      )}

      {/* Location Search */}
      <div>
        <label className="block text-sm font-medium text-gray-700 mb-1">
          Search Location
        </label>
        <PlacesAutocomplete
          value={formData.location}
          onChange={(value) => setFormData((prev) => ({ ...prev, location: value }))}
          onPlaceSelect={handlePlaceSelect}
          placeholder="Search for a place in the Philippines..."
          disabled={loading}
        />
      </div>

      {/* Place Suggestions - show when location has coordinates */}
      {formData.coordinates && (
        <PlaceSuggestions
          location={{
            lat: formData.coordinates.x,
            lng: formData.coordinates.y,
          }}
          onSelectPlace={handleSuggestionSelect}
        />
      )}

      {/* Title */}
      <div>
        <label htmlFor="title" className="block text-sm font-medium text-gray-700 mb-1">
          Activity Title *
        </label>
        <input
          type="text"
          id="title"
          name="title"
          value={formData.title}
          onChange={handleChange}
          placeholder="e.g., Visit Rizal Park"
          className="input-field"
          disabled={loading}
        />
      </div>

      {/* Place Type */}
      <div>
        <label className="block text-sm font-medium text-gray-700 mb-2">
          Type
        </label>
        <PlaceTypeSelector
          value={formData.place_type}
          onChange={(type) => setFormData((prev) => ({ ...prev, place_type: type }))}
        />
      </div>

      {/* Times */}
      <div className="grid grid-cols-2 gap-4">
        <div>
          <label htmlFor="start_time" className="block text-sm font-medium text-gray-700 mb-1">
            Start Time
          </label>
          <input
            type="time"
            id="start_time"
            name="start_time"
            value={formData.start_time}
            onChange={handleChange}
            className="input-field"
            disabled={loading}
          />
        </div>
        <div>
          <label htmlFor="end_time" className="block text-sm font-medium text-gray-700 mb-1">
            End Time
          </label>
          <input
            type="time"
            id="end_time"
            name="end_time"
            value={formData.end_time}
            onChange={handleChange}
            className="input-field"
            disabled={loading}
          />
        </div>
      </div>

      {/* Costs */}
      <div className="grid grid-cols-2 gap-4">
        <div>
          <label htmlFor="estimated_cost" className="block text-sm font-medium text-gray-700 mb-1">
            Estimated Cost
          </label>
          <div className="relative">
            <span className="absolute left-3 top-1/2 -translate-y-1/2 text-gray-500 text-sm">₱</span>
            <input
              type="number"
              id="estimated_cost"
              name="estimated_cost"
              value={formData.estimated_cost}
              onChange={handleChange}
              placeholder="0"
              min="0"
              className="input-field pl-7"
              disabled={loading}
            />
          </div>
        </div>
        <div>
          <label htmlFor="actual_cost" className="block text-sm font-medium text-gray-700 mb-1">
            Actual Cost
          </label>
          <div className="relative">
            <span className="absolute left-3 top-1/2 -translate-y-1/2 text-gray-500 text-sm">₱</span>
            <input
              type="number"
              id="actual_cost"
              name="actual_cost"
              value={formData.actual_cost}
              onChange={handleChange}
              placeholder="0"
              min="0"
              className="input-field pl-7"
              disabled={loading}
            />
          </div>
        </div>
      </div>

      {/* Description */}
      <div>
        <label htmlFor="description" className="block text-sm font-medium text-gray-700 mb-1">
          Description
        </label>
        <textarea
          id="description"
          name="description"
          value={formData.description}
          onChange={handleChange}
          placeholder="What will you do here?"
          rows={2}
          className="input-field resize-none"
          disabled={loading}
        />
      </div>

      {/* Notes */}
      <div>
        <label htmlFor="notes" className="block text-sm font-medium text-gray-700 mb-1">
          Notes
        </label>
        <input
          type="text"
          id="notes"
          name="notes"
          value={formData.notes}
          onChange={handleChange}
          placeholder="Any reminders or tips..."
          className="input-field"
          disabled={loading}
        />
      </div>

      {/* Actions */}
      <div className="flex gap-3 pt-2">
        <button
          type="button"
          onClick={onCancel}
          disabled={loading}
          className="flex-1 btn-secondary"
        >
          Cancel
        </button>
        <button
          type="submit"
          disabled={loading}
          className="flex-1 btn-primary flex items-center justify-center"
        >
          {loading ? (
            <>
              <div className="w-4 h-4 border-2 border-white border-t-transparent rounded-full animate-spin mr-2" />
              Saving...
            </>
          ) : (
            submitLabel
          )}
        </button>
      </div>
    </form>
  )
}
