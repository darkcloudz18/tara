import { supabase } from '@/lib/supabase'
import { DiscoverPlace } from '@/features/planner/services/placeService'

export type PersonalizationSignal = {
  destination: string
  source: 'dated_lakad' | 'bucket_cluster'
  savedIds: string[]
}

// Minimum bucket saves clustered on a single location before we treat
// it as intent. Two saves might be exploratory; three starts to look
// like a shortlist for that place. Task 09 report-back tracks whether
// this cutoff is right.
const BUCKET_CLUSTER_THRESHOLD = 3

// Priority order: a real dated lakad beats a cluster of saves. If the
// visitor has both, the lakad wins because dates + destinations are a
// stronger commitment than a wishlist.
//
// Both queries below rely on Supabase RLS to scope by identity — no
// upfront getUserSafe() network round-trip. That avoids a timeout
// window that would silently kill the strip on slow links.
export async function detectSignal(): Promise<PersonalizationSignal | null> {
  const fromLakad = await detectFromDatedLakad()
  if (fromLakad) return fromLakad
  return await detectFromBucketCluster()
}

async function detectFromDatedLakad(): Promise<PersonalizationSignal | null> {
  const today = todayInPHT()
  const { data, error } = await supabase
    .from('itineraries')
    .select('destinations, start_date, id')
    .eq('status', 'dated')
    .gte('start_date', today)
    .order('start_date', { ascending: true })
    .order('id', { ascending: true })
    .limit(1)

  if (error || !data || data.length === 0) return null

  const row = data[0]
  const destinations = (row.destinations as string[] | null) ?? []
  const destination = destinations.find((d) => d && d.trim().length > 0)
  if (!destination) return null

  const savedIds = await savedPlaceIdsForDestination(destination)

  return {
    destination,
    source: 'dated_lakad',
    savedIds,
  }
}

async function detectFromBucketCluster(): Promise<PersonalizationSignal | null> {
  // RLS scopes to the current identity (user_id or anon_id via header),
  // so a single select covers both anon and auth visitors.
  const { data, error } = await supabase
    .from('bucket_list')
    .select('place_location, place_id, external_place_id')

  if (error || !data || data.length === 0) return null

  const counts = new Map<string, number>()
  for (const row of data) {
    const loc = normalizeLocation(row.place_location)
    if (!loc) continue
    counts.set(loc, (counts.get(loc) ?? 0) + 1)
  }

  let topLocation = ''
  let topCount = 0
  for (const [loc, count] of counts) {
    if (count > topCount) {
      topLocation = loc
      topCount = count
    }
  }

  if (topCount < BUCKET_CLUSTER_THRESHOLD) return null

  const savedIds = data
    .map((r) => r.place_id ?? r.external_place_id)
    .filter((id): id is string => Boolean(id))

  return {
    destination: topLocation,
    source: 'bucket_cluster',
    savedIds,
  }
}

async function savedPlaceIdsForDestination(
  destination: string
): Promise<string[]> {
  const { data, error } = await supabase
    .from('bucket_list')
    .select('place_id, external_place_id, place_location')
    .ilike('place_location', `%${destination}%`)

  if (error || !data) return []
  return data
    .map((r) => r.place_id ?? r.external_place_id)
    .filter((id): id is string => Boolean(id))
}

function normalizeLocation(loc: string | null): string {
  if (!loc) return ''
  return loc.trim()
}

// Manila is UTC+8. Local date, no timezone drift.
function todayInPHT(): string {
  const now = new Date()
  const phtMs = now.getTime() + (now.getTimezoneOffset() + 8 * 60) * 60_000
  const pht = new Date(phtMs)
  const pad = (n: number) => (n < 10 ? `0${n}` : String(n))
  return `${pht.getUTCFullYear()}-${pad(pht.getUTCMonth() + 1)}-${pad(pht.getUTCDate())}`
}

// -----------------------------------------------------------------------
// Personalized places fetch

export async function getPersonalizedPlaces(
  signal: PersonalizationSignal,
  limit = 8
): Promise<DiscoverPlace[]> {
  let query = supabase
    .from('places')
    .select('*')
    .eq('is_active', true)
    .ilike('location', `%${signal.destination}%`)
    // is_featured first, then quality, then id tiebreaker for
    // deterministic ordering per project rules.
    .order('is_featured', { ascending: false, nullsFirst: false })
    .order('average_rating', { ascending: false, nullsFirst: false })
    .order('id', { ascending: true })
    .limit(limit)

  if (signal.savedIds.length > 0) {
    query = query.not('id', 'in', `(${signal.savedIds.join(',')})`)
  }

  const { data, error } = await query
  if (error || !data) return []

  return data.map((p) => ({
    id: p.id,
    sourceId: p.id,
    name: p.name,
    location: p.location ?? '',
    description: p.description ?? undefined,
    category: (p.category ?? 'see') as DiscoverPlace['category'],
    placeType: p.place_type ?? p.category ?? 'see',
    tags: p.tags ?? [],
    photos: p.photos ?? [],
    rating: p.average_rating ?? 0,
    reviewCount: p.total_reviews ?? 0,
    estimatedCost: p.estimated_cost ?? undefined,
    isFeatured: p.is_featured ?? false,
    source: 'tara' as const,
  }))
}
