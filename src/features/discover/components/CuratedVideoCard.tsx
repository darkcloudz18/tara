'use client'

import { useState } from 'react'
import { MapPin, Heart, MessageCircle, Send, MoreHorizontal, Play, Eye, Video, Camera } from 'lucide-react'
import BucketIcon from '@/components/icons/BucketIcon'
import { FeedVideo, getYouTubeEmbedUrl } from '../services/videoService'

interface CuratedVideoCardProps {
  video: FeedVideo
  onLike?: () => void
  onSave?: () => void
}

export default function CuratedVideoCard({ video, onLike, onSave }: CuratedVideoCardProps) {
  const [isPlaying, setIsPlaying] = useState(false)
  const [liked, setLiked] = useState(false)
  const [saved, setSaved] = useState(false)
  const [likeCount, setLikeCount] = useState(video.likes || Math.floor(Math.random() * 1000) + 100)

  const handlePlay = () => {
    // Only embed if we have a valid YouTube ID
    if (video.youtubeId) {
      setIsPlaying(true)
    } else if (video.videoUrl) {
      // Open external video URL in new tab
      window.open(video.videoUrl, '_blank')
    }
  }

  const handleLike = () => {
    setLiked(!liked)
    setLikeCount(prev => liked ? prev - 1 : prev + 1)
    onLike?.()
  }

  const handleSave = () => {
    setSaved(!saved)
    onSave?.()
  }

  const getCategoryLabel = (category: string) => {
    const labels: Record<string, string> = {
      stay: 'Accommodation',
      eat: 'Food & Dining',
      see: 'Attraction',
      do: 'Activity',
      vlog: 'Travel Vlog',
      guide: 'Travel Guide',
    }
    return labels[category] || (video.youtubeId ? 'Video' : 'Destination')
  }

  return (
    <article className="bg-white dark:bg-black">
      {/* Header */}
      <div className="flex items-center justify-between px-4 py-3">
        <div className="flex items-center gap-3">
          {/* Channel Avatar */}
          <div className={`w-10 h-10 rounded-full bg-gradient-to-br flex items-center justify-center ${
            video.youtubeId ? 'from-red-500 to-red-600' : 'from-teal-400 to-teal-600'
          }`}>
            {video.youtubeId ? (
              <Video className="w-5 h-5 text-white" />
            ) : (
              <Camera className="w-5 h-5 text-white" />
            )}
          </div>
          {/* Channel Info */}
          <div>
            <div className="flex items-center gap-1">
              <span className="font-semibold text-sm text-gray-900 dark:text-white">
                {video.sourceChannel || 'Travel Philippines'}
              </span>
            </div>
            <span className="text-xs text-gray-500 dark:text-gray-400">
              {getCategoryLabel(video.category)}
            </span>
          </div>
        </div>
        {/* More Options */}
        <button className="p-2 hover:bg-gray-100 dark:hover:bg-gray-800 rounded-full transition-colors">
          <MoreHorizontal className="w-5 h-5 text-gray-600 dark:text-gray-400" />
        </button>
      </div>

      {/* Video Player / Thumbnail - 16:9 aspect ratio for YouTube */}
      <div className="relative aspect-video overflow-hidden bg-black">
        {isPlaying && video.youtubeId ? (
          <iframe
            src={getYouTubeEmbedUrl(video.youtubeId)}
            title={video.title}
            allow="accelerometer; autoplay; clipboard-write; encrypted-media; gyroscope; picture-in-picture"
            allowFullScreen
            className="absolute inset-0 w-full h-full"
          />
        ) : (
          <>
            <img
              src={video.thumbnailUrl || (video.youtubeId ? `https://img.youtube.com/vi/${video.youtubeId}/hqdefault.jpg` : 'https://images.unsplash.com/photo-1518509562904-e7ef99cdcc86?w=800')}
              alt={video.title}
              className="w-full h-full object-cover"
            />
            {/* Play Button Overlay - Only show if video is playable */}
            {video.youtubeId && (
              <button
                onClick={handlePlay}
                className="absolute inset-0 flex items-center justify-center bg-black/30 hover:bg-black/40 transition-colors group"
              >
                <div className="w-16 h-16 bg-red-600 rounded-full flex items-center justify-center shadow-lg group-hover:scale-110 transition-transform">
                  <Play className="w-8 h-8 text-white ml-1" fill="white" />
                </div>
              </button>
            )}
            {/* Views Badge */}
            <div className="absolute bottom-3 left-3 flex items-center gap-1.5 px-2.5 py-1 bg-black/70 backdrop-blur-sm text-white text-xs font-medium rounded-lg">
              <Eye className="w-3.5 h-3.5" />
              {video.views > 0 ? video.views.toLocaleString() : Math.floor(Math.random() * 50000 + 10000).toLocaleString()} views
            </div>
            {/* Featured Badge */}
            {video.isFeatured && (
              <div className="absolute top-3 left-3 px-2.5 py-1 bg-red-600 text-white text-xs font-bold rounded-lg">
                FEATURED
              </div>
            )}
          </>
        )}
      </div>

      {/* Action Buttons */}
      <div className="px-4 pt-3">
        <div className="flex items-center justify-between">
          <div className="flex items-center gap-4">
            {/* Like */}
            <button onClick={handleLike} className="hover:opacity-60 transition-opacity">
              <Heart
                className={`w-7 h-7 ${liked ? 'fill-red-500 text-red-500' : 'text-gray-900 dark:text-white'}`}
              />
            </button>
            {/* Comment */}
            <button className="hover:opacity-60 transition-opacity">
              <MessageCircle className="w-7 h-7 text-gray-900 dark:text-white" />
            </button>
            {/* Share */}
            <button className="hover:opacity-60 transition-opacity">
              <Send className="w-7 h-7 text-gray-900 dark:text-white" />
            </button>
          </div>

          {/* Save to Bucket List */}
          <button onClick={handleSave} className="hover:opacity-60 transition-opacity">
            <BucketIcon
              className={`w-7 h-7 ${saved ? 'text-teal-500' : 'text-gray-900 dark:text-white'}`}
              filled={saved}
            />
          </button>
        </div>

        {/* Likes Count */}
        <p className="font-semibold text-sm text-gray-900 dark:text-white mt-3">
          {likeCount.toLocaleString()} likes
        </p>
      </div>

      {/* Content */}
      <div className="px-4 pb-4">
        {/* Title */}
        <p className="text-sm mt-1">
          <span className="font-semibold text-gray-900 dark:text-white">{video.title}</span>
        </p>

        {/* Description */}
        {video.description && (
          <p className="text-sm text-gray-700 dark:text-gray-300 mt-1 line-clamp-2">
            {video.description}
          </p>
        )}

        {/* Location */}
        <div className="flex items-center gap-2 mt-2 text-sm text-gray-500 dark:text-gray-400">
          <MapPin className="w-3.5 h-3.5" />
          <span>{video.location}</span>
        </div>

        {/* Tags */}
        {video.tags && video.tags.length > 0 && (
          <div className="flex flex-wrap gap-1 mt-2">
            {video.tags.slice(0, 4).map((tag) => (
              <span key={tag} className="text-teal-600 dark:text-teal-400 text-sm">
                #{tag.replace(/\s+/g, '')}
              </span>
            ))}
          </div>
        )}
      </div>
    </article>
  )
}
