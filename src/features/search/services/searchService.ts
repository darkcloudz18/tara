import { supabase } from '@/lib/supabase'
import { DiscoverPlace, PlaceCategory, PlaceSource } from '@/features/planner/services/placeService'

export interface SearchFilters {
  query?: string
  category?: PlaceCategory
  destination?: string
  minRating?: number
  maxPrice?: number
  minPrice?: number
}

export interface SearchResult {
  places: DiscoverPlace[]
  total: number
  hasMore: boolean
}

const SEARCH_HISTORY_KEY = 'tara-search-history'
const MAX_HISTORY_ITEMS = 10

// Map place types to categories
const TYPE_TO_CATEGORY: Record<string, PlaceCategory> = {
  hotel: 'stay',
  resort: 'stay',
  hostel: 'stay',
  lodging: 'stay',
  restaurant: 'eat',
  cafe: 'eat',
  food: 'eat',
  bar: 'eat',
  attraction: 'see',
  beach: 'see',
  landmark: 'see',
  natural_feature: 'see',
  tourist_attraction: 'see',
  activity: 'do',
  tour: 'do',
  adventure: 'do',
  transport: 'do',
  shopping: 'do',
}

function getCategory(placeType: string): PlaceCategory {
  return TYPE_TO_CATEGORY[placeType.toLowerCase()] || 'see'
}

export const searchService = {
  // Full-text search with filters
  async search(filters: SearchFilters, limit: number = 30, offset: number = 0): Promise<SearchResult> {
    try {
      const { query, category, destination, minRating, maxPrice, minPrice } = filters

      // Search Tara places
      let placesQuery = supabase
        .from('places')
        .select('*', { count: 'exact' })
        .eq('is_active', true)
        .order('is_featured', { ascending: false })
        .order('average_rating', { ascending: false })

      // Full-text search on name and description
      if (query && query.trim()) {
        placesQuery = placesQuery.or(`name.ilike.%${query}%,description.ilike.%${query}%,location.ilike.%${query}%`)
      }

      // Category filter
      if (category && category !== 'all') {
        const types = Object.entries(TYPE_TO_CATEGORY)
          .filter(([_, cat]) => cat === category)
          .map(([type]) => type)
        if (types.length > 0) {
          placesQuery = placesQuery.in('place_type', types)
        }
      }

      // Destination filter
      if (destination && destination !== 'all') {
        placesQuery = placesQuery.ilike('location', `%${destination}%`)
      }

      // Rating filter
      if (minRating && minRating > 0) {
        placesQuery = placesQuery.gte('average_rating', minRating)
      }

      // Price filter
      if (minPrice !== undefined && minPrice > 0) {
        placesQuery = placesQuery.gte('estimated_cost', minPrice)
      }
      if (maxPrice !== undefined && maxPrice > 0) {
        placesQuery = placesQuery.lte('estimated_cost', maxPrice)
      }

      // Pagination
      placesQuery = placesQuery.range(offset, offset + limit - 1)

      const { data: placesData, error: placesError, count } = await placesQuery

      if (placesError) throw placesError

      const taraPlaces: DiscoverPlace[] = (placesData || []).map((place) => ({
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

      // Also search partner listings
      let listingsQuery = supabase
        .from('listings')
        .select('*')
        .eq('is_active', true)
        .order('average_rating', { ascending: false })
        .limit(10)

      if (query && query.trim()) {
        listingsQuery = listingsQuery.or(`title.ilike.%${query}%,description.ilike.%${query}%,location.ilike.%${query}%`)
      }

      if (category && category !== 'all') {
        const types = Object.entries(TYPE_TO_CATEGORY)
          .filter(([_, cat]) => cat === category)
          .map(([type]) => type)
        if (types.length > 0) {
          listingsQuery = listingsQuery.in('listing_type', types)
        }
      }

      if (destination && destination !== 'all') {
        listingsQuery = listingsQuery.ilike('location', `%${destination}%`)
      }

      const { data: listingsData } = await listingsQuery

      const partnerPlaces: DiscoverPlace[] = (listingsData || []).map((listing) => ({
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
        isFeatured: true,
      }))

      // Combine results - partners first
      const allPlaces = [...partnerPlaces, ...taraPlaces]
      const total = (count || 0) + partnerPlaces.length

      return {
        places: allPlaces,
        total,
        hasMore: offset + limit < total,
      }
    } catch (err) {
      console.error('Search error:', err)
      return { places: [], total: 0, hasMore: false }
    }
  },

  // Get popular destinations for filter
  async getDestinations(): Promise<string[]> {
    try {
      const { data, error } = await supabase
        .from('places')
        .select('location')
        .eq('is_active', true)

      if (error) throw error

      const locations = [...new Set((data || []).map((p) => p.location))]
      return locations.sort()
    } catch (err) {
      console.error('Error fetching destinations:', err)
      return []
    }
  },

  // Search history management (localStorage)
  getSearchHistory(): string[] {
    if (typeof window === 'undefined') return []
    try {
      const history = localStorage.getItem(SEARCH_HISTORY_KEY)
      return history ? JSON.parse(history) : []
    } catch {
      return []
    }
  },

  addToSearchHistory(query: string): void {
    if (typeof window === 'undefined' || !query.trim()) return
    try {
      const history = this.getSearchHistory()
      const filtered = history.filter((h) => h.toLowerCase() !== query.toLowerCase())
      const updated = [query, ...filtered].slice(0, MAX_HISTORY_ITEMS)
      localStorage.setItem(SEARCH_HISTORY_KEY, JSON.stringify(updated))
    } catch (err) {
      console.error('Error saving search history:', err)
    }
  },

  removeFromSearchHistory(query: string): void {
    if (typeof window === 'undefined') return
    try {
      const history = this.getSearchHistory()
      const updated = history.filter((h) => h !== query)
      localStorage.setItem(SEARCH_HISTORY_KEY, JSON.stringify(updated))
    } catch (err) {
      console.error('Error removing from search history:', err)
    }
  },

  clearSearchHistory(): void {
    if (typeof window === 'undefined') return
    try {
      localStorage.removeItem(SEARCH_HISTORY_KEY)
    } catch (err) {
      console.error('Error clearing search history:', err)
    }
  },
}
