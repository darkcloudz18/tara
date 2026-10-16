'use client'

import { useEffect, useState } from 'react'
import Link from 'next/link'
import { Loader2, ShieldCheck, MapPin, Globe2 } from 'lucide-react'
import { adminService } from '@/features/admin/services/adminService'
import { useUser } from '@/contexts/UserContext'
import { useToast } from '@/contexts/ToastContext'

// Staleness queue — places + destinations whose verified_at is older
// than 6 months OR never set. Oldest first. One-click re-verify.
// Editor + admin accessible via the admin layout's nav filter.

type StaleRows = {
  places: { id: string; name: string; verified_at: string | null; destination_name: string | null }[]
  destinations: { id: string; name: string; verified_at: string | null }[]
}

export default function AdminReviewPage() {
  const { user } = useUser()
  const { success, error } = useToast()
  const [rows, setRows] = useState<StaleRows>({ places: [], destinations: [] })
  const [loading, setLoading] = useState(true)
  const [workingId, setWorkingId] = useState<string | null>(null)

  const refresh = async () => {
    setLoading(true)
    const data = await adminService.getStaleContent()
    setRows(data)
    setLoading(false)
  }

  useEffect(() => {
    refresh()
  }, [])

  const reverifyPlace = async (id: string) => {
    if (!user?.email) {
      error('Need to be signed in')
      return
    }
    setWorkingId(id)
    const ok = await adminService.markPlaceVerified(id, user.email)
    setWorkingId(null)
    if (!ok) {
      error('Failed to re-verify')
      return
    }
    success('Re-verified')
    await refresh()
  }

  const reverifyDestination = async (id: string) => {
    if (!user?.email) {
      error('Need to be signed in')
      return
    }
    setWorkingId(id)
    const ok = await adminService.markDestinationVerified(id, user.email)
    setWorkingId(null)
    if (!ok) {
      error('Failed to re-verify')
      return
    }
    success('Re-verified')
    await refresh()
  }

  const totalStale = rows.places.length + rows.destinations.length

  return (
    <div className="p-6 lg:p-8">
      <div className="mb-6">
        <h1 className="text-2xl font-bold text-gray-900 dark:text-white">Review</h1>
        <p className="text-gray-500 dark:text-gray-400">
          {totalStale === 0
            ? 'All content verified within the last 6 months.'
            : `${totalStale} ${totalStale === 1 ? 'item' : 'items'} needing re-verification.`}
        </p>
      </div>

      {loading ? (
        <div className="flex justify-center py-12">
          <Loader2 className="w-8 h-8 text-teal-600 animate-spin" />
        </div>
      ) : totalStale === 0 ? (
        <div className="rounded-xl border border-gray-200 dark:border-gray-800 bg-white dark:bg-gray-900 p-8 text-center text-gray-500 dark:text-gray-400">
          <ShieldCheck className="w-10 h-10 text-emerald-500 mx-auto mb-3" />
          Nothing stale right now. Come back after a research pass.
        </div>
      ) : (
        <div className="space-y-6">
          <StaleSection
            icon={<MapPin className="w-5 h-5 text-teal-500" />}
            title={`Places (${rows.places.length})`}
            emptyLabel="No stale places."
            rows={rows.places.map((p) => ({
              id: p.id,
              href: `/admin/places/${p.id}`,
              name: p.name,
              sub: p.destination_name,
              verifiedAt: p.verified_at,
              onReverify: () => reverifyPlace(p.id),
            }))}
            workingId={workingId}
          />
          <StaleSection
            icon={<Globe2 className="w-5 h-5 text-teal-500" />}
            title={`Destinations (${rows.destinations.length})`}
            emptyLabel="No stale destinations."
            rows={rows.destinations.map((d) => ({
              id: d.id,
              href: `/admin/destinations/${d.id}`,
              name: d.name,
              sub: null,
              verifiedAt: d.verified_at,
              onReverify: () => reverifyDestination(d.id),
            }))}
            workingId={workingId}
          />
        </div>
      )}
    </div>
  )
}

function StaleSection({
  icon,
  title,
  emptyLabel,
  rows,
  workingId,
}: {
  icon: React.ReactNode
  title: string
  emptyLabel: string
  rows: {
    id: string
    href: string
    name: string
    sub: string | null
    verifiedAt: string | null
    onReverify: () => void
  }[]
  workingId: string | null
}) {
  return (
    <section className="rounded-xl border border-gray-200 dark:border-gray-800 bg-white dark:bg-gray-900 overflow-hidden">
      <header className="px-4 py-3 border-b border-gray-200 dark:border-gray-800 flex items-center gap-2">
        {icon}
        <h2 className="font-semibold text-gray-900 dark:text-white">{title}</h2>
      </header>
      {rows.length === 0 ? (
        <p className="px-4 py-6 text-sm text-gray-500 dark:text-gray-400">{emptyLabel}</p>
      ) : (
        <ul className="divide-y divide-gray-100 dark:divide-gray-800">
          {rows.map((r) => (
            <li key={r.id} className="px-4 py-3 flex items-center justify-between gap-4">
              <div className="min-w-0">
                <Link
                  href={r.href}
                  className="font-medium text-gray-900 dark:text-white hover:text-teal-600 dark:hover:text-teal-400 block truncate"
                >
                  {r.name}
                </Link>
                <p className="text-xs text-gray-500 dark:text-gray-400 truncate">
                  {r.sub ? <>{r.sub} · </> : null}
                  Last verified{' '}
                  {r.verifiedAt
                    ? new Date(r.verifiedAt).toLocaleDateString('en-GB', { day: '2-digit', month: 'short', year: 'numeric' })
                    : 'never'}
                </p>
              </div>
              <button
                type="button"
                onClick={r.onReverify}
                disabled={workingId === r.id}
                className="inline-flex items-center gap-1 px-3 py-1.5 text-sm bg-teal-600 text-white font-medium rounded-lg hover:bg-teal-700 disabled:opacity-50 flex-shrink-0"
              >
                {workingId === r.id ? <Loader2 className="w-4 h-4 animate-spin" /> : <ShieldCheck className="w-4 h-4" />}
                Re-verify
              </button>
            </li>
          ))}
        </ul>
      )}
    </section>
  )
}
