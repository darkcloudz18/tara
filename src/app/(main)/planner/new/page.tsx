'use client'

import { useState } from 'react'
import { useRouter } from 'next/navigation'
import Link from 'next/link'
import ItineraryForm, { ItineraryFormData } from '@/features/planner/components/ItineraryForm'
import { useItineraries } from '@/features/planner/hooks/useItineraries'

export default function NewItineraryPage() {
  const router = useRouter()
  const { createItinerary } = useItineraries()
  const [loading, setLoading] = useState(false)

  const handleSubmit = async (data: ItineraryFormData) => {
    setLoading(true)

    try {
      const destinations = data.destinations
        .split(',')
        .map((d) => d.trim())
        .filter((d) => d.length > 0)

      const itinerary = await createItinerary({
        title: data.title.trim(),
        description: data.description.trim() || undefined,
        start_date: data.start_date,
        end_date: data.end_date,
        destinations,
        total_budget: data.total_budget ? parseFloat(data.total_budget) : undefined,
      })

      if (itinerary) {
        router.push(`/planner/${itinerary.id}`)
      }
    } finally {
      setLoading(false)
    }
  }

  return (
    <div className="min-h-screen bg-gray-50">
      <div className="max-w-2xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
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
        <div className="mb-8">
          <h1 className="text-2xl font-bold text-gray-900">Plan a New Trip</h1>
          <p className="text-gray-600 mt-1">
            Create your itinerary and start planning your adventure.
          </p>
        </div>

        {/* Form Card */}
        <div className="card">
          <ItineraryForm
            onSubmit={handleSubmit}
            onCancel={() => router.push('/planner')}
            loading={loading}
            submitLabel="Create Trip"
          />
        </div>

        {/* Tips */}
        <div className="mt-8 p-4 bg-primary-50 rounded-lg">
          <h3 className="font-medium text-primary-900 mb-2">Tips for planning</h3>
          <ul className="text-sm text-primary-700 space-y-1">
            <li>• Days will be automatically created based on your date range</li>
            <li>• You can add activities with locations, times, and costs to each day</li>
            <li>• Track your budget as you plan - estimated vs actual spending</li>
            <li>• View all your activities on an interactive map</li>
          </ul>
        </div>
      </div>
    </div>
  )
}
