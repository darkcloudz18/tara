import { supabase, getUserSafe } from '@/lib/supabase'
import { addDays, format, parseISO } from 'date-fns'
import { getBucketList } from '@/features/planner/services/bucketListService'
import { todayInPHT } from '@/features/planner/services/datedLakadService'
import type { BudgetBand } from '@/features/planner/components/TripWizard'

export interface SmartBuildDraftInputs {
  destinationId: string
  destinationSlug: string
  destinationName: string
  days: number
  startDate?: string              // 'YYYY-MM-DD', present when the wizard captured exact dates
  tripMonth?: string              // 'YYYY-MM' when the user picked a month only
  budgetBand: Exclude<BudgetBand, ''>
  originKey: string               // lowercased hub, used as the lakad origin label
  travelers: number
}

export interface SmartBuildDraftResult {
  itineraryId: string
  placeCount: number
  hadBucketOverlap: boolean
  isDated: boolean
}

// Rough per-day band allowance split: 60% lodging / 40% food. Writes as
// two editable placeholder activities per day so the running-cost widget
// reflects the band without the user having to key anything in.
const BAND_PER_DAY: Record<Exclude<BudgetBand, ''>, number> = {
  low: 3000,
  mid: 5000,
  high: 8000,
  luxe: 12000,
}
const ACCOMMODATION_SHARE = 0.6
const FOOD_SHARE = 0.4

// Target places per day. More than 4 reads as overbooked; fewer than 2
// leaves days feeling empty.
const PLACES_PER_DAY_MAX = 4

interface PlaceRow {
  id: string
  name: string
  summary: string | null
  category: string | null
  entrance_fee: number | null
  fee_notes: string | null
  duration_minutes: number | null
  part_of_tour: string | null
  not_same_day_as: string[] | null
  pairs_with: string[] | null
}

/**
 * Create an editable lakad from a Smart Build pick. Writes itineraries +
 * itinerary_days + itinerary_activities + per-day allowance placeholders.
 *
 * Day-filling:
 *   - Places grouped by part_of_tour. A tour gets its own day (El Nido
 *     Tour A is one boat trip, not spread across the week).
 *   - Standalone places fill the remaining days, capped at PLACES_PER_DAY_MAX.
 *   - Priority order: tours containing a bucket-list overlap first, then
 *     other tours, then standalones. Keeps the user's saved places on the
 *     earlier days where the trip feels most real.
 *   - not_same_day_as is respected — if a candidate would collide with a
 *     place already on the day, it's skipped and tried the next day.
 */
