import { supabase, getUserSafe } from '@/lib/supabase'
import { addDays, differenceInDays, format, parseISO } from 'date-fns'
import { getBucketList } from './bucketListService'
import { dayService } from './dayService'

export interface CreateDatedLakadResult {
  itineraryId: string
  itemCount: number
  destinations: string[]
  durationDays: number
  daysUntilTrip: number
}

// Turns the current user's bucket list into a dated itinerary. Requires
// an authenticated user — callers gate on that (or use the pending-dates
// resume path in Providers for the anonymous → auth boundary).
//
// The bucket rows themselves are *not* consumed or deleted. They stay on
// /bucket and get re-surfaced as suggestions in the itinerary builder
// (Task 10). The lakad's `destinations` field is seeded from the distinct
// `place_location` values on the bucket rows so the state-aware homepage,
// share pages, and future template matching all have something to work
// with immediately after conversion.
export async function createDatedLakadFromBucket(
  startDate: string,
  endDate: string
): Promise<CreateDatedLakadResult> {
  const user = await getUserSafe()
  if (!user) throw new Error('Must be signed in to create a dated lakad')

  if (!isValidRange(startDate, endDate)) {
    throw new Error('Invalid date range')
  }

  const bucketItems = await getBucketList()
  const destinations = uniqueLocations(bucketItems.map((b) => b.place_location))

  const title = titleFor(destinations, startDate)

  const { data: itinerary, error } = await supabase
    .from('itineraries')
    .insert({
      user_id: user.id,
      title,
      start_date: startDate,
      end_date: endDate,
      destinations,
      status: 'dated',
      is_public: false,
      actual_spent: 0,
      views_count: 0,
      copies_count: 0,
    })
    .select()
    .single()

  if (error) throw error

  // Auto-generate day placeholders (Day 1, Day 2, …). Matches the
  // existing useItineraries.createItinerary behavior so the builder has
  // rows to hang activities off. Capped at 30 days to avoid runaway
  // inserts if a bad range slips past client validation.
  const start = parseISO(startDate)
  const end = parseISO(endDate)
  const numDays = differenceInDays(end, start) + 1
  if (numDays > 0 && numDays <= 30) {
    const daysToCreate = Array.from({ length: numDays }, (_, i) => ({
      itinerary_id: itinerary.id,
      day_number: i + 1,
      date: format(addDays(start, i), 'yyyy-MM-dd'),
      title: `Day ${i + 1}`,
    }))
    await dayService.bulkCreate(daysToCreate)
  }

  if (typeof window !== 'undefined') {
    localStorage.setItem('tara-lakad-created', '1')
    window.dispatchEvent(new Event('tara:pwa-eligibility-changed'))
  }

  const today = todayInPHT()
  const daysUntilTrip = differenceInDays(start, parseISO(today))

  return {
    itineraryId: itinerary.id,
    itemCount: bucketItems.length,
    destinations,
    durationDays: numDays,
    daysUntilTrip,
  }
}

export function isValidRange(startDate: string, endDate: string): boolean {
  if (!startDate || !endDate) return false
  const today = todayInPHT()
  return startDate >= today && endDate >= startDate
}

// Manila is UTC+8, no DST. Using the local YYYY-MM-DD avoids
// timezone-crossing off-by-one when the DB or the client's clock is in
// a different zone. Task 07 hard rule: a trip starting "today" in Manila
// must not read as yesterday.
export function todayInPHT(): string {
  const now = new Date()
  const phtMs = now.getTime() + (now.getTimezoneOffset() + 8 * 60) * 60_000
  const pht = new Date(phtMs)
  return `${pht.getUTCFullYear()}-${pad(pht.getUTCMonth() + 1)}-${pad(pht.getUTCDate())}`
}

function pad(n: number): string {
  return n < 10 ? `0${n}` : String(n)
}

function uniqueLocations(raw: (string | null)[]): string[] {
  const seen = new Set<string>()
  const out: string[] = []
  for (const loc of raw) {
    if (!loc) continue
    const trimmed = loc.trim()
    if (!trimmed || seen.has(trimmed)) continue
    seen.add(trimmed)
    out.push(trimmed)
  }
  return out
}

function titleFor(destinations: string[], startDate: string): string {
  const year = startDate.slice(0, 4)
  if (destinations.length === 0) return `My lakad ${year}`
  if (destinations.length === 1) return `${destinations[0]} ${year}`
  if (destinations.length === 2) return `${destinations[0]} & ${destinations[1]} ${year}`
  return `${destinations[0]} + ${destinations.length - 1} more ${year}`
}

// ---------- Pending-dates handoff across the anonymous → auth boundary ----------
//
// An anonymous user picks dates, then signs up. The dates must survive
// the round trip. Providers reads this on SIGNED_IN, calls the create
// service, then redirects to the new lakad.

const PENDING_KEY = 'tara-pending-dated-lakad'

export interface PendingDatedLakad {
  startDate: string
  endDate: string
  savedAt: number
}

export function savePendingDates(startDate: string, endDate: string): void {
  if (typeof window === 'undefined') return
  const payload: PendingDatedLakad = {
    startDate,
    endDate,
    savedAt: Date.now(),
  }
  localStorage.setItem(PENDING_KEY, JSON.stringify(payload))
}

export function readPendingDates(): PendingDatedLakad | null {
  if (typeof window === 'undefined') return null
  const raw = localStorage.getItem(PENDING_KEY)
  if (!raw) return null
  try {
    const parsed = JSON.parse(raw) as PendingDatedLakad
    // 24h stale-check — if a user signed up a day later, the intent is
    // gone. Better to drop the pending state than to conjure a lakad
    // the user forgot about.
    if (Date.now() - parsed.savedAt > 24 * 60 * 60 * 1000) {
      clearPendingDates()
      return null
    }
    return parsed
  } catch {
    clearPendingDates()
    return null
  }
}

export function clearPendingDates(): void {
  if (typeof window === 'undefined') return
  localStorage.removeItem(PENDING_KEY)
}
