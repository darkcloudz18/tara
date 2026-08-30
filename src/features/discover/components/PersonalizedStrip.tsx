'use client'

import { useEffect, useRef, useState } from 'react'
import Link from 'next/link'
import Image from 'next/image'
import { MapPin } from 'lucide-react'
import { DiscoverPlace } from '@/features/planner/services/placeService'
import {
  detectSignal,
  getPersonalizedPlaces,
  PersonalizationSignal,
} from '../services/personalizationService'
import { capture } from '@/lib/analytics'
import BucketPin from '@/components/icons/BucketPin'

// Additive strip above the base Discover grid. Client-only, so SSR of
// `/` stays byte-stable and indexable. If detection fails, the query
// errors, or the location match is empty, the strip silently doesn't
// render — the base feed carries the page.
export default function PersonalizedStrip() {
  const [signal, setSignal] = useState<PersonalizationSignal | null>(null)
  const [places, setPlaces] = useState<DiscoverPlace[]>([])
  const [status, setStatus] = useState<'idle' | 'loading' | 'ready' | 'hide'>('loading')
  const capturedRef = useRef(false)

  useEffect(() => {
    let cancelled = false
    ;(async () => {
      try {
        const detected = await detectSignal()
        if (cancelled) return
        if (!detected) {
          setStatus('hide')
          return
        }
        const matching = await getPersonalizedPlaces(detected)
        if (cancelled) return
        if (matching.length === 0) {
          setStatus('hide')
          return
        }
        setSignal(detected)
        setPlaces(matching)
        setStatus('ready')
      } catch (err) {
        console.error('PersonalizedStrip detection failed:', err)
        if (!cancelled) setStatus('hide')
      }
    })()
    return () => {
      cancelled = true
    }
  }, [])

  useEffect(() => {
    if (status !== 'ready' || capturedRef.current || !signal) return
    capturedRef.current = true
    capture('discover_personalized_shown', {
      destination: signal.destination,
      source: signal.source,
      itemCount: places.length,
    })
  }, [status, signal, places.length])

  if (status === 'hide') return null

  const header = signal
    ? signal.source === 'dated_lakad'
      ? `For your ${signal.destination} trip`
      : `More around ${signal.destination}`
    : ''

  return (
    <section
      aria-label="Recommended for you"
      className="max-w-7xl mx-auto px-4 pt-4 pb-2"
    >
      <div className="flex items-baseline justify-between mb-3">
        {status === 'loading' ? (
          <div className="h-6 w-56 bg-gray-100 dark:bg-gray-900 rounded animate-pulse" />
        ) : (
          <>
            <h2 className="text-lg font-bold text-gray-900 dark:text-white flex items-center gap-2">
              <BucketPin className="w-5 h-5 text-teal-600 dark:text-teal-400" />
              {header}
            </h2>
            {signal?.source === 'bucket_cluster' && (
              <Link
                href="/bucket"
                className="text-sm font-medium text-teal-600 dark:text-teal-400 hover:underline"
              >
                View bucket
              </Link>
            )}
          </>
        )}
      </div>

      <div
        className="flex gap-3 overflow-x-auto snap-x snap-mandatory scrollbar-none pb-2 -mx-4 px-4"
      >
        {status === 'loading'
          ? Array.from({ length: 4 }).map((_, i) => (
              <div
                key={i}
                className="snap-start flex-shrink-0 w-[220px] rounded-xl border border-gray-200 dark:border-gray-800 bg-white dark:bg-gray-950 overflow-hidden"
              >
                <div className="aspect-[4/3] bg-gray-100 dark:bg-gray-900 animate-pulse" />
                <div className="p-3 space-y-2">
                  <div className="h-4 w-3/4 bg-gray-100 dark:bg-gray-900 rounded animate-pulse" />
                  <div className="h-3 w-1/2 bg-gray-100 dark:bg-gray-900 rounded animate-pulse" />
                </div>
              </div>
            ))
          : places.map((place) => (
              <StripCard
                key={place.id}
                place={place}
                destination={signal!.destination}
              />
            ))}
      </div>
    </section>
  )
}

interface StripCardProps {
  place: DiscoverPlace
  destination: string
}

function StripCard({ place, destination }: StripCardProps) {
  const photo = place.photos?.[0]

  function handleClick() {
    capture('discover_personalized_click', {
      destination,
      placeId: place.id,
    })
  }

  return (
    <article
      onClick={handleClick}
      className="snap-start flex-shrink-0 w-[220px] rounded-xl border border-gray-200 dark:border-gray-800 bg-white dark:bg-gray-950 overflow-hidden cursor-pointer hover:border-gray-300 dark:hover:border-gray-700 transition-colors"
    >
      <div className="relative aspect-[4/3] bg-gray-100 dark:bg-gray-900">
        {photo ? (
          <Image
            src={photo}
            alt={place.name}
            fill
            sizes="220px"
            className="object-cover"
          />
        ) : (
          <div className="w-full h-full flex items-center justify-center">
            <MapPin className="w-8 h-8 text-gray-300 dark:text-gray-700" />
          </div>
        )}
      </div>
      <div className="p-3">
        <h3 className="font-semibold text-sm text-gray-900 dark:text-white line-clamp-1">
          {place.name}
        </h3>
        <p className="text-xs text-gray-500 dark:text-gray-400 mt-0.5 line-clamp-1">
          {place.location}
        </p>
      </div>
    </article>
  )
}
