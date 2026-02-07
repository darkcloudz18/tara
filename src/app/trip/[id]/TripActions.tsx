'use client'

import { useState } from 'react'
import { Share2, Download, Loader2 } from 'lucide-react'
import { downloadItineraryPDF } from '@/features/planner/components/ItineraryPDF'

interface TripActionsProps {
  tripId: string
  title: string
  itinerary: any
  days: any[]
  activities: any[]
}

export default function TripActions({
  tripId,
  title,
  itinerary,
  days,
  activities,
}: TripActionsProps) {
  const [downloading, setDownloading] = useState(false)

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
        // User cancelled or error
      }
    } else {
      try {
        await navigator.clipboard.writeText(shareUrl)
        alert('Link copied to clipboard!')
      } catch (err) {
        prompt('Copy this link:', shareUrl)
      }
    }
  }

  const handleDownload = async () => {
    setDownloading(true)
    try {
      await downloadItineraryPDF(itinerary, days, activities)
    } catch (error) {
      console.error('Failed to generate PDF:', error)
      alert('Failed to generate PDF. Please try again.')
    } finally {
      setDownloading(false)
    }
  }

  return (
    <div className="flex flex-col sm:flex-row gap-3">
      <button
        onClick={handleShare}
        className="inline-flex items-center justify-center gap-2 px-6 py-3 bg-white/10 text-white font-semibold rounded-xl hover:bg-white/20 transition-colors backdrop-blur-sm border border-white/20"
      >
        <Share2 className="w-5 h-5" />
        Share Trip
      </button>
      <button
        onClick={handleDownload}
        disabled={downloading}
        className="inline-flex items-center justify-center gap-2 px-6 py-3 bg-white/10 text-white font-semibold rounded-xl hover:bg-white/20 transition-colors backdrop-blur-sm border border-white/20 disabled:opacity-50"
      >
        {downloading ? (
          <>
            <Loader2 className="w-5 h-5 animate-spin" />
            Generating...
          </>
        ) : (
          <>
            <Download className="w-5 h-5" />
            Download PDF
          </>
        )}
      </button>
    </div>
  )
}
