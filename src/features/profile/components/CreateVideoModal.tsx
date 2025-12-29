'use client'

import { useState } from 'react'
import { X, Link as LinkIcon, MapPin, Loader2, Play } from 'lucide-react'
import { supabase } from '@/lib/supabase'
import { getYouTubeVideoId, getYouTubeThumbnail } from '@/features/discover/services/creatorVideoService'

interface CreateVideoModalProps {
  userId: string
  onClose: () => void
  onSuccess: () => void
}

type VideoType = 'youtube' | 'tiktok' | 'instagram'

export default function CreateVideoModal({
  userId,
  onClose,
  onSuccess,
}: CreateVideoModalProps) {
  const [title, setTitle] = useState('')
  const [description, setDescription] = useState('')
  const [videoUrl, setVideoUrl] = useState('')
  const [videoType, setVideoType] = useState<VideoType>('youtube')
  const [location, setLocation] = useState('')
  const [destinations, setDestinations] = useState('')
  const [saving, setSaving] = useState(false)
  const [error, setError] = useState('')
  const [thumbnailPreview, setThumbnailPreview] = useState('')

  const detectVideoType = (url: string): VideoType => {
    if (url.includes('youtube.com') || url.includes('youtu.be')) {
      return 'youtube'
    } else if (url.includes('tiktok.com')) {
      return 'tiktok'
    } else if (url.includes('instagram.com')) {
      return 'instagram'
    }
    return 'youtube'
  }

  const handleUrlChange = (url: string) => {
    setVideoUrl(url)

    // Auto-detect video type
    const type = detectVideoType(url)
    setVideoType(type)

    // Generate thumbnail preview for YouTube
    if (type === 'youtube') {
      const videoId = getYouTubeVideoId(url)
      if (videoId) {
        setThumbnailPreview(getYouTubeThumbnail(url))
      } else {
        setThumbnailPreview('')
      }
    } else {
      setThumbnailPreview('')
    }

    setError('')
  }

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()

    if (!videoUrl.trim()) {
      setError('Please enter a video URL')
      return
    }

    if (!title.trim()) {
      setError('Please enter a title')
      return
    }

    // Validate URL
    const urlPattern = /^(https?:\/\/)?(www\.)?(youtube\.com|youtu\.be|tiktok\.com|instagram\.com)/
    if (!urlPattern.test(videoUrl)) {
      setError('Please enter a valid YouTube, TikTok, or Instagram URL')
      return
    }

    setSaving(true)
    setError('')

    try {
      // Get thumbnail URL
      let thumbnailUrl = null
      if (videoType === 'youtube') {
        thumbnailUrl = getYouTubeThumbnail(videoUrl)
      }

      // Parse destinations
      const destinationList = destinations
        .split(',')
        .map(d => d.trim())
        .filter(Boolean)

      // Create video entry
      const { error: videoError } = await supabase
        .from('creator_videos')
        .insert({
          creator_id: userId,
          title,
          description: description || null,
          video_url: videoUrl,
          video_type: videoType,
          thumbnail_url: thumbnailUrl,
          location: location || null,
          destinations: destinationList.length > 0 ? destinationList : null,
          views: 0,
          likes: 0,
          saves: 0,
          shares: 0,
          is_featured: false,
          is_active: true,
        })

      if (videoError) throw videoError

      onSuccess()
      onClose()
    } catch (err: any) {
      console.error('Error creating video:', err)
      setError(err.message || 'Failed to add video')
    } finally {
      setSaving(false)
    }
  }

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4">
      {/* Backdrop */}
      <div
        className="absolute inset-0 bg-black/60 backdrop-blur-sm"
        onClick={onClose}
      />

      {/* Modal */}
      <div className="relative bg-white dark:bg-gray-900 rounded-2xl w-full max-w-lg max-h-[90vh] overflow-hidden shadow-2xl">
        {/* Header */}
        <div className="flex items-center justify-between px-6 py-4 border-b border-gray-200 dark:border-gray-800">
          <h2 className="text-lg font-semibold text-gray-900 dark:text-white">
            Add Video
          </h2>
          <button
            onClick={onClose}
            className="p-2 hover:bg-gray-100 dark:hover:bg-gray-800 rounded-full transition-colors"
          >
            <X className="w-5 h-5 text-gray-500 dark:text-gray-400" />
          </button>
        </div>

        {/* Form */}
        <form onSubmit={handleSubmit} className="p-6 overflow-y-auto max-h-[calc(90vh-8rem)]">
          {/* Error */}
          {error && (
            <div className="mb-4 p-3 bg-red-50 dark:bg-red-900/30 border border-red-200 dark:border-red-800 rounded-lg">
              <p className="text-sm text-red-600 dark:text-red-400">{error}</p>
            </div>
          )}

          {/* Video URL */}
          <div className="mb-4">
            <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">
              Video URL *
            </label>
            <div className="relative">
              <LinkIcon className="absolute left-3 top-1/2 -translate-y-1/2 w-5 h-5 text-gray-400" />
              <input
                type="url"
                value={videoUrl}
                onChange={(e) => handleUrlChange(e.target.value)}
                placeholder="Paste YouTube, TikTok, or Instagram URL"
                className="w-full pl-10 pr-4 py-2.5 bg-gray-50 dark:bg-gray-800 border border-gray-200 dark:border-gray-700 rounded-lg text-gray-900 dark:text-white placeholder-gray-400 focus:ring-2 focus:ring-teal-500 focus:border-transparent transition-all"
              />
            </div>
            <p className="text-xs text-gray-500 dark:text-gray-400 mt-1">
              Supports YouTube, TikTok, and Instagram videos
            </p>
          </div>

          {/* Thumbnail Preview */}
          {thumbnailPreview && (
            <div className="mb-4">
              <div className="relative aspect-video rounded-lg overflow-hidden bg-gray-100 dark:bg-gray-800">
                <img
                  src={thumbnailPreview}
                  alt="Video thumbnail"
                  className="w-full h-full object-cover"
                />
                <div className="absolute inset-0 flex items-center justify-center">
                  <div className="w-16 h-16 bg-black/50 backdrop-blur-sm rounded-full flex items-center justify-center">
                    <Play className="w-8 h-8 text-white fill-white ml-1" />
                  </div>
                </div>
                <div className="absolute top-2 right-2 px-2 py-1 bg-black/70 rounded text-xs text-white capitalize">
                  {videoType}
                </div>
              </div>
            </div>
          )}

          {/* Title */}
          <div className="mb-4">
            <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">
              Title *
            </label>
            <input
              type="text"
              value={title}
              onChange={(e) => setTitle(e.target.value)}
              placeholder="Give your video a title"
              maxLength={100}
              className="w-full px-4 py-2.5 bg-gray-50 dark:bg-gray-800 border border-gray-200 dark:border-gray-700 rounded-lg text-gray-900 dark:text-white placeholder-gray-400 focus:ring-2 focus:ring-teal-500 focus:border-transparent transition-all"
            />
          </div>

          {/* Description */}
          <div className="mb-4">
            <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">
              Description
            </label>
            <textarea
              value={description}
              onChange={(e) => setDescription(e.target.value)}
              placeholder="What's this video about?"
              rows={3}
              maxLength={500}
              className="w-full px-4 py-2.5 bg-gray-50 dark:bg-gray-800 border border-gray-200 dark:border-gray-700 rounded-lg text-gray-900 dark:text-white placeholder-gray-400 focus:ring-2 focus:ring-teal-500 focus:border-transparent transition-all resize-none"
            />
          </div>

          {/* Location */}
          <div className="mb-4">
            <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">
              Location
            </label>
            <div className="relative">
              <MapPin className="absolute left-3 top-1/2 -translate-y-1/2 w-5 h-5 text-gray-400" />
              <input
                type="text"
                value={location}
                onChange={(e) => setLocation(e.target.value)}
                placeholder="Where was this filmed?"
                className="w-full pl-10 pr-4 py-2.5 bg-gray-50 dark:bg-gray-800 border border-gray-200 dark:border-gray-700 rounded-lg text-gray-900 dark:text-white placeholder-gray-400 focus:ring-2 focus:ring-teal-500 focus:border-transparent transition-all"
              />
            </div>
          </div>

          {/* Destinations */}
          <div className="mb-6">
            <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">
              Destinations Featured
            </label>
            <input
              type="text"
              value={destinations}
              onChange={(e) => setDestinations(e.target.value)}
              placeholder="Boracay, Palawan, Siargao (comma separated)"
              className="w-full px-4 py-2.5 bg-gray-50 dark:bg-gray-800 border border-gray-200 dark:border-gray-700 rounded-lg text-gray-900 dark:text-white placeholder-gray-400 focus:ring-2 focus:ring-teal-500 focus:border-transparent transition-all"
            />
            <p className="text-xs text-gray-500 dark:text-gray-400 mt-1">
              Helps travelers discover your video when exploring destinations
            </p>
          </div>

          {/* Actions */}
          <div className="flex gap-3">
            <button
              type="button"
              onClick={onClose}
              className="flex-1 py-2.5 px-4 bg-gray-100 dark:bg-gray-800 text-gray-700 dark:text-gray-300 font-medium rounded-lg hover:bg-gray-200 dark:hover:bg-gray-700 transition-colors"
            >
              Cancel
            </button>
            <button
              type="submit"
              disabled={saving || !videoUrl.trim() || !title.trim()}
              className="flex-1 py-2.5 px-4 bg-teal-500 text-white font-medium rounded-lg hover:bg-teal-600 transition-colors disabled:opacity-50 disabled:cursor-not-allowed flex items-center justify-center gap-2"
            >
              {saving ? (
                <>
                  <Loader2 className="w-4 h-4 animate-spin" />
                  Adding...
                </>
              ) : (
                'Add Video'
              )}
            </button>
          </div>
        </form>
      </div>
    </div>
  )
}
