'use client'

import { useState } from 'react'
import { Play, Heart, MessageCircle, Share2, User, CheckCircle } from 'lucide-react'
import { CreatorVideo, getYouTubeVideoId, getYouTubeThumbnail } from '../services/creatorVideoService'

interface VideoCardProps {
  video: CreatorVideo
  onCreatorClick?: (creatorId: string) => void
  className?: string
}

export default function VideoCard({ video, onCreatorClick, className = '' }: VideoCardProps) {
  const [isPlaying, setIsPlaying] = useState(false)
  const [liked, setLiked] = useState(false)

  const youtubeId = video.video_type === 'youtube' ? getYouTubeVideoId(video.video_url) : null
  const thumbnail = video.thumbnail_url || (youtubeId ? getYouTubeThumbnail(video.video_url) : null)

  const handlePlay = () => {
    setIsPlaying(true)
  }

  const handleLike = (e: React.MouseEvent) => {
    e.stopPropagation()
    setLiked(!liked)
  }

  return (
    <div className={`relative bg-black rounded-2xl overflow-hidden ${className}`}>
      {/* Video or Thumbnail */}
      <div className="relative aspect-[9/16] w-full">
        {isPlaying && youtubeId ? (
          <iframe
            src={`https://www.youtube.com/embed/${youtubeId}?autoplay=1&controls=1&rel=0`}
            className="absolute inset-0 w-full h-full"
            allow="accelerometer; autoplay; clipboard-write; encrypted-media; gyroscope; picture-in-picture"
            allowFullScreen
          />
        ) : (
          <>
            {/* Thumbnail */}
            <div
              className="absolute inset-0 bg-cover bg-center cursor-pointer"
              style={{ backgroundImage: `url(${thumbnail})` }}
              onClick={handlePlay}
            >
              {/* Gradient overlay */}
              <div className="absolute inset-0 bg-gradient-to-t from-black/80 via-transparent to-black/30" />
            </div>

            {/* Play Button */}
            <button
              onClick={handlePlay}
              className="absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 w-16 h-16 bg-white/20 backdrop-blur-sm rounded-full flex items-center justify-center hover:bg-white/30 transition-colors"
            >
              <Play className="w-8 h-8 text-white fill-white ml-1" />
            </button>
          </>
        )}

        {/* Creator Info - Bottom Left */}
        <div className="absolute bottom-4 left-4 right-16 z-10">
          {/* Creator */}
          <button
            onClick={() => video.creator && onCreatorClick?.(video.creator.id)}
            className="flex items-center gap-2 mb-2"
          >
            <div className="w-10 h-10 rounded-full bg-gray-600 overflow-hidden flex-shrink-0">
              {video.creator?.avatar_url ? (
                <img
                  src={video.creator.avatar_url}
                  alt={video.creator.display_name}
                  className="w-full h-full object-cover"
                />
              ) : (
                <div className="w-full h-full flex items-center justify-center">
                  <User className="w-5 h-5 text-gray-400" />
                </div>
              )}
            </div>
            <div className="text-left">
              <div className="flex items-center gap-1">
                <span className="text-white font-semibold text-sm">
                  @{video.creator?.display_name || 'creator'}
                </span>
                {video.creator?.verified && (
                  <CheckCircle className="w-4 h-4 text-primary-400 fill-primary-400" />
                )}
              </div>
              <span className="text-white/60 text-xs">
                {video.creator?.total_followers?.toLocaleString() || 0} followers
              </span>
            </div>
          </button>

          {/* Title & Description */}
          <h3 className="text-white font-semibold text-base mb-1 line-clamp-2">
            {video.title}
          </h3>
          {video.description && (
            <p className="text-white/70 text-sm line-clamp-2">{video.description}</p>
          )}

          {/* Location Tag */}
          {video.location && (
            <div className="mt-2">
              <span className="inline-flex items-center px-2 py-1 bg-white/20 backdrop-blur-sm rounded-full text-white text-xs">
                📍 {video.location}
              </span>
            </div>
          )}
        </div>

        {/* Action Buttons - Right Side */}
        <div className="absolute bottom-4 right-4 flex flex-col gap-4 z-10">
          {/* Like */}
          <button
            onClick={handleLike}
            className="flex flex-col items-center gap-1"
          >
            <div
              className={`w-12 h-12 rounded-full flex items-center justify-center transition-colors ${
                liked ? 'bg-red-500' : 'bg-white/20 backdrop-blur-sm'
              }`}
            >
              <Heart
                className={`w-6 h-6 ${liked ? 'text-white fill-white' : 'text-white'}`}
              />
            </div>
            <span className="text-white text-xs font-medium">
              {(video.likes + (liked ? 1 : 0)).toLocaleString()}
            </span>
          </button>

          {/* Comments */}
          <button className="flex flex-col items-center gap-1">
            <div className="w-12 h-12 rounded-full bg-white/20 backdrop-blur-sm flex items-center justify-center">
              <MessageCircle className="w-6 h-6 text-white" />
            </div>
            <span className="text-white text-xs font-medium">
              {Math.floor(video.views * 0.02).toLocaleString()}
            </span>
          </button>

          {/* Share */}
          <button className="flex flex-col items-center gap-1">
            <div className="w-12 h-12 rounded-full bg-white/20 backdrop-blur-sm flex items-center justify-center">
              <Share2 className="w-6 h-6 text-white" />
            </div>
            <span className="text-white text-xs font-medium">Share</span>
          </button>
        </div>
      </div>
    </div>
  )
}
