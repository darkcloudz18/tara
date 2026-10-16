'use client'

import { useState } from 'react'
import { useRouter } from 'next/navigation'
import Link from 'next/link'
import { ArrowLeft, Loader2 } from 'lucide-react'
import { adminService } from '@/features/admin/services/adminService'
import { useToast } from '@/contexts/ToastContext'

// Minimal create-and-redirect. The real editing happens in
// /admin/places/[id] — this just captures the two columns places.name +
// places.location that are NOT NULL on the existing table, then opens
// the editor. is_active defaults to false so the row stays off Discover
// until the editor explicitly flips it.

export default function AdminPlaceCreatePage() {
  const router = useRouter()
  const { error } = useToast()
  const [name, setName] = useState('')
  const [location, setLocation] = useState('')
  const [saving, setSaving] = useState(false)

  const handleCreate = async () => {
    if (!name.trim() || !location.trim()) return
    setSaving(true)
    const id = await adminService.createDraftPlace({
      name: name.trim(),
      location: location.trim(),
    })
    setSaving(false)
    if (!id) {
      error('Failed to create place')
      return
    }
    router.push(`/admin/places/${id}`)
  }

  return (
    <div className="p-6 lg:p-8 max-w-xl">
      <div className="mb-6 flex items-center gap-3">
        <Link
          href="/admin/places"
          className="p-2 hover:bg-gray-200 dark:hover:bg-gray-800 rounded-lg"
          aria-label="Back to queue"
        >
          <ArrowLeft className="w-5 h-5" />
        </Link>
        <h1 className="text-2xl font-bold text-gray-900 dark:text-white">New place</h1>
      </div>

      <div className="rounded-xl border border-gray-200 dark:border-gray-800 bg-white dark:bg-gray-900 p-6 space-y-4">
        <div>
          <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1.5">Name</label>
          <input
            autoFocus
            className="w-full px-3 py-2 bg-gray-50 dark:bg-gray-800 border border-gray-200 dark:border-gray-700 rounded-lg text-sm"
            value={name}
            onChange={(e) => setName(e.target.value)}
            placeholder="Big Lagoon"
          />
        </div>

        <div>
          <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1.5">Location</label>
          <p className="text-xs text-gray-500 dark:text-gray-400 mb-1.5">
            Short label stored on the existing places.location column, e.g. "El Nido, Palawan". The structured destination fk is set in the editor.
          </p>
          <input
            className="w-full px-3 py-2 bg-gray-50 dark:bg-gray-800 border border-gray-200 dark:border-gray-700 rounded-lg text-sm"
            value={location}
            onChange={(e) => setLocation(e.target.value)}
            placeholder="El Nido, Palawan"
          />
        </div>

        <div className="pt-2 flex justify-end">
          <button
            onClick={handleCreate}
            disabled={saving || !name.trim() || !location.trim()}
            className="inline-flex items-center gap-2 px-4 py-2 bg-teal-600 text-white font-medium rounded-lg hover:bg-teal-700 disabled:opacity-50"
          >
            {saving && <Loader2 className="w-4 h-4 animate-spin" />}
            Create draft
          </button>
        </div>
      </div>
    </div>
  )
}
