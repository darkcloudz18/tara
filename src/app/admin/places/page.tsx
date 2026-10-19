'use client'

import { useEffect, useMemo, useRef, useState } from 'react'
import Link from 'next/link'
import { Plus, Loader2, MapPin, Search, X } from 'lucide-react'
import {
  adminService,
  AdminPlaceQueueRow,
  PLACE_CATEGORY_OPTIONS,
  type PlaceQueueSort,
} from '@/features/admin/services/adminService'

type StatusFilter = '' | 'draft' | 'published' | 'needs_review'

// Debounce the search box so we don't re-query on every keystroke. 300ms
// is the standard typing pause; faster feels jittery, slower feels dead.
function useDebounced<T>(value: T, delay: number): T {
  const [debounced, setDebounced] = useState(value)
  useEffect(() => {
    const t = setTimeout(() => setDebounced(value), delay)
    return () => clearTimeout(t)
  }, [value, delay])
  return debounced
}

const STATUS_LABEL: Record<AdminPlaceQueueRow['status'], string> = {
  draft: 'Draft',
  published: 'Published',
  needs_review: 'Needs review',
}

const STATUS_PILL: Record<AdminPlaceQueueRow['status'], string> = {
  draft: 'bg-gray-100 text-gray-700 dark:bg-gray-800 dark:text-gray-300',
  published: 'bg-emerald-100 text-emerald-700 dark:bg-emerald-900/40 dark:text-emerald-300',
  needs_review: 'bg-amber-100 text-amber-700 dark:bg-amber-900/40 dark:text-amber-300',
}

