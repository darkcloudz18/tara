'use client'

import { useEffect } from 'react'
import { capture } from '@/lib/analytics'

interface Props {
  event: 'destination_page_view' | 'place_page_view'
  properties: Record<string, unknown>
}

/**
 * One-shot analytics fire on mount. Keeps the server components dumb —
 * they drop this tracker in with the right event + props and go.
 */
export default function PageViewTracker({ event, properties }: Props) {
  useEffect(() => {
    capture(event, properties)
    // Intentionally empty deps — fire once per mount even if parent
    // re-renders with the same props.
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [])
  return null
}
