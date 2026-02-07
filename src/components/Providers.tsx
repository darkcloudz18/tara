'use client'

import { ThemeProvider } from '@/contexts/ThemeContext'
import { ToastProvider } from '@/contexts/ToastContext'
import InstallPrompt from '@/components/pwa/InstallPrompt'
import { WelcomeModal } from '@/features/onboarding'

export default function Providers({ children }: { children: React.ReactNode }) {
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
