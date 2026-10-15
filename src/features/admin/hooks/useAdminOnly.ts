'use client'

import { useEffect, useState } from 'react'
import { useRouter } from 'next/navigation'
import { adminService } from '../services/adminService'

/**
 * Guard an admin page that editors should NOT reach. Editors land here if
 * they manually navigate — redirect them to the place queue, which is the
 * one admin surface they do have access to.
 *
 * The parent `/admin/layout.tsx` already confirmed `canEditPlaces()`, so
 * this hook only needs to narrow to admin-or-moderator (RLS enforces the
 * same on the API side regardless).
 */
export function useAdminOnly(): { ready: boolean } {
  const router = useRouter()
  const [ready, setReady] = useState(false)

  useEffect(() => {
    let cancelled = false
    adminService.isAdmin().then((admin) => {
      if (cancelled) return
      if (!admin) {
        router.replace('/admin/places')
        return
      }
      setReady(true)
    })
    return () => {
      cancelled = true
    }
  }, [router])

  return { ready }
}
