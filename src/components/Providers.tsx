'use client'

import { useEffect } from 'react'
import { useRouter } from 'next/navigation'
import { ThemeProvider } from '@/contexts/ThemeContext'
import { ToastProvider } from '@/contexts/ToastContext'
import { UserProvider } from '@/contexts/UserContext'
import InstallPrompt from '@/components/pwa/InstallPrompt'
import { WelcomeModal } from '@/features/onboarding'
import { getSupabase } from '@/lib/supabase'
import { claimAnonBucket } from '@/lib/claimBucket'
import { initAnalytics, identifyUser, resetAnalytics, capture } from '@/lib/analytics'
import {
  createDatedLakadFromBucket,
  readPendingDates,
  clearPendingDates,
} from '@/features/planner/services/datedLakadService'
import { writeCachedTripSummary } from '@/lib/tripCache'

export default function Providers({ children }: { children: React.ReactNode }) {
  const router = useRouter()

  useEffect(() => {
    // Increment once per session (tab lifetime). SessionStorage guard
    // survives React StrictMode's dev-time effect double-invocation,
    // which would otherwise count every load as two visits.
    if (sessionStorage.getItem('tara-visit-counted')) return
    sessionStorage.setItem('tara-visit-counted', '1')
    const visits = parseInt(localStorage.getItem('tara-visit-count') || '0', 10)
    localStorage.setItem('tara-visit-count', String(visits + 1))
  }, [])

  // Analytics init + auth-boundary bookkeeping. One subscription drives
  // both claimAnonBucket (merge anon rows) and identify (fold the anon
  // distinct_id into the user in PostHog). SIGNED_OUT clears PostHog so
  // the next anonymous session gets a fresh identity.
  useEffect(() => {
    initAnalytics()

    const { data: { subscription } } = getSupabase().auth.onAuthStateChange(
      (event, session) => {
        if (event === 'SIGNED_IN' && session?.user) {
          identifyUser(session.user.id, session.user.email ?? undefined)
          // Sequenced: claim anon bucket rows first so the freshly-signed-in
          // user actually owns those items, THEN resume the pending dated
          // lakad flow if the user left one queued before signup. Running
          // in parallel would race — the lakad creation would read an
          // empty bucket if claim hasn't landed yet.
          void (async () => {
            try {
              await claimAnonBucket(session.user.id)
            } catch (err) {
              console.error('claimAnonBucket failed:', err)
            }
            const pending = readPendingDates()
            if (!pending) return
            try {
              const result = await createDatedLakadFromBucket(
                pending.startDate,
                pending.endDate
              )
              clearPendingDates()
              capture('bucket_dated', {
                itemCount: result.itemCount,
                daysUntilTrip: result.daysUntilTrip,
                durationDays: result.durationDays,
                wasAnonymous: true,
              })
              router.push(`/trip/${result.itineraryId}/edit`)
            } catch (err) {
              console.error('pending dated lakad resume failed:', err)
              clearPendingDates()
            }
          })()
        } else if (event === 'SIGNED_OUT') {
          resetAnalytics()
          // Clear personalized caches so the next visitor (or the same
          // user signing back in on a shared machine) doesn't see stale
          // hero content before the fresh fetch resolves.
          writeCachedTripSummary(null)
        }
      }
    )
    return () => subscription.unsubscribe()
  }, [router])

  return (
    <ThemeProvider>
      <ToastProvider>
        <UserProvider>
          {children}
          <WelcomeModal />
          <InstallPrompt />
        </UserProvider>
      </ToastProvider>
    </ThemeProvider>
  )
}
