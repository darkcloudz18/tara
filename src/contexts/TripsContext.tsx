'use client'

import {
  createContext,
  useCallback,
  useContext,
  useEffect,
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
// Keeps the localStorage-first pattern: activeTrip seeded from the
// tripCache summary so the has-trip hero renders on first client paint
// without waiting for Supabase's slow getSession lock. Real fetch runs
// on user id change and on SIGNED_IN confirmation.

interface TripsContextValue {
  trips: Itinerary[]
  activeTrip: Itinerary | null
  // Split resolution signals so consumers can distinguish "we don't
  // know yet" from "we know and there really is nothing".
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

const LIMIT = 5

export function TripsProvider({ children }: { children: ReactNode }) {
  const { user, loading: authLoading } = useUser()
  const userId = user?.id ?? null

  // Seed activeTrip from the localStorage summary. Reused by Sidebar's
  // hero widget and HomeClient's HeroSection so the correct variant
  // paints on first render.
  const [trips, setTrips] = useState<Itinerary[]>(() => {
    const cached = readCachedTripSummary()
    return cached ? [cached as Itinerary] : []
  })
  const [tripFetchDone, setTripFetchDone] = useState(false)
  const [sdkConfirmed, setSdkConfirmed] = useState(false)

  const doFetch = useCallback(
    async (targetUserId: string, sdkKnown: boolean) => {
      const { data } = await supabase
        .from('itineraries')
        .select('*')
        .eq('user_id', targetUserId)
        .order('updated_at', { ascending: false })
        .limit(LIMIT)

      setTripFetchDone(true)
      if (data && data.length > 0) {
        setTrips(data)
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
        // SDK settled + fetch empty = user really has no trips. Clear
        // both the in-memory list (the cached-summary initializer may
        // have populated it) and the cache.
        setTrips([])
        writeCachedTripSummary(null)
      }
    },
    []
  )

  useEffect(() => {
    if (!userId) {
      setTrips([])
      setTripFetchDone(!authLoading)
      setSdkConfirmed(!authLoading)
      return
    }

    let cancelled = false
    setTripFetchDone(false)
    setSdkConfirmed(false)

    const run = async (sdkKnown: boolean) => {
      try {
        await doFetch(userId, sdkKnown)
      } catch (err) {
        if (!cancelled) {
          console.error('TripsContext fetch failed:', err)
          setTripFetchDone(true)
        }
      }
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
      cancelled = true
      subscription.unsubscribe()
    }
  }, [userId, authLoading, doFetch])

  const refetch = useCallback(async () => {
    if (userId) await doFetch(userId, true)
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
