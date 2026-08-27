'use client'

import { useEffect } from 'react'
import { ThemeProvider } from '@/contexts/ThemeContext'
import { ToastProvider } from '@/contexts/ToastContext'
import { UserProvider } from '@/contexts/UserContext'
import InstallPrompt from '@/components/pwa/InstallPrompt'
import { WelcomeModal } from '@/features/onboarding'
import { getSupabase } from '@/lib/supabase'
import { claimAnonBucket } from '@/lib/claimBucket'

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

  // Merge anonymous bucket items into the user's account whenever they
  // sign in from any surface (login, register, magic link). Idempotent
  // — subsequent SIGNED_IN events after the anon_id has been cleared
  // are no-ops.
  useEffect(() => {
    const { data: { subscription } } = getSupabase().auth.onAuthStateChange(
      (event, session) => {
        if (event === 'SIGNED_IN' && session?.user) {
          claimAnonBucket(session.user.id).catch((err) => {
            console.error('claimAnonBucket failed:', err)
          })
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
