'use client'

import { useState } from 'react'
import {
  X,
  Link2,
  MessageCircle,
  Twitter,
  Facebook,
  Copy,
  Check,
  ExternalLink,
  Image,
} from 'lucide-react'
import { Itinerary } from '@/types/database'
import { useToast } from '@/contexts/ToastContext'

interface SharePreviewProps {
  isOpen: boolean
  onClose: () => void
  itinerary: Itinerary
}

export default function SharePreview({ isOpen, onClose, itinerary }: SharePreviewProps) {
  const { success } = useToast()
  const [copied, setCopied] = useState(false)

  if (!isOpen) return null

  const shareUrl = `${typeof window !== 'undefined' ? window.location.origin : ''}/trip/${itinerary.id}`
  const destination = itinerary.destinations?.[0] || 'Philippines'

  // Calculate trip duration
  const startDate = new Date(itinerary.start_date)
  const endDate = new Date(itinerary.end_date)
  const duration = Math.ceil((endDate.getTime() - startDate.getTime()) / (1000 * 60 * 60 * 24)) + 1

  // Generate share text
  const shareText = `Check out my ${duration}-day trip to ${destination}! 🌴✈️\n\n${itinerary.title}\n\nPlanned with Tara - the free trip planner for the Philippines`

  const handleCopyLink = async () => {
    try {
      await navigator.clipboard.writeText(shareUrl)
      setCopied(true)
      success('Link copied to clipboard!')
      setTimeout(() => setCopied(false), 2000)
    } catch (err) {
      console.error('Failed to copy:', err)
    }
  }

  const handleCopyText = async () => {
    try {
      await navigator.clipboard.writeText(`${shareText}\n\n${shareUrl}`)
      success('Share text copied!')
    } catch (err) {
      console.error('Failed to copy:', err)
    }
  }

  const socialLinks = {
    twitter: `https://twitter.com/intent/tweet?text=${encodeURIComponent(shareText)}&url=${encodeURIComponent(shareUrl)}`,
    facebook: `https://www.facebook.com/sharer/sharer.php?u=${encodeURIComponent(shareUrl)}`,
    whatsapp: `https://wa.me/?text=${encodeURIComponent(`${shareText}\n\n${shareUrl}`)}`,
    messenger: `https://www.facebook.com/dialog/send?link=${encodeURIComponent(shareUrl)}&app_id=YOUR_APP_ID`,
  }

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/60 backdrop-blur-sm animate-fade-in">
      <div className="relative w-full max-w-lg mx-4 bg-white dark:bg-gray-900 rounded-2xl shadow-2xl overflow-hidden animate-scale-in">
        {/* Header */}
        <div className="flex items-center justify-between px-6 py-4 border-b border-gray-200 dark:border-gray-800">
          <h2 className="text-lg font-semibold text-gray-900 dark:text-white">
            Share Trip
          </h2>
          <button
            onClick={onClose}
            className="p-2 text-gray-400 hover:text-gray-600 dark:hover:text-gray-300 rounded-lg hover:bg-gray-100 dark:hover:bg-gray-800"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        {/* OG Image Preview */}
        <div className="px-6 py-4">
          <p className="text-sm text-gray-500 dark:text-gray-400 mb-3">
            Link Preview
          </p>
          <div className="border border-gray-200 dark:border-gray-700 rounded-xl overflow-hidden">
            {/* Preview card mimicking social media */}
            <div className="bg-gradient-to-br from-teal-500 to-blue-600 p-6 text-white">
              <p className="text-sm font-medium text-teal-100 mb-2">
                {duration}-Day Trip
              </p>
              <h3 className="text-xl font-bold mb-1">{itinerary.title}</h3>
              <p className="text-teal-100 text-sm flex items-center gap-1">
                📍 {destination}
              </p>
            </div>
            <div className="bg-gray-50 dark:bg-gray-800 px-4 py-3">
              <p className="text-xs text-gray-500 dark:text-gray-400 truncate">
                {shareUrl}
              </p>
            </div>
          </div>
          <a
            href={`/trip/${itinerary.id}/opengraph-image`}
            target="_blank"
            rel="noopener noreferrer"
            className="mt-2 text-xs text-teal-600 dark:text-teal-400 flex items-center gap-1 hover:underline"
          >
            <Image className="w-3 h-3" />
            View full OG image
          </a>
        </div>

        {/* Share Link */}
        <div className="px-6 pb-4">
          <p className="text-sm text-gray-500 dark:text-gray-400 mb-2">
            Share Link
          </p>
          <div className="flex gap-2">
            <div className="flex-1 flex items-center gap-2 px-3 py-2 bg-gray-100 dark:bg-gray-800 rounded-lg overflow-hidden">
              <Link2 className="w-4 h-4 text-gray-400 flex-shrink-0" />
              <span className="text-sm text-gray-700 dark:text-gray-300 truncate">
                {shareUrl}
              </span>
            </div>
            <button
              onClick={handleCopyLink}
              className="flex items-center gap-2 px-4 py-2 bg-teal-600 hover:bg-teal-700 text-white rounded-lg font-medium transition-colors"
            >
              {copied ? (
                <>
                  <Check className="w-4 h-4" />
                  Copied
                </>
              ) : (
                <>
                  <Copy className="w-4 h-4" />
                  Copy
                </>
              )}
            </button>
          </div>
        </div>

        {/* Suggested Share Text */}
        <div className="px-6 pb-4">
          <div className="flex items-center justify-between mb-2">
            <p className="text-sm text-gray-500 dark:text-gray-400">
              Suggested Caption
            </p>
            <button
              onClick={handleCopyText}
              className="text-xs text-teal-600 dark:text-teal-400 hover:underline flex items-center gap-1"
            >
              <Copy className="w-3 h-3" />
              Copy text
            </button>
          </div>
          <div className="p-3 bg-gray-50 dark:bg-gray-800 rounded-lg text-sm text-gray-700 dark:text-gray-300 whitespace-pre-line">
            {shareText}
          </div>
        </div>

        {/* Social Share Buttons */}
        <div className="px-6 pb-6">
          <p className="text-sm text-gray-500 dark:text-gray-400 mb-3">
            Share on Social Media
          </p>
          <div className="flex gap-3">
            <a
              href={socialLinks.twitter}
              target="_blank"
              rel="noopener noreferrer"
              className="flex-1 flex items-center justify-center gap-2 py-2.5 bg-black text-white rounded-lg hover:bg-gray-800 transition-colors"
            >
              <Twitter className="w-4 h-4" />
              <span className="text-sm font-medium">Twitter</span>
            </a>
            <a
              href={socialLinks.facebook}
              target="_blank"
              rel="noopener noreferrer"
              className="flex-1 flex items-center justify-center gap-2 py-2.5 bg-blue-600 text-white rounded-lg hover:bg-blue-700 transition-colors"
            >
              <Facebook className="w-4 h-4" />
              <span className="text-sm font-medium">Facebook</span>
            </a>
            <a
              href={socialLinks.whatsapp}
              target="_blank"
              rel="noopener noreferrer"
              className="flex-1 flex items-center justify-center gap-2 py-2.5 bg-green-500 text-white rounded-lg hover:bg-green-600 transition-colors"
            >
              <MessageCircle className="w-4 h-4" />
              <span className="text-sm font-medium">WhatsApp</span>
            </a>
          </div>
        </div>

        {/* Open in new tab */}
        <div className="px-6 pb-6 pt-4 border-t border-gray-200 dark:border-gray-800">
          <a
            href={shareUrl}
            target="_blank"
            rel="noopener noreferrer"
            className="flex items-center justify-center gap-2 text-sm text-gray-600 dark:text-gray-400 hover:text-teal-600 dark:hover:text-teal-400"
          >
            <ExternalLink className="w-4 h-4" />
            Open trip page in new tab
          </a>
        </div>
      </div>
    </div>
  )
}
