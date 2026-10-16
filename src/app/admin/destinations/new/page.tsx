'use client'

import { useState } from 'react'
import { useRouter } from 'next/navigation'
import Link from 'next/link'
import { ArrowLeft, Loader2 } from 'lucide-react'
import { adminService } from '@/features/admin/services/adminService'
import { useToast } from '@/contexts/ToastContext'

// Minimal create-and-redirect. Takes the two columns the schema needs
// (name + slug), then opens the full editor. Everything else — Smart
// Build fields, tips, sources — is filled in /admin/destinations/[id].

export default function AdminDestinationCreatePage() {
  const router = useRouter()
  const { error } = useToast()
  const [name, setName] = useState('')
  const [slug, setSlug] = useState('')
  const [saving, setSaving] = useState(false)

  const slugify = (s: string) =>
    s
      .toLowerCase()
      .trim()
      .replace(/[^a-z0-9\s-]/g, '')
      .replace(/\s+/g, '-')
      .replace(/-+/g, '-')

  const handleNameChange = (next: string) => {
    setName(next)
    // Auto-populate slug only while the editor hasn't touched it.
    if (slug === '' || slug === slugify(name)) {
      setSlug(slugify(next))
    }
  }

  const handleCreate = async () => {
    if (!name.trim() || !slug.trim()) return
    setSaving(true)
    const id = await adminService.createDraftDestination({
      name: name.trim(),
      slug: slug.trim(),
    })
    setSaving(false)
    if (!id) {
      error('Failed to create destination. Slug might already be in use.')
      return
    }
    router.push(`/admin/destinations/${id}`)
  }

  return (
    <div className="p-6 lg:p-8 max-w-xl">
      <div className="mb-6 flex items-center gap-3">
        <Link
          href="/admin/destinations"
          className="p-2 hover:bg-gray-200 dark:hover:bg-gray-800 rounded-lg"
          aria-label="Back to queue"
        >
          <ArrowLeft className="w-5 h-5" />
        </Link>
        <h1 className="text-2xl font-bold text-gray-900 dark:text-white">New destination</h1>
      </div>

      <div className="rounded-xl border border-gray-200 dark:border-gray-800 bg-white dark:bg-gray-900 p-6 space-y-4">
        <div>
          <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1.5">Name</label>
          <input
            autoFocus
            className="w-full px-3 py-2 bg-gray-50 dark:bg-gray-800 border border-gray-200 dark:border-gray-700 rounded-lg text-sm"
            value={name}
            onChange={(e) => handleNameChange(e.target.value)}
            placeholder="El Nido"
          />
        </div>

        <div>
          <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1.5">Slug</label>
          <p className="text-xs text-gray-500 dark:text-gray-400 mb-1.5">
            URL path: <span className="font-mono">/destinations/{slug || '…'}</span>. Must be unique.
          </p>
          <input
            className="w-full px-3 py-2 bg-gray-50 dark:bg-gray-800 border border-gray-200 dark:border-gray-700 rounded-lg text-sm"
            value={slug}
            onChange={(e) => setSlug(e.target.value)}
            placeholder="el-nido"
          />
        </div>

        <div className="pt-2 flex justify-end">
          <button
            onClick={handleCreate}
            disabled={saving || !name.trim() || !slug.trim()}
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
