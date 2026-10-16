import { supabase } from '@/lib/supabase'
import { getBucketList } from '@/features/planner/services/bucketListService'
import type { BudgetBand } from '@/features/planner/components/TripWizard'

/**
 * Smart Build suggestion engine. Plain SQL + TS ranking, no ML.
 *
 * Pipeline:
 *   1. Hard filter — min_viable_days <= days_available
 *   2. Travel-time check — travel_times[originKey] <= threshold(days)
 *   3. Budget-band fit — destination has the chosen band's number set
 *   4. Bucket-list overlap — count of saved places whose destination matches
 *   5. Seasonality — best_months includes the user's month
 *
 * Destinations that fail (1) or (2) become refusals *only* if the user has
 * bucket-list places there — that's the whole point of saying "El Nido
 * stays in your bucket list" instead of silently hiding it.
 */

export interface SmartBuildInputs {
  originKey: string                       // lowercased hub, e.g. 'manila'
  days: number
  budgetBand: Exclude<BudgetBand, ''>     // '' can't get past the wizard
  month: number                           // 1-12
  travelers: number
}

export interface MatchResult {
  destination: DestinationRow
  rank: number
  score: number
  perDayCost: number | null
  totalCost: number | null
  travelMinutes: number | null
  overlapCount: number
  overlapPlaceNames: string[]
  seasonalFit: boolean
}

export type RefusalReason = 'min_days' | 'budget' | 'no_match'

export interface RefusalResult {
  destination: DestinationRow
  reason: RefusalReason
  message: string
  overlapPlaceNames: string[]
}

export interface SmartBuildResults {
  matches: MatchResult[]
  refusals: RefusalResult[]
  hasOverlap: boolean
}

interface DestinationRow {
  id: string
  slug: string
  name: string
  region: string | null
  summary: string | null
  min_viable_days: number | null
  travel_times: Record<string, number> | null
  budget_low: number | null
  budget_mid: number | null
  budget_high: number | null
  best_months: number[] | null
  typical_days: number | null
}

const BUDGET_COLUMN: Record<Exclude<BudgetBand, ''>, keyof Pick<DestinationRow, 'budget_low' | 'budget_mid' | 'budget_high'>> = {
  low: 'budget_low',
  mid: 'budget_mid',
  high: 'budget_high',
  luxe: 'budget_high',
}

/**
 * Rough travel-time ceiling. One hour of overhead + 90 min per day of trip.
 * Keeps 1-day trips strict (150 min) while a 5-day trip tolerates 10 hours.
 */
function travelCeiling(days: number): number {
  return 60 + 90 * Math.max(1, days)
}

