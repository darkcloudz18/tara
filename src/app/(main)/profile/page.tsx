'use client'

export const dynamic = 'force-dynamic'

import { useEffect, useState } from 'react'
import { useRouter } from 'next/navigation'
import { supabase } from '@/lib/supabase'
import { useUser } from '@/contexts/UserContext'
import { Loader2 } from 'lucide-react'

export default function ProfileIndexPage() {
  const router = useRouter()
  const { user, loading: userLoading } = useUser()
  const [loading, setLoading] = useState(true)

  useEffect(() => {
    if (userLoading) return
    if (!user) {
      router.push('/login')
      return
    }
    redirectToProfile(user)
  }, [user, userLoading])

  const redirectToProfile = async (currentUser: NonNullable<typeof user>) => {
    try {
      const { data: profile } = await supabase
        .from('profiles')
        .select('username')
        .eq('id', currentUser.id)
        .single()

      const identifier = profile?.username || currentUser.id
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
