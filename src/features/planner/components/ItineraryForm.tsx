'use client'

import { useState } from 'react'
import { format, addDays } from 'date-fns'
import { Itinerary } from '@/types/database'

export interface ItineraryFormData {
  title: string
  description: string
  start_date: string
  end_date: string
  destinations: string
  total_budget: string
}

interface ItineraryFormProps {
  initialData?: Partial<Itinerary>
  onSubmit: (data: ItineraryFormData) => Promise<void>
  onCancel?: () => void
  loading?: boolean
  submitLabel?: string
}

export default function ItineraryForm({
  initialData,
  onSubmit,
  onCancel,
  loading = false,
  submitLabel = 'Create Trip',
}: ItineraryFormProps) {
  const today = format(new Date(), 'yyyy-MM-dd')
  const nextWeek = format(addDays(new Date(), 7), 'yyyy-MM-dd')

  const [formData, setFormData] = useState<ItineraryFormData>({
    title: initialData?.title || '',
    description: initialData?.description || '',
    start_date: initialData?.start_date || today,
    end_date: initialData?.end_date || nextWeek,
    destinations: initialData?.destinations?.join(', ') || '',
    total_budget: initialData?.total_budget?.toString() || '',
  })

  const [error, setError] = useState('')

  const handleChange = (
    e: React.ChangeEvent<HTMLInputElement | HTMLTextAreaElement>
  ) => {
    const { name, value } = e.target
    setFormData((prev) => ({ ...prev, [name]: value }))
    setError('')
  }

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()
    setError('')

    // Validation
    if (!formData.title.trim()) {
      setError('Please enter a title for your trip')
      return
    }

    if (!formData.start_date || !formData.end_date) {
      setError('Please select start and end dates')
      return
    }

    if (new Date(formData.start_date) > new Date(formData.end_date)) {
      setError('End date must be after start date')
      return
    }

    if (!formData.destinations.trim()) {
      setError('Please enter at least one destination')
      return
    }

    try {
      await onSubmit(formData)
    } catch (err: any) {
      setError(err.message || 'Something went wrong')
    }
  }

  return (
    <form onSubmit={handleSubmit} className="space-y-6">
      {error && (
        <div className="p-4 bg-red-50 border border-red-200 rounded-lg text-red-700">
          {error}
        </div>
      )}

      {/* Title */}
      <div>
        <label htmlFor="title" className="block text-sm font-medium text-gray-700 mb-1">
          Trip Title *
        </label>
        <input
          type="text"
          id="title"
          name="title"
          value={formData.title}
          onChange={handleChange}
          placeholder="e.g., Summer Palawan Adventure"
          className="input-field"
          disabled={loading}
        />
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
          placeholder="What's this trip about?"
          rows={3}
          className="input-field resize-none"
          disabled={loading}
        />
      </div>

      {/* Dates */}
      <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
        <div>
          <label htmlFor="start_date" className="block text-sm font-medium text-gray-700 mb-1">
            Start Date *
          </label>
          <input
            type="date"
            id="start_date"
            name="start_date"
            value={formData.start_date}
            onChange={handleChange}
            className="input-field"
            disabled={loading}
          />
        </div>
        <div>
          <label htmlFor="end_date" className="block text-sm font-medium text-gray-700 mb-1">
            End Date *
          </label>
          <input
            type="date"
            id="end_date"
            name="end_date"
            value={formData.end_date}
            onChange={handleChange}
            min={formData.start_date}
            className="input-field"
            disabled={loading}
          />
        </div>
      </div>

      {/* Destinations */}
      <div>
        <label htmlFor="destinations" className="block text-sm font-medium text-gray-700 mb-1">
          Destinations *
        </label>
        <input
          type="text"
          id="destinations"
          name="destinations"
          value={formData.destinations}
          onChange={handleChange}
          placeholder="e.g., El Nido, Coron, Puerto Princesa"
          className="input-field"
          disabled={loading}
        />
        <p className="mt-1 text-sm text-gray-500">Separate multiple destinations with commas</p>
      </div>

      {/* Budget */}
      <div>
        <label htmlFor="total_budget" className="block text-sm font-medium text-gray-700 mb-1">
          Total Budget (PHP)
        </label>
        <div className="relative">
          <span className="absolute left-3 top-1/2 -translate-y-1/2 text-gray-500">₱</span>
          <input
            type="number"
            id="total_budget"
            name="total_budget"
            value={formData.total_budget}
            onChange={handleChange}
            placeholder="0"
            min="0"
            step="100"
            className="input-field pl-8"
            disabled={loading}
          />
        </div>
      </div>

      {/* Actions */}
      <div className="flex gap-3 pt-4">
        {onCancel && (
          <button
            type="button"
            onClick={onCancel}
            disabled={loading}
            className="flex-1 btn-secondary"
          >
            Cancel
          </button>
        )}
        <button
          type="submit"
          disabled={loading}
          className={`btn-primary flex items-center justify-center ${onCancel ? 'flex-1' : 'w-full'}`}
        >
          {loading ? (
            <>
              <div className="w-4 h-4 border-2 border-white border-t-transparent rounded-full animate-spin mr-2" />
              Creating...
            </>
          ) : (
            submitLabel
          )}
        </button>
      </div>
    </form>
  )
}
