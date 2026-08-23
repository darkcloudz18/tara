'use client'

import { useEffect } from 'react'
import { ThemeProvider } from '@/contexts/ThemeContext'
import { ToastProvider } from '@/contexts/ToastContext'
import InstallPrompt from '@/components/pwa/InstallPrompt'
import { WelcomeModal } from '@/features/onboarding'

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

  return (
    <ThemeProvider>
      <ToastProvider>
        {children}
        <WelcomeModal />
        <InstallPrompt />
      </ToastProvider>
    </ThemeProvider>
  )
}
