'use client'

export const dynamic = 'force-dynamic'

import { useEffect, useState } from 'react'
import { useRouter } from 'next/navigation'
import Link from 'next/link'
import { supabase } from '@/lib/supabase'
import { Profile, Creator, Supplier } from '@/types/database'

interface DashboardData {
  profile: Profile | null
  creator: Creator | null
  supplier: Supplier | null
  stats: {
    itinerariesCount: number
    bookingsCount: number
    savedPlaces: number
  }
}

interface UpgradeModalProps {
  type: 'creator' | 'supplier'
  onClose: () => void
  onSuccess: () => void
}

export default function DashboardPage() {
  const router = useRouter()
  const [data, setData] = useState<DashboardData>({
    profile: null,
    creator: null,
    supplier: null,
    stats: { itinerariesCount: 0, bookingsCount: 0, savedPlaces: 0 }
  })
  const [loading, setLoading] = useState(true)
  const [upgrading, setUpgrading] = useState<'creator' | 'supplier' | null>(null)
  const [upgradeError, setUpgradeError] = useState('')
  const [showSupplierForm, setShowSupplierForm] = useState(false)
  const [supplierForm, setSupplierForm] = useState({
    businessName: '',
    businessType: 'hotel' as 'hotel' | 'resort' | 'hostel' | 'tour' | 'activity' | 'transport',
    location: ''
  })

  useEffect(() => {
    loadDashboard()
  }, [])

  const loadDashboard = async () => {
    try {
      const { data: { user } } = await supabase.auth.getUser()

      if (!user) {
        router.push('/login')
        return
      }

      // Fetch user profile
      const { data: profile } = await supabase
        .from('profiles')
        .select('*')
        .eq('id', user.id)
        .single()

      // Check if user is a creator
      const { data: creator } = await supabase
        .from('creators')
        .select('*')
        .eq('id', user.id)
        .single()

      // Check if user is a supplier
      const { data: supplier } = await supabase
        .from('suppliers')
        .select('*')
        .eq('id', user.id)
        .single()

      // Get stats
      const { count: itinerariesCount } = await supabase
        .from('itineraries')
        .select('*', { count: 'exact', head: true })
        .eq('user_id', user.id)

      const { count: bookingsCount } = await supabase
        .from('bookings')
        .select('*', { count: 'exact', head: true })
        .eq('user_id', user.id)

      setData({
        profile,
        creator,
        supplier,
        stats: {
          itinerariesCount: itinerariesCount || 0,
          bookingsCount: bookingsCount || 0,
          savedPlaces: 0
        }
      })
    } catch (error) {
      console.error('Error loading dashboard:', error)
    } finally {
      setLoading(false)
    }
  }

  const handleLogout = async () => {
    await supabase.auth.signOut()
    router.push('/')
  }

  const handleBecomeCreator = async () => {
    setUpgrading('creator')
    setUpgradeError('')
    try {
      const { data: { user } } = await supabase.auth.getUser()
      if (!user) throw new Error('Not authenticated')

      const { error } = await supabase.from('creators').insert({ id: user.id })
      if (error) throw error

      await loadDashboard()
    } catch (err: any) {
      console.error('Error becoming creator:', err)
      setUpgradeError(err.message || 'Failed to become creator')
    } finally {
      setUpgrading(null)
    }
  }

  const handleBecomeSupplier = async () => {
    if (!supplierForm.businessName) {
      setUpgradeError('Business name is required')
      return
    }
    setUpgrading('supplier')
    setUpgradeError('')
    try {
      const { data: { user } } = await supabase.auth.getUser()
      if (!user) throw new Error('Not authenticated')

      const { error } = await supabase.from('suppliers').insert({
        id: user.id,
        business_name: supplierForm.businessName,
        business_type: supplierForm.businessType,
        location: supplierForm.location || 'Philippines'
      })
      if (error) throw error

      setShowSupplierForm(false)
      await loadDashboard()
    } catch (err: any) {
      console.error('Error becoming supplier:', err)
      setUpgradeError(err.message || 'Failed to become supplier')
    } finally {
      setUpgrading(null)
    }
  }

  if (loading) {
    return (
      <div className="min-h-screen flex items-center justify-center">
        <div className="text-xl">Loading...</div>
      </div>
    )
  }

  const { profile, creator, supplier, stats } = data

  return (
    <div className="min-h-screen bg-gray-50">
      {/* Header */}
      <header className="bg-white shadow-sm">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-4 flex justify-between items-center">
          <Link href="/" className="text-2xl font-bold text-primary-600">Tara</Link>
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
        {/* Welcome Section */}
        <div className="mb-8">
          <h2 className="text-3xl font-bold mb-2">
            Welcome back, {profile?.first_name || 'Traveler'}!
          </h2>
          <p className="text-gray-600">
            Ready for your next adventure in the Philippines?
          </p>

          {/* Account Type Badges */}
          <div className="flex gap-2 mt-3">
            <span className="px-3 py-1 bg-blue-100 text-blue-800 rounded-full text-sm">
              Traveler
            </span>
            {creator && (
              <span className="px-3 py-1 bg-purple-100 text-purple-800 rounded-full text-sm">
                Creator {creator.verified && '✓'}
              </span>
            )}
            {supplier && (
              <span className="px-3 py-1 bg-green-100 text-green-800 rounded-full text-sm">
                Supplier {supplier.verified && '✓'}
              </span>
            )}
          </div>

          {/* Upgrade Account Options */}
          {(!creator || !supplier) && (
            <div className="mt-4 p-4 bg-gray-100 rounded-lg">
              <p className="text-sm text-gray-600 mb-3">Expand your account:</p>
              {upgradeError && (
                <p className="text-sm text-red-600 mb-2">{upgradeError}</p>
              )}
              <div className="flex flex-wrap gap-2">
                {!creator && (
                  <button
                    onClick={handleBecomeCreator}
                    disabled={upgrading === 'creator'}
                    className="px-4 py-2 bg-purple-600 text-white rounded-lg text-sm hover:bg-purple-700 disabled:opacity-50"
                  >
                    {upgrading === 'creator' ? 'Processing...' : 'Become a Creator'}
                  </button>
                )}
                {!supplier && !showSupplierForm && (
                  <button
                    onClick={() => setShowSupplierForm(true)}
                    className="px-4 py-2 bg-green-600 text-white rounded-lg text-sm hover:bg-green-700"
                  >
                    Become a Supplier
                  </button>
                )}
              </div>
              {showSupplierForm && (
                <div className="mt-4 p-4 bg-white rounded-lg space-y-3">
                  <h4 className="font-medium">Business Information</h4>
                  <input
                    type="text"
                    placeholder="Business Name *"
                    value={supplierForm.businessName}
                    onChange={(e) => setSupplierForm({ ...supplierForm, businessName: e.target.value })}
                    className="w-full px-3 py-2 border rounded-lg"
                  />
                  <select
                    value={supplierForm.businessType}
                    onChange={(e) => setSupplierForm({ ...supplierForm, businessType: e.target.value as any })}
                    className="w-full px-3 py-2 border rounded-lg"
                  >
                    <option value="hotel">Hotel</option>
                    <option value="resort">Resort</option>
                    <option value="hostel">Hostel</option>
                    <option value="tour">Tour Operator</option>
                    <option value="activity">Activity Provider</option>
                    <option value="transport">Transport Service</option>
                  </select>
                  <input
                    type="text"
                    placeholder="Location (e.g., Boracay)"
                    value={supplierForm.location}
                    onChange={(e) => setSupplierForm({ ...supplierForm, location: e.target.value })}
                    className="w-full px-3 py-2 border rounded-lg"
                  />
                  <div className="flex gap-2">
                    <button
                      onClick={handleBecomeSupplier}
                      disabled={upgrading === 'supplier'}
                      className="px-4 py-2 bg-green-600 text-white rounded-lg text-sm hover:bg-green-700 disabled:opacity-50"
                    >
                      {upgrading === 'supplier' ? 'Processing...' : 'Submit'}
                    </button>
                    <button
                      onClick={() => setShowSupplierForm(false)}
                      className="px-4 py-2 bg-gray-300 text-gray-700 rounded-lg text-sm hover:bg-gray-400"
                    >
                      Cancel
                    </button>
                  </div>
                </div>
              )}
            </div>
          )}
        </div>

        {/* Quick Stats */}
        <div className="grid grid-cols-1 md:grid-cols-4 gap-6 mb-8">
          <div className="card">
            <h3 className="text-gray-600 text-sm mb-1">Trips Planned</h3>
            <p className="text-3xl font-bold">{stats.itinerariesCount}</p>
          </div>
          <div className="card">
            <h3 className="text-gray-600 text-sm mb-1">Bookings</h3>
            <p className="text-3xl font-bold">{stats.bookingsCount}</p>
          </div>
          {creator && (
            <>
              <div className="card">
                <h3 className="text-gray-600 text-sm mb-1">Followers</h3>
                <p className="text-3xl font-bold">{creator.total_followers}</p>
              </div>
              <div className="card">
                <h3 className="text-gray-600 text-sm mb-1">Earnings</h3>
                <p className="text-3xl font-bold">₱{creator.total_earnings.toLocaleString()}</p>
              </div>
            </>
          )}
          {supplier && (
            <>
              <div className="card">
                <h3 className="text-gray-600 text-sm mb-1">Total Bookings</h3>
                <p className="text-3xl font-bold">{supplier.total_bookings}</p>
              </div>
              <div className="card">
                <h3 className="text-gray-600 text-sm mb-1">Revenue</h3>
                <p className="text-3xl font-bold">₱{supplier.total_revenue.toLocaleString()}</p>
              </div>
            </>
          )}
        </div>

        {/* Quick Actions - Traveler */}
        <div className="card mb-6">
          <h3 className="text-xl font-semibold mb-4">Quick Actions</h3>
          <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
            <button className="btn-primary text-left p-4 flex items-center gap-3">
              <span className="text-2xl">🗺️</span>
              <div>
                <div className="font-semibold">Plan a Trip</div>
                <div className="text-sm opacity-90">Create a new itinerary</div>
              </div>
            </button>
            <button className="btn-secondary text-left p-4 flex items-center gap-3">
              <span className="text-2xl">🏨</span>
              <div>
                <div className="font-semibold">Find Hotels</div>
                <div className="text-sm opacity-90">Browse accommodations</div>
              </div>
            </button>
            <button className="btn-secondary text-left p-4 flex items-center gap-3">
              <span className="text-2xl">🏝️</span>
              <div>
                <div className="font-semibold">Explore</div>
                <div className="text-sm opacity-90">Discover destinations</div>
              </div>
            </button>
          </div>
        </div>

        {/* Creator Section */}
        {creator && (
          <div className="card mb-6 border-l-4 border-purple-500">
            <h3 className="text-xl font-semibold mb-4 flex items-center gap-2">
              <span>📸</span> Creator Dashboard
            </h3>
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              <button className="btn-secondary text-left p-4 flex items-center gap-3">
                <span className="text-2xl">✏️</span>
                <div>
                  <div className="font-semibold">Create Post</div>
                  <div className="text-sm text-gray-500">Share your travel story</div>
                </div>
              </button>
              <button className="btn-secondary text-left p-4 flex items-center gap-3">
                <span className="text-2xl">📊</span>
                <div>
                  <div className="font-semibold">Analytics</div>
                  <div className="text-sm text-gray-500">View your performance</div>
                </div>
              </button>
            </div>
            <div className="mt-4 p-4 bg-purple-50 rounded-lg">
              <p className="text-sm text-purple-800">
                <strong>Commission Rate:</strong> {(creator.commission_rate * 100).toFixed(0)}% •
                <strong> Posts:</strong> {creator.total_posts} •
                <strong> Views:</strong> {creator.total_views.toLocaleString()}
              </p>
            </div>
          </div>
        )}

        {/* Supplier Section */}
        {supplier && (
          <div className="card mb-6 border-l-4 border-green-500">
            <h3 className="text-xl font-semibold mb-4 flex items-center gap-2">
              <span>🏢</span> {supplier.business_name}
            </h3>
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              <button className="btn-secondary text-left p-4 flex items-center gap-3">
                <span className="text-2xl">➕</span>
                <div>
                  <div className="font-semibold">Add Listing</div>
                  <div className="text-sm text-gray-500">Create new {supplier.business_type}</div>
                </div>
              </button>
              <button className="btn-secondary text-left p-4 flex items-center gap-3">
                <span className="text-2xl">📋</span>
                <div>
                  <div className="font-semibold">Manage Bookings</div>
                  <div className="text-sm text-gray-500">View reservations</div>
                </div>
              </button>
            </div>
            <div className="mt-4 p-4 bg-green-50 rounded-lg">
              <p className="text-sm text-green-800">
                <strong>Type:</strong> {supplier.business_type} •
                <strong> Location:</strong> {supplier.location} •
                <strong> Rating:</strong> {supplier.average_rating > 0 ? `${supplier.average_rating}/5` : 'No reviews yet'}
                {!supplier.verified && <span className="ml-2 text-yellow-600">• Pending verification</span>}
              </p>
            </div>
          </div>
        )}

        {/* Recent Activity */}
        <div className="card">
          <h3 className="text-xl font-semibold mb-4">Recent Activity</h3>
          <p className="text-gray-500 text-center py-8">
            No recent activity yet. Start by planning your first trip!
          </p>
        </div>

        {/* Popular Destinations */}
        <div className="card mt-6">
          <h3 className="text-xl font-semibold mb-4">Popular Destinations</h3>
          <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
            {['Boracay', 'Palawan', 'Siargao', 'Cebu'].map((place) => (
              <div key={place} className="p-4 bg-gray-100 rounded-lg text-center hover:bg-gray-200 cursor-pointer">
                <div className="text-2xl mb-2">🏝️</div>
                <div className="font-medium">{place}</div>
              </div>
            ))}
          </div>
        </div>
      </main>
    </div>
  )
}
