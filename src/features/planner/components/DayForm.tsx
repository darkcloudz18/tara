'use client'

import { useState } from 'react'
import { ItineraryDay } from '@/types/database'

export interface DayFormData {
  title: string
  notes: string
  estimated_budget: string
}

interface DayFormProps {
  initialData?: Partial<ItineraryDay>
  onSubmit: (data: DayFormData) => Promise<void>
  onCancel: () => void
  loading?: boolean
  submitLabel?: string
  dayNumber?: number
}

export default function DayForm({
  initialData,
  onSubmit,
  onCancel,
  loading = false,
  submitLabel = 'Save Day',
  dayNumber,
}: DayFormProps) {
  const [formData, setFormData] = useState<DayFormData>({
    title: initialData?.title || (dayNumber ? `Day ${dayNumber}` : ''),
    notes: initialData?.notes || '',
    estimated_budget: initialData?.estimated_budget?.toString() || '',
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

      {/* Title */}
      <div>
        <label htmlFor="title" className="block text-sm font-medium text-gray-700 mb-1">
          Day Title
        </label>
        <input
          type="text"
          id="title"
          name="title"
          value={formData.title}
          onChange={handleChange}
          placeholder="e.g., Arrival Day, Beach Day"
          className="input-field"
          disabled={loading}
        />
      </div>

      {/* Notes */}
      <div>
        <label htmlFor="notes" className="block text-sm font-medium text-gray-700 mb-1">
          Notes
        </label>
        <textarea
          id="notes"
          name="notes"
          value={formData.notes}
          onChange={handleChange}
          placeholder="Any notes for this day..."
          rows={2}
          className="input-field resize-none"
          disabled={loading}
        />
      </div>

      {/* Budget */}
      <div>
        <label htmlFor="estimated_budget" className="block text-sm font-medium text-gray-700 mb-1">
          Day Budget
        </label>
        <div className="relative">
          <span className="absolute left-3 top-1/2 -translate-y-1/2 text-gray-500">₱</span>
          <input
            type="number"
            id="estimated_budget"
            name="estimated_budget"
            value={formData.estimated_budget}
            onChange={handleChange}
            placeholder="0"
            min="0"
            className="input-field pl-8"
            disabled={loading}
          />
        </div>
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
