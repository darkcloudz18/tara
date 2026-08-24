const KEY = 'tara-anon-id'

// Returns the visitor's anonymous UUID, creating one on first call. Browser
// only — reading or writing localStorage from a server component would throw
// and produce a hydration mismatch. Callers on the server must handle the
// empty string case.
export function getAnonId(): string {
  if (typeof window === 'undefined') return ''
  const existing = localStorage.getItem(KEY)
  if (existing) return existing
  const fresh = crypto.randomUUID()
  localStorage.setItem(KEY, fresh)
  return fresh
}

export function clearAnonId(): void {
  if (typeof window === 'undefined') return
  localStorage.removeItem(KEY)
}
