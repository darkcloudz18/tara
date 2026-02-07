'use client'

import { useState, useEffect, useCallback } from 'react'

const ONBOARDING_KEY = 'tara-onboarding-completed'
const FEATURE_TOOLTIPS_KEY = 'tara-feature-tooltips-shown'

export interface OnboardingState {
  hasCompletedOnboarding: boolean
  shownTooltips: string[]
}

export function useOnboarding() {
  const [hasCompletedOnboarding, setHasCompletedOnboarding] = useState(true)
  const [shownTooltips, setShownTooltips] = useState<string[]>([])
  const [isLoading, setIsLoading] = useState(true)

  // Load state from localStorage
  useEffect(() => {
    if (typeof window === 'undefined') return

    try {
      const completed = localStorage.getItem(ONBOARDING_KEY)
      const tooltips = localStorage.getItem(FEATURE_TOOLTIPS_KEY)

      setHasCompletedOnboarding(completed === 'true')
      setShownTooltips(tooltips ? JSON.parse(tooltips) : [])
    } catch (err) {
      console.error('Error loading onboarding state:', err)
    } finally {
      setIsLoading(false)
    }
  }, [])

  // Complete onboarding
  const completeOnboarding = useCallback(() => {
    if (typeof window === 'undefined') return

    localStorage.setItem(ONBOARDING_KEY, 'true')
    setHasCompletedOnboarding(true)
  }, [])

  // Reset onboarding (for testing)
  const resetOnboarding = useCallback(() => {
    if (typeof window === 'undefined') return

    localStorage.removeItem(ONBOARDING_KEY)
    localStorage.removeItem(FEATURE_TOOLTIPS_KEY)
    setHasCompletedOnboarding(false)
    setShownTooltips([])
  }, [])

  // Check if a tooltip has been shown
  const hasShownTooltip = useCallback((tooltipId: string) => {
    return shownTooltips.includes(tooltipId)
  }, [shownTooltips])

  // Mark a tooltip as shown
  const markTooltipShown = useCallback((tooltipId: string) => {
    if (typeof window === 'undefined') return

    setShownTooltips((prev) => {
      if (prev.includes(tooltipId)) return prev
      const updated = [...prev, tooltipId]
      localStorage.setItem(FEATURE_TOOLTIPS_KEY, JSON.stringify(updated))
      return updated
    })
  }, [])

  // Show onboarding if first visit
  const shouldShowOnboarding = !isLoading && !hasCompletedOnboarding

  return {
    isLoading,
    hasCompletedOnboarding,
    shouldShowOnboarding,
    completeOnboarding,
    resetOnboarding,
    hasShownTooltip,
    markTooltipShown,
    shownTooltips,
  }
}
