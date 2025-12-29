'use client'

import { useState } from 'react'
import { ProfileContent } from '../services/profileService'
import { Grid3X3, Play, Bookmark, Map, Heart, MessageCircle, Eye } from 'lucide-react'
import { getYouTubeThumbnail, getYouTubeVideoId } from '@/features/discover/services/creatorVideoService'

interface ProfileContentGridProps {
  content: ProfileContent
  username?: string
  isOwnProfile?: boolean
}

type TabType = 'posts' | 'videos' | 'itineraries' | 'saved'

export default function ProfileContentGrid({ content, username, isOwnProfile }: ProfileContentGridProps) {
  const [activeTab, setActiveTab] = useState<TabType>('posts')

  const tabs: { id: TabType; icon: typeof Grid3X3; label: string; count: number }[] = [
    { id: 'posts', icon: Grid3X3, label: 'Posts', count: content.posts.length },
    { id: 'videos', icon: Play, label: 'Videos', count: content.videos.length },
    { id: 'itineraries', icon: Map, label: 'Trips', count: content.itineraries.length },
  ]

  return (
    <div className="border-t border-gray-200 dark:border-gray-800">
      {/* Tabs */}
      <div className="flex justify-center gap-12 max-w-4xl mx-auto">
        {tabs.map((tab) => {
          const Icon = tab.icon
          const isActive = activeTab === tab.id
          return (
            <button
              key={tab.id}
              onClick={() => setActiveTab(tab.id)}
              className={`flex items-center gap-2 py-4 border-t-2 transition-colors ${
                isActive
                  ? 'border-gray-900 dark:border-white text-gray-900 dark:text-white'
                  : 'border-transparent text-gray-400 dark:text-gray-500 hover:text-gray-600 dark:hover:text-gray-300'
              }`}
            >
              <Icon className="w-4 h-4" />
              <span className="text-xs uppercase tracking-wider font-semibold hidden md:inline">
                {tab.label}
              </span>
              {tab.count > 0 && (
                <span className="text-xs text-gray-500 dark:text-gray-400 md:hidden">
                  {tab.count}
                </span>
              )}
            </button>
          )
        })}
      </div>

      {/* Content */}
      <div className="max-w-4xl mx-auto">
        {activeTab === 'posts' && (
          <PostsGrid posts={content.posts} />
        )}
        {activeTab === 'videos' && (
          <VideosGrid videos={content.videos} />
        )}
        {activeTab === 'itineraries' && (
          <ItinerariesGrid itineraries={content.itineraries} />
        )}
      </div>
    </div>
  )
}

function PostsGrid({ posts }: { posts: ProfileContent['posts'] }) {
  if (posts.length === 0) {
    return (
      <div className="py-16 text-center">
        <Grid3X3 className="w-16 h-16 mx-auto text-gray-300 dark:text-gray-600 mb-4" />
        <h3 className="text-xl font-semibold text-gray-900 dark:text-white mb-2">No Posts Yet</h3>
        <p className="text-gray-500 dark:text-gray-400">Share your travel experiences with the world.</p>
      </div>
    )
  }

  return (
    <div className="grid grid-cols-3 gap-1 md:gap-4">
      {posts.map((post) => (
        <div
          key={post.id}
          className="aspect-square bg-gray-100 dark:bg-gray-800 relative group cursor-pointer overflow-hidden"
        >
          {post.media_urls?.[0] ? (
            <img
              src={post.media_urls[0]}
              alt={post.caption || 'Post'}
              className="w-full h-full object-cover"
            />
          ) : (
            <div className="w-full h-full flex items-center justify-center text-gray-400">
              <Grid3X3 className="w-8 h-8" />
            </div>
          )}

          {/* Hover Overlay */}
          <div className="absolute inset-0 bg-black/50 opacity-0 group-hover:opacity-100 transition-opacity flex items-center justify-center gap-6">
            <div className="flex items-center gap-1 text-white font-semibold">
              <Heart className="w-5 h-5 fill-white" />
              <span>{post.likes_count}</span>
            </div>
            <div className="flex items-center gap-1 text-white font-semibold">
              <MessageCircle className="w-5 h-5 fill-white" />
              <span>{post.comments_count}</span>
            </div>
          </div>

          {/* Multiple Photos Indicator */}
          {post.media_urls && post.media_urls.length > 1 && (
            <div className="absolute top-2 right-2">
              <svg className="w-5 h-5 text-white drop-shadow" viewBox="0 0 24 24" fill="currentColor">
                <path d="M5 21V5h14v16H5zm2-2h10V7H7v12zm-4-2V3h14v2H5v12H3zm4 0h10V7H7v12z"/>
              </svg>
            </div>
          )}

          {/* Video Indicator */}
          {post.content_type === 'reel' && (
            <div className="absolute top-2 right-2">
              <Play className="w-5 h-5 text-white drop-shadow fill-white" />
            </div>
          )}
        </div>
      ))}
    </div>
  )
}

