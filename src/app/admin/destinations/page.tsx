'use client'

import { useEffect, useMemo, useState } from 'react'
import Link from 'next/link'
import { Plus, Loader2, Globe2 } from 'lucide-react'
import {
  adminService,
  AdminDestinationQueueRow,
} from '@/features/admin/services/adminService'

type StatusFilter = '' | 'draft' | 'published' | 'needs_review'

const STATUS_LABEL: Record<AdminDestinationQueueRow['status'], string> = {
  draft: 'Draft',
  published: 'Published',
  needs_review: 'Needs review',
}

const STATUS_PILL: Record<AdminDestinationQueueRow['status'], string> = {
  draft: 'bg-gray-100 text-gray-700 dark:bg-gray-800 dark:text-gray-300',
  published: 'bg-emerald-100 text-emerald-700 dark:bg-emerald-900/40 dark:text-emerald-300',
  needs_review: 'bg-amber-100 text-amber-700 dark:bg-amber-900/40 dark:text-amber-300',
}

export default function AdminDestinationsPage() {
  const [rows, setRows] = useState<AdminDestinationQueueRow[]>([])
  const [loading, setLoading] = useState(true)
  const [statusFilter, setStatusFilter] = useState<StatusFilter>('')
  const [incompleteOnly, setIncompleteOnly] = useState(false)
  const [staleOnly, setStaleOnly] = useState(false)

  useEffect(() => {
    setLoading(true)
    adminService
      .getDestinationQueue({
        status: statusFilter || undefined,
        incomplete: incompleteOnly,
        stale: staleOnly,
      })
      .then(setRows)
      .finally(() => setLoading(false))
  }, [statusFilter, incompleteOnly, staleOnly])

  const summary = useMemo(() => {
    if (rows.length === 0) return { avg: 0, publishable: 0 }
    const total = rows.reduce((n, r) => n + r.completeness, 0)
    return {
      avg: Math.round(total / rows.length),
      publishable: rows.filter((r) => r.status === 'published').length,
    }
  }, [rows])

  return (
    <div className="p-6 lg:p-8">
      <div className="mb-6 flex flex-wrap items-start justify-between gap-4">
        <div>
          <h1 className="text-2xl font-bold text-gray-900 dark:text-white">Destinations</h1>
          <p className="text-gray-500 dark:text-gray-400">
            {rows.length} total · {summary.publishable} published · avg completeness {summary.avg}%
          </p>
        </div>
        <Link
          href="/admin/destinations/new"
          className="inline-flex items-center gap-2 px-4 py-2 bg-teal-600 text-white font-medium rounded-lg hover:bg-teal-700"
        >
          <Plus className="w-5 h-5" />
          New destination
        </Link>
      </div>

      <div className="mb-4 flex flex-wrap items-center gap-3">
        <select
          value={statusFilter}
          onChange={(e) => setStatusFilter(e.target.value as StatusFilter)}
          className="px-3 py-2 bg-white dark:bg-gray-900 border border-gray-200 dark:border-gray-800 rounded-lg text-sm"
        >
          <option value="">All statuses</option>
          <option value="draft">Draft</option>
          <option value="published">Published</option>
          <option value="needs_review">Needs review</option>
        </select>
        <label className="inline-flex items-center gap-2 px-3 py-2 bg-white dark:bg-gray-900 border border-gray-200 dark:border-gray-800 rounded-lg text-sm cursor-pointer">
          <input type="checkbox" checked={incompleteOnly} onChange={(e) => setIncompleteOnly(e.target.checked)} />
          Incomplete only
        </label>
        <label className="inline-flex items-center gap-2 px-3 py-2 bg-white dark:bg-gray-900 border border-gray-200 dark:border-gray-800 rounded-lg text-sm cursor-pointer">
          <input type="checkbox" checked={staleOnly} onChange={(e) => setStaleOnly(e.target.checked)} />
          Stale only
        </label>
      </div>

      <div className="bg-white dark:bg-gray-900 rounded-xl border border-gray-200 dark:border-gray-800 overflow-hidden">
        {loading ? (
          <div className="flex justify-center py-12">
            <Loader2 className="w-8 h-8 text-teal-600 animate-spin" />
          </div>
        ) : rows.length === 0 ? (
          <div className="py-12 text-center text-gray-500 dark:text-gray-400">
            No destinations match these filters.
            {rows.length === 0 && !statusFilter && !incompleteOnly && !staleOnly && (
              <p className="mt-2 text-sm">
                Start with El Nido, Boracay, Bohol, Siargao — those are the four Smart Build needs to rank anything.
              </p>
            )}
          </div>
        ) : (
          <div className="overflow-x-auto">
            <table className="w-full">
              <thead>
                <tr className="border-b border-gray-200 dark:border-gray-800 bg-gray-50 dark:bg-gray-800/50">
                  <th className="px-4 py-3 text-left text-xs font-semibold text-gray-500 dark:text-gray-400 uppercase">Name</th>
                  <th className="px-4 py-3 text-left text-xs font-semibold text-gray-500 dark:text-gray-400 uppercase">Smart Build</th>
                  <th className="px-4 py-3 text-left text-xs font-semibold text-gray-500 dark:text-gray-400 uppercase">Completeness</th>
                  <th className="px-4 py-3 text-left text-xs font-semibold text-gray-500 dark:text-gray-400 uppercase">Status</th>
                  <th className="px-4 py-3 text-left text-xs font-semibold text-gray-500 dark:text-gray-400 uppercase">Last verified</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-gray-100 dark:divide-gray-800">
                {rows.map((r) => (
                  <DestinationRow key={r.id} row={r} />
                ))}
              </tbody>
            </table>
          </div>
        )}
      </div>
    </div>
  )
}

