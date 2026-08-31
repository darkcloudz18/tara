'use client'

import { useEffect, useRef, useState } from 'react'
import { useRouter } from 'next/navigation'
import { CalendarDays, Loader2 } from 'lucide-react'
import { useUser } from '@/contexts/UserContext'
import { useTrips } from '@/contexts/TripsContext'
import { useToast } from '@/contexts/ToastContext'
import { capture } from '@/lib/analytics'
import {
  createDatedLakadFromBucket,
  isValidRange,
  savePendingDates,
  todayInPHT,
} from '../services/datedLakadService'

interface DatePromptCardProps {
  itemCount: number
}

// Primary action on /bucket. Above the fold, always visible when the
// bucket has ≥1 item. Anonymous submit persists the selection to
// localStorage and hands off to sign-up; Providers resumes on SIGNED_IN.
export default function DatePromptCard({ itemCount }: DatePromptCardProps) {
  const router = useRouter()
  const { user } = useUser()
  const { refetch: refetchTrips } = useTrips()
  const toast = useToast()

  const today = todayInPHT()
  const [startDate, setStartDate] = useState('')
  const [endDate, setEndDate] = useState('')
  const [submitting, setSubmitting] = useState(false)
  const [inlineError, setInlineError] = useState<string | null>(null)

  // Track engagement so we can fire started/abandoned as a real funnel.
  // "Started" = the user interacted with the picker at all. "Abandoned"
  // = they started but the component unmounts (navigation, close) with
  // no successful submit.
  const startedRef = useRef(false)
  const submittedRef = useRef(false)

  useEffect(() => {
    return () => {
      if (startedRef.current && !submittedRef.current) {
        capture('date_prompt_abandoned', { stage: 'picker_open' })
      }
    }
  }, [])

  function markStarted() {
    if (startedRef.current) return
    startedRef.current = true
    capture('date_prompt_started', { itemCount })
  }

  function validate(start: string, end: string): string | null {
    if (!start || !end) return 'Pick both start and end dates.'
    if (start < today) return "Start date can't be in the past."
    if (end < start) return "End date must be on or after start date."
    return null
  }

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault()
    if (submitting) return

    const err = validate(startDate, endDate)
    if (err) {
      setInlineError(err)
      return
    }
    setInlineError(null)

    // Anonymous: hand off to sign-up with the selection stashed.
    // Providers resumes createDatedLakadFromBucket on SIGNED_IN.
    if (!user) {
      savePendingDates(startDate, endDate)
      capture('date_prompt_abandoned', { stage: 'awaiting_signup' })
      submittedRef.current = true  // don't double-fire abandoned on unmount
      router.push('/register?redirect=/bucket')
      return
    }

    setSubmitting(true)
    try {
      const result = await createDatedLakadFromBucket(startDate, endDate)
      submittedRef.current = true
      capture('bucket_dated', {
        itemCount: result.itemCount,
        daysUntilTrip: result.daysUntilTrip,
        durationDays: result.durationDays,
        wasAnonymous: false,
      })
      refetchTrips()
      // /trip/[id] is the public share view (requires is_public=true).
      // Newly created lakads are private, so the owner lands on the
      // /edit route — the builder — which is where Task 10's suggestions
      // will surface next anyway.
      router.push(`/trip/${result.itineraryId}/edit`)
    } catch (err) {
      console.error('Dated lakad creation failed:', err)
      toast.error(
        "Couldn't create your lakad",
        'Check your connection and try again.'
      )
      setSubmitting(false)
    }
  }

  const disabled = submitting || itemCount === 0
  const primaryLabel = user ? 'Create lakad' : 'Pick dates and sign up'

  return (
    <section
      aria-label="Date prompt"
      className="rounded-2xl border border-gray-200 dark:border-gray-800 bg-white dark:bg-gray-950 p-5 mb-6"
    >
      <div className="flex items-start gap-3">
        <div className="w-11 h-11 rounded-xl bg-teal-50 dark:bg-teal-950/40 flex items-center justify-center flex-shrink-0">
          <CalendarDays className="w-6 h-6 text-teal-600 dark:text-teal-400" />
        </div>
        <div className="flex-1 min-w-0">
          <h2 className="font-semibold text-gray-900 dark:text-white">
            Planning this trip? When are you going?
          </h2>
          <p className="text-sm text-gray-500 dark:text-gray-400 mt-1">
            Pick dates to turn your bucket list into a day-by-day lakad.
          </p>

          <form onSubmit={handleSubmit} className="mt-4 space-y-3">
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
              <label className="block">
                <span className="text-xs font-medium text-gray-500 dark:text-gray-400 uppercase tracking-wide">
                  Start
                </span>
                <input
                  type="date"
                  value={startDate}
                  min={today}
                  onChange={(e) => {
                    setStartDate(e.target.value)
                    markStarted()
                    setInlineError(null)
                  }}
                  onFocus={markStarted}
                  disabled={itemCount === 0}
                  className="mt-1 w-full min-h-[44px] px-3 py-2 rounded-lg border border-gray-300 dark:border-gray-700 bg-white dark:bg-gray-900 text-gray-900 dark:text-white focus:outline-none focus:ring-2 focus:ring-teal-500 disabled:opacity-50"
                  aria-label="Trip start date"
                />
              </label>
              <label className="block">
                <span className="text-xs font-medium text-gray-500 dark:text-gray-400 uppercase tracking-wide">
                  End
                </span>
                <input
                  type="date"
                  value={endDate}
                  min={startDate || today}
                  onChange={(e) => {
                    setEndDate(e.target.value)
                    markStarted()
                    setInlineError(null)
                  }}
                  onFocus={markStarted}
                  disabled={itemCount === 0}
                  className="mt-1 w-full min-h-[44px] px-3 py-2 rounded-lg border border-gray-300 dark:border-gray-700 bg-white dark:bg-gray-900 text-gray-900 dark:text-white focus:outline-none focus:ring-2 focus:ring-teal-500 disabled:opacity-50"
                  aria-label="Trip end date"
                />
              </label>
            </div>

            {inlineError && (
              <p role="alert" className="text-sm text-red-600 dark:text-red-400">
                {inlineError}
              </p>
            )}

            {itemCount === 0 ? (
              <p className="text-sm text-gray-500 dark:text-gray-400">
                Save a place first, then pick dates.
              </p>
            ) : (
              <button
                type="submit"
                disabled={disabled}
                className="inline-flex items-center gap-2 min-h-[44px] px-5 py-2 rounded-lg bg-teal-500 text-white text-sm font-semibold hover:bg-teal-600 disabled:opacity-50 disabled:cursor-not-allowed transition-colors"
              >
                {submitting && <Loader2 className="w-4 h-4 animate-spin" />}
                {primaryLabel}
              </button>
            )}
          </form>
        </div>
      </div>
    </section>
  )
}
