import { supabase } from '@/lib/supabase'
import { CreatorVideo, fetchFeaturedVideos } from './creatorVideoService'
import { DiscoverPlace, fetchFeaturedPlaces } from '@/features/planner/services/placeService'

export type FeedItemType = 'video' | 'place'

export interface FeedItem {
  type: FeedItemType
  id: string
  data: CreatorVideo | DiscoverPlace
}

/**
 * Fetch mixed feed of videos and places
 * Pattern: 3 places → 1 video → 3 places → 1 video
 */
export async function fetchDiscoverFeed(limit = 20): Promise<FeedItem[]> {
  return fetchDiscoverFeedPaginated(0, limit)
}

/**
 * Fetch paginated feed with offset support for infinite scroll
 */
export async function fetchDiscoverFeedPaginated(page = 0, pageSize = 20): Promise<FeedItem[]> {
  const offset = page * pageSize

  // Calculate how many places and videos we need based on the 3:1 pattern
  const videosPerPage = Math.ceil(pageSize / 4)
  const placesPerPage = pageSize - videosPerPage

  // Fetch both content types in parallel with pagination
  const [videosResult, placesResult] = await Promise.all([
    supabase
      .from('creator_videos')
      .select('*')
      .eq('is_active', true)
      .order('created_at', { ascending: false })
      .range(Math.floor(offset / 4), Math.floor(offset / 4) + videosPerPage - 1),
    supabase
      .from('places')
      .select('*')
      .eq('is_active', true)
      .order('is_featured', { ascending: false })
      .order('average_rating', { ascending: false })
      .range(Math.floor(offset * 3 / 4), Math.floor(offset * 3 / 4) + placesPerPage - 1),
  ])

  const videos = videosResult.data || []
  const rawPlaces = placesResult.data || []

  // Transform places to DiscoverPlace format
  const places: DiscoverPlace[] = rawPlaces.map((place) => ({
    id: `tara-${place.id}`,
    name: place.name,
    description: place.description,
    location: place.location,
    address: place.address,
    coordinates: place.coordinates,
    category: place.category || 'see',
    placeType: place.place_type,
    photos: place.photos || [],
    rating: place.average_rating || 0,
    reviewCount: place.total_reviews || 0,
    estimatedCost: place.estimated_cost,
    source: 'tara' as const,
    sourceId: place.id,
    tags: place.tags,
    isFeatured: place.is_featured,
  }))

  // Mix them: 3 places, 1 video pattern
  const feed: FeedItem[] = []
  let placeIndex = 0
  let videoIndex = 0

  while (feed.length < pageSize && (placeIndex < places.length || videoIndex < videos.length)) {
    // Add 3 places
    for (let i = 0; i < 3 && placeIndex < places.length && feed.length < pageSize; i++) {
      feed.push({
        type: 'place',
        id: `place-${places[placeIndex].id}`,
        data: places[placeIndex],
      })
      placeIndex++
    }

    // Add 1 video
    if (videoIndex < videos.length && feed.length < pageSize) {
      feed.push({
        type: 'video',
        id: `video-${videos[videoIndex].id}`,
        data: videos[videoIndex] as CreatorVideo,
      })
      videoIndex++
    }
  }

  return feed
}

/**
 * Fetch feed filtered by destination
 */
export async function fetchFeedByDestination(destination: string, limit = 20): Promise<FeedItem[]> {
  // Fetch places for this destination
  const { data: places, error: placesError } = await supabase
    .from('places')
    .select('*')
    .eq('is_active', true)
    .ilike('location', `%${destination}%`)
    .order('is_featured', { ascending: false })
    .order('average_rating', { ascending: false })
    .limit(Math.ceil(limit * 0.75))

  if (placesError) {
    console.error('Error fetching places:', placesError)
  }

  // Fetch videos for this destination
  const { data: videos, error: videosError } = await supabase
    .from('creator_videos')
    .select('*')
    .eq('is_active', true)
    .or(`location.ilike.%${destination}%,destinations.cs.{${destination}}`)
    .order('views', { ascending: false })
    .limit(Math.ceil(limit * 0.25))

  if (videosError) {
    console.error('Error fetching videos:', videosError)
  }

  // Transform places to DiscoverPlace format
  const transformedPlaces: DiscoverPlace[] = (places || []).map((place) => ({
    id: `tara-${place.id}`,
    name: place.name,
    description: place.description,
    location: place.location,
    address: place.address,
    coordinates: place.coordinates,
    category: place.category || 'see',
    placeType: place.place_type,
    photos: place.photos || [],
    rating: place.average_rating || 0,
    reviewCount: place.total_reviews || 0,
    estimatedCost: place.estimated_cost,
    source: 'tara' as const,
    sourceId: place.id,
    tags: place.tags,
    isFeatured: place.is_featured,
  }))

  // Mix them
  const feed: FeedItem[] = []
  let placeIndex = 0
  let videoIndex = 0

  while (feed.length < limit && (placeIndex < transformedPlaces.length || videoIndex < (videos || []).length)) {
    for (let i = 0; i < 3 && placeIndex < transformedPlaces.length && feed.length < limit; i++) {
      feed.push({
        type: 'place',
        id: `place-${transformedPlaces[placeIndex].id}`,
        data: transformedPlaces[placeIndex],
      })
      placeIndex++
    }

    if (videoIndex < (videos || []).length && feed.length < limit) {
      feed.push({
        type: 'video',
        id: `video-${videos![videoIndex].id}`,
        data: videos![videoIndex] as CreatorVideo,
      })
      videoIndex++
    }
  }

  return feed
}
