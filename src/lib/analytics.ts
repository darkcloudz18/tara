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
    // advanced_disable_decide: skips the remote /decide fetch that
    // was hanging in this project, leaving __loaded undefined and
    // silently swallowing every capture() call. We don't use PostHog
    // feature flags or A/B tests, so /decide contributes nothing.
    advanced_disable_decide: true,
    // Assign window.posthog once the SDK actually finishes async
    // init. Makes debugging in the browser console reliable.
    loaded: (ph) => {
      ;(window as any).posthog = ph
    },
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
