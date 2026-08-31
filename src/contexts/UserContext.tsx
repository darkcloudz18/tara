'use client'

import { createContext, useContext, useEffect, useState, ReactNode } from 'react'
import type { User, Session } from '@supabase/supabase-js'
import { supabase } from '@/lib/supabase'

// One resolved snapshot of the auth state.
//
// Previous implementation called supabase.auth.getSession() at mount and raced it
// against a 3s timeout. In practice that call was blocking for ~7–8s on cold
// loads (Supabase JS internal lock waiting on initial validation), so the UI
// hit the 3s fallback first — flashing "Sign in" for ~4s before the real user
// resolved. Reading the persisted session directly from localStorage skips that
// lock entirely; the SDK's own onAuthStateChange still fires afterwards to
// confirm and to catch sign-in / sign-out events.
type UserContextValue = {
  user: User | null
  session: Session | null
  loading: boolean
}

const UserContext = createContext<UserContextValue>({
  user: null,
  session: null,
  loading: true,
})

// Supabase persists the session under `sb-<projectRef>-auth-token`. Derive the
// key from the public URL rather than hardcoding a project ref, so this
// survives the ap-southeast-1 → whatever-comes-next migration path.
function readCachedSession(): { user: User | null; session: Session | null } {
  if (typeof window === 'undefined') return { user: null, session: null }
  const url = process.env.NEXT_PUBLIC_SUPABASE_URL
  const ref = url?.match(/https?:\/\/([^.]+)\./)?.[1]
  if (!ref) return { user: null, session: null }
  const raw = window.localStorage.getItem(`sb-${ref}-auth-token`)
  if (!raw) return { user: null, session: null }
  try {
    const parsed = JSON.parse(raw) as Session
    // Treat expired sessions as signed-out. onAuthStateChange will do
    // the real refresh dance; we just don't want to flash the stale user.
    if (parsed.expires_at && parsed.expires_at * 1000 < Date.now()) {
      return { user: null, session: null }
    }
    return { user: parsed.user ?? null, session: parsed }
  } catch {
    return { user: null, session: null }
  }
}

export function UserProvider({ children }: { children: ReactNode }) {
  const [state, setState] = useState<UserContextValue>({
    user: null,
    session: null,
    loading: true,
  })

  useEffect(() => {
    // Sync read from localStorage. Runs on the same tick as the effect, no
    // network, no lock, no timeout window. Sets the resolved state on the
    // first client render after hydration, so the sidebar avatar / hero
    // widgets don't have to fall through a "Sign in" intermediate.
    const cached = readCachedSession()
    setState({ user: cached.user, session: cached.session, loading: false })

    const { data: { subscription } } = supabase.auth.onAuthStateChange(
      (_event, session) => {
        setState({ user: session?.user ?? null, session, loading: false })
      }
    )

    return () => subscription.unsubscribe()
  }, [])

  return <UserContext.Provider value={state}>{children}</UserContext.Provider>
}

export function useUser(): UserContextValue {
  return useContext(UserContext)
}
