import { getBucketList, BucketListItem } from './bucketListService'

export interface BucketSuggestionsGrouped {
  matching: BucketListItem[]
  offDestination: BucketListItem[]
  totalCount: number
}

// Splits the visitor's bucket into two piles relative to a specific
// lakad's destinations: items whose location matches (this trip, plans
// them), and items that don't (still saved intent, just not for this
// trip). Both are returned so the builder can show the off-destination
// pile behind an affordance rather than hiding it.
//
// RLS on bucket_list handles identity scoping — no user_id needed.
export async function getBucketSuggestions(
  destinations: string[]
): Promise<BucketSuggestionsGrouped> {
  const all = await getBucketList()

  if (all.length === 0) {
    return { matching: [], offDestination: [], totalCount: 0 }
  }

  const normalized = destinations
    .map((d) => d.trim().toLowerCase())
    .filter((d) => d.length > 0)

  const matching: BucketListItem[] = []
  const offDestination: BucketListItem[] = []

  for (const item of all) {
    const loc = item.place_location?.trim().toLowerCase() ?? ''
    const hit = normalized.some((d) => loc.includes(d) || d.includes(loc))
    if (hit && loc) matching.push(item)
    else offDestination.push(item)
  }

  return {
    matching,
    offDestination,
    totalCount: all.length,
  }
}
