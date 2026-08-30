import posthog from 'posthog-js'
import { getAnonId } from './anonId'

let initialized = false

// Boots PostHog once per browser session. Silent no-op if the key isn't
// configured — safe to ship the wire-up without an active account.
export function initAnalytics(): void {
  if (initialized || typeof window === 'undefined') return
  const key = process.env.NEXT_PUBLIC_POSTHOG_KEY
  if (!key) return

  posthog.init(key, {
    api_host: process.env.NEXT_PUBLIC_POSTHOG_HOST || 'https://us.i.posthog.com',
    person_profiles: 'identified_only',
    bootstrap: { distinctID: getAnonId() },
    capture_pageview: true,
    capture_pageleave: true,
  })
  initialized = true
}

export function identifyUser(userId: string, email?: string): void {
  if (!initialized) return
  posthog.identify(userId, email ? { email } : undefined)
}

export function resetAnalytics(): void {
  if (!initialized) return
  posthog.reset()
}

export function capture(event: string, props?: Record<string, unknown>): void {
  if (!initialized) return
  posthog.capture(event, props)
}
