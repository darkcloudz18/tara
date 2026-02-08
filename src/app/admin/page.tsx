'use client'

import { useState, useEffect } from 'react'
import {
  Users,
  Map,
  MapPin,
  Globe,
  Flag,
  TrendingUp,
  Activity,
  Loader2,
} from 'lucide-react'
import { adminService, AdminStats } from '@/features/admin/services/adminService'
import { formatDistanceToNow } from 'date-fns'

export default function AdminDashboard() {
  const [stats, setStats] = useState<AdminStats | null>(null)
  const [activityLog, setActivityLog] = useState<any[]>([])
  const [loading, setLoading] = useState(true)

  useEffect(() => {
    loadData()
  }, [])

  const loadData = async () => {
    setLoading(true)
    const [statsData, logData] = await Promise.all([
      adminService.getStats(),
      adminService.getActivityLog(10),
    ])
    setStats(statsData)
    setActivityLog(logData)
    setLoading(false)
  }

  if (loading) {
    return (
      <div className="flex items-center justify-center min-h-screen">
        <Loader2 className="w-8 h-8 text-teal-600 animate-spin" />
      </div>
    )
  }

  const statCards = [
    { label: 'Total Users', value: stats?.totalUsers || 0, icon: Users, color: 'bg-blue-500' },
    { label: 'Total Trips', value: stats?.totalTrips || 0, icon: Map, color: 'bg-teal-500' },
    { label: 'Total Places', value: stats?.totalPlaces || 0, icon: MapPin, color: 'bg-purple-500' },
    { label: 'Public Trips', value: stats?.publicTrips || 0, icon: Globe, color: 'bg-green-500' },
    { label: 'Pending Reports', value: stats?.pendingReports || 0, icon: Flag, color: 'bg-red-500' },
    { label: 'New Users (7d)', value: stats?.newUsersThisWeek || 0, icon: TrendingUp, color: 'bg-orange-500' },
  ]

  return (
    <div className="p-6 lg:p-8">
      {/* Header */}
      <div className="mb-8">
        <h1 className="text-2xl font-bold text-gray-900 dark:text-white">Dashboard</h1>
        <p className="text-gray-500 dark:text-gray-400">Welcome to Tara Admin Panel</p>
      </div>

      {/* Stats Grid */}
      <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-6 gap-4 mb-8">
        {statCards.map((stat) => {
          const Icon = stat.icon
          return (
            <div
              key={stat.label}
              className="bg-white dark:bg-gray-900 rounded-xl border border-gray-200 dark:border-gray-800 p-4"
            >
              <div className={`w-10 h-10 ${stat.color} rounded-lg flex items-center justify-center mb-3`}>
                <Icon className="w-5 h-5 text-white" />
              </div>
              <p className="text-2xl font-bold text-gray-900 dark:text-white">
                {stat.value.toLocaleString()}
              </p>
              <p className="text-sm text-gray-500 dark:text-gray-400">{stat.label}</p>
            </div>
          )
        })}
      </div>

      {/* Two columns */}
      <div className="grid lg:grid-cols-2 gap-6">
        {/* Recent Activity */}
        <div className="bg-white dark:bg-gray-900 rounded-xl border border-gray-200 dark:border-gray-800">
          <div className="px-4 py-4 border-b border-gray-200 dark:border-gray-800 flex items-center gap-2">
            <Activity className="w-5 h-5 text-teal-600" />
            <h2 className="font-semibold text-gray-900 dark:text-white">Recent Activity</h2>
          </div>
          <div className="divide-y divide-gray-100 dark:divide-gray-800">
            {activityLog.length === 0 ? (
              <div className="p-8 text-center text-gray-500 dark:text-gray-400">
                No recent activity
              </div>
            ) : (
              activityLog.map((log) => (
                <div key={log.id} className="px-4 py-3">
                  <div className="flex items-center justify-between">
                    <div>
                      <p className="text-sm font-medium text-gray-900 dark:text-white">
                        {formatAction(log.action)}
                      </p>
                      <p className="text-xs text-gray-500 dark:text-gray-400">
                        by {log.admin?.first_name || log.admin?.username || 'Admin'}
                        {log.target_type && ` • ${log.target_type}`}
                      </p>
                    </div>
                    <span className="text-xs text-gray-400">
                      {formatDistanceToNow(new Date(log.created_at), { addSuffix: true })}
                    </span>
                  </div>
                </div>
              ))
            )}
          </div>
        </div>

        {/* Quick Actions */}
        <div className="bg-white dark:bg-gray-900 rounded-xl border border-gray-200 dark:border-gray-800">
          <div className="px-4 py-4 border-b border-gray-200 dark:border-gray-800">
            <h2 className="font-semibold text-gray-900 dark:text-white">Quick Actions</h2>
          </div>
          <div className="p-4 grid grid-cols-2 gap-3">
            <a
              href="/admin/users"
              className="flex items-center gap-3 p-4 bg-gray-50 dark:bg-gray-800 rounded-xl hover:bg-gray-100 dark:hover:bg-gray-700 transition-colors"
            >
              <Users className="w-6 h-6 text-blue-500" />
              <span className="font-medium text-gray-900 dark:text-white">Manage Users</span>
            </a>
            <a
              href="/admin/reports"
              className="flex items-center gap-3 p-4 bg-gray-50 dark:bg-gray-800 rounded-xl hover:bg-gray-100 dark:hover:bg-gray-700 transition-colors"
            >
              <Flag className="w-6 h-6 text-red-500" />
              <span className="font-medium text-gray-900 dark:text-white">View Reports</span>
            </a>
            <a
              href="/admin/places"
              className="flex items-center gap-3 p-4 bg-gray-50 dark:bg-gray-800 rounded-xl hover:bg-gray-100 dark:hover:bg-gray-700 transition-colors"
            >
              <MapPin className="w-6 h-6 text-purple-500" />
              <span className="font-medium text-gray-900 dark:text-white">Add Place</span>
            </a>
            <a
              href="/admin/trips"
              className="flex items-center gap-3 p-4 bg-gray-50 dark:bg-gray-800 rounded-xl hover:bg-gray-100 dark:hover:bg-gray-700 transition-colors"
            >
              <Map className="w-6 h-6 text-teal-500" />
              <span className="font-medium text-gray-900 dark:text-white">Moderate Trips</span>
            </a>
          </div>
        </div>
      </div>
    </div>
  )
}

function formatAction(action: string): string {
  const actions: Record<string, string> = {
    update_role: 'Updated user role',
    ban_user: 'Banned user',
    unban_user: 'Unbanned user',
    delete_trip: 'Deleted trip',
    create_place: 'Created place',
    update_place: 'Updated place',
    delete_place: 'Deleted place',
    review_report: 'Reviewed report',
  }
  return actions[action] || action
}
