'use client'

import { useEffect } from 'react'
import { AlertTriangle, RefreshCcw } from 'lucide-react'
import * as Sentry from '@sentry/nextjs'

export default function GlobalError({
  error,
  reset,
}: {
  error: Error & { digest?: string }
  reset: () => void
}) {
  useEffect(() => {
    Sentry.captureException(error)
    console.error('Global error:', error)
  }, [error])

  return (
    <html lang="en">
      <body className="bg-gray-900 text-white min-h-screen flex items-center justify-center px-4">
        <div className="max-w-md w-full text-center">
          <div className="mb-6 inline-flex items-center justify-center w-16 h-16 rounded-full bg-red-500/20">
            <AlertTriangle className="w-8 h-8 text-red-400" />
          </div>

          <h1 className="text-2xl font-bold mb-2">Critical Error</h1>
          <p className="text-gray-400 mb-8">
            The application encountered a critical error. Please refresh the page.
          </p>

          <button
            onClick={() => reset()}
            className="inline-flex items-center justify-center gap-2 px-6 py-3 bg-teal-600 text-white font-semibold rounded-xl hover:bg-teal-700 transition-colors"
          >
            <RefreshCcw className="w-5 h-5" />
            Refresh Page
          </button>
        </div>
      </body>
    </html>
  )
}