function DestinationRow({ row }: { row: AdminDestinationQueueRow }) {
  const barColor =
    row.completeness >= 80
      ? 'bg-emerald-500'
      : row.completeness >= 50
      ? 'bg-amber-500'
      : 'bg-rose-500'

  const verifiedLabel = row.verified_at
    ? new Date(row.verified_at).toLocaleDateString('en-GB', { day: '2-digit', month: 'short', year: 'numeric' })
    : 'Never'

  const travelHubs = row.travel_times
    ? Object.entries(row.travel_times)
        .map(([hub, minutes]) => `${hub} ${minutes}m`)
        .join(' · ')
    : null

  return (
    <tr className="hover:bg-gray-50 dark:hover:bg-gray-800/50">
      <td className="px-4 py-3">
        <Link href={`/admin/destinations/${row.id}`} className="flex items-center gap-2 group">
          <Globe2 className="w-4 h-4 text-gray-400 group-hover:text-teal-500" />
          <div>
            <span className="font-medium text-gray-900 dark:text-white group-hover:text-teal-600 dark:group-hover:text-teal-400 block">
              {row.name}
            </span>
            {row.region && (
              <span className="text-xs text-gray-500 dark:text-gray-400">{row.region}</span>
            )}
          </div>
        </Link>
      </td>
      <td className="px-4 py-3 text-xs text-gray-600 dark:text-gray-300">
        {row.min_viable_days ? (
          <div>
            <span className="font-medium">min {row.min_viable_days}d</span>
          </div>
        ) : (
          <div className="text-rose-500">no min days</div>
        )}
        {travelHubs ? (
          <div className="text-gray-500 dark:text-gray-400">{travelHubs}</div>
        ) : (
          <div className="text-rose-500">no travel times</div>
        )}
      </td>
      <td className="px-4 py-3">
        <div className="flex items-center gap-2">
          <div className="w-28 h-2 bg-gray-100 dark:bg-gray-800 rounded-full overflow-hidden">
            <div className={`h-full ${barColor}`} style={{ width: `${row.completeness}%` }} />
          </div>
          <span className="text-sm font-medium text-gray-700 dark:text-gray-300 tabular-nums">
            {row.completeness}%
          </span>
        </div>
      </td>
      <td className="px-4 py-3">
        <span className={`px-2 py-1 text-xs font-medium rounded ${STATUS_PILL[row.status]}`}>
          {STATUS_LABEL[row.status]}
        </span>
      </td>
      <td className={`px-4 py-3 text-sm tabular-nums ${row.stale ? 'text-rose-600 dark:text-rose-400 font-medium' : 'text-gray-600 dark:text-gray-300'}`}>
        {verifiedLabel}
      </td>
    </tr>
  )
}