export async function createLakadFromSmartBuild(
  inputs: SmartBuildDraftInputs,
): Promise<SmartBuildDraftResult> {
  const user = await getUserSafe()
  if (!user) throw new Error('Must be signed in to open a draft lakad')

  const [{ data: placeRows, error: placesError }, bucket] = await Promise.all([
    supabase
      .from('places')
      .select('id, name, summary, category, entrance_fee, fee_notes, duration_minutes, part_of_tour, not_same_day_as, pairs_with')
      .eq('destination_id', inputs.destinationId)
      .eq('status', 'published'),
    getBucketList().catch(() => []),
  ])

  if (placesError) {
    console.error('Draft generation: places fetch failed', placesError)
    throw placesError
  }

  const places: PlaceRow[] = placeRows || []

  // Which of the user's bucket items live in this destination? Also pull
  // their bucket_list.id so we can wire bucket_list_id on the activity.
  const bucketByPlace = new Map<string, string>()  // place_id -> bucket_list.id
  for (const b of bucket) {
    if (b.place_id) bucketByPlace.set(b.place_id, b.id)
  }
  const overlapPlaceIds = new Set(
    places.map((p) => p.id).filter((id) => bucketByPlace.has(id)),
  )
  const hadBucketOverlap = overlapPlaceIds.size > 0

  // Resolve dates. Exact mode: use the user's start_date + days. Month
  // mode: anchor to the 1st of the picked month so start_date is still
  // writeable (NOT NULL on the column) without pretending we know the day.
  const { startDate, endDate, isDated } = resolveDates(inputs)

  const title = `${inputs.destinationName} — ${inputs.days} ${inputs.days === 1 ? 'day' : 'days'}`
  const description = `Draft from Smart Build (${inputs.originKey}, ${inputs.budgetBand} budget).`
  const dayPlan = planDays(places, overlapPlaceIds, inputs.days)
  const perDayAllowance = BAND_PER_DAY[inputs.budgetBand]

  // Insert itinerary row.
  const { data: itinerary, error: itineraryError } = await supabase
    .from('itineraries')
    .insert({
      user_id: user.id,
      title,
      description,
      start_date: startDate,
      end_date: endDate,
      destinations: [inputs.destinationName],
      status: isDated ? 'dated' : 'draft',
      is_public: false,
      total_budget: perDayAllowance * inputs.days * inputs.travelers,
    })
    .select('id')
    .single()

  if (itineraryError || !itinerary) {
    console.error('Draft generation: itinerary insert failed', itineraryError)
    throw itineraryError ?? new Error('Failed to create itinerary')
  }
  const itineraryId = itinerary.id

  // Insert day rows (day_number 1..N, dates stepped from startDate).
  const start = parseISO(startDate)
  const dayPayloads = Array.from({ length: inputs.days }, (_, i) => ({
    itinerary_id: itineraryId,
    day_number: i + 1,
    date: format(addDays(start, i), 'yyyy-MM-dd'),
    title: dayTitleFor(dayPlan[i]),
  }))

  const { data: insertedDays, error: daysError } = await supabase
    .from('itinerary_days')
    .insert(dayPayloads)
    .select('id, day_number')

  if (daysError || !insertedDays) {
    console.error('Draft generation: days insert failed', daysError)
    throw daysError ?? new Error('Failed to create days')
  }

  const dayIdByNumber = new Map(insertedDays.map((d) => [d.day_number, d.id]))

  // Build the activity payload across all days.
  const activityPayloads: any[] = []
  dayPlan.forEach((placesForDay, dayIndex) => {
    const dayNumber = dayIndex + 1
    const dayId = dayIdByNumber.get(dayNumber)
    if (!dayId) return

    let order = 0

    placesForDay.forEach((p) => {
      const bucketId = bucketByPlace.get(p.id) ?? null
      activityPayloads.push({
        day_id: dayId,
        title: p.name,
        description: p.summary,
        location: p.name,
        place_type: normalisePlaceType(p.category),
        estimated_cost: p.entrance_fee,
        bucket_list_id: bucketId,
        order_index: order++,
      })
    })

    // Per-day allowance placeholders — editable, deletable, counted by
    // the existing BudgetBreakdown + useBudgetCalculations.
    activityPayloads.push({
      day_id: dayId,
      title: 'Stay',
      description: 'Lodging allowance from your chosen budget band.',
      location: inputs.destinationName,
      place_type: 'accommodation',
      estimated_cost: Math.round(perDayAllowance * ACCOMMODATION_SHARE),
      order_index: order++,
    })
    activityPayloads.push({
      day_id: dayId,
      title: 'Food',
      description: 'Meal allowance from your chosen budget band.',
      location: inputs.destinationName,
      place_type: 'meal',
      estimated_cost: Math.round(perDayAllowance * FOOD_SHARE),
      order_index: order++,
    })
  })

  if (activityPayloads.length > 0) {
    const { error: activityError } = await supabase.from('itinerary_activities').insert(activityPayloads)
    if (activityError) {
      console.error('Draft generation: activities insert failed', activityError)
      throw activityError
    }
  }

  // Signal for PWA install prompt eligibility — matches the existing
  // createItinerary and createDatedLakadFromBucket paths.
  if (typeof window !== 'undefined') {
    localStorage.setItem('tara-lakad-created', '1')
    window.dispatchEvent(new Event('tara:pwa-eligibility-changed'))
  }

  return {
    itineraryId,
    placeCount: dayPlan.reduce((n, day) => n + day.length, 0),
    hadBucketOverlap,
    isDated,
  }
}

// ---------------------------------------------------------------------------
// Day-filling helpers
// ---------------------------------------------------------------------------

interface Group {
  tourKey: string            // 'tour:<label>' | 'standalone:<id>'
  tourLabel: string | null
  places: PlaceRow[]
  overlapCount: number
}

