'use client'

import { useState } from 'react'
import { Play, Heart, MessageCircle, Send, User, CheckCircle, MoreHorizontal, Video, MapPin } from 'lucide-react'
import BucketIcon from '@/components/icons/BucketIcon'
import { CreatorVideo, getYouTubeVideoId, getYouTubeThumbnail } from '../services/creatorVideoService'

interface VideoCardProps {
  video: CreatorVideo
  onCreatorClick?: (creatorId: string) => void
  className?: string
}

export default function VideoCard({ video, onCreatorClick, className = '' }: VideoCardProps) {
  const [isPlaying, setIsPlaying] = useState(false)
  const [liked, setLiked] = useState(false)
  const [saved, setSaved] = useState(false)
  const [likeCount, setLikeCount] = useState(video.likes || 0)

  const youtubeId = video.video_type === 'youtube' ? getYouTubeVideoId(video.video_url) : null
  const thumbnail = video.thumbnail_url || (youtubeId ? getYouTubeThumbnail(video.video_url) : null)

  const handlePlay = () => {
    setIsPlaying(true)
  }

  const handleLike = () => {
    setLiked(!liked)
    setLikeCount(prev => liked ? prev - 1 : prev + 1)
  }

  return (
    <article className={`bg-white dark:bg-black ${className}`}>
      {/* Header - Instagram style */}
      <div className="flex items-center justify-between px-4 py-3">
        <button
          onClick={() => video.creator && onCreatorClick?.(video.creator.id)}
          className="flex items-center gap-3"
        >
          {/* Avatar */}
          <div className="w-8 h-8 rounded-full bg-gradient-to-br from-yellow-400 via-red-500 to-purple-600 p-[2px]">
            <div className="w-full h-full rounded-full bg-white dark:bg-black p-[2px]">
              <div className="w-full h-full rounded-full bg-gray-200 dark:bg-gray-700 overflow-hidden">
                {video.creator?.avatar_url ? (
                  <img
                    src={video.creator.avatar_url}
                    alt={video.creator.display_name}
                    className="w-full h-full object-cover"
                  />
                ) : (
                  <div className="w-full h-full flex items-center justify-center">
                    <User className="w-4 h-4 text-gray-400" />
                  </div>
                )}
              </div>
            </div>
          </div>
          {/* Creator info */}
          <div className="text-left">
            <div className="flex items-center gap-1">
              <span className="font-semibold text-sm text-gray-900 dark:text-white">
                {video.creator?.display_name || 'creator'}
              </span>
              {video.creator?.verified && (
                <CheckCircle className="w-4 h-4 text-primary-500 fill-primary-500" />
              )}
            </div>
            {video.location && (
              <span className="text-xs text-gray-500 dark:text-gray-400">{video.location}</span>
            )}
          </div>
        </button>
        {/* More options */}
        <button className="p-2 hover:bg-gray-100 dark:hover:bg-gray-800 rounded-full">
          <MoreHorizontal className="w-5 h-5 text-gray-600 dark:text-gray-400" />
        </button>
      </div>

      {/* Video - Square like Instagram */}
      <div className="relative aspect-square overflow-hidden bg-black">
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
              onDoubleClick={handleLike}
            >
              {/* Slight dark overlay for better visibility */}
              <div className="absolute inset-0 bg-black/10" />
            </div>

            {/* Play Button */}
            <button
              onClick={handlePlay}
              className="absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 w-16 h-16 bg-black/50 backdrop-blur-sm rounded-full flex items-center justify-center hover:bg-black/60 transition-colors"
            >
              <Play className="w-8 h-8 text-white fill-white ml-1" />
            </button>

            {/* Video badge */}
            <div className="absolute top-3 right-3 px-2 py-1 bg-black/60 backdrop-blur-sm rounded text-white text-xs font-medium">
              VIDEO
            </div>
          </>
        )}
      </div>

      {/* Action buttons - Instagram style */}
      <div className="px-4 pt-3">
        <div className="flex items-center justify-between">
          <div className="flex items-center gap-4">
            {/* Like */}
            <button onClick={handleLike} className="hover:opacity-60 transition-opacity">
              <Heart
                className={`w-6 h-6 ${liked ? 'fill-red-500 text-red-500' : 'text-gray-900 dark:text-white'}`}
              />
            </button>
            {/* Comment */}
            <button className="hover:opacity-60 transition-opacity">
              <MessageCircle className="w-6 h-6 text-gray-900 dark:text-white" />
            </button>
            {/* Share */}
            <button className="hover:opacity-60 transition-opacity">
              <Send className="w-6 h-6 text-gray-900 dark:text-white" />
            </button>
          </div>
          {/* Save to Bucket List */}
          <button onClick={() => setSaved(!saved)} className="hover:opacity-60 transition-opacity">
            <BucketIcon
              className={`w-6 h-6 ${saved ? 'text-teal-500' : 'text-gray-900 dark:text-white'}`}
              filled={saved}
            />
          </button>
        </div>

        {/* Likes count */}
        <p className="font-semibold text-sm text-gray-900 dark:text-white mt-3">
          {likeCount.toLocaleString()} likes
        </p>
      </div>

      {/* Content - Instagram style */}
      <div className="px-4 pb-4">
        {/* Creator name with caption */}
        <p className="text-sm mt-1">
          <span className="font-semibold text-gray-900 dark:text-white">
            {video.creator?.display_name || 'creator'}
          </span>
          {' '}
          <span className="text-gray-900 dark:text-white">{video.title}</span>
        </p>

        {video.description && (
          <p className="text-sm text-gray-600 dark:text-gray-400 mt-1 line-clamp-2">{video.description}</p>
        )}

        {/* View count */}
        <p className="text-sm text-gray-500 dark:text-gray-400 mt-2">
          {video.views.toLocaleString()} views
        </p>
      </div>
    </article>
  )
}
