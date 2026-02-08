'use client'

import { useState, useEffect } from 'react'
import {
  Search,
  MoreVertical,
  Shield,
  ShieldAlert,
  ShieldOff,
  Ban,
  CheckCircle,
  Loader2,
  ChevronLeft,
  ChevronRight,
} from 'lucide-react'
import { adminService, AdminUser } from '@/features/admin/services/adminService'
import { formatDistanceToNow } from 'date-fns'
import { useToast } from '@/contexts/ToastContext'

export default function AdminUsersPage() {
  const { success, error } = useToast()
  const [users, setUsers] = useState<AdminUser[]>([])
  const [total, setTotal] = useState(0)
  const [page, setPage] = useState(1)
  const [search, setSearch] = useState('')
  const [loading, setLoading] = useState(true)
  const [actionMenu, setActionMenu] = useState<string | null>(null)
  const [banModal, setBanModal] = useState<{ userId: string; username: string } | null>(null)
  const [banReason, setBanReason] = useState('')

  const limit = 20

  useEffect(() => {
    loadUsers()
  }, [page, search])

  const loadUsers = async () => {
    setLoading(true)
    const result = await adminService.getUsers(page, limit, search || undefined)
    setUsers(result.users)
    setTotal(result.total)
    setLoading(false)
  }

  const handleSearch = (e: React.FormEvent) => {
    e.preventDefault()
    setPage(1)
    loadUsers()
  }

  const handleRoleChange = async (userId: string, role: 'admin' | 'moderator' | 'user') => {
    const ok = await adminService.updateUserRole(userId, role)
    if (ok) {
      success(`User role updated to ${role}`)
      loadUsers()
    } else {
      error('Failed to update role')
    }
    setActionMenu(null)
  }

  const handleBan = async () => {
    if (!banModal) return

    const ok = await adminService.toggleBan(banModal.userId, true, banReason)
    if (ok) {
      success('User banned')
      loadUsers()
    } else {
      error('Failed to ban user')
    }
    setBanModal(null)
    setBanReason('')
  }

  const handleUnban = async (userId: string) => {
    const ok = await adminService.toggleBan(userId, false)
    if (ok) {
      success('User unbanned')
      loadUsers()
    } else {
      error('Failed to unban user')
    }
    setActionMenu(null)
  }

  const totalPages = Math.ceil(total / limit)

  return (
    <div className="p-6 lg:p-8">
      {/* Header */}
      <div className="mb-6">
        <h1 className="text-2xl font-bold text-gray-900 dark:text-white">Users</h1>
        <p className="text-gray-500 dark:text-gray-400">Manage user accounts and permissions</p>
      </div>

      {/* Search */}
      <form onSubmit={handleSearch} className="mb-6">
        <div className="relative max-w-md">
          <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-5 h-5 text-gray-400" />
          <input
            type="text"
            value={search}
            onChange={(e) => setSearch(e.target.value)}
            placeholder="Search users..."
            className="w-full pl-10 pr-4 py-2 bg-white dark:bg-gray-900 border border-gray-200 dark:border-gray-700 rounded-lg focus:outline-none focus:ring-2 focus:ring-teal-500"
          />
        </div>
      </form>

      {/* Users table */}
      <div className="bg-white dark:bg-gray-900 rounded-xl border border-gray-200 dark:border-gray-800 overflow-hidden">
        {loading ? (
          <div className="flex justify-center py-12">
            <Loader2 className="w-8 h-8 text-teal-600 animate-spin" />
          </div>
        ) : (
          <>
            <div className="overflow-x-auto">
              <table className="w-full">
                <thead>
                  <tr className="border-b border-gray-200 dark:border-gray-800 bg-gray-50 dark:bg-gray-800/50">
                    <th className="px-4 py-3 text-left text-xs font-semibold text-gray-500 dark:text-gray-400 uppercase">
                      User
                    </th>
                    <th className="px-4 py-3 text-left text-xs font-semibold text-gray-500 dark:text-gray-400 uppercase">
                      Role
                    </th>
                    <th className="px-4 py-3 text-left text-xs font-semibold text-gray-500 dark:text-gray-400 uppercase">
                      Status
                    </th>
                    <th className="px-4 py-3 text-left text-xs font-semibold text-gray-500 dark:text-gray-400 uppercase">
                      Joined
                    </th>
                    <th className="px-4 py-3 text-right text-xs font-semibold text-gray-500 dark:text-gray-400 uppercase">
                      Actions
                    </th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-gray-100 dark:divide-gray-800">
                  {users.map((user) => (
                    <tr key={user.id} className="hover:bg-gray-50 dark:hover:bg-gray-800/50">
                      <td className="px-4 py-3">
                        <div className="flex items-center gap-3">
                          {user.photo_url ? (
                            <img
                              src={user.photo_url}
                              alt=""
                              className="w-10 h-10 rounded-full object-cover"
                            />
                          ) : (
                            <div className="w-10 h-10 rounded-full bg-gradient-to-br from-teal-400 to-blue-500 flex items-center justify-center text-white font-bold">
                              {(user.first_name?.[0] || user.username?.[0] || user.email?.[0] || 'U').toUpperCase()}
                            </div>
                          )}
                          <div>
                            <p className="font-medium text-gray-900 dark:text-white">
                              {user.first_name && user.last_name
                                ? `${user.first_name} ${user.last_name}`
                                : user.username || 'No name'}
                            </p>
                            <p className="text-sm text-gray-500 dark:text-gray-400">
                              {user.email}
                            </p>
                          </div>
                        </div>
                      </td>
                      <td className="px-4 py-3">
                        {user.is_admin ? (
                          <span className="inline-flex items-center gap-1 px-2 py-1 bg-red-100 dark:bg-red-900/30 text-red-700 dark:text-red-400 text-xs font-medium rounded">
                            <Shield className="w-3 h-3" />
                            Admin
                          </span>
                        ) : user.is_moderator ? (
                          <span className="inline-flex items-center gap-1 px-2 py-1 bg-orange-100 dark:bg-orange-900/30 text-orange-700 dark:text-orange-400 text-xs font-medium rounded">
                            <ShieldAlert className="w-3 h-3" />
                            Moderator
                          </span>
                        ) : (
                          <span className="text-sm text-gray-500 dark:text-gray-400">User</span>
                        )}
                      </td>
                      <td className="px-4 py-3">
                        {user.is_banned ? (
                          <span className="inline-flex items-center gap-1 px-2 py-1 bg-red-100 dark:bg-red-900/30 text-red-700 dark:text-red-400 text-xs font-medium rounded">
                            <Ban className="w-3 h-3" />
                            Banned
                          </span>
                        ) : (
                          <span className="inline-flex items-center gap-1 px-2 py-1 bg-green-100 dark:bg-green-900/30 text-green-700 dark:text-green-400 text-xs font-medium rounded">
                            <CheckCircle className="w-3 h-3" />
                            Active
                          </span>
                        )}
                      </td>
                      <td className="px-4 py-3 text-sm text-gray-500 dark:text-gray-400">
                        {formatDistanceToNow(new Date(user.created_at), { addSuffix: true })}
                      </td>
                      <td className="px-4 py-3 text-right">
                        <div className="relative">
                          <button
                            onClick={() => setActionMenu(actionMenu === user.id ? null : user.id)}
                            className="p-2 text-gray-400 hover:text-gray-600 rounded-lg hover:bg-gray-100 dark:hover:bg-gray-800"
                          >
                            <MoreVertical className="w-5 h-5" />
                          </button>

                          {actionMenu === user.id && (
                            <div className="absolute right-0 top-full mt-1 w-48 bg-white dark:bg-gray-800 rounded-lg shadow-lg border border-gray-200 dark:border-gray-700 py-1 z-10">
                              <button
                                onClick={() => handleRoleChange(user.id, 'admin')}
                                className="w-full px-4 py-2 text-left text-sm hover:bg-gray-100 dark:hover:bg-gray-700 flex items-center gap-2"
                              >
                                <Shield className="w-4 h-4 text-red-500" />
                                Make Admin
                              </button>
                              <button
                                onClick={() => handleRoleChange(user.id, 'moderator')}
                                className="w-full px-4 py-2 text-left text-sm hover:bg-gray-100 dark:hover:bg-gray-700 flex items-center gap-2"
                              >
                                <ShieldAlert className="w-4 h-4 text-orange-500" />
                                Make Moderator
                              </button>
                              <button
                                onClick={() => handleRoleChange(user.id, 'user')}
                                className="w-full px-4 py-2 text-left text-sm hover:bg-gray-100 dark:hover:bg-gray-700 flex items-center gap-2"
                              >
                                <ShieldOff className="w-4 h-4 text-gray-500" />
                                Remove Role
                              </button>
                              <hr className="my-1 border-gray-200 dark:border-gray-700" />
                              {user.is_banned ? (
                                <button
                                  onClick={() => handleUnban(user.id)}
                                  className="w-full px-4 py-2 text-left text-sm hover:bg-gray-100 dark:hover:bg-gray-700 flex items-center gap-2 text-green-600"
                                >
                                  <CheckCircle className="w-4 h-4" />
                                  Unban User
                                </button>
                              ) : (
                                <button
                                  onClick={() => setBanModal({ userId: user.id, username: user.username || user.email })}
                                  className="w-full px-4 py-2 text-left text-sm hover:bg-gray-100 dark:hover:bg-gray-700 flex items-center gap-2 text-red-600"
                                >
                                  <Ban className="w-4 h-4" />
                                  Ban User
                                </button>
                              )}
                            </div>
                          )}
                        </div>
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>

            {/* Pagination */}
            <div className="px-4 py-3 border-t border-gray-200 dark:border-gray-800 flex items-center justify-between">
              <p className="text-sm text-gray-500 dark:text-gray-400">
                Showing {(page - 1) * limit + 1} to {Math.min(page * limit, total)} of {total}
              </p>
              <div className="flex gap-2">
                <button
                  onClick={() => setPage(page - 1)}
                  disabled={page === 1}
                  className="p-2 rounded-lg border border-gray-200 dark:border-gray-700 disabled:opacity-50 disabled:cursor-not-allowed hover:bg-gray-100 dark:hover:bg-gray-800"
                >
                  <ChevronLeft className="w-5 h-5" />
                </button>
                <button
                  onClick={() => setPage(page + 1)}
                  disabled={page >= totalPages}
                  className="p-2 rounded-lg border border-gray-200 dark:border-gray-700 disabled:opacity-50 disabled:cursor-not-allowed hover:bg-gray-100 dark:hover:bg-gray-800"
                >
                  <ChevronRight className="w-5 h-5" />
                </button>
              </div>
            </div>
          </>
        )}
      </div>

      {/* Ban Modal */}
      {banModal && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/60 backdrop-blur-sm">
          <div className="w-full max-w-md mx-4 bg-white dark:bg-gray-900 rounded-2xl shadow-2xl overflow-hidden">
            <div className="px-6 py-4 border-b border-gray-200 dark:border-gray-800">
              <h3 className="text-lg font-semibold text-gray-900 dark:text-white">
                Ban User
              </h3>
            </div>
            <div className="p-6">
              <p className="text-gray-600 dark:text-gray-400 mb-4">
                Are you sure you want to ban <strong>{banModal.username}</strong>?
              </p>
              <label className="text-sm font-medium text-gray-700 dark:text-gray-300 mb-2 block">
                Reason (optional)
              </label>
              <textarea
                value={banReason}
                onChange={(e) => setBanReason(e.target.value)}
                placeholder="Enter reason for ban..."
                rows={3}
                className="w-full px-3 py-2 bg-gray-100 dark:bg-gray-800 rounded-lg border-0 focus:outline-none focus:ring-2 focus:ring-red-500"
              />
            </div>
            <div className="px-6 py-4 border-t border-gray-200 dark:border-gray-800 flex gap-3">
              <button
                onClick={() => setBanModal(null)}
                className="flex-1 px-4 py-2 text-gray-700 dark:text-gray-300 font-medium hover:bg-gray-100 dark:hover:bg-gray-800 rounded-lg"
              >
                Cancel
              </button>
              <button
                onClick={handleBan}
                className="flex-1 px-4 py-2 bg-red-600 text-white font-medium rounded-lg hover:bg-red-700"
              >
                Ban User
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  )
}
