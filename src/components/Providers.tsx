'use client'

import { useEffect } from 'react'
import { ThemeProvider } from '@/contexts/ThemeContext'
import { ToastProvider } from '@/contexts/ToastContext'
import { UserProvider } from '@/contexts/UserContext'
import InstallPrompt from '@/components/pwa/InstallPrompt'
import { WelcomeModal } from '@/features/onboarding'
import { getSupabase } from '@/lib/supabase'
import { claimAnonBucket } from '@/lib/claimBucket'
import { initAnalytics, identifyUser, resetAnalytics } from '@/lib/analytics'

export default function Providers({ children }: { children: React.ReactNode }) {
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
          claimAnonBucket(session.user.id).catch((err) => {
            console.error('claimAnonBucket failed:', err)
          })
          identifyUser(session.user.id, session.user.email ?? undefined)
        } else if (event === 'SIGNED_OUT') {
          resetAnalytics()
        }
      }
    )
    return () => subscription.unsubscribe()
  }, [])

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
