'use client'

export const dynamic = 'force-dynamic'

import { useState } from 'react'
import Link from 'next/link'
import { useRouter } from 'next/navigation'
import { supabase } from '@/lib/supabase'

export default function RegisterPage() {
  const router = useRouter()
  const [formData, setFormData] = useState({
    email: '',
    password: '',
    confirmPassword: '',
    firstName: '',
    lastName: '',
    phone: '',
    // Account types - user can select multiple
    isTraveler: true,
    isCreator: false,
    isSupplier: false,
    // For suppliers
    businessName: '',
    businessType: 'hotel' as 'hotel' | 'resort' | 'hostel' | 'tour' | 'activity' | 'transport',
    location: '',
  })
  const [error, setError] = useState('')
  const [loading, setLoading] = useState(false)

  const handleChange = (e: React.ChangeEvent<HTMLInputElement | HTMLSelectElement>) => {
    const { name, value, type } = e.target
    if (type === 'checkbox') {
      setFormData({
        ...formData,
        [name]: (e.target as HTMLInputElement).checked,
      })
    } else {
      setFormData({
        ...formData,
        [name]: value,
      })
    }
  }

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()
    setError('')

    // Validation
    if (formData.password !== formData.confirmPassword) {
      setError('Passwords do not match')
      return
    }

    if (formData.password.length < 6) {
      setError('Password must be at least 6 characters')
      return
    }

    if (!formData.isTraveler && !formData.isCreator && !formData.isSupplier) {
      setError('Please select at least one account type')
      return
    }

    if (formData.isSupplier && !formData.businessName) {
      setError('Business name is required for suppliers')
      return
    }

    setLoading(true)

    try {
      // Sign up the user
      const { data: authData, error: authError } = await supabase.auth.signUp({
        email: formData.email,
        password: formData.password,
      })

      if (authError) throw authError

      if (authData.user) {
        // Wait for session to be established (important for RLS policies)
        // This ensures auth.uid() is available for subsequent queries
        let session = authData.session
        if (!session) {
          // If no session returned (email confirmation might be pending),
          // try to get the current session
          const { data: sessionData } = await supabase.auth.getSession()
          session = sessionData.session
        }

        // If still no session, user might need to confirm email first
        if (!session) {
          setError('Please check your email to confirm your account, then log in.')
          setLoading(false)
          return
        }

        // Determine primary role (for backward compatibility)
        let primaryRole = 'traveler'
        if (formData.isSupplier) primaryRole = 'supplier'
        else if (formData.isCreator) primaryRole = 'creator'

        // Update profile with additional info
        const { error: profileError } = await supabase
          .from('profiles')
          .update({
            first_name: formData.firstName,
            last_name: formData.lastName,
            phone: formData.phone,
            role: primaryRole,
          })
          .eq('id', authData.user.id)

        if (profileError) {
          console.error('Profile update error:', profileError)
          throw profileError
        }

        // If user wants to be a creator, create creator record
        if (formData.isCreator) {
          const { error: creatorError } = await supabase
            .from('creators')
            .insert({
              id: authData.user.id,
            })

          if (creatorError) {
            console.error('Creator insert error:', creatorError)
            throw creatorError
          }
        }

        // If user wants to be a supplier, create supplier record
        if (formData.isSupplier) {
          const { error: supplierError } = await supabase
            .from('suppliers')
            .insert({
              id: authData.user.id,
              business_name: formData.businessName,
              business_type: formData.businessType,
              location: formData.location || 'Philippines',
            })

          if (supplierError) {
            console.error('Supplier insert error:', supplierError)
            throw supplierError
          }
        }

        // Redirect to dashboard
        router.push('/dashboard')
      }
    } catch (err: any) {
      setError(err.message || 'Failed to create account')
    } finally {
      setLoading(false)
    }
  }

  return (
    <div className="min-h-screen flex items-center justify-center bg-gray-50 py-12 px-4 sm:px-6 lg:px-8">
      <div className="max-w-md w-full space-y-8">
        <div>
          <Link href="/" className="text-center block">
            <h1 className="text-3xl font-bold text-primary-600">Tara</h1>
          </Link>
          <p className="mt-2 text-center text-sm text-gray-500">
            Your all-in-one travel platform for the Philippines
          </p>
          <h2 className="mt-6 text-center text-3xl font-bold text-gray-900">
            Create your account
          </h2>
          <p className="mt-2 text-center text-sm text-gray-600">
            Already have an account?{' '}
            <Link href="/login" className="text-primary-600 hover:text-primary-500">
              Sign in
            </Link>
          </p>
        </div>

        <form className="mt-8 space-y-6" onSubmit={handleSubmit}>
          {error && (
            <div className="bg-red-50 border border-red-200 text-red-600 px-4 py-3 rounded-lg">
              {error}
            </div>
          )}

          <div className="space-y-4">
            <div className="grid grid-cols-2 gap-4">
              <div>
                <label htmlFor="firstName" className="block text-sm font-medium text-gray-700 mb-1">
                  First Name
                </label>
                <input
                  id="firstName"
                  name="firstName"
                  type="text"
                  required
                  value={formData.firstName}
                  onChange={handleChange}
                  className="input-field"
                />
              </div>
              <div>
                <label htmlFor="lastName" className="block text-sm font-medium text-gray-700 mb-1">
                  Last Name
                </label>
                <input
                  id="lastName"
                  name="lastName"
                  type="text"
                  required
                  value={formData.lastName}
                  onChange={handleChange}
                  className="input-field"
                />
              </div>
            </div>

            <div>
              <label htmlFor="email" className="block text-sm font-medium text-gray-700 mb-1">
                Email address
              </label>
              <input
                id="email"
                name="email"
                type="email"
                autoComplete="email"
                required
                value={formData.email}
                onChange={handleChange}
                className="input-field"
              />
            </div>

            <div>
              <label htmlFor="phone" className="block text-sm font-medium text-gray-700 mb-1">
                Phone Number
              </label>
              <input
                id="phone"
                name="phone"
                type="tel"
                value={formData.phone}
                onChange={handleChange}
                className="input-field"
                placeholder="+63 XXX XXX XXXX"
              />
            </div>

            {/* Account Types - Multi-select */}
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-2">
                I want to (select all that apply)
              </label>
              <div className="space-y-3">
                <label className="flex items-start gap-3 p-3 border rounded-lg cursor-pointer hover:bg-gray-50">
                  <input
                    type="checkbox"
                    name="isTraveler"
                    checked={formData.isTraveler}
                    onChange={handleChange}
                    className="mt-1"
                  />
                  <div>
                    <div className="font-medium text-gray-900">Traveler</div>
                    <div className="text-sm text-gray-500">Plan trips, book hotels & tours, explore destinations</div>
                  </div>
                </label>

                <label className="flex items-start gap-3 p-3 border rounded-lg cursor-pointer hover:bg-gray-50">
                  <input
                    type="checkbox"
                    name="isCreator"
                    checked={formData.isCreator}
                    onChange={handleChange}
                    className="mt-1"
                  />
                  <div>
                    <div className="font-medium text-gray-900">Content Creator</div>
                    <div className="text-sm text-gray-500">Share travel content & earn affiliate commissions</div>
                  </div>
                </label>

                <label className="flex items-start gap-3 p-3 border rounded-lg cursor-pointer hover:bg-gray-50">
                  <input
                    type="checkbox"
                    name="isSupplier"
                    checked={formData.isSupplier}
                    onChange={handleChange}
                    className="mt-1"
                  />
                  <div>
                    <div className="font-medium text-gray-900">Supplier / Business</div>
                    <div className="text-sm text-gray-500">List your hotel, resort, tours, or transport services</div>
                  </div>
                </label>
              </div>
            </div>

            {/* Supplier-specific fields */}
            {formData.isSupplier && (
              <div className="space-y-4 p-4 bg-gray-50 rounded-lg">
                <h3 className="font-medium text-gray-900">Business Information</h3>
                <div>
                  <label htmlFor="businessName" className="block text-sm font-medium text-gray-700 mb-1">
                    Business Name
                  </label>
                  <input
                    id="businessName"
                    name="businessName"
                    type="text"
                    required
                    value={formData.businessName}
                    onChange={handleChange}
                    className="input-field"
                    placeholder="Your hotel, resort, or tour company name"
                  />
                </div>
                <div>
                  <label htmlFor="businessType" className="block text-sm font-medium text-gray-700 mb-1">
                    Business Type
                  </label>
                  <select
                    id="businessType"
                    name="businessType"
                    value={formData.businessType}
                    onChange={handleChange}
                    className="input-field"
                  >
                    <option value="hotel">Hotel</option>
                    <option value="resort">Resort</option>
                    <option value="hostel">Hostel</option>
                    <option value="tour">Tour Operator</option>
                    <option value="activity">Activity Provider</option>
                    <option value="transport">Transport Service</option>
                  </select>
                </div>
                <div>
                  <label htmlFor="location" className="block text-sm font-medium text-gray-700 mb-1">
                    Location
                  </label>
                  <input
                    id="location"
                    name="location"
                    type="text"
                    value={formData.location}
                    onChange={handleChange}
                    className="input-field"
                    placeholder="e.g., Boracay, Palawan, Cebu"
                  />
                </div>
              </div>
            )}

            <div>
              <label htmlFor="password" className="block text-sm font-medium text-gray-700 mb-1">
                Password
              </label>
              <input
                id="password"
                name="password"
                type="password"
                autoComplete="new-password"
                required
                value={formData.password}
                onChange={handleChange}
                className="input-field"
                placeholder="At least 6 characters"
              />
            </div>

            <div>
              <label htmlFor="confirmPassword" className="block text-sm font-medium text-gray-700 mb-1">
                Confirm Password
              </label>
              <input
                id="confirmPassword"
                name="confirmPassword"
                type="password"
                autoComplete="new-password"
                required
                value={formData.confirmPassword}
                onChange={handleChange}
                className="input-field"
              />
            </div>
          </div>

          <div>
            <button
              type="submit"
              disabled={loading}
              className="w-full btn-primary disabled:opacity-50 disabled:cursor-not-allowed"
            >
              {loading ? 'Creating account...' : 'Create account'}
            </button>
          </div>

          <p className="text-xs text-gray-500 text-center">
            By creating an account, you agree to our Terms of Service and Privacy Policy
          </p>
        </form>
      </div>
    </div>
  )
}