function planDays(places: PlaceRow[], overlapPlaceIds: Set<string>, days: number): PlaceRow[][] {
  // Group by part_of_tour. null part_of_tour becomes a standalone group
  // with just that one place.
  const tourGroups = new Map<string, PlaceRow[]>()
  const standalones: PlaceRow[] = []
  for (const p of places) {
    if (p.part_of_tour) {
      const list = tourGroups.get(p.part_of_tour) ?? []
      list.push(p)
      tourGroups.set(p.part_of_tour, list)
    } else {
      standalones.push(p)
    }
  }

  const groups: Group[] = []
  for (const [label, members] of tourGroups) {
    groups.push({
      tourKey: `tour:${label}`,
      tourLabel: label,
      places: members,
      overlapCount: members.filter((p) => overlapPlaceIds.has(p.id)).length,
    })
  }
  for (const p of standalones) {
    groups.push({
      tourKey: `standalone:${p.id}`,
      tourLabel: null,
      places: [p],
      overlapCount: overlapPlaceIds.has(p.id) ? 1 : 0,
    })
  }

  // Priority: overlap first, then tours (more places = more interesting
  // day), then by name for determinism.
  groups.sort((a, b) => {
    if (a.overlapCount !== b.overlapCount) return b.overlapCount - a.overlapCount
    if (a.places.length !== b.places.length) return b.places.length - a.places.length
    return a.tourKey.localeCompare(b.tourKey)
  })

  const dayPlan: PlaceRow[][] = Array.from({ length: days }, () => [])
  let groupIndex = 0

  // First pass — assign tours whole-day (first N tours fill first N days).
  for (let d = 0; d < days && groupIndex < groups.length; d++) {
    const group = groups[groupIndex]
    // Only treat as a 'tour day' if the group actually has more than one
    // place. Single-place groups fall through to the standalone pass.
    if (group.places.length <= 1) break
    const placed = tryAddGroup(dayPlan[d], group.places)
    if (placed) groupIndex++
    else break
  }

  // Second pass — fill remaining day slots with the leftover groups
  // (mostly standalones), round-robin, respecting not_same_day_as and the
  // PLACES_PER_DAY_MAX cap.
  while (groupIndex < groups.length) {
    const group = groups[groupIndex]
    let placed = false
    for (let d = 0; d < days; d++) {
      if (dayPlan[d].length >= PLACES_PER_DAY_MAX) continue
      if (tryAddGroup(dayPlan[d], group.places)) {
        placed = true
        break
      }
    }
    if (!placed) break   // nowhere valid to put it, drop silently
    groupIndex++
  }

  return dayPlan
}

/**
 * Try to add a group's places to a day without violating not_same_day_as
 * against anything already on that day. All-or-nothing — a tour is one
 * boat day, not spread across days.
 */
function tryAddGroup(day: PlaceRow[], newPlaces: PlaceRow[]): boolean {
  if (day.length + newPlaces.length > PLACES_PER_DAY_MAX && newPlaces.length === 1) {
    return false
  }
  for (const candidate of newPlaces) {
    for (const existing of day) {
      if (collides(candidate, existing)) return false
    }
  }
  day.push(...newPlaces)
  return true
}

function collides(a: PlaceRow, b: PlaceRow): boolean {
  if (Array.isArray(a.not_same_day_as) && a.not_same_day_as.includes(b.id)) return true
  if (Array.isArray(b.not_same_day_as) && b.not_same_day_as.includes(a.id)) return true
  return false
}

function dayTitleFor(places: PlaceRow[]): string | null {
  if (!places || places.length === 0) return null
  const tour = places[0].part_of_tour
  if (tour && places.every((p) => p.part_of_tour === tour)) return tour
  return places[0].name
}

// Existing activity schema uses free-text place_type. Smart Build maps the
// place category to one of the values useBudgetCalculations knows about so
// the running cost widget attributes it correctly.
function normalisePlaceType(category: string | null): string {
  if (!category) return 'activity'
  const c = category.toLowerCase()
  if (c === 'stay') return 'accommodation'
  if (c === 'food') return 'meal'
  return 'activity'
}

function resolveDates(inputs: SmartBuildDraftInputs): { startDate: string; endDate: string; isDated: boolean } {
  if (inputs.startDate) {
    const start = parseISO(inputs.startDate)
    return {
      startDate: inputs.startDate,
      endDate: format(addDays(start, inputs.days - 1), 'yyyy-MM-dd'),
      isDated: true,
    }
  }

  // Month-only mode or no dates at all — anchor to the first of the month
  // (or today's month if nothing was supplied) so start_date is still
  // writeable without faking a specific day.
  const anchor = inputs.tripMonth
    ? parseISO(`${inputs.tripMonth}-01`)
    : parseISO(`${todayInPHT().slice(0, 7)}-01`)
  const startDate = format(anchor, 'yyyy-MM-dd')
  const endDate = format(addDays(anchor, inputs.days - 1), 'yyyy-MM-dd')
  return { startDate, endDate, isDated: false }
}