function VideosGrid({ videos }: { videos: ProfileContent['videos'] }) {
  if (videos.length === 0) {
    return (
      <div className="py-16 text-center">
        <Play className="w-16 h-16 mx-auto text-gray-300 dark:text-gray-600 mb-4" />
        <h3 className="text-xl font-semibold text-gray-900 dark:text-white mb-2">No Videos Yet</h3>
        <p className="text-gray-500 dark:text-gray-400">Create travel videos to share your adventures.</p>
      </div>
    )
  }

  return (
    <div className="grid grid-cols-3 gap-1 md:gap-4">
      {videos.map((video) => {
        const thumbnail = video.thumbnail_url ||
          (video.video_type === 'youtube' ? getYouTubeThumbnail(video.video_url) : null)

        return (
          <div
            key={video.id}
            className="aspect-[9/16] md:aspect-square bg-gray-100 dark:bg-gray-800 relative group cursor-pointer overflow-hidden"
          >
            {thumbnail ? (
              <img
                src={thumbnail}
                alt={video.title}
                className="w-full h-full object-cover"
              />
            ) : (
              <div className="w-full h-full flex items-center justify-center text-gray-400 bg-gradient-to-br from-gray-200 to-gray-300 dark:from-gray-700 dark:to-gray-800">
                <Play className="w-12 h-12" />
              </div>
            )}

            {/* Play Indicator */}
            <div className="absolute inset-0 flex items-center justify-center">
              <div className="w-12 h-12 bg-black/30 backdrop-blur-sm rounded-full flex items-center justify-center opacity-80 group-hover:opacity-100 transition-opacity">
                <Play className="w-6 h-6 text-white fill-white ml-1" />
              </div>
            </div>

            {/* Hover Overlay */}
            <div className="absolute inset-0 bg-black/50 opacity-0 group-hover:opacity-100 transition-opacity flex items-center justify-center gap-4">
              <div className="flex items-center gap-1 text-white font-semibold text-sm">
                <Eye className="w-4 h-4" />
                <span>{(video.views || 0).toLocaleString()}</span>
              </div>
              <div className="flex items-center gap-1 text-white font-semibold text-sm">
                <Heart className="w-4 h-4 fill-white" />
                <span>{video.likes || 0}</span>
              </div>
            </div>

            {/* Title Overlay */}
            <div className="absolute bottom-0 left-0 right-0 p-2 bg-gradient-to-t from-black/80 to-transparent">
              <p className="text-white text-xs font-medium line-clamp-2">{video.title}</p>
            </div>
          </div>
        )
      })}
    </div>
  )
}

function ItinerariesGrid({ itineraries }: { itineraries: ProfileContent['itineraries'] }) {
  if (itineraries.length === 0) {
    return (
      <div className="py-16 text-center">
        <Map className="w-16 h-16 mx-auto text-gray-300 dark:text-gray-600 mb-4" />
        <h3 className="text-xl font-semibold text-gray-900 dark:text-white mb-2">No Public Trips Yet</h3>
        <p className="text-gray-500 dark:text-gray-400">Plan trips and share them with the community.</p>
      </div>
    )
  }

  return (
    <div className="grid grid-cols-2 md:grid-cols-3 gap-4 p-4">
      {itineraries.map((itinerary) => {
        const startDate = new Date(itinerary.start_date)
        const endDate = new Date(itinerary.end_date)
        const days = Math.ceil((endDate.getTime() - startDate.getTime()) / (1000 * 60 * 60 * 24)) + 1

        return (
          <div
            key={itinerary.id}
            className="bg-white dark:bg-gray-900 rounded-xl overflow-hidden border border-gray-200 dark:border-gray-800 hover:shadow-lg transition-shadow cursor-pointer"
          >
            {/* Cover Image */}
            <div className="aspect-video bg-gray-100 dark:bg-gray-800 relative">
              {itinerary.cover_image_url ? (
                <img
                  src={itinerary.cover_image_url}
                  alt={itinerary.title}
                  className="w-full h-full object-cover"
                />
              ) : (
                <div className="w-full h-full flex items-center justify-center bg-gradient-to-br from-teal-400 to-blue-500">
                  <Map className="w-8 h-8 text-white" />
                </div>
              )}
              <div className="absolute top-2 right-2 px-2 py-1 bg-black/50 backdrop-blur-sm rounded-full text-white text-xs font-medium">
                {days} days
              </div>
            </div>

            {/* Info */}
            <div className="p-3">
              <h3 className="font-semibold text-gray-900 dark:text-white text-sm line-clamp-1">
                {itinerary.title}
              </h3>
              <p className="text-xs text-gray-500 dark:text-gray-400 mt-1">
                {itinerary.destinations.slice(0, 2).join(', ')}
                {itinerary.destinations.length > 2 && ` +${itinerary.destinations.length - 2}`}
              </p>
              <p className="text-xs text-gray-400 dark:text-gray-500 mt-1">
                {startDate.toLocaleDateString('en-US', { month: 'short', day: 'numeric' })} -{' '}
                {endDate.toLocaleDateString('en-US', { month: 'short', day: 'numeric', year: 'numeric' })}
              </p>
            </div>
          </div>
        )
      })}
    </div>
  )
}
