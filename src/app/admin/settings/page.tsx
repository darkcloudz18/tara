'use client'

import { useState } from 'react'
import {
  Settings,
  Bell,
  Shield,
  Database,
  Mail,
  Globe,
  Save,
  Loader2,
} from 'lucide-react'
import { useToast } from '@/contexts/ToastContext'

export default function AdminSettingsPage() {
  const { success } = useToast()
  const [saving, setSaving] = useState(false)
  const [settings, setSettings] = useState({
    siteName: 'Tara',
    siteDescription: 'Plan your perfect Philippine adventure',
    maintenanceMode: false,
    allowRegistration: true,
    requireEmailVerification: true,
    maxTripsPerUser: 50,
    maxPlacesPerTrip: 20,
    enableNotifications: true,
    enableEmailNotifications: true,
    moderatePublicTrips: false,
    autoFeatureTopTrips: false,
  })

  const handleSave = async () => {
    setSaving(true)
    // Simulate save
    await new Promise(resolve => setTimeout(resolve, 1000))
    setSaving(false)
    success('Settings saved')
  }

  return (
    <div className="p-6 lg:p-8">
      {/* Header */}
      <div className="mb-6 flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-bold text-gray-900 dark:text-white">Settings</h1>
          <p className="text-gray-500 dark:text-gray-400">Configure application settings</p>
        </div>
        <button
          onClick={handleSave}
          disabled={saving}
          className="flex items-center gap-2 px-4 py-2 bg-teal-600 text-white font-medium rounded-lg hover:bg-teal-700 disabled:opacity-50"
        >
          {saving ? (
            <Loader2 className="w-5 h-5 animate-spin" />
          ) : (
            <Save className="w-5 h-5" />
          )}
          Save Changes
        </button>
      </div>

      <div className="space-y-6">
        {/* General Settings */}
        <div className="bg-white dark:bg-gray-900 rounded-xl border border-gray-200 dark:border-gray-800 overflow-hidden">
          <div className="px-6 py-4 border-b border-gray-200 dark:border-gray-800 flex items-center gap-2">
            <Globe className="w-5 h-5 text-teal-600" />
            <h2 className="font-semibold text-gray-900 dark:text-white">General</h2>
          </div>
          <div className="p-6 space-y-4">
            <div>
              <label className="text-sm font-medium text-gray-700 dark:text-gray-300 mb-2 block">
                Site Name
              </label>
              <input
                type="text"
                value={settings.siteName}
                onChange={(e) => setSettings({ ...settings, siteName: e.target.value })}
                className="w-full max-w-md px-3 py-2 bg-gray-100 dark:bg-gray-800 rounded-lg border-0 focus:outline-none focus:ring-2 focus:ring-teal-500"
              />
            </div>
            <div>
              <label className="text-sm font-medium text-gray-700 dark:text-gray-300 mb-2 block">
                Site Description
              </label>
              <input
                type="text"
                value={settings.siteDescription}
                onChange={(e) => setSettings({ ...settings, siteDescription: e.target.value })}
                className="w-full max-w-md px-3 py-2 bg-gray-100 dark:bg-gray-800 rounded-lg border-0 focus:outline-none focus:ring-2 focus:ring-teal-500"
              />
            </div>
            <div className="flex items-center justify-between max-w-md">
              <div>
                <p className="font-medium text-gray-900 dark:text-white">Maintenance Mode</p>
                <p className="text-sm text-gray-500 dark:text-gray-400">
                  Only admins can access the site
                </p>
              </div>
              <button
                onClick={() => setSettings({ ...settings, maintenanceMode: !settings.maintenanceMode })}
                className={`w-12 h-6 rounded-full transition-colors ${
                  settings.maintenanceMode ? 'bg-teal-600' : 'bg-gray-300 dark:bg-gray-600'
                }`}
              >
                <div
                  className={`w-5 h-5 bg-white rounded-full shadow transform transition-transform ${
                    settings.maintenanceMode ? 'translate-x-6' : 'translate-x-0.5'
                  }`}
                />
              </button>
            </div>
          </div>
        </div>

        {/* User Settings */}
        <div className="bg-white dark:bg-gray-900 rounded-xl border border-gray-200 dark:border-gray-800 overflow-hidden">
          <div className="px-6 py-4 border-b border-gray-200 dark:border-gray-800 flex items-center gap-2">
            <Shield className="w-5 h-5 text-teal-600" />
            <h2 className="font-semibold text-gray-900 dark:text-white">Users & Registration</h2>
          </div>
          <div className="p-6 space-y-4">
            <div className="flex items-center justify-between max-w-md">
              <div>
                <p className="font-medium text-gray-900 dark:text-white">Allow Registration</p>
                <p className="text-sm text-gray-500 dark:text-gray-400">
                  New users can create accounts
                </p>
              </div>
              <button
                onClick={() => setSettings({ ...settings, allowRegistration: !settings.allowRegistration })}
                className={`w-12 h-6 rounded-full transition-colors ${
                  settings.allowRegistration ? 'bg-teal-600' : 'bg-gray-300 dark:bg-gray-600'
                }`}
              >
                <div
                  className={`w-5 h-5 bg-white rounded-full shadow transform transition-transform ${
                    settings.allowRegistration ? 'translate-x-6' : 'translate-x-0.5'
                  }`}
                />
              </button>
            </div>
            <div className="flex items-center justify-between max-w-md">
              <div>
                <p className="font-medium text-gray-900 dark:text-white">Require Email Verification</p>
                <p className="text-sm text-gray-500 dark:text-gray-400">
                  Users must verify email to use features
                </p>
              </div>
              <button
                onClick={() => setSettings({ ...settings, requireEmailVerification: !settings.requireEmailVerification })}
                className={`w-12 h-6 rounded-full transition-colors ${
                  settings.requireEmailVerification ? 'bg-teal-600' : 'bg-gray-300 dark:bg-gray-600'
                }`}
              >
                <div
                  className={`w-5 h-5 bg-white rounded-full shadow transform transition-transform ${
                    settings.requireEmailVerification ? 'translate-x-6' : 'translate-x-0.5'
                  }`}
                />
              </button>
            </div>
          </div>
        </div>

        {/* Limits */}
        <div className="bg-white dark:bg-gray-900 rounded-xl border border-gray-200 dark:border-gray-800 overflow-hidden">
          <div className="px-6 py-4 border-b border-gray-200 dark:border-gray-800 flex items-center gap-2">
            <Database className="w-5 h-5 text-teal-600" />
            <h2 className="font-semibold text-gray-900 dark:text-white">Limits</h2>
          </div>
          <div className="p-6 space-y-4">
            <div>
              <label className="text-sm font-medium text-gray-700 dark:text-gray-300 mb-2 block">
                Max Trips Per User
              </label>
              <input
                type="number"
                value={settings.maxTripsPerUser}
                onChange={(e) => setSettings({ ...settings, maxTripsPerUser: parseInt(e.target.value) || 0 })}
                className="w-32 px-3 py-2 bg-gray-100 dark:bg-gray-800 rounded-lg border-0 focus:outline-none focus:ring-2 focus:ring-teal-500"
              />
            </div>
            <div>
              <label className="text-sm font-medium text-gray-700 dark:text-gray-300 mb-2 block">
                Max Places Per Trip
              </label>
              <input
                type="number"
                value={settings.maxPlacesPerTrip}
                onChange={(e) => setSettings({ ...settings, maxPlacesPerTrip: parseInt(e.target.value) || 0 })}
                className="w-32 px-3 py-2 bg-gray-100 dark:bg-gray-800 rounded-lg border-0 focus:outline-none focus:ring-2 focus:ring-teal-500"
              />
            </div>
          </div>
        </div>

        {/* Notifications */}
        <div className="bg-white dark:bg-gray-900 rounded-xl border border-gray-200 dark:border-gray-800 overflow-hidden">
          <div className="px-6 py-4 border-b border-gray-200 dark:border-gray-800 flex items-center gap-2">
            <Bell className="w-5 h-5 text-teal-600" />
            <h2 className="font-semibold text-gray-900 dark:text-white">Notifications</h2>
          </div>
          <div className="p-6 space-y-4">
            <div className="flex items-center justify-between max-w-md">
              <div>
                <p className="font-medium text-gray-900 dark:text-white">In-App Notifications</p>
                <p className="text-sm text-gray-500 dark:text-gray-400">
                  Show notifications within the app
                </p>
              </div>
              <button
                onClick={() => setSettings({ ...settings, enableNotifications: !settings.enableNotifications })}
                className={`w-12 h-6 rounded-full transition-colors ${
                  settings.enableNotifications ? 'bg-teal-600' : 'bg-gray-300 dark:bg-gray-600'
                }`}
              >
                <div
                  className={`w-5 h-5 bg-white rounded-full shadow transform transition-transform ${
                    settings.enableNotifications ? 'translate-x-6' : 'translate-x-0.5'
                  }`}
                />
              </button>
            </div>
            <div className="flex items-center justify-between max-w-md">
              <div>
                <p className="font-medium text-gray-900 dark:text-white">Email Notifications</p>
                <p className="text-sm text-gray-500 dark:text-gray-400">
                  Send notifications via email
                </p>
              </div>
              <button
                onClick={() => setSettings({ ...settings, enableEmailNotifications: !settings.enableEmailNotifications })}
                className={`w-12 h-6 rounded-full transition-colors ${
                  settings.enableEmailNotifications ? 'bg-teal-600' : 'bg-gray-300 dark:bg-gray-600'
                }`}
              >
                <div
                  className={`w-5 h-5 bg-white rounded-full shadow transform transition-transform ${
                    settings.enableEmailNotifications ? 'translate-x-6' : 'translate-x-0.5'
                  }`}
                />
              </button>
            </div>
          </div>
        </div>

        {/* Content Moderation */}
        <div className="bg-white dark:bg-gray-900 rounded-xl border border-gray-200 dark:border-gray-800 overflow-hidden">
          <div className="px-6 py-4 border-b border-gray-200 dark:border-gray-800 flex items-center gap-2">
            <Settings className="w-5 h-5 text-teal-600" />
            <h2 className="font-semibold text-gray-900 dark:text-white">Content Moderation</h2>
          </div>
          <div className="p-6 space-y-4">
            <div className="flex items-center justify-between max-w-md">
              <div>
                <p className="font-medium text-gray-900 dark:text-white">Moderate Public Trips</p>
                <p className="text-sm text-gray-500 dark:text-gray-400">
                  Require approval before trips go public
                </p>
              </div>
              <button
                onClick={() => setSettings({ ...settings, moderatePublicTrips: !settings.moderatePublicTrips })}
                className={`w-12 h-6 rounded-full transition-colors ${
                  settings.moderatePublicTrips ? 'bg-teal-600' : 'bg-gray-300 dark:bg-gray-600'
                }`}
              >
                <div
                  className={`w-5 h-5 bg-white rounded-full shadow transform transition-transform ${
                    settings.moderatePublicTrips ? 'translate-x-6' : 'translate-x-0.5'
                  }`}
                />
              </button>
            </div>
            <div className="flex items-center justify-between max-w-md">
              <div>
                <p className="font-medium text-gray-900 dark:text-white">Auto-Feature Top Trips</p>
                <p className="text-sm text-gray-500 dark:text-gray-400">
                  Automatically feature popular trips
                </p>
              </div>
              <button
                onClick={() => setSettings({ ...settings, autoFeatureTopTrips: !settings.autoFeatureTopTrips })}
                className={`w-12 h-6 rounded-full transition-colors ${
                  settings.autoFeatureTopTrips ? 'bg-teal-600' : 'bg-gray-300 dark:bg-gray-600'
                }`}
              >
                <div
                  className={`w-5 h-5 bg-white rounded-full shadow transform transition-transform ${
                    settings.autoFeatureTopTrips ? 'translate-x-6' : 'translate-x-0.5'
                  }`}
                />
              </button>
            </div>
          </div>
        </div>
      </div>
    </div>
  )
}
