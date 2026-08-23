'use client'

import { useEffect } from 'react'
import { ThemeProvider } from '@/contexts/ThemeContext'
import { ToastProvider } from '@/contexts/ToastContext'
import InstallPrompt from '@/components/pwa/InstallPrompt'
import { WelcomeModal } from '@/features/onboarding'

export default function Providers({ children }: { children: React.ReactNode }) {
  useEffect(() => {
    // Increment once per page load. SPA navigations don't unmount this
    // provider, so this fires once per real "session" open.
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
