import { supabase } from '@/lib/supabase'

export interface CreatorVideo {
  id: string
  creator_id: string
  title: string
  description: string | null
  video_url: string
  video_type: 'youtube' | 'uploaded' | 'tiktok' | 'instagram'
  thumbnail_url: string | null
  duration_seconds: number | null
  location: string | null
  destinations: string[] | null
  place_ids: string[] | null
  views: number
  likes: number
  saves: number
  shares: number
  is_featured: boolean
  created_at: string
  // Joined data
  creator?: {
    id: string
    display_name: string
    avatar_url: string | null
    verified: boolean
    total_followers: number
  }
}

export async function fetchFeaturedVideos(limit = 10): Promise<CreatorVideo[]> {
  const { data, error } = await supabase
    .from('creator_videos')
    .select(`
      *,
      creator:creators(
        id,
        total_followers,
        verified
      )
    `)
    .eq('is_active', true)
    .eq('is_featured', true)
    .order('created_at', { ascending: false })
    .limit(limit)

  if (error) {
    console.error('Error fetching featured videos:', error)
    return []
  }

  // Get creator profile info
  const videosWithProfiles = await Promise.all(
    (data || []).map(async (video) => {
      if (video.creator_id) {
        const { data: profile } = await supabase
          .from('profiles')
          .select('first_name, last_name, avatar_url')
          .eq('id', video.creator_id)
          .single()

        return {
          ...video,
          creator: {
            ...video.creator,
            display_name: profile
              ? `${profile.first_name || ''} ${profile.last_name || ''}`.trim() || 'Creator'
              : 'Creator',
            avatar_url: profile?.avatar_url,
          },
        }
      }
      return video
    })
  )

  return videosWithProfiles
}

export async function fetchVideosByLocation(location: string, limit = 5): Promise<CreatorVideo[]> {
  const { data, error } = await supabase
    .from('creator_videos')
    .select(`
      *,
      creator:creators(
        id,
        total_followers,
        verified
      )
    `)
    .eq('is_active', true)
    .or(`location.ilike.%${location}%,destinations.cs.{${location}}`)
    .order('views', { ascending: false })
    .limit(limit)

  if (error) {
    console.error('Error fetching videos by location:', error)
    return []
  }

  return data || []
}

export async function incrementVideoView(videoId: string): Promise<void> {
  await supabase.rpc('increment_video_views', { video_id: videoId })
}

export async function likeVideo(videoId: string): Promise<void> {
  await supabase.rpc('increment_video_likes', { video_id: videoId })
}

// Extract YouTube video ID from URL
export function getYouTubeVideoId(url: string): string | null {
  const regExp = /^.*(youtu.be\/|v\/|u\/\w\/|embed\/|watch\?v=|&v=)([^#&?]*).*/
  const match = url.match(regExp)
  return match && match[2].length === 11 ? match[2] : null
}

// Get YouTube thumbnail
export function getYouTubeThumbnail(url: string): string {
  const videoId = getYouTubeVideoId(url)
  if (videoId) {
    return `https://img.youtube.com/vi/${videoId}/maxresdefault.jpg`
  }
  return 'https://images.unsplash.com/photo-1518509562904-e7ef99cdcc86?w=800'
}
