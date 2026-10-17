import { supabase } from '@/lib/supabase'

// Thin-page bar — mirrors adminService.placePublishBlockers so a thin
// place published by hand (or via a bug) still 404s on the public side.
// Belt-and-braces: the admin shouldn't let it happen, but the public
// render refuses to show it.
function placeMeetsThinPageBar(place: PublicPlace): boolean {
  if (!place.getting_there) return false
  if (!Array.isArray(place.tips) || place.tips.length < 3) return false
  const hasFee =
    (place.entrance_fee !== null && place.entrance_fee !== undefined) ||
    (typeof place.fee_notes === 'string' && /free/i.test(place.fee_notes))
  if (!hasFee) return false
  return true
}

export interface PublicPlace {
  id: string
  slug: string
  name: string
  summary: string | null
  description: string | null
  photos: string[] | null
  entrance_fee: number | null
  fee_notes: string | null
  duration_minutes: number | null
  getting_there: string | null
  nearest_hub: string | null
  best_time_of_day: string | null
  best_months: number[] | null
  booking_required: boolean | null
  booking_notes: string | null
  category: string | null
  part_of_tour: string | null
  pairs_with: string[] | null
  not_same_day_as: string[] | null
  tips: string[] | null
  source_urls: string[] | null
  verified_at: string | null
  verified_by: string | null
  status: 'draft' | 'published' | 'needs_review'
  destination_id: string | null
}

export interface PublicDestination {
  id: string
  slug: string
  name: string
  region: string | null
  summary: string | null
  description: string | null
  getting_there: string | null
  best_months: number[] | null
  typical_days: number | null
  budget_low: number | null
  budget_mid: number | null
  budget_high: number | null
  min_viable_days: number | null
  travel_times: Record<string, number> | null
  tips: string[] | null
  source_urls: string[] | null
  verified_at: string | null
  status: 'draft' | 'published' | 'needs_review'
}

export interface PublicPartnerProduct {
  id: string
  partner: string
  product_name: string | null
  product_type: 'activity' | 'stay' | 'transfer' | 'addon'
  price_from: number | null
  includes: string | null
  deeplink: string
}

export interface DestinationPageData {
  destination: PublicDestination
  places: PublicPlace[]              // only ones that clear the thin-page bar
  placesByTour: Map<string, PublicPlace[]>
  standalonePlaces: PublicPlace[]
}

export interface PlacePageData {
  place: PublicPlace
  destination: PublicDestination | null
  pairsWith: PublicPlace[]
  tourSiblings: PublicPlace[]        // other places sharing part_of_tour (minus self)
  partnerProducts: PublicPartnerProduct[]
}

/**
 * Fetch a destination for /destinations/[slug]. Returns null when the
 * destination is draft or doesn't exist — the route calls notFound() on
 * null.
 */
export async function getPublicDestinationBySlug(slug: string): Promise<DestinationPageData | null> {
  const { data: destination, error } = await supabase
    .from('destinations')
    .select('*')
    .eq('slug', slug)
    .eq('status', 'published')
    .maybeSingle()

  if (error) {
    console.error('getPublicDestinationBySlug:', error)
    return null
  }
  if (!destination) return null

  const { data: places } = await supabase
    .from('places')
    .select('*')
    .eq('destination_id', destination.id)
    .eq('status', 'published')
    .order('part_of_tour', { ascending: true, nullsFirst: false })
    .order('name', { ascending: true })

  const allPlaces = (places || []) as PublicPlace[]
  const publishedPlaces = allPlaces.filter(placeMeetsThinPageBar)

  // Group by part_of_tour. Null part_of_tour becomes standalone.
  const placesByTour = new Map<string, PublicPlace[]>()
  const standalonePlaces: PublicPlace[] = []
  for (const p of publishedPlaces) {
    if (p.part_of_tour) {
      const list = placesByTour.get(p.part_of_tour) ?? []
      list.push(p)
      placesByTour.set(p.part_of_tour, list)
    } else {
      standalonePlaces.push(p)
    }
  }

  return {
    destination: destination as PublicDestination,
    places: publishedPlaces,
    placesByTour,
    standalonePlaces,
  }
}

