import { supabase } from '@/lib/supabase'
import { Listing, TaraPlace } from '@/types/database'

export type PlaceSource = 'partner' | 'tara' | 'google'
export type PlaceCategory = 'stay' | 'eat' | 'see' | 'do' | 'all'

export interface DiscoverPlace {
  id: string
  name: string
  description?: string
  location: string // City/Province
  address?: string
  coordinates?: { x: number; y: number }
  category: PlaceCategory
  placeType: string // original type (hotel, restaurant, etc.)
  photos: string[]
  rating: number
  reviewCount: number
  estimatedCost?: number
  source: PlaceSource
  sourceId: string // original ID from source
  tags?: string[]
  isFeatured?: boolean
}

// Map place types to categories
const TYPE_TO_CATEGORY: Record<string, PlaceCategory> = {
  // Stay
  hotel: 'stay',
  resort: 'stay',
  hostel: 'stay',
  lodging: 'stay',
  // Eat
  restaurant: 'eat',
  cafe: 'eat',
  food: 'eat',
  bar: 'eat',
  // See
  attraction: 'see',
  beach: 'see',
  landmark: 'see',
  natural_feature: 'see',
  tourist_attraction: 'see',
  // Do
  activity: 'do',
  tour: 'do',
  adventure: 'do',
  transport: 'do',
  shopping: 'do',
}

function getCategory(placeType: string): PlaceCategory {
  return TYPE_TO_CATEGORY[placeType.toLowerCase()] || 'see'
}

// Fetch partner listings (suppliers)
async function fetchPartnerListings(
  destination?: string,
  category?: PlaceCategory
): Promise<DiscoverPlace[]> {
  try {
    let query = supabase
      .from('listings')
      .select('*')
      .eq('is_active', true)
      .order('average_rating', { ascending: false })
      .limit(20)

    if (destination && destination !== 'all') {
      query = query.ilike('location', `%${destination}%`)
    }

    if (category && category !== 'all') {
      const types = Object.entries(TYPE_TO_CATEGORY)
        .filter(([_, cat]) => cat === category)
        .map(([type]) => type)
      if (types.length > 0) {
        query = query.in('listing_type', types)
      }
    }

    const { data, error } = await query

    if (error) throw error

    return (data || []).map((listing: Listing) => ({
      id: `partner-${listing.id}`,
      name: listing.title,
      description: listing.description,
      location: listing.location,
      address: listing.location,
      coordinates: listing.coordinates,
      category: getCategory(listing.listing_type),
      placeType: listing.listing_type,
      photos: listing.photos || [],
      rating: listing.average_rating || 0,
      reviewCount: listing.total_reviews || 0,
      estimatedCost: listing.price,
      source: 'partner' as PlaceSource,
      sourceId: listing.id,
      isFeatured: true, // All partner listings are featured
    }))
  } catch (err) {
    console.error('Error fetching partner listings:', err)
    return []
  }
}

// Fetch Tara places (our database)
async function fetchTaraPlaces(
  destination?: string,
  category?: PlaceCategory
): Promise<DiscoverPlace[]> {
  try {
    let query = supabase
      .from('places')
      .select('*')
      .eq('is_active', true)
      .order('is_featured', { ascending: false })
      .order('average_rating', { ascending: false })
      .limit(30)

    if (destination && destination !== 'all') {
      query = query.ilike('location', `%${destination}%`)
    }

    if (category && category !== 'all') {
      const types = Object.entries(TYPE_TO_CATEGORY)
        .filter(([_, cat]) => cat === category)
        .map(([type]) => type)
      if (types.length > 0) {
        query = query.in('place_type', types)
      }
    }

    const { data, error } = await query

    if (error) throw error

    return (data || []).map((place: TaraPlace) => ({
      id: `tara-${place.id}`,
      name: place.name,
      description: place.description,
      location: place.location,
      address: place.address,
      coordinates: place.coordinates,
      category: getCategory(place.place_type),
      placeType: place.place_type,
      photos: place.photos || [],
      rating: place.average_rating || 0,
      reviewCount: place.total_reviews || 0,
      estimatedCost: place.estimated_cost,
      source: 'tara' as PlaceSource,
      sourceId: place.id,
      tags: place.tags,
      isFeatured: place.is_featured,
    }))
  } catch (err) {
    console.error('Error fetching Tara places:', err)
    return []
  }
}

// Get unique destinations from places table
export async function fetchDestinations(): Promise<string[]> {
  try {
    const { data, error } = await supabase
      .from('places')
      .select('location')
      .eq('is_active', true)

    if (error) throw error

    // Get unique locations
    const locations = [...new Set((data || []).map((p) => p.location))]
    return locations.sort()
  } catch (err) {
    console.error('Error fetching destinations:', err)
    return []
  }
}

// Main function: Fetch all places with priority
export async function fetchDiscoverPlaces(
  destination?: string,
  category?: PlaceCategory
): Promise<DiscoverPlace[]> {
  // Fetch in priority order
  const [partnerPlaces, taraPlaces] = await Promise.all([
    fetchPartnerListings(destination, category),
    fetchTaraPlaces(destination, category),
  ])

  // Combine with priority: partners first, then tara
  const allPlaces = [...partnerPlaces, ...taraPlaces]

  // If we have very few results, we could add Google Places here
  // For now, skip Google to prioritize our own data

  return allPlaces
}

// Get featured places for initial load (no filters)
export async function fetchFeaturedPlaces(): Promise<DiscoverPlace[]> {
  const [partnerPlaces, taraPlaces] = await Promise.all([
    fetchPartnerListings(),
    fetchTaraPlaces(),
  ])

  // Prioritize featured items
  const featured = [
    ...partnerPlaces, // All partners are featured
    ...taraPlaces.filter((p) => p.isFeatured),
  ]

  // Add non-featured if we need more
  const nonFeatured = taraPlaces.filter((p) => !p.isFeatured)

  return [...featured, ...nonFeatured]
}
