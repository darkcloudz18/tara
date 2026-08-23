'use client'

export const dynamic = 'force-dynamic'

import { useEffect, useState } from 'react'
import { useRouter } from 'next/navigation'
import { supabase, getUserSafe } from '@/lib/supabase'
import { Loader2 } from 'lucide-react'

export default function ProfileIndexPage() {
  const router = useRouter()
  const [loading, setLoading] = useState(true)

  useEffect(() => {
    redirectToProfile()
  }, [])

  const redirectToProfile = async () => {
    try {
      const user = await getUserSafe()

      if (!user) {
        router.push('/login')
        return
      }

      // Get user's profile to find username
      const { data: profile } = await supabase
        .from('profiles')
        .select('username')
        .eq('id', user.id)
        .single()

      // Redirect to profile page using username or ID
      const identifier = profile?.username || user.id
      router.replace(`/profile/${identifier}`)
    } catch (error) {
      console.error('Error redirecting to profile:', error)
      router.push('/dashboard')
    }
  }

  return (
    <div className="min-h-screen bg-white dark:bg-black flex items-center justify-center">
      <Loader2 className="w-8 h-8 text-teal-500 animate-spin" />
    </div>
  )
}
