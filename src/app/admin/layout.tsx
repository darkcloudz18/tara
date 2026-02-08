'use client'

import { useState, useEffect } from 'react'
import { useRouter, usePathname } from 'next/navigation'
import Link from 'next/link'
import {
  LayoutDashboard,
  Users,
  Map,
  FileText,
  Flag,
  Sparkles,
  Settings,
  LogOut,
  Menu,
  X,
  Shield,
} from 'lucide-react'
import { supabase } from '@/lib/supabase'
import { adminService } from '@/features/admin/services/adminService'

const NAV_ITEMS = [
  { href: '/admin', icon: LayoutDashboard, label: 'Dashboard' },
  { href: '/admin/users', icon: Users, label: 'Users' },
  { href: '/admin/trips', icon: Map, label: 'Trips' },
  { href: '/admin/places', icon: FileText, label: 'Places' },
  { href: '/admin/reports', icon: Flag, label: 'Reports' },
  { href: '/admin/featured', icon: Sparkles, label: 'Featured' },
  { href: '/admin/settings', icon: Settings, label: 'Settings' },
]

export default function AdminLayout({ children }: { children: React.ReactNode }) {
  const router = useRouter()
  const pathname = usePathname()
  const [loading, setLoading] = useState(true)
  const [isAdmin, setIsAdmin] = useState(false)
  const [sidebarOpen, setSidebarOpen] = useState(false)
  const [user, setUser] = useState<any>(null)

  useEffect(() => {
    const checkAdmin = async () => {
      const { data: { user } } = await supabase.auth.getUser()

      if (!user) {
        router.push('/login?redirect=/admin')
        return
      }

      setUser(user)
      const admin = await adminService.isAdmin()

      if (!admin) {
        router.push('/')
        return
      }

      setIsAdmin(true)
      setLoading(false)
    }

    checkAdmin()
  }, [router])

  const handleLogout = async () => {
    await supabase.auth.signOut()
    router.push('/login')
  }

  if (loading) {
    return (
      <div className="min-h-screen bg-gray-100 dark:bg-gray-950 flex items-center justify-center">
        <div className="text-center">
          <Shield className="w-12 h-12 text-teal-600 animate-pulse mx-auto mb-4" />
          <p className="text-gray-600 dark:text-gray-400">Verifying admin access...</p>
        </div>
      </div>
    )
  }

  if (!isAdmin) {
    return null
  }

  return (
    <div className="min-h-screen bg-gray-100 dark:bg-gray-950">
      {/* Mobile sidebar toggle */}
      <div className="lg:hidden fixed top-4 left-4 z-50">
        <button
          onClick={() => setSidebarOpen(!sidebarOpen)}
          className="p-2 bg-white dark:bg-gray-800 rounded-lg shadow-lg"
        >
          {sidebarOpen ? <X className="w-6 h-6" /> : <Menu className="w-6 h-6" />}
        </button>
      </div>

      {/* Sidebar */}
      <aside
        className={`fixed inset-y-0 left-0 z-40 w-64 bg-white dark:bg-gray-900 border-r border-gray-200 dark:border-gray-800 transform transition-transform lg:translate-x-0 ${
          sidebarOpen ? 'translate-x-0' : '-translate-x-full'
        }`}
      >
        {/* Logo */}
        <div className="px-6 py-6 border-b border-gray-200 dark:border-gray-800">
          <Link href="/admin" className="flex items-center gap-3">
            <div className="w-10 h-10 bg-gradient-to-br from-red-500 to-orange-500 rounded-xl flex items-center justify-center">
              <Shield className="w-6 h-6 text-white" />
            </div>
            <div>
              <span className="text-xl font-bold text-gray-900 dark:text-white">Admin</span>
              <p className="text-xs text-gray-500 dark:text-gray-400">Tara Dashboard</p>
            </div>
          </Link>
        </div>

        {/* Navigation */}
        <nav className="px-4 py-6 space-y-1">
          {NAV_ITEMS.map((item) => {
            const isActive = pathname === item.href || (item.href !== '/admin' && pathname.startsWith(item.href))
            const Icon = item.icon

            return (
              <Link
                key={item.href}
                href={item.href}
                onClick={() => setSidebarOpen(false)}
                className={`flex items-center gap-3 px-4 py-3 rounded-xl transition-colors ${
                  isActive
                    ? 'bg-teal-50 dark:bg-teal-900/30 text-teal-600 dark:text-teal-400'
                    : 'text-gray-600 dark:text-gray-400 hover:bg-gray-100 dark:hover:bg-gray-800'
                }`}
              >
                <Icon className="w-5 h-5" />
                <span className="font-medium">{item.label}</span>
              </Link>
            )
          })}
        </nav>

        {/* User info */}
        <div className="absolute bottom-0 left-0 right-0 p-4 border-t border-gray-200 dark:border-gray-800">
          <div className="flex items-center gap-3 px-2 py-2">
            <div className="w-10 h-10 rounded-full bg-gradient-to-br from-teal-400 to-blue-500 flex items-center justify-center text-white font-bold">
              {user?.email?.charAt(0).toUpperCase()}
            </div>
            <div className="flex-1 min-w-0">
              <p className="text-sm font-medium text-gray-900 dark:text-white truncate">
                {user?.email?.split('@')[0]}
              </p>
              <p className="text-xs text-gray-500 dark:text-gray-400">Administrator</p>
            </div>
            <button
              onClick={handleLogout}
              className="p-2 text-gray-400 hover:text-red-500 rounded-lg hover:bg-gray-100 dark:hover:bg-gray-800"
            >
              <LogOut className="w-5 h-5" />
            </button>
          </div>
        </div>
      </aside>

      {/* Overlay */}
      {sidebarOpen && (
        <div
          className="fixed inset-0 bg-black/50 z-30 lg:hidden"
          onClick={() => setSidebarOpen(false)}
        />
      )}

      {/* Main content */}
      <main className="lg:ml-64 min-h-screen">
        {children}
      </main>
    </div>
  )
}