export async function rankSmartBuild(inputs: SmartBuildInputs): Promise<SmartBuildResults> {
  const [destinationsRes, bucket] = await Promise.all([
    supabase
      .from('destinations')
      .select('id, slug, name, region, summary, min_viable_days, travel_times, budget_low, budget_mid, budget_high, best_months, typical_days')
      .eq('status', 'published')
      .order('name', { ascending: true }),
    getBucketList().catch(() => []),
  ])

  if (destinationsRes.error) {
    console.error('Smart Build: destinations fetch failed', destinationsRes.error)
    return { matches: [], refusals: [], hasOverlap: false }
  }

  const destinations: DestinationRow[] = destinationsRes.data || []
  const bucketPlaceIds = bucket.map((b) => b.place_id).filter((id): id is string => Boolean(id))

  // Group saved places by destination so each destination knows which of
  // the user's items would fit there.
  const bucketByDestination = new Map<string, { placeId: string; placeName: string }[]>()
  if (bucketPlaceIds.length > 0) {
    const { data: placeRows } = await supabase
      .from('places')
      .select('id, name, destination_id')
      .in('id', bucketPlaceIds)
    for (const row of placeRows || []) {
      if (!row.destination_id) continue
      const list = bucketByDestination.get(row.destination_id) ?? []
      list.push({ placeId: row.id, placeName: row.name })
      bucketByDestination.set(row.destination_id, list)
    }
  }

  const matches: MatchResult[] = []
  const refusals: RefusalResult[] = []
  const ceiling = travelCeiling(inputs.days)
  const originKey = inputs.originKey.toLowerCase().trim()
  const budgetColumn = BUDGET_COLUMN[inputs.budgetBand]

  for (const dest of destinations) {
    const overlap = bucketByDestination.get(dest.id) ?? []
    const overlapPlaceNames = overlap.map((o) => o.placeName)

    const minDaysOk = dest.min_viable_days === null || dest.min_viable_days <= inputs.days
    const travelMinutes =
      dest.travel_times && typeof dest.travel_times === 'object'
        ? dest.travel_times[originKey] ?? null
        : null
    const travelOk = travelMinutes === null || travelMinutes <= ceiling

    if (!minDaysOk) {
      if (overlap.length > 0) {
        refusals.push({
          destination: dest,
          reason: 'min_days',
          message: refusalMessageForMinDays(dest, inputs.days, originKey),
          overlapPlaceNames,
        })
      }
      continue
    }

    if (!travelOk) {
      if (overlap.length > 0) {
        refusals.push({
          destination: dest,
          reason: 'no_match',
          message: refusalMessageForTravel(dest, inputs.days, originKey, travelMinutes),
          overlapPlaceNames,
        })
      }
      continue
    }

    // Score — higher wins. Weights are deliberately boring; iterate once
    // real traffic shows which signal matters most.
    let score = 100
    score += 50 * (travelMinutes === null ? 0 : 1 - travelMinutes / ceiling) // closer = better
    const perDayCost = (dest[budgetColumn] as number | null) ?? null
    if (perDayCost !== null) score += 30
    score += 20 * overlap.length
    const seasonalFit =
      Array.isArray(dest.best_months) && dest.best_months.includes(inputs.month)
    if (seasonalFit) score += 15

    matches.push({
      destination: dest,
      rank: 0,
      score,
      perDayCost,
      totalCost: perDayCost !== null ? perDayCost * inputs.days * inputs.travelers : null,
      travelMinutes,
      overlapCount: overlap.length,
      overlapPlaceNames,
      seasonalFit,
    })
  }

  matches.sort((a, b) => b.score - a.score)
  matches.forEach((m, i) => (m.rank = i + 1))
  const topMatches = matches.slice(0, 6)

  // If every destination the user already saved was rejected, surface at
  // least one refusal so the dream doesn't die silently.
  if (topMatches.length > 0 && refusals.length === 0 && bucketByDestination.size > 0) {
    // Nothing to add — the overlap destinations were in the matches list.
  }

  return {
    matches: topMatches,
    refusals,
    hasOverlap: bucketByDestination.size > 0,
  }
}

function refusalMessageForMinDays(dest: DestinationRow, days: number, originKey: string): string {
  const need = dest.min_viable_days ?? 0
  const origin = capitalize(originKey)
  return `${dest.name} needs ${need}+ days — the transfer from ${origin} eats into shorter trips. With ${days} days, ${dest.name} stays on your bucket list for when you have longer.`
}

function refusalMessageForTravel(
  dest: DestinationRow,
  days: number,
  originKey: string,
  travelMinutes: number | null,
): string {
  const hrs = travelMinutes !== null ? Math.round((travelMinutes / 60) * 10) / 10 : null
  const origin = capitalize(originKey)
  const label = hrs !== null ? `${hrs} hours door-to-door` : 'the trip there'
  return `${dest.name} is ${label} from ${origin} — on ${days} days, that's most of two days gone. Stays on your bucket list for a longer trip.`
}

function capitalize(s: string): string {
  if (!s) return s
  return s.charAt(0).toUpperCase() + s.slice(1)
}
