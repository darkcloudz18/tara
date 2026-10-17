'use client'

import { Sparkles, Clock, Users, Wallet, Bookmark, ArrowRight, Loader2 } from 'lucide-react'
import Link from 'next/link'
import type { MatchResult, SmartBuildResults } from '../services/smartBuildService'

interface Props {
  loading: boolean
  results: SmartBuildResults | null
  travelers: number
  onPick: (match: MatchResult) => void
  pickingId?: string | null
}

export default function SmartBuildResultsView({
  loading,
  results,
  travelers,
  onPick,
  pickingId,
}: Props) {
  if (loading) {
    return (
      <div className="max-w-3xl mx-auto rounded-2xl border border-gray-200 dark:border-gray-800 bg-white dark:bg-gray-900 p-8 text-center">
        <Sparkles className="w-10 h-10 text-teal-500 mx-auto mb-4 animate-pulse" />
        <h2 className="text-xl font-semibold text-gray-900 dark:text-white">
          Finding destinations that fit
        </h2>
        <p className="mt-2 text-sm text-gray-500 dark:text-gray-400">
          Checking what works for your days, origin, budget, and bucket list.
        </p>
      </div>
    )
  }

  if (!results) return null

  if (results.matches.length === 0 && results.refusals.length === 0) {
    return (
      <div className="max-w-3xl mx-auto rounded-2xl border border-gray-200 dark:border-gray-800 bg-white dark:bg-gray-900 p-8 text-center">
        <h2 className="text-xl font-semibold text-gray-900 dark:text-white">No destinations yet</h2>
        <p className="mt-3 text-sm text-gray-500 dark:text-gray-400">
          We're still curating destination data. Browse places directly for now, and we'll suggest trips once a few are ready.
        </p>
        <Link
          href="/discover"
          className="mt-5 inline-flex items-center gap-2 px-4 py-2 bg-teal-600 text-white font-semibold rounded-lg hover:bg-teal-700"
        >
          Browse places
          <ArrowRight className="w-4 h-4" />
        </Link>
      </div>
    )
  }

  return (
    <div className="max-w-3xl mx-auto space-y-5">
      {results.matches.length > 0 && (
        <section className="space-y-3">
          <div className="flex items-end justify-between">
            <div>
              <h2 className="text-xl font-semibold text-gray-900 dark:text-white">
                {results.matches.length === 1
                  ? '1 destination fits'
                  : `${results.matches.length} destinations fit`}
              </h2>
              <p className="text-sm text-gray-500 dark:text-gray-400">
                Ranked by how well they match your answers.
              </p>
            </div>
          </div>
          <ul className="space-y-3">
            {results.matches.map((m) => (
              <MatchCard
                key={m.destination.id}
                match={m}
                travelers={travelers}
                onPick={() => onPick(m)}
                picking={pickingId === m.destination.id}
                disabled={!!pickingId && pickingId !== m.destination.id}
              />
            ))}
          </ul>
        </section>
      )}

      {results.refusals.length > 0 && (
        <section className="rounded-2xl border border-amber-200 dark:border-amber-800/60 bg-amber-50 dark:bg-amber-900/20 p-5">
          <header className="flex items-center gap-2 mb-3">
            <Bookmark className="w-5 h-5 text-amber-600 dark:text-amber-300" />
            <h3 className="font-semibold text-amber-900 dark:text-amber-100">
              Keeping on your bucket list
            </h3>
          </header>
          <ul className="space-y-3 text-sm text-amber-900 dark:text-amber-100/90">
            {results.refusals.map((r) => (
              <li key={r.destination.id}>
                <p>{r.message}</p>
                {r.overlapPlaceNames.length > 0 && (
                  <p className="mt-1 text-xs text-amber-800/80 dark:text-amber-200/80">
                    Your saved places there: {r.overlapPlaceNames.join(', ')}.
                  </p>
                )}
              </li>
            ))}
          </ul>
        </section>
      )}
    </div>
  )
}

function MatchCard({
  match,
  travelers,
  onPick,
  picking,
  disabled,
}: {
  match: MatchResult
  travelers: number
  onPick: () => void
  picking: boolean
  disabled: boolean
}) {
  const d = match.destination
  const travelHrs = match.travelMinutes !== null ? match.travelMinutes / 60 : null

  return (
    <li className="rounded-2xl border border-gray-200 dark:border-gray-800 bg-white dark:bg-gray-900 p-5">
      <div className="flex items-start justify-between gap-3 flex-wrap">
        <div className="min-w-0 flex-1">
          <div className="flex items-center gap-2 flex-wrap">
            <h3 className="text-lg font-semibold text-gray-900 dark:text-white">{d.name}</h3>
            {d.region && (
              <span className="text-sm text-gray-500 dark:text-gray-400">· {d.region}</span>
            )}
          </div>
          {d.summary && (
            <p className="mt-1 text-sm text-gray-600 dark:text-gray-300 line-clamp-2">{d.summary}</p>
          )}
          {match.overlapCount > 0 && (
            <p className="mt-2 inline-flex items-center gap-1 px-2 py-1 rounded-full bg-teal-50 dark:bg-teal-900/30 text-xs text-teal-700 dark:text-teal-300">
              <Bookmark className="w-3 h-3" />
              You saved {match.overlapPlaceNames.slice(0, 2).join(', ')}
              {match.overlapPlaceNames.length > 2 && ` +${match.overlapPlaceNames.length - 2}`}
            </p>
          )}

          <dl className="mt-3 grid grid-cols-3 gap-3 text-xs">
            <Stat icon={<Clock className="w-3.5 h-3.5" />} label="Travel">
              {travelHrs !== null ? `${roundOne(travelHrs)} h` : '—'}
            </Stat>
            <Stat icon={<Wallet className="w-3.5 h-3.5" />} label="Est. cost">
              {match.totalCost !== null ? `₱${formatMoney(match.totalCost)}` : '—'}
            </Stat>
            <Stat icon={<Users className="w-3.5 h-3.5" />} label="Travellers">
              {travelers}
            </Stat>
          </dl>
        </div>

        <button
          onClick={onPick}
          disabled={picking || disabled}
          className="inline-flex items-center gap-2 px-4 py-2 bg-teal-600 text-white font-semibold rounded-lg hover:bg-teal-700 disabled:opacity-50 disabled:cursor-not-allowed self-start"
        >
          {picking ? <Loader2 className="w-4 h-4 animate-spin" /> : <Sparkles className="w-4 h-4" />}
          Pick this
        </button>
      </div>
    </li>
  )
}

function Stat({ icon, label, children }: { icon: React.ReactNode; label: string; children: React.ReactNode }) {
  return (
    <div className="rounded-lg bg-gray-50 dark:bg-gray-800/60 p-2">
      <div className="flex items-center gap-1 text-gray-500 dark:text-gray-400 mb-0.5">
        {icon}
        <span>{label}</span>
      </div>
      <div className="font-medium text-gray-900 dark:text-white">{children}</div>
    </div>
  )
}

function roundOne(n: number): string {
  return (Math.round(n * 10) / 10).toString()
}

function formatMoney(n: number): string {
  if (n >= 1000) return `${(n / 1000).toFixed(n >= 10000 ? 0 : 1)}k`
  return Math.round(n).toLocaleString()
}