export default function AdminPlacesPage() {
  const [rows, setRows] = useState<AdminPlaceQueueRow[]>([])
  const [destinations, setDestinations] = useState<{ id: string; name: string }[]>([])
  const [loading, setLoading] = useState(true)
  const [totalInDb, setTotalInDb] = useState<number | null>(null)

  const [destinationFilter, setDestinationFilter] = useState<string>('')
  const [statusFilter, setStatusFilter] = useState<StatusFilter>('')
  const [categoryFilter, setCategoryFilter] = useState<string>('')
  const [incompleteOnly, setIncompleteOnly] = useState(false)
  const [staleOnly, setStaleOnly] = useState(false)
  const [sort, setSort] = useState<PlaceQueueSort>('completeness')
  const [search, setSearch] = useState('')
  const debouncedSearch = useDebounced(search, 300)
  const searchRef = useRef<HTMLInputElement | null>(null)

  useEffect(() => {
    adminService.getDestinationsForFilter().then(setDestinations)
    // Unfiltered row count once at mount so 'Showing X of Y' has a stable
    // total. Pulled via the queue too so it bakes in RLS.
    adminService.getPlaceQueue({}).then((all) => setTotalInDb(all.length))
  }, [])

  useEffect(() => {
    setLoading(true)
    adminService
      .getPlaceQueue({
        destinationId: destinationFilter || undefined,
        status: statusFilter || undefined,
        category: categoryFilter || undefined,
        search: debouncedSearch || undefined,
        incomplete: incompleteOnly,
        stale: staleOnly,
        sort,
      })
      .then((data) => setRows(data))
      .finally(() => setLoading(false))
  }, [destinationFilter, statusFilter, categoryFilter, debouncedSearch, incompleteOnly, staleOnly, sort])

  // '/' focuses search unless the user is already typing in another input.
  useEffect(() => {
    const handler = (e: KeyboardEvent) => {
      if (e.key !== '/' || e.metaKey || e.ctrlKey) return
      const target = e.target as HTMLElement | null
      const tag = target?.tagName
      if (tag === 'INPUT' || tag === 'TEXTAREA' || target?.isContentEditable) return
      e.preventDefault()
      searchRef.current?.focus()
    }
    window.addEventListener('keydown', handler)
    return () => window.removeEventListener('keydown', handler)
  }, [])

  const summary = useMemo(() => {
    if (rows.length === 0) return { avg: 0, publishable: 0 }
    const total = rows.reduce((n, r) => n + r.completeness, 0)
    return {
      avg: Math.round(total / rows.length),
      publishable: rows.filter((r) => r.status === 'published').length,
    }
  }, [rows])

  const hasAnyFilter = Boolean(
    destinationFilter || statusFilter || categoryFilter || debouncedSearch || incompleteOnly || staleOnly,
  )

  const clearFilters = () => {
    setDestinationFilter('')
    setStatusFilter('')
    setCategoryFilter('')
    setSearch('')
    setIncompleteOnly(false)
    setStaleOnly(false)
  }

  const showing = rows.length
  const total = totalInDb ?? showing
  const countLabel = hasAnyFilter
    ? `Showing ${showing} of ${total}`
    : `${total} total`

  return (
    <div className="p-6 lg:p-8">
      {/* Header */}
      <div className="mb-6 flex flex-wrap items-start justify-between gap-4">
        <div>
          <h1 className="text-2xl font-bold text-gray-900 dark:text-white">Places</h1>
          <p className="text-gray-500 dark:text-gray-400">
            {countLabel} · {summary.publishable} published · avg completeness {summary.avg}%
          </p>
        </div>
        <Link
          href="/admin/places/new"
          className="inline-flex items-center gap-2 px-4 py-2 bg-teal-600 text-white font-medium rounded-lg hover:bg-teal-700"
        >
          <Plus className="w-5 h-5" />
          New place
        </Link>
      </div>

      {/* Search */}
      <div className="mb-3 relative max-w-xl">
        <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-gray-400" aria-hidden="true" />
        <input
          ref={searchRef}
          type="search"
          value={search}
          onChange={(e) => setSearch(e.target.value)}
          placeholder="Search name or location… (press / to focus)"
          className="w-full pl-9 pr-9 py-2 bg-white dark:bg-gray-900 border border-gray-200 dark:border-gray-800 rounded-lg text-sm text-gray-900 dark:text-white placeholder-gray-400 focus:outline-none focus:ring-2 focus:ring-teal-500"
          aria-label="Search places"
        />
        {search && (
          <button
            type="button"
            onClick={() => {
              setSearch('')
              searchRef.current?.focus()
            }}
            className="absolute right-2 top-1/2 -translate-y-1/2 p-1 text-gray-400 hover:text-gray-600 dark:hover:text-gray-200"
            aria-label="Clear search"
          >
            <X className="w-4 h-4" />
          </button>
        )}
      </div>

      {/* Filters */}
      <div className="mb-4 flex flex-wrap items-center gap-3">
        <select
          value={destinationFilter}
          onChange={(e) => setDestinationFilter(e.target.value)}
          className="px-3 py-2 bg-white dark:bg-gray-900 border border-gray-200 dark:border-gray-800 rounded-lg text-sm"
          aria-label="Filter by destination"
        >
          <option value="">All destinations</option>
          {destinations.map((d) => (
            <option key={d.id} value={d.id}>{d.name}</option>
          ))}
        </select>

        <select
          value={statusFilter}
          onChange={(e) => setStatusFilter(e.target.value as StatusFilter)}
          className="px-3 py-2 bg-white dark:bg-gray-900 border border-gray-200 dark:border-gray-800 rounded-lg text-sm"
          aria-label="Filter by status"
        >
          <option value="">All statuses</option>
          <option value="draft">Draft</option>
          <option value="published">Published</option>
          <option value="needs_review">Needs review</option>
        </select>

        <select
          value={categoryFilter}
          onChange={(e) => setCategoryFilter(e.target.value)}
          className="px-3 py-2 bg-white dark:bg-gray-900 border border-gray-200 dark:border-gray-800 rounded-lg text-sm"
          aria-label="Filter by category"
        >
          <option value="">All categories</option>
          {PLACE_CATEGORY_OPTIONS.map((c) => (
            <option key={c} value={c} className="capitalize">{c}</option>
          ))}
        </select>

        <label className="inline-flex items-center gap-2 px-3 py-2 bg-white dark:bg-gray-900 border border-gray-200 dark:border-gray-800 rounded-lg text-sm cursor-pointer">
          <input
            type="checkbox"
            checked={incompleteOnly}
            onChange={(e) => setIncompleteOnly(e.target.checked)}
          />
          Incomplete only
        </label>

        <label className="inline-flex items-center gap-2 px-3 py-2 bg-white dark:bg-gray-900 border border-gray-200 dark:border-gray-800 rounded-lg text-sm cursor-pointer">
          <input
            type="checkbox"
            checked={staleOnly}
            onChange={(e) => setStaleOnly(e.target.checked)}
          />
          Stale only
        </label>

        <div className="ml-auto flex items-center gap-2">
          <label className="text-xs text-gray-500 dark:text-gray-400" htmlFor="sort">Sort</label>
          <select
            id="sort"
            value={sort}
            onChange={(e) => setSort(e.target.value as PlaceQueueSort)}
            className="px-3 py-2 bg-white dark:bg-gray-900 border border-gray-200 dark:border-gray-800 rounded-lg text-sm"
          >
            <option value="completeness">Worst first</option>
            <option value="name">Name A→Z</option>
            <option value="verified_at">Recently verified</option>
          </select>
        </div>

        {hasAnyFilter && (
          <button
            type="button"
            onClick={clearFilters}
            className="text-xs text-gray-500 dark:text-gray-400 underline underline-offset-2 hover:no-underline"
          >
            Clear all filters
          </button>
        )}
      </div>

      {/* Queue */}
      <div className="bg-white dark:bg-gray-900 rounded-xl border border-gray-200 dark:border-gray-800 overflow-hidden">
        {loading ? (
          <div className="flex justify-center py-12">
            <Loader2 className="w-8 h-8 text-teal-600 animate-spin" />
          </div>
        ) : rows.length === 0 ? (
          <div className="py-12 text-center text-gray-500 dark:text-gray-400">
            No places match these filters.
          </div>
        ) : (
          <div className="overflow-x-auto">
            <table className="w-full">
              <thead>
                <tr className="border-b border-gray-200 dark:border-gray-800 bg-gray-50 dark:bg-gray-800/50">
                  <th className="px-4 py-3 text-left text-xs font-semibold text-gray-500 dark:text-gray-400 uppercase">Name</th>
                  <th className="px-4 py-3 text-left text-xs font-semibold text-gray-500 dark:text-gray-400 uppercase">Destination</th>
                  <th className="px-4 py-3 text-left text-xs font-semibold text-gray-500 dark:text-gray-400 uppercase">Completeness</th>
                  <th className="px-4 py-3 text-left text-xs font-semibold text-gray-500 dark:text-gray-400 uppercase">Status</th>
                  <th className="px-4 py-3 text-left text-xs font-semibold text-gray-500 dark:text-gray-400 uppercase">Last verified</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-gray-100 dark:divide-gray-800">
                {rows.map((r) => (
                  <PlaceRow key={r.id} row={r} />
                ))}
              </tbody>
            </table>
          </div>
        )}
      </div>
    </div>
  )
}

function PlaceRow({ row }: { row: AdminPlaceQueueRow }) {
  const barColor =
    row.completeness >= 80
      ? 'bg-emerald-500'
      : row.completeness >= 50
      ? 'bg-amber-500'
      : 'bg-rose-500'

  const verifiedLabel = row.verified_at
    ? new Date(row.verified_at).toLocaleDateString('en-GB', { day: '2-digit', month: 'short', year: 'numeric' })
    : 'Never'

  return (
    <tr className="hover:bg-gray-50 dark:hover:bg-gray-800/50">
      <td className="px-4 py-3">
        <Link href={`/admin/places/${row.id}`} className="flex items-center gap-2 group">
          <MapPin className="w-4 h-4 text-gray-400 group-hover:text-teal-500" />
          <span className="font-medium text-gray-900 dark:text-white group-hover:text-teal-600 dark:group-hover:text-teal-400">
            {row.name}
          </span>
        </Link>
      </td>
      <td className="px-4 py-3 text-sm text-gray-600 dark:text-gray-300">
        {row.destination_name ?? <span className="text-gray-400">—</span>}
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
