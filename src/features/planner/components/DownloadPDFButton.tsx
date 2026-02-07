'use client'

import { useState } from 'react'
import { Download, Loader2 } from 'lucide-react'
import { Itinerary, ItineraryDay, ItineraryActivity } from '@/types/database'
import { downloadItineraryPDF } from './ItineraryPDF'

interface DownloadPDFButtonProps {
  itinerary: Itinerary
  days: ItineraryDay[]
  activities: ItineraryActivity[]
  travelers?: number
  variant?: 'primary' | 'secondary' | 'ghost'
  size?: 'sm' | 'md' | 'lg'
  className?: string
}

export default function DownloadPDFButton({
  itinerary,
  days,
  activities,
  travelers = 1,
  variant = 'secondary',
  size = 'md',
  className = '',
}: DownloadPDFButtonProps) {
  const [downloading, setDownloading] = useState(false)

  const handleDownload = async () => {
    setDownloading(true)
    try {
      await downloadItineraryPDF(itinerary, days, activities, travelers)
    } catch (error) {
      console.error('Failed to generate PDF:', error)
      alert('Failed to generate PDF. Please try again.')
    } finally {
      setDownloading(false)
    }
  }

  const sizeClasses = {
    sm: 'px-3 py-1.5 text-sm gap-1.5',
    md: 'px-4 py-2 text-sm gap-2',
    lg: 'px-6 py-3 text-base gap-2',
  }

  const variantClasses = {
    primary:
      'bg-teal-500 text-white hover:bg-teal-600 disabled:bg-teal-300',
    secondary:
      'bg-gray-100 dark:bg-gray-800 text-gray-700 dark:text-gray-300 hover:bg-gray-200 dark:hover:bg-gray-700',
    ghost:
      'text-gray-600 dark:text-gray-400 hover:bg-gray-100 dark:hover:bg-gray-800',
  }

  return (
    <button
      onClick={handleDownload}
      disabled={downloading}
      className={`
        inline-flex items-center justify-center font-medium rounded-lg transition-colors
        disabled:opacity-50 disabled:cursor-not-allowed
        ${sizeClasses[size]}
        ${variantClasses[variant]}
        ${className}
      `}
    >
      {downloading ? (
        <>
          <Loader2 className="w-4 h-4 animate-spin" />
          <span>Generating...</span>
        </>
      ) : (
        <>
          <Download className="w-4 h-4" />
          <span>Download PDF</span>
        </>
      )}
    </button>
  )
}
