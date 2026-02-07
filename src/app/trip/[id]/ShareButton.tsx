'use client'

import { Share2 } from 'lucide-react'

interface ShareButtonProps {
  tripId: string
  title: string
}

export default function ShareButton({ tripId, title }: ShareButtonProps) {
  const handleShare = async () => {
    const shareUrl = `${window.location.origin}/trip/${tripId}`

    if (navigator.share) {
      try {
        await navigator.share({
          title: `${title} | Tara`,
          text: `Check out this trip itinerary: ${title}`,
          url: shareUrl,
        })
      } catch (err) {
        // User cancelled or error - ignore
      }
    } else {
      // Fallback: copy to clipboard
      try {
        await navigator.clipboard.writeText(shareUrl)
        alert('Link copied to clipboard!')
      } catch (err) {
        // Fallback for older browsers
        prompt('Copy this link:', shareUrl)
      }
    }
  }

  return (
    <button
      onClick={handleShare}
      className="inline-flex items-center justify-center gap-2 px-6 py-3 bg-white/10 text-white font-semibold rounded-xl hover:bg-white/20 transition-colors backdrop-blur-sm border border-white/20"
    >
      <Share2 className="w-5 h-5" />
      Share Trip
    </button>
  )
}
