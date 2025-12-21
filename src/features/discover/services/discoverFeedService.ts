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
  // Fetch both content types in parallel
  const [videos, places] = await Promise.all([
    fetchFeaturedVideos(Math.ceil(limit / 4)), // ~25% videos
    fetchFeaturedPlaces(), // Get all featured places
  ])

  // Mix them: 3 places, 1 video pattern
  const feed: FeedItem[] = []
  let placeIndex = 0
  let videoIndex = 0

  while (feed.length < limit && (placeIndex < places.length || videoIndex < videos.length)) {
    // Add 3 places
    for (let i = 0; i < 3 && placeIndex < places.length && feed.length < limit; i++) {
      feed.push({
        type: 'place',
        id: `place-${places[placeIndex].id}`,
        data: places[placeIndex],
      })
      placeIndex++
    }

    // Add 1 video
    if (videoIndex < videos.length && feed.length < limit) {
      feed.push({
        type: 'video',
        id: `video-${videos[videoIndex].id}`,
        data: videos[videoIndex],
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