/**
 * Fetch a place for /places/[slug]. Returns null when draft or
 * thin-page bar fails. The route calls notFound() on null.
 */
export async function getPublicPlaceBySlug(slug: string): Promise<PlacePageData | null> {
  const { data: place, error } = await supabase
    .from('places')
    .select('*')
    .eq('slug', slug)
    .eq('status', 'published')
    .maybeSingle()

  if (error) {
    console.error('getPublicPlaceBySlug:', error)
    return null
  }
  if (!place) return null

  const typed = place as PublicPlace
  if (!placeMeetsThinPageBar(typed)) return null

  // Resolve pairs_with uuids -> places.
  const pairsWith: PublicPlace[] =
    Array.isArray(typed.pairs_with) && typed.pairs_with.length > 0
      ? await resolvePlaces(typed.pairs_with)
      : []

  // Tour siblings — other places with same part_of_tour, minus self.
  let tourSiblings: PublicPlace[] = []
  if (typed.part_of_tour) {
    const { data: siblings } = await supabase
      .from('places')
      .select('*')
      .eq('part_of_tour', typed.part_of_tour)
      .eq('status', 'published')
      .neq('id', typed.id)
      .order('name', { ascending: true })
    tourSiblings = (siblings || []) as PublicPlace[]
  }

  // Partner products attached to this place.
  const { data: partnerRows } = await supabase
    .from('partner_products')
    .select('id, partner, product_name, product_type, price_from, includes, deeplink')
    .eq('place_id', typed.id)
    .eq('active', true)
    .order('priority', { ascending: false })
    .order('id', { ascending: true })

  const partnerProducts = (partnerRows || []) as PublicPartnerProduct[]

  // Destination lookup.
  let destination: PublicDestination | null = null
  if (typed.destination_id) {
    const { data } = await supabase
      .from('destinations')
      .select('*')
      .eq('id', typed.destination_id)
      .eq('status', 'published')
      .maybeSingle()
    destination = (data as PublicDestination | null) ?? null
  }

  return { place: typed, destination, pairsWith, tourSiblings, partnerProducts }
}

async function resolvePlaces(ids: string[]): Promise<PublicPlace[]> {
  if (ids.length === 0) return []
  const { data } = await supabase
    .from('places')
    .select('*')
    .in('id', ids)
    .eq('status', 'published')
    .order('name', { ascending: true })
  return (data || []) as PublicPlace[]
}

/**
 * Light helpers for the UI layer — formatting that both the destination
 * and the place pages need, kept here so the pages stay dumb.
 */

export function formatFee(fee: number | null, notes: string | null): string {
  if (fee === 0) return 'Free'
  if (fee !== null && fee !== undefined) return `₱${fee.toLocaleString()}`
  if (typeof notes === 'string' && /free/i.test(notes)) return 'Free'
  return 'Not published yet'
}

export function formatDuration(minutes: number | null): string | null {
  if (!minutes) return null
  if (minutes < 60) return `${minutes} min`
  const hours = minutes / 60
  if (hours % 1 === 0) return `${hours} h`
  return `${hours.toFixed(1)} h`
}

export function formatVerifiedAt(iso: string | null): string {
  if (!iso) return 'Not verified yet'
  return new Date(iso).toLocaleDateString('en-GB', {
    day: '2-digit',
    month: 'long',
    year: 'numeric',
  })
}

export function monthLabels(months: number[] | null): string {
  if (!Array.isArray(months) || months.length === 0) return ''
  const names = ['Jan', 'Feb', 'Mar', 'Apr', 'May', 'Jun', 'Jul', 'Aug', 'Sep', 'Oct', 'Nov', 'Dec']
  return months.slice().sort((a, b) => a - b).map((m) => names[m - 1] ?? '').filter(Boolean).join(', ')
}
