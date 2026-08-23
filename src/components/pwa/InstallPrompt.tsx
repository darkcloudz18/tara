'use client'

import { useState, useEffect } from 'react'
import { Download, X, Smartphone } from 'lucide-react'

interface BeforeInstallPromptEvent extends Event {
  prompt: () => Promise<void>
  userChoice: Promise<{ outcome: 'accepted' | 'dismissed' }>
}

const DISMISS_DAYS = 30
const MIN_VISITS = 2

// Prompt fires only when the visitor has some intent signal: they've been
// here before, or they've created a lakad. First-time landings on 404 or
// error routes never see it.
function isEligible(): boolean {
  if (typeof window === 'undefined') return false
  if (document.body.dataset.errorRoute === '1') return false

  const dismissedAt = localStorage.getItem('pwa-install-dismissed')
  if (dismissedAt) {
    const days = (Date.now() - parseInt(dismissedAt, 10)) / (1000 * 60 * 60 * 24)
    if (days < DISMISS_DAYS) return false
  }

  const visits = parseInt(localStorage.getItem('tara-visit-count') || '0', 10)
  const hasLakad = localStorage.getItem('tara-lakad-created') === '1'
  return visits >= MIN_VISITS || hasLakad
}

export default function InstallPrompt() {
  const [deferredPrompt, setDeferredPrompt] = useState<BeforeInstallPromptEvent | null>(null)
  const [showPrompt, setShowPrompt] = useState(false)
  const [isIOS, setIsIOS] = useState(false)
  const [isStandalone, setIsStandalone] = useState(false)
  const [hasInstallableSignal, setHasInstallableSignal] = useState(false)

  useEffect(() => {
    const standalone = window.matchMedia('(display-mode: standalone)').matches
    const iOS = /iPad|iPhone|iPod/.test(navigator.userAgent) && !(window as any).MSStream
    const installable = localStorage.getItem('tara-pwa-installable') === '1'
    setIsStandalone(standalone)
    setIsIOS(iOS)
    setHasInstallableSignal(installable)

    // Chrome/Edge fire beforeinstallprompt but throttle re-fires within a
    // session and sometimes skip it entirely on subsequent sessions once
    // the user has dismissed it. Persist the "we were installable at least
    // once" fact so a later eligible session can still surface manual
    // install UI even without a live event.
    const handleBeforeInstallPrompt = (e: Event) => {
      e.preventDefault()
      setDeferredPrompt(e as BeforeInstallPromptEvent)
      localStorage.setItem('tara-pwa-installable', '1')
      setHasInstallableSignal(true)
      if (isEligible()) setShowPrompt(true)
    }
    window.addEventListener('beforeinstallprompt', handleBeforeInstallPrompt)

    // For platforms we can't drive natively (iOS always, Chrome once
    // throttled), schedule a delayed check so a manual install hint can
    // still appear when the visitor becomes eligible.
    const shouldOfferManual = !standalone && (iOS || installable)
    let timer: ReturnType<typeof setTimeout> | null = null
    if (shouldOfferManual) {
      timer = setTimeout(() => {
        if (isEligible()) setShowPrompt(true)
      }, 3000)
    }

    return () => {
      if (timer) clearTimeout(timer)
      window.removeEventListener('beforeinstallprompt', handleBeforeInstallPrompt)
    }
  }, [])

  // Re-check eligibility when it can change mid-session (a lakad gets
  // created, another tab bumps localStorage, or the user returns focus).
  useEffect(() => {
    if (isStandalone) return
    const recheck = () => {
      if (!isEligible()) return
      if (deferredPrompt || isIOS || hasInstallableSignal) {
        setShowPrompt(true)
      }
    }
    window.addEventListener('tara:pwa-eligibility-changed', recheck)
    window.addEventListener('storage', recheck)
    window.addEventListener('focus', recheck)
    return () => {
      window.removeEventListener('tara:pwa-eligibility-changed', recheck)
      window.removeEventListener('storage', recheck)
      window.removeEventListener('focus', recheck)
    }
  }, [deferredPrompt, isIOS, isStandalone, hasInstallableSignal])

  const handleInstall = async () => {
    if (!deferredPrompt) return

    deferredPrompt.prompt()
    const { outcome } = await deferredPrompt.userChoice

    if (outcome === 'accepted') {
      setShowPrompt(false)
    }
    setDeferredPrompt(null)
  }

  const handleDismiss = () => {
    setShowPrompt(false)
    localStorage.setItem('pwa-install-dismissed', Date.now().toString())
  }

  // Don't show if already installed or prompt shouldn't show
  if (isStandalone || !showPrompt) return null

  return (
    <div className="fixed bottom-20 left-4 right-4 md:left-auto md:right-4 md:w-96 bg-white dark:bg-gray-800 rounded-xl shadow-xl border border-gray-200 dark:border-gray-700 p-4 z-50 animate-slide-up">
      <button
        onClick={handleDismiss}
        className="absolute top-2 right-2 p-1 text-gray-400 hover:text-gray-600 dark:hover:text-gray-300"
        aria-label="Dismiss"
      >
        <X className="w-5 h-5" />
      </button>

      <div className="flex items-start gap-3">
        <div className="flex-shrink-0 w-12 h-12 bg-teal-100 dark:bg-teal-900/30 rounded-xl flex items-center justify-center">
          <Smartphone className="w-6 h-6 text-teal-600 dark:text-teal-400" />
        </div>

        <div className="flex-1 min-w-0">
          <h3 className="font-semibold text-gray-900 dark:text-white text-sm">
            Install Tara
          </h3>
          <p className="text-xs text-gray-500 dark:text-gray-400 mt-0.5">
            Add to your home screen for the best experience
          </p>

          {isIOS ? (
            <div className="mt-3 text-xs text-gray-600 dark:text-gray-300">
              <p className="flex items-center gap-1">
                Tap <span className="inline-flex items-center justify-center w-5 h-5 bg-gray-100 dark:bg-gray-700 rounded">
                  <svg className="w-3 h-3" fill="currentColor" viewBox="0 0 20 20">
                    <path d="M10 3a1 1 0 01.707.293l3 3a1 1 0 01-1.414 1.414L11 6.414V14a1 1 0 11-2 0V6.414L7.707 7.707a1 1 0 01-1.414-1.414l3-3A1 1 0 0110 3z" />
                    <path d="M3 14a1 1 0 011-1h12a1 1 0 110 2H4a1 1 0 01-1-1z" />
                  </svg>
                </span> then &quot;Add to Home Screen&quot;
              </p>
            </div>
          ) : deferredPrompt ? (
            <button
              onClick={handleInstall}
              className="mt-3 flex items-center gap-2 px-3 py-1.5 bg-teal-600 hover:bg-teal-700 text-white text-sm font-medium rounded-lg transition-colors"
            >
              <Download className="w-4 h-4" />
              Install
            </button>
          ) : (
            <p className="mt-3 text-xs text-gray-600 dark:text-gray-300">
              Open your browser menu and choose &quot;Install Tara app&quot;.
            </p>
          )}
        </div>
      </div>
    </div>
  )
}
