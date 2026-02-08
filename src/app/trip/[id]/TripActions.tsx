'use client'

import { useState, useEffect } from 'react'
import { useRouter } from 'next/navigation'
import { Share2, Download, Loader2, Copy, Check, CalendarPlus } from 'lucide-react'
import { downloadItineraryPDF } from '@/features/planner/components/ItineraryPDF'
import { generateICS, itineraryToEvents, downloadICS } from '@/lib/calendar'
import { itineraryService } from '@/features/planner/services/itineraryService'
import { supabase } from '@/lib/supabase'
import { useToast } from '@/contexts/ToastContext'

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
  const router = useRouter()
  const { success, error: showError } = useToast()
  const [downloading, setDownloading] = useState(false)
  const [copying, setCopying] = useState(false)
  const [copied, setCopied] = useState(false)
  const [user, setUser] = useState<any>(null)

  useEffect(() => {
    supabase.auth.getUser().then(({ data: { user } }) => {
      setUser(user)
    })
  }, [])

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
      showError('Failed to generate PDF. Please try again.')
    } finally {
      setDownloading(false)
    }
  }

  const handleCopy = async () => {
    if (!user) {
      router.push('/login?redirect=/trip/' + tripId)
      return
    }

    setCopying(true)
    try {
      const newItinerary = await itineraryService.copyItinerary(tripId, user.id)
      if (newItinerary) {
        setCopied(true)
        success('Trip copied to your itineraries!')
        setTimeout(() => {
          router.push(`/trip/${newItinerary.id}/edit`)
        }, 1500)
      } else {
        showError('Failed to copy trip. Please try again.')
      }
    } catch (error) {
      console.error('Failed to copy trip:', error)
      showError('Failed to copy trip. Please try again.')
    } finally {
      setCopying(false)
    }
  }

  const handleCalendarExport = () => {
    try {
      const events = itineraryToEvents(itinerary, days, activities)
      const icsContent = generateICS(events, itinerary.title)
      const filename = `${itinerary.title.replace(/[^a-z0-9]/gi, '-').toLowerCase()}-itinerary.ics`
      downloadICS(icsContent, filename)
      success('Calendar file downloaded!')
    } catch (error) {
      console.error('Failed to export calendar:', error)
      showError('Failed to export calendar. Please try again.')
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
      <button
        onClick={handleCalendarExport}
        className="inline-flex items-center justify-center gap-2 px-6 py-3 bg-white/10 text-white font-semibold rounded-xl hover:bg-white/20 transition-colors backdrop-blur-sm border border-white/20"
      >
        <CalendarPlus className="w-5 h-5" />
        Add to Calendar
      </button>
      <button
        onClick={handleCopy}
        disabled={copying || copied}
        className="inline-flex items-center justify-center gap-2 px-6 py-3 bg-teal-500 text-white font-semibold rounded-xl hover:bg-teal-600 transition-colors disabled:opacity-50"
      >
        {copied ? (
          <>
            <Check className="w-5 h-5" />
            Copied!
          </>
        ) : copying ? (
          <>
            <Loader2 className="w-5 h-5 animate-spin" />
            Copying...
          </>
        ) : (
          <>
            <Copy className="w-5 h-5" />
            Copy to My Trips
          </>
        )}
      </button>
    </div>
  )
}
