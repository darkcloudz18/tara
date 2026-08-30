'use client'

import { useEffect, useRef, useState } from 'react'
import Image from 'next/image'
import { AlertCircle, Check, ChevronDown, MapPin, Loader2 } from 'lucide-react'
import { capture } from '@/lib/analytics'
import { BucketListItem } from '../services/bucketListService'
import {
  getBucketSuggestions,
  BucketSuggestionsGrouped,
} from '../services/builderSuggestionService'
import BucketPin from '@/components/icons/BucketPin'
import { ItineraryActivity } from '@/types/database'

interface DayOption {
  id: string
  day_number: number
  date: string
}

interface BucketSuggestionsProps {
  lakadId: string
  destinations: string[]
  days: DayOption[]
  // Existing activities across all days for this lakad. Used to detect
  // which bucket items have already been added — matching by
  // (title, location) since we don't yet have a bucket_list_id fk on
  // itinerary_activities. That keeps the "Added to Day N" state durable
  // across reloads and blocks adding the same bucket item twice.
  activities: ItineraryActivity[]
  // Parent handler mirrors the shape used by the rest of the builder so
  // add-from-bucket writes through the same activityService.create path.
  onAddToDay: (
    dayId: string,
    activity: {
      title: string
      location: string
      place_type?: string
      estimated_cost?: number
    }
  ) => Promise<void>
}

