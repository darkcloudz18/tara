'use client'

import { useEffect, useRef, useState } from 'react'
import Link from 'next/link'
import Image from 'next/image'
import { Sparkles, ArrowRight } from 'lucide-react'
import { capture } from '@/lib/analytics'
import {
  findTopTemplateMatch,
  TemplateMatch,
} from '../services/templateMatchingService'

// Renders above the date prompt on /bucket. Silent no-render on error,
// no match, or empty bucket — the date prompt stays as the primary
// action in those cases. One primary suggestion only; a second template
// would dilute the CTA.
export default function MatchingTemplateCard() {
  const [status, setStatus] = useState<'loading' | 'ready' | 'hide'>('loading')
  const [match, setMatch] = useState<TemplateMatch | null>(null)
  const capturedRef = useRef(false)

  useEffect(() => {
    let cancelled = false
    ;(async () => {
      try {
        const top = await findTopTemplateMatch()
        if (cancelled) return
        if (!top) {
          setStatus('hide')
          return
        }
        setMatch(top)
        setStatus('ready')
      } catch (err) {
        console.error('Template matching failed:', err)
        if (!cancelled) setStatus('hide')
      }
    })()
    return () => {
      cancelled = true
    }
  }, [])

  useEffect(() => {
    if (status !== 'ready' || capturedRef.current || !match) return
    capturedRef.current = true
    capture('templates_matched_shown', {
      templateSlug: match.template.slug,
      overlapCount: match.overlapCount,
      matchedPlaces: match.matchedPlaces,
    })
  }, [status, match])

  if (status === 'loading') {
    return (
      <div className="rounded-2xl border border-gray-200 dark:border-gray-800 bg-white dark:bg-gray-950 p-5 mb-4 flex gap-4 items-center">
        <div className="w-16 h-16 rounded-xl bg-gray-100 dark:bg-gray-900 animate-pulse flex-shrink-0" />
        <div className="flex-1 space-y-2">
          <div className="h-4 w-3/4 bg-gray-100 dark:bg-gray-900 rounded animate-pulse" />
          <div className="h-3 w-1/2 bg-gray-100 dark:bg-gray-900 rounded animate-pulse" />
        </div>
      </div>
    )
  }

  if (status === 'hide' || !match) return null

  const { template, overlapCount, matchedPlaces } = match
  const singular = overlapCount === 1
  const headline = `${overlapCount} of your saved place${singular ? ' is' : 's are'} in ${template.title}`

  function handleClick() {
    capture('template_matched_click', {
      templateSlug: template.slug,
      overlapCount,
    })
  }

  return (
    <section
      aria-label="Matching template"
      className="rounded-2xl border border-teal-200 dark:border-teal-900/60 bg-teal-50/60 dark:bg-teal-900/10 p-5 mb-4"
    >
      <div className="flex flex-col sm:flex-row gap-4">
        <div className="relative w-full sm:w-24 aspect-video sm:aspect-square rounded-xl overflow-hidden bg-gray-100 dark:bg-gray-900 flex-shrink-0">
          <Image
            src={template.image}
            alt={template.title}
            fill
            sizes="(max-width: 640px) 100vw, 96px"
            className="object-cover"
          />
        </div>

        <div className="flex-1 min-w-0">
          <div className="inline-flex items-center gap-1.5 text-xs font-semibold uppercase tracking-wide text-teal-700 dark:text-teal-300 mb-1.5">
            <Sparkles className="w-3.5 h-3.5" />
            Template match
          </div>

          <h2 className="font-semibold text-gray-900 dark:text-white leading-tight">
            {headline}
          </h2>

          <p className="text-sm text-gray-600 dark:text-gray-400 mt-1">
            {template.duration}-day itinerary · from ₱{template.estimatedBudget.toLocaleString()}
          </p>

          {matchedPlaces.length > 0 && (
            <ul className="flex flex-wrap gap-1.5 mt-3">
              {matchedPlaces.slice(0, 4).map((name) => (
                <li
                  key={name}
                  className="text-xs font-medium px-2 py-0.5 rounded-full bg-white dark:bg-gray-950 border border-gray-200 dark:border-gray-800 text-gray-700 dark:text-gray-300"
                >
                  {name}
                </li>
              ))}
              {matchedPlaces.length > 4 && (
                <li className="text-xs font-medium px-2 py-0.5 rounded-full text-gray-500 dark:text-gray-400">
                  +{matchedPlaces.length - 4} more
                </li>
              )}
            </ul>
          )}

          <div className="flex items-center gap-4 mt-4">
            <Link
              href={`/trip/new?template=${template.slug}`}
              onClick={handleClick}
              className="inline-flex items-center gap-1.5 min-h-[44px] px-4 rounded-lg bg-teal-500 hover:bg-teal-600 text-white text-sm font-semibold"
            >
              Use this template
              <ArrowRight className="w-4 h-4" />
            </Link>
            <Link
              href="/templates"
              className="text-sm font-medium text-teal-700 dark:text-teal-300 hover:underline"
            >
              See other templates
            </Link>
          </div>
        </div>
      </div>
    </section>
  )
}
