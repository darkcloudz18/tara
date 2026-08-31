'use client'

import {
  createContext,
  useCallback,
  useContext,
  useEffect,
  useRef,
  useState,
  ReactNode,
} from 'react'
import { supabase } from '@/lib/supabase'
import { Itinerary } from '@/types/database'
import { useUser } from './UserContext'
import { readCachedTripSummary, writeCachedTripSummary } from '@/lib/tripCache'

// Single source of truth for the current user's most-recent-first
// itinerary list. Before this existed, HomeClient and Sidebar each ran
// their own `.from('itineraries').eq('user_id', ...)` query on every
// mount — duplicate work against the same auth-scoped table, and drift
// waiting to happen when a mutation only refreshed one of them.
//
// Fetch dedup: Supabase's onAuthStateChange fires both INITIAL_SESSION
// and SIGNED_IN on cold load, and our initial run happens before those.
// Without dedup we'd issue three identical select=* queries in the
// same millisecond. Refs guard both the "already have data" fast-path
// and the "in-flight fetch" case.

interface TripsContextValue {
  trips: Itinerary[]
  activeTrip: Itinerary | null
  tripFetchDone: boolean
  sdkConfirmed: boolean
  refetch: () => Promise<void>
}

const TripsContext = createContext<TripsContextValue>({
  trips: [],
  activeTrip: null,
  tripFetchDone: false,
  sdkConfirmed: false,
  refetch: async () => {},
})

// Serves Sidebar (top 1) and HomeClient (top 1) plus /dashboard (top 6
// for recent + upcoming filtering). Kept low so the payload stays small
// for users with many trips.
const LIMIT = 6

export function TripsProvider({ children }: { children: ReactNode }) {
  const { user, loading: authLoading } = useUser()
  const userId = user?.id ?? null

  const [trips, setTrips] = useState<Itinerary[]>(() => {
    const cached = readCachedTripSummary()
    return cached ? [cached as Itinerary] : []
  })
  const [tripFetchDone, setTripFetchDone] = useState(false)
  const [sdkConfirmed, setSdkConfirmed] = useState(false)

  // Refs the runner reads/writes to dedup across the initial mount fire
  // and the two onAuthStateChange fires. Reset when userId changes.
  const hasDataRef = useRef(false)
  const inFlightRef = useRef<Promise<void> | null>(null)
  const currentUserIdRef = useRef<string | null>(null)

  const doFetch = useCallback(
    async (targetUserId: string, sdkKnown: boolean): Promise<void> => {
      const { data } = await supabase
        .from('itineraries')
        .select('*')
        .eq('user_id', targetUserId)
        .order('updated_at', { ascending: false })
        .limit(LIMIT)

      // Guard against writes for a stale user after sign-out+sign-in
      // as different identities.
      if (currentUserIdRef.current !== targetUserId) return

      setTripFetchDone(true)
      if (data && data.length > 0) {
        setTrips(data)
        hasDataRef.current = true
        const top = data[0]
        writeCachedTripSummary({
          id: top.id,
          user_id: top.user_id,
          title: top.title,
          destinations: top.destinations ?? [],
          start_date: top.start_date,
          end_date: top.end_date,
          updated_at: top.updated_at,
        })
      } else if (sdkKnown) {
        setTrips([])
        writeCachedTripSummary(null)
      }
    },
    []
  )

  useEffect(() => {
    currentUserIdRef.current = userId
    hasDataRef.current = false
    inFlightRef.current = null

    if (!userId) {
      setTrips([])
      setTripFetchDone(!authLoading)
      setSdkConfirmed(!authLoading)
      return
    }

    setTripFetchDone(false)
    setSdkConfirmed(false)

    const run = (sdkKnown: boolean): Promise<void> => {
      // Once we've confirmed data for this user, subsequent fires are
      // no-ops. The refetch() escape hatch (or a fresh mount after a
      // sign-in/out cycle) is the only path to a new fetch.
      if (hasDataRef.current) return Promise.resolve()
      // Coalesce concurrent calls onto the same promise.
      if (inFlightRef.current) return inFlightRef.current

      const p = doFetch(userId, sdkKnown).finally(() => {
        inFlightRef.current = null
      })
      inFlightRef.current = p
      return p
    }

    run(false)

    const { data: { subscription } } = supabase.auth.onAuthStateChange(
      (event, session) => {
        if (event === 'INITIAL_SESSION' || event === 'SIGNED_IN') {
          setSdkConfirmed(true)
          if (session?.user.id === userId) run(true)
        }
      }
    )

    return () => {
      subscription.unsubscribe()
    }
  }, [userId, authLoading, doFetch])

  const refetch = useCallback(async () => {
    if (!userId) return
    // Bypass the hasData short-circuit — this is called explicitly
    // after a mutation and always wants a fresh read.
    hasDataRef.current = false
    inFlightRef.current = null
    await doFetch(userId, true)
  }, [userId, doFetch])

  const value: TripsContextValue = {
    trips,
    activeTrip: trips[0] ?? null,
    tripFetchDone,
    sdkConfirmed,
    refetch,
  }

  return <TripsContext.Provider value={value}>{children}</TripsContext.Provider>
}

export function useTrips(): TripsContextValue {
  return useContext(TripsContext)
}
