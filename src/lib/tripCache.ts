// Lightweight cache of the visitor's most recent lakad, mirroring the
// pattern UserContext already uses for the auth session: write from the
// authoritative fetch, read synchronously on the next cold load so the
// hero and sidebar can render the correct state before the network
// resolves. Cleared on sign-out.
//
// Trade-off is the same one already accepted for the account row: if
// the cached value has drifted (trip deleted / renamed / dates changed
// on another device), the visitor briefly sees stale content before the
// real fetch corrects it. That's acceptable for a personalized surface
// but never for anything security-sensitive — the cache only holds the
// fields the has-trip hero needs to name and link the trip, never
// anything the server would use to authorize.

const KEY = 'tara-last-trip-summary'

export interface CachedTripSummary {
  id: string
  user_id: string
  title: string
  destinations: string[]
  start_date: string
  end_date: string
  updated_at: string
}

export function readCachedTripSummary(): CachedTripSummary | null {
  if (typeof window === 'undefined') return null
  try {
    const raw = window.localStorage.getItem(KEY)
    if (!raw) return null
    const parsed = JSON.parse(raw) as CachedTripSummary
    if (!parsed.id || !parsed.user_id) return null
    return parsed
  } catch {
    return null
  }
}

export function writeCachedTripSummary(summary: CachedTripSummary | null): void {
  if (typeof window === 'undefined') return
  if (!summary) {
    window.localStorage.removeItem(KEY)
    return
  }
  window.localStorage.setItem(KEY, JSON.stringify(summary))
}
