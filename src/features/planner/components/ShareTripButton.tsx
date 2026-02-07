'use client'

import { useState } from 'react'
import { Share2, Copy, Check, Globe, Lock, ExternalLink } from 'lucide-react'
import { itineraryService } from '../services/itineraryService'

interface ShareTripButtonProps {
  itineraryId: string
  isPublic: boolean
  onVisibilityChange?: (isPublic: boolean) => void
}

export default function ShareTripButton({
  itineraryId,
  isPublic,
  onVisibilityChange,
}: ShareTripButtonProps) {
  const [showModal, setShowModal] = useState(false)
  const [isPublicState, setIsPublicState] = useState(isPublic)
  const [copying, setCopying] = useState(false)
  const [copied, setCopied] = useState(false)
  const [toggling, setToggling] = useState(false)

  const shareUrl = typeof window !== 'undefined'
    ? `${window.location.origin}/trip/${itineraryId}`
    : `/trip/${itineraryId}`

  const handleTogglePublic = async () => {
    setToggling(true)
    try {
      if (isPublicState) {
        await itineraryService.makePrivate(itineraryId)
        setIsPublicState(false)
        onVisibilityChange?.(false)
      } else {
        await itineraryService.makePublic(itineraryId)
        setIsPublicState(true)
        onVisibilityChange?.(true)
      }
    } catch (error) {
      console.error('Failed to toggle visibility:', error)
    } finally {
      setToggling(false)
    }
  }

  const handleCopyLink = async () => {
    setCopying(true)
    try {
      await navigator.clipboard.writeText(shareUrl)
      setCopied(true)
      setTimeout(() => setCopied(false), 2000)
    } catch (error) {
      // Fallback
      prompt('Copy this link:', shareUrl)
    } finally {
      setCopying(false)
    }
  }

  const handleNativeShare = async () => {
    if (navigator.share) {
      try {
        await navigator.share({
          title: 'Check out my trip itinerary!',
          text: 'I planned this trip with Tara',
          url: shareUrl,
        })
      } catch (error) {
        // User cancelled or error
      }
    }
  }

  return (
    <>
      <button
        onClick={() => setShowModal(true)}
        className="btn-secondary flex items-center gap-1"
      >
        <Share2 className="w-4 h-4" />
        Share
      </button>

      {/* Share Modal */}
      {showModal && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/50 backdrop-blur-sm p-4">
          <div className="bg-white dark:bg-gray-900 rounded-2xl max-w-md w-full p-6 shadow-xl">
            {/* Header */}
            <div className="flex items-center justify-between mb-6">
              <h2 className="text-xl font-bold text-gray-900 dark:text-white">Share Trip</h2>
              <button
                onClick={() => setShowModal(false)}
                className="p-2 hover:bg-gray-100 dark:hover:bg-gray-800 rounded-lg transition-colors"
              >
                <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
                </svg>
              </button>
            </div>

            {/* Visibility Toggle */}
            <div className="mb-6">
              <div className="flex items-center justify-between p-4 bg-gray-50 dark:bg-gray-800 rounded-xl">
                <div className="flex items-center gap-3">
                  {isPublicState ? (
                    <div className="w-10 h-10 bg-teal-100 dark:bg-teal-900 rounded-lg flex items-center justify-center">
                      <Globe className="w-5 h-5 text-teal-600 dark:text-teal-400" />
                    </div>
                  ) : (
                    <div className="w-10 h-10 bg-gray-200 dark:bg-gray-700 rounded-lg flex items-center justify-center">
                      <Lock className="w-5 h-5 text-gray-500 dark:text-gray-400" />
                    </div>
                  )}
                  <div>
                    <p className="font-medium text-gray-900 dark:text-white">
                      {isPublicState ? 'Public' : 'Private'}
                    </p>
                    <p className="text-sm text-gray-500 dark:text-gray-400">
                      {isPublicState
                        ? 'Anyone with the link can view'
                        : 'Only you can see this trip'}
                    </p>
                  </div>
                </div>
                <button
                  onClick={handleTogglePublic}
                  disabled={toggling}
                  className={`relative w-12 h-7 rounded-full transition-colors ${
                    isPublicState ? 'bg-teal-500' : 'bg-gray-300 dark:bg-gray-600'
                  } ${toggling ? 'opacity-50' : ''}`}
                >
                  <span
                    className={`absolute top-1 w-5 h-5 bg-white rounded-full shadow transition-transform ${
                      isPublicState ? 'left-6' : 'left-1'
                    }`}
                  />
                </button>
              </div>
            </div>

            {/* Share Link */}
            {isPublicState && (
              <>
                <div className="mb-4">
                  <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
                    Share link
                  </label>
                  <div className="flex gap-2">
                    <input
                      type="text"
                      value={shareUrl}
                      readOnly
                      className="flex-1 px-4 py-2 bg-gray-50 dark:bg-gray-800 border border-gray-200 dark:border-gray-700 rounded-lg text-gray-900 dark:text-white text-sm"
                    />
                    <button
                      onClick={handleCopyLink}
                      disabled={copying}
                      className="px-4 py-2 bg-gray-100 dark:bg-gray-800 text-gray-700 dark:text-gray-300 rounded-lg hover:bg-gray-200 dark:hover:bg-gray-700 transition-colors flex items-center gap-2"
                    >
                      {copied ? (
                        <>
                          <Check className="w-4 h-4 text-teal-500" />
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

                {/* Share Actions */}
                <div className="grid grid-cols-2 gap-3">
                  {'share' in navigator && (
                    <button
                      onClick={handleNativeShare}
                      className="flex items-center justify-center gap-2 py-3 bg-teal-500 text-white font-semibold rounded-xl hover:bg-teal-600 transition-colors"
                    >
                      <Share2 className="w-5 h-5" />
                      Share
                    </button>
                  )}
                  <a
                    href={shareUrl}
                    target="_blank"
                    rel="noopener noreferrer"
                    className="flex items-center justify-center gap-2 py-3 bg-gray-100 dark:bg-gray-800 text-gray-700 dark:text-gray-300 font-semibold rounded-xl hover:bg-gray-200 dark:hover:bg-gray-700 transition-colors"
                  >
                    <ExternalLink className="w-5 h-5" />
                    Preview
                  </a>
                </div>

                {/* Social Share Hint */}
                <p className="mt-4 text-sm text-gray-500 dark:text-gray-400 text-center">
                  Share on social media — your friends will see a beautiful preview card!
                </p>
              </>
            )}

            {!isPublicState && (
              <p className="text-sm text-gray-500 dark:text-gray-400 text-center">
                Make your trip public to share it with others
              </p>
            )}
          </div>
        </div>
      )}
    </>
  )
}
