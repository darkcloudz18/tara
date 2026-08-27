'use client'

import { createContext, useContext, useEffect, useState, ReactNode } from 'react'
import type { User, Session } from '@supabase/supabase-js'
import { supabase, getSessionSafe } from '@/lib/supabase'

// One resolved snapshot of the auth state, hydrated once at Provider mount and
// updated on every onAuthStateChange event. Consumers read this via useUser()
// instead of doing their own getUserSafe fetch — that pattern was hitting a
// 3s network timeout from Manila and leaving `user` null across the tree.
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

export function UserProvider({ children }: { children: ReactNode }) {
  const [state, setState] = useState<UserContextValue>({
    user: null,
    session: null,
    loading: true,
  })

  useEffect(() => {
    // getSession reads the cached JWT from localStorage — no network,
    // no 3s timeout risk. Right primitive for "am I logged in?" UI checks.
    getSessionSafe().then((session) => {
      setState({ user: session?.user ?? null, session, loading: false })
    })

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
