'use client'

export const dynamic = 'force-dynamic'

import { useEffect, useState } from 'react'
import { useRouter } from 'next/navigation'
import { supabase } from '@/lib/supabase'
import { Profile } from '@/types/database'

export default function DashboardPage() {
  const router = useRouter()
  const [profile, setProfile] = useState<Profile | null>(null)
  const [loading, setLoading] = useState(true)

  useEffect(() => {
    checkUser()
  }, [])

  const checkUser = async () => {
    try {
      const { data: { user } } = await supabase.auth.getUser()

      if (!user) {
        router.push('/login')
        return
      }

      // Fetch user profile
      const { data: profileData, error } = await supabase
        .from('profiles')
        .select('*')
        .eq('id', user.id)
        .single()

      if (error) throw error

      setProfile(profileData)
    } catch (error) {
      console.error('Error fetching user:', error)
      router.push('/login')
    } finally {
      setLoading(false)
    }
  }

  const handleLogout = async () => {
    await supabase.auth.signOut()
    router.push('/')
  }

  if (loading) {
    return (
      <div className="min-h-screen flex items-center justify-center">
        <div className="text-xl">Loading...</div>
      </div>
    )
  }

  return (
    <div className="min-h-screen bg-gray-50">
      {/* Header */}
      <header className="bg-white shadow-sm">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-4 flex justify-between items-center">
          <h1 className="text-2xl font-bold text-primary-600">WorkFinder</h1>
          <div className="flex items-center gap-4">
            <span className="text-gray-600">
              {profile?.first_name} {profile?.last_name}
            </span>
            <button onClick={handleLogout} className="btn-secondary text-sm">
              Logout
            </button>
          </div>
        </div>
      </header>

      {/* Main Content */}
      <main className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
        <div className="mb-8">
          <h2 className="text-3xl font-bold mb-2">
            Welcome back, {profile?.first_name}!
          </h2>
          <p className="text-gray-600">
            {profile?.role === 'customer'
              ? 'Find and book skilled workers for your needs'
              : 'Manage your bookings and grow your business'}
          </p>
        </div>

        {/* Quick Stats */}
        <div className="grid grid-cols-1 md:grid-cols-3 gap-6 mb-8">
          <div className="card">
            <h3 className="text-gray-600 text-sm mb-1">Active Bookings</h3>
            <p className="text-3xl font-bold">0</p>
          </div>
          <div className="card">
            <h3 className="text-gray-600 text-sm mb-1">Completed Jobs</h3>
            <p className="text-3xl font-bold">0</p>
          </div>
          <div className="card">
            <h3 className="text-gray-600 text-sm mb-1">
              {profile?.role === 'customer' ? 'Total Spent' : 'Total Earned'}
            </h3>
            <p className="text-3xl font-bold">₱0</p>
          </div>
        </div>

        {/* Quick Actions */}
        <div className="card">
          <h3 className="text-xl font-semibold mb-4">Quick Actions</h3>
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            {profile?.role === 'customer' ? (
              <>
                <button className="btn-primary text-left p-4">
                  🔍 Find Workers
                </button>
                <button className="btn-secondary text-left p-4">
                  📋 View My Bookings
                </button>
              </>
            ) : (
              <>
                <button className="btn-primary text-left p-4">
                  ✏️ Complete Profile
                </button>
                <button className="btn-secondary text-left p-4">
                  📋 View My Jobs
                </button>
              </>
            )}
          </div>
        </div>

        {/* Recent Activity */}
        <div className="card mt-6">
          <h3 className="text-xl font-semibold mb-4">Recent Activity</h3>
          <p className="text-gray-500 text-center py-8">No recent activity</p>
        </div>
      </main>
    </div>
  )
}
