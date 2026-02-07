'use client'

import { useState, useEffect, useRef } from 'react'
import { X } from 'lucide-react'
import { useOnboarding } from '@/hooks/useOnboarding'

type TooltipPosition = 'top' | 'bottom' | 'left' | 'right'

interface FeatureTooltipProps {
  id: string
  title: string
  description: string
  position?: TooltipPosition
  targetRef?: React.RefObject<HTMLElement>
  show?: boolean
  onDismiss?: () => void
  children?: React.ReactNode
}

const positionStyles: Record<TooltipPosition, string> = {
  top: 'bottom-full left-1/2 -translate-x-1/2 mb-2',
  bottom: 'top-full left-1/2 -translate-x-1/2 mt-2',
  left: 'right-full top-1/2 -translate-y-1/2 mr-2',
  right: 'left-full top-1/2 -translate-y-1/2 ml-2',
}

const arrowStyles: Record<TooltipPosition, string> = {
  top: 'top-full left-1/2 -translate-x-1/2 border-l-8 border-r-8 border-t-8 border-l-transparent border-r-transparent border-t-gray-900',
  bottom: 'bottom-full left-1/2 -translate-x-1/2 border-l-8 border-r-8 border-b-8 border-l-transparent border-r-transparent border-b-gray-900',
  left: 'left-full top-1/2 -translate-y-1/2 border-t-8 border-b-8 border-l-8 border-t-transparent border-b-transparent border-l-gray-900',
  right: 'right-full top-1/2 -translate-y-1/2 border-t-8 border-b-8 border-r-8 border-t-transparent border-b-transparent border-r-gray-900',
}

export default function FeatureTooltip({
  id,
  title,
  description,
  position = 'bottom',
  show,
  onDismiss,
  children,
}: FeatureTooltipProps) {
  const { hasShownTooltip, markTooltipShown, hasCompletedOnboarding } = useOnboarding()
  const [isVisible, setIsVisible] = useState(false)
  const tooltipRef = useRef<HTMLDivElement>(null)

  // Determine visibility
  useEffect(() => {
    // Only show after onboarding and if not already shown
    if (!hasCompletedOnboarding || hasShownTooltip(id)) {
      setIsVisible(false)
      return
    }

    // If show prop is provided, use it
    if (show !== undefined) {
      setIsVisible(show)
      return
    }

    // Otherwise show after a delay
    const timer = setTimeout(() => {
      setIsVisible(true)
    }, 1000)

    return () => clearTimeout(timer)
  }, [id, hasShownTooltip, hasCompletedOnboarding, show])

  const handleDismiss = () => {
    setIsVisible(false)
    markTooltipShown(id)
    onDismiss?.()
  }

  // Auto-dismiss after 10 seconds
  useEffect(() => {
    if (!isVisible) return

    const timer = setTimeout(() => {
      handleDismiss()
    }, 10000)

    return () => clearTimeout(timer)
  }, [isVisible])

  if (!isVisible) {
    return <>{children}</>
  }

  return (
    <div className="relative inline-block">
      {children}
      <div
        ref={tooltipRef}
        className={`absolute z-50 ${positionStyles[position]} animate-scale-in`}
        role="tooltip"
      >
        <div className="relative bg-gray-900 text-white rounded-lg shadow-xl p-4 max-w-xs">
          {/* Close button */}
          <button
            onClick={handleDismiss}
            className="absolute top-2 right-2 p-1 text-gray-400 hover:text-white"
            aria-label="Dismiss tooltip"
          >
            <X className="w-4 h-4" />
          </button>

          {/* Content */}
          <h4 className="font-semibold text-sm mb-1 pr-6">{title}</h4>
          <p className="text-xs text-gray-300">{description}</p>

          {/* Got it button */}
          <button
            onClick={handleDismiss}
            className="mt-3 text-xs font-medium text-teal-400 hover:text-teal-300"
          >
            Got it
          </button>

          {/* Arrow */}
          <div className={`absolute ${arrowStyles[position]} w-0 h-0`} />
        </div>
      </div>
    </div>
  )
}