// Renders the "From your bucket list" section at the top of the builder.
// See Task 10 for the full contract:
// - Bucket-first, not bucket-only — templates + Discover still layer below
// - Empty bucket → don't render the section header at all
// - Off-destination items are hidden by default, revealed on toggle
export default function BucketSuggestions({
  lakadId,
  destinations,
  days,
  activities,
  onAddToDay,
}: BucketSuggestionsProps) {
  const [state, setState] = useState<'loading' | 'error' | 'ready' | 'hide'>('loading')
  const [suggestions, setSuggestions] = useState<BucketSuggestionsGrouped>({
    matching: [],
    offDestination: [],
    totalCount: 0,
  })
  const [showOffDestination, setShowOffDestination] = useState(false)
  const [addingId, setAddingId] = useState<string | null>(null)
  const capturedRef = useRef(false)

  // Derive "added" state from real activities on every render — persists
  // across reloads, prevents duplicate additions. Matches on
  // (title, location) since that's what onAddToDay writes.
  const addedByDay = new Map<string, string>()
  for (const item of [...suggestions.matching, ...suggestions.offDestination]) {
    const name = item.place_name.trim().toLowerCase()
    const loc = (item.place_location ?? '').trim().toLowerCase()
    const match = activities.find(
      (a) =>
        a.title.trim().toLowerCase() === name &&
        (a.location ?? '').trim().toLowerCase() === loc
    )
    if (match) addedByDay.set(item.id, match.day_id)
  }

  async function load() {
    setState('loading')
    try {
      const grouped = await getBucketSuggestions(destinations)
      if (grouped.totalCount === 0) {
        setState('hide')
        return
      }
      setSuggestions(grouped)
      setState('ready')
    } catch (err) {
      console.error('BucketSuggestions load failed:', err)
      setState('error')
    }
  }

  useEffect(() => {
    load()
    // load() takes the destinations closure; reload on lakadId change.
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [lakadId])

  // Fire the shown event once per real render of the section, not on
  // re-renders as the user adds items or toggles.
  useEffect(() => {
    if (state !== 'ready' || capturedRef.current) return
    if (suggestions.matching.length + suggestions.offDestination.length === 0) return
    capturedRef.current = true
    capture('builder_bucket_suggestion_shown', {
      lakadId,
      destination: destinations[0] ?? null,
      matchingCount: suggestions.matching.length,
      totalBucketCount: suggestions.totalCount,
    })
  }, [state, suggestions, lakadId, destinations])

  async function handleAdd(item: BucketListItem, dayId: string, wasMatch: boolean) {
    // Guard: if this item is somehow already added, no-op. The button is
    // hidden in the added state, but this catches racey double-clicks.
    if (addingId || addedByDay.has(item.id)) return
    setAddingId(item.id)
    try {
      await onAddToDay(dayId, {
        title: item.place_name,
        location: item.place_location ?? '',
        place_type: item.place_category ?? undefined,
        estimated_cost: item.place_estimated_cost ?? undefined,
      })
      // No local state update needed — activities refetch upstream, and
      // the next render will pick up the new activity via the addedByDay
      // derivation above.
      capture('builder_bucket_suggestion_added', {
        lakadId,
        placeId: item.place_id ?? item.external_place_id ?? item.id,
        wasDestinationMatch: wasMatch,
      })
    } catch (err) {
      console.error('BucketSuggestions add failed:', err)
    } finally {
      setAddingId(null)
    }
  }

  if (state === 'hide') return null

  const primaryDestination = destinations[0] ?? ''

  return (
    <section
      aria-label="Suggestions from your bucket list"
      className="rounded-2xl border border-gray-200 dark:border-gray-800 bg-white dark:bg-gray-950 p-5 mb-4"
    >
      <div className="flex items-start justify-between gap-3 mb-3">
        <div className="flex items-center gap-2">
          <BucketPin className="w-5 h-5 text-teal-600 dark:text-teal-400" />
          <h2 className="font-semibold text-gray-900 dark:text-white">
            From your bucket list
          </h2>
          {state === 'ready' && (
            <span className="text-xs font-medium px-2 py-0.5 rounded-full bg-gray-100 dark:bg-gray-800 text-gray-600 dark:text-gray-400">
              {suggestions.matching.length + suggestions.offDestination.length}
            </span>
          )}
        </div>
      </div>

      {state === 'loading' && (
        <div className="space-y-2">
          {[0, 1].map((i) => (
            <div
              key={i}
              className="h-16 rounded-lg bg-gray-100 dark:bg-gray-900 animate-pulse"
            />
          ))}
        </div>
      )}

      {state === 'error' && (
        <div className="flex items-start gap-3 rounded-lg bg-red-50 dark:bg-red-900/20 p-3">
          <AlertCircle className="w-5 h-5 text-red-500 flex-shrink-0 mt-0.5" />
          <div className="flex-1 min-w-0">
            <p className="text-sm text-gray-900 dark:text-white">
              Couldn&rsquo;t load your bucket list.
            </p>
            <button
              onClick={load}
              className="text-sm font-medium text-red-600 dark:text-red-400 hover:underline mt-1"
            >
              Try again
            </button>
          </div>
        </div>
      )}

      {state === 'ready' && (
        <>
          {suggestions.matching.length > 0 ? (
            <ul className="space-y-2">
              {suggestions.matching.map((item) => (
                <SuggestionRow
                  key={item.id}
                  item={item}
                  days={days}
                  disabled={addingId === item.id}
                  addedDayId={addedByDay.get(item.id) ?? null}
                  onAdd={(dayId) => handleAdd(item, dayId, true)}
                />
              ))}
            </ul>
          ) : (
            suggestions.offDestination.length > 0 && (
              <p className="text-sm text-gray-500 dark:text-gray-400 mb-2">
                Nothing saved for {primaryDestination || 'this trip'} yet — you&rsquo;ve saved
                these elsewhere:
              </p>
            )
          )}

          {suggestions.offDestination.length > 0 && (
            <div className="mt-3">
              {suggestions.matching.length > 0 && (
                <button
                  onClick={() => setShowOffDestination((v) => !v)}
                  className="text-sm text-gray-500 dark:text-gray-400 hover:text-gray-700 dark:hover:text-gray-300 inline-flex items-center gap-1"
                >
                  <ChevronDown
                    className={`w-4 h-4 transition-transform ${
                      showOffDestination ? 'rotate-180' : ''
                    }`}
                  />
                  {showOffDestination
                    ? 'Hide off-destination saves'
                    : `Show ${suggestions.offDestination.length} save${suggestions.offDestination.length === 1 ? '' : 's'} not in ${primaryDestination || 'this trip'}`}
                </button>
              )}

              {(showOffDestination || suggestions.matching.length === 0) && (
                <ul className="space-y-2 mt-3">
                  {suggestions.offDestination.map((item) => (
                    <SuggestionRow
                      key={item.id}
                      item={item}
                      days={days}
                      disabled={addingId === item.id}
                      addedDayId={addedByDay.get(item.id) ?? null}
                      offDestination
                      onAdd={(dayId) => handleAdd(item, dayId, false)}
                    />
                  ))}
                </ul>
              )}
            </div>
          )}
        </>
      )}
    </section>
  )
}

interface SuggestionRowProps {
  item: BucketListItem
  days: DayOption[]
  disabled: boolean
  // When set, this item has been added this session — the row swaps the
  // day picker + Add button for a static "Added to Day N" state.
  addedDayId: string | null
  offDestination?: boolean
  onAdd: (dayId: string) => Promise<void>
}

function SuggestionRow({
  item,
  days,
  disabled,
  addedDayId,
  offDestination = false,
  onAdd,
}: SuggestionRowProps) {
  const [selectedDayId, setSelectedDayId] = useState<string>(days[0]?.id ?? '')
  const addedDay = addedDayId
    ? days.find((d) => d.id === addedDayId)
    : null
  const isAdded = Boolean(addedDay)

  return (
    <li
      className={`flex items-center gap-3 rounded-lg border p-2 transition-colors ${
        isAdded
          ? 'border-teal-200 dark:border-teal-900/60 bg-teal-50/40 dark:bg-teal-900/10'
          : 'border-gray-200 dark:border-gray-800'
      }`}
    >
      <div className="relative w-14 h-14 flex-shrink-0 rounded-md overflow-hidden bg-gray-100 dark:bg-gray-900">
        {item.place_image_url ? (
          <Image
            src={item.place_image_url}
            alt={item.place_name}
            fill
            sizes="56px"
            className={`object-cover ${isAdded ? 'opacity-80' : ''}`}
          />
        ) : (
          <div className="w-full h-full flex items-center justify-center">
            <MapPin className="w-5 h-5 text-gray-300 dark:text-gray-700" />
          </div>
        )}
      </div>
      <div className="flex-1 min-w-0">
        <p className="font-medium text-sm text-gray-900 dark:text-white line-clamp-1">
          {item.place_name}
        </p>
        <p className="text-xs text-gray-500 dark:text-gray-400 line-clamp-1">
          {item.place_location}
          {offDestination && ' · off-destination'}
        </p>
      </div>
      <div className="flex items-center gap-2 flex-shrink-0">
        {isAdded ? (
          <span className="inline-flex items-center gap-1.5 min-h-[44px] px-3 rounded-md bg-teal-100 dark:bg-teal-900/40 text-teal-700 dark:text-teal-300 text-sm font-semibold">
            <Check className="w-4 h-4" />
            Added to Day {addedDay!.day_number}
          </span>
        ) : (
          <>
            <select
              value={selectedDayId}
              onChange={(e) => setSelectedDayId(e.target.value)}
              disabled={disabled || days.length === 0}
              aria-label={`Choose day to add ${item.place_name}`}
              className="min-h-[44px] text-sm px-2 py-1 rounded-md border border-gray-300 dark:border-gray-700 bg-white dark:bg-gray-900 text-gray-900 dark:text-white focus:outline-none focus:ring-2 focus:ring-teal-500 disabled:opacity-50"
            >
              {days.map((day) => (
                <option key={day.id} value={day.id}>
                  Day {day.day_number}
                </option>
              ))}
            </select>
            <button
              onClick={() => onAdd(selectedDayId)}
              disabled={disabled || !selectedDayId}
              className="inline-flex items-center gap-1.5 min-h-[44px] px-3 rounded-md bg-teal-500 hover:bg-teal-600 text-white text-sm font-semibold disabled:opacity-50 disabled:cursor-not-allowed"
            >
              {disabled ? <Loader2 className="w-4 h-4 animate-spin" /> : 'Add'}
            </button>
          </>
        )}
      </div>
    </li>
  )
}
