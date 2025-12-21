import { supabase } from '@/lib/supabase'
import { CuratedVideo, VideoCategory } from '@/types/database'

export interface FeedVideo {
  id: string
  type: 'video'
  title: string
  description?: string
  videoUrl: string
  videoType: 'youtube' | 'short'
  youtubeId?: string
  thumbnailUrl?: string
  category: VideoCategory
  location: string
  tags?: string[]
  sourceChannel?: string
  views: number
  likes: number
  saves: number
  isFeatured: boolean
  isShort: boolean
}

// Convert database video to feed format
function toFeedVideo(video: CuratedVideo): FeedVideo {
  return {
    id: `video-${video.id}`,
    type: 'video',
    title: video.title,
    description: video.description,
    videoUrl: video.video_url,
    videoType: video.is_short ? 'short' : 'youtube',
    youtubeId: video.youtube_id,
    thumbnailUrl: video.thumbnail_url,
    category: video.category,
    location: video.location,
    tags: video.tags,
    sourceChannel: video.source_channel,
    views: video.views,
    likes: video.likes,
    saves: video.saves,
    isFeatured: video.is_featured,
    isShort: video.is_short,
  }
}

// Fetch curated YouTube videos
export async function fetchCuratedVideos(
  limit: number = 10,
  category?: VideoCategory,
  location?: string
): Promise<FeedVideo[]> {
  try {
    let query = supabase
      .from('curated_videos')
      .select('*')
      .eq('is_active', true)
      .eq('is_short', false)
      .order('is_featured', { ascending: false })
      .order('created_at', { ascending: false })
      .limit(limit)

    if (category && category !== 'see') {
      query = query.eq('category', category)
    }

    if (location) {
      query = query.ilike('location', `%${location}%`)
    }

    const { data, error } = await query

    if (error) throw error

    return (data || []).map(toFeedVideo)
  } catch (err) {
    console.error('Error fetching curated videos:', err)
    return []
  }
}

// Fetch short-form videos (Reels/Shorts style)
export async function fetchShortVideos(
  limit: number = 10,
  category?: VideoCategory
): Promise<FeedVideo[]> {
  try {
    let query = supabase
      .from('curated_videos')
      .select('*')
      .eq('is_active', true)
      .eq('is_short', true)
      .order('is_featured', { ascending: false })
      .order('created_at', { ascending: false })
      .limit(limit)

    if (category) {
      query = query.eq('category', category)
    }

    const { data, error } = await query

    if (error) throw error

    return (data || []).map(toFeedVideo)
  } catch (err) {
    console.error('Error fetching short videos:', err)
    return []
  }
}

// Fetch featured videos for homepage
export async function fetchFeaturedVideos(limit: number = 5): Promise<FeedVideo[]> {
  try {
    const { data, error } = await supabase
      .from('curated_videos')
      .select('*')
      .eq('is_active', true)
      .eq('is_featured', true)
      .eq('is_short', false)
      .order('display_order', { ascending: true })
      .limit(limit)

    if (error) throw error

    return (data || []).map(toFeedVideo)
  } catch (err) {
    console.error('Error fetching featured videos:', err)
    return []
  }
}

// Extract YouTube video ID from URL
export function extractYouTubeId(url: string): string | null {
  const patterns = [
    /(?:youtube\.com\/watch\?v=|youtu\.be\/|youtube\.com\/embed\/)([^&\n?#]+)/,
    /youtube\.com\/shorts\/([^&\n?#]+)/,
  ]

  for (const pattern of patterns) {
    const match = url.match(pattern)
    if (match) return match[1]
  }

  return null
}

// Get YouTube thumbnail URL
export function getYouTubeThumbnail(videoId: string, quality: 'default' | 'medium' | 'high' | 'max' = 'high'): string {
  const qualityMap = {
    default: 'default',
    medium: 'mqdefault',
    high: 'hqdefault',
    max: 'maxresdefault',
  }
  return `https://img.youtube.com/vi/${videoId}/${qualityMap[quality]}.jpg`
}

// Get YouTube embed URL
export function getYouTubeEmbedUrl(videoId: string): string {
  return `https://www.youtube.com/embed/${videoId}?rel=0&modestbranding=1`
}
