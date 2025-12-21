'use client'

import Link from 'next/link'
import { usePathname } from 'next/navigation'
import {
  Compass,
  Search,
  Map,
  PlusCircle,
  Bell,
  Settings,
  User,
  Moon,
  Sun,
  LogOut,
  HelpCircle,
} from 'lucide-react'
import { useState } from 'react'
import { useTheme } from '@/contexts/ThemeContext'
import BucketIcon from '@/components/icons/BucketIcon'

interface NavItem {
  icon: React.ComponentType<{ className?: string }>
  label: string
  href: string
  requiresAuth?: boolean
  badge?: number
}

interface SidebarProps {
  user: any
}

export default function Sidebar({ user }: SidebarProps) {
  const pathname = usePathname()
  const [collapsed, setCollapsed] = useState(false)
  const { resolvedTheme, toggleTheme } = useTheme()

  const isActive = (href: string) => {
    if (href === '/') return pathname === '/'
    return pathname.startsWith(href)
  }

  const mainNavItems: NavItem[] = [
    { icon: Compass, label: 'Discover', href: '/' },
    { icon: Search, label: 'Search', href: '/search' },
    { icon: Map, label: 'Destinations', href: '/destinations' },
  ]

  const tripNavItems: NavItem[] = [
    { icon: () => <BucketIcon className="w-6 h-6" />, label: 'Bucket List', href: '/planner', requiresAuth: true },
    { icon: PlusCircle, label: 'Plan a Trip', href: '/planner/new', requiresAuth: true },
  ]

  const accountNavItems: NavItem[] = [
    { icon: Bell, label: 'Notifications', href: '/notifications', requiresAuth: true, badge: 3 },
    { icon: User, label: 'Dashboard', href: '/dashboard', requiresAuth: true },
  ]

  const NavLink = ({ item }: { item: NavItem }) => {
    const active = isActive(item.href)
    const Icon = item.icon
    const href = item.requiresAuth && !user ? '/login' : item.href

    return (
      <Link
        href={href}
        className={`flex items-center gap-3 px-4 py-3 rounded-xl transition-all group ${
          active
            ? 'bg-teal-50 dark:bg-teal-900/30 text-teal-600 dark:text-teal-400'
            : 'text-gray-600 dark:text-gray-400 hover:bg-gray-100 dark:hover:bg-gray-800'
        }`}
      >
        <div className="relative">
          <Icon
            className={`w-6 h-6 transition-transform group-hover:scale-110 ${
              active ? 'text-teal-600 dark:text-teal-400' : ''
            }`}
          />
          {item.badge && item.badge > 0 && (
            <span className="absolute -top-1 -right-1 w-4 h-4 bg-coral-500 text-white text-[10px] font-bold rounded-full flex items-center justify-center">
              {item.badge}
            </span>
          )}
        </div>
        {!collapsed && (
          <span className={`text-sm font-medium ${active ? 'font-semibold' : ''}`}>
            {item.label}
          </span>
        )}
      </Link>
    )
  }

  return (
    <aside
      className={`fixed left-0 top-0 h-full bg-white dark:bg-gray-950 border-r border-gray-200 dark:border-gray-800 z-40 transition-all duration-300 ${
        collapsed ? 'w-[72px]' : 'w-[260px]'
      } hidden lg:flex flex-col`}
    >
      {/* Logo */}
      <div className="px-4 pt-6 pb-6">
        <Link href="/" className="flex items-center gap-3 px-2">
          <div className="w-10 h-10 bg-gradient-to-br from-teal-400 to-teal-600 rounded-xl flex items-center justify-center shadow-lg shadow-teal-500/30">
            <span className="text-xl">🌴</span>
          </div>
          {!collapsed && (
            <div>
              <span className="text-xl font-bold text-gray-900 dark:text-white">Tara</span>
              <p className="text-xs text-gray-500 dark:text-gray-400">Travel Philippines</p>
            </div>
          )}
        </Link>
      </div>

      {/* Main Navigation */}
      <nav className="flex-1 px-3 space-y-1">
        {/* Discover Section */}
        {!collapsed && (
          <p className="px-4 py-2 text-xs font-semibold text-gray-400 dark:text-gray-500 uppercase tracking-wider">
            Explore
          </p>
        )}
        {mainNavItems.map((item) => (
          <NavLink key={item.href} item={item} />
        ))}

        {/* Trip Section */}
        {!collapsed && (
          <p className="px-4 py-2 mt-6 text-xs font-semibold text-gray-400 dark:text-gray-500 uppercase tracking-wider">
            Your Trips
          </p>
        )}
        {tripNavItems.map((item) => (
          <NavLink key={item.href} item={item} />
        ))}

        {/* Account Section */}
        {!collapsed && (
          <p className="px-4 py-2 mt-6 text-xs font-semibold text-gray-400 dark:text-gray-500 uppercase tracking-wider">
            Account
          </p>
        )}
        {accountNavItems.map((item) => (
          <NavLink key={item.href} item={item} />
        ))}
      </nav>

      {/* Bottom Section */}
      <div className="px-3 pb-6 space-y-1 border-t border-gray-100 dark:border-gray-800 pt-4 mt-auto">
        {/* Theme Toggle */}
        <button
          onClick={toggleTheme}
          className="flex items-center gap-3 px-4 py-3 rounded-xl transition-all w-full text-gray-600 dark:text-gray-400 hover:bg-gray-100 dark:hover:bg-gray-800 group"
        >
          {resolvedTheme === 'dark' ? (
            <Sun className="w-6 h-6 transition-transform group-hover:scale-110" />
          ) : (
            <Moon className="w-6 h-6 transition-transform group-hover:scale-110" />
          )}
          {!collapsed && (
            <span className="text-sm font-medium">
              {resolvedTheme === 'dark' ? 'Light Mode' : 'Dark Mode'}
            </span>
          )}
        </button>

        {/* Help */}
        <Link
          href="/help"
          className="flex items-center gap-3 px-4 py-3 rounded-xl transition-all text-gray-600 dark:text-gray-400 hover:bg-gray-100 dark:hover:bg-gray-800 group"
        >
          <HelpCircle className="w-6 h-6 transition-transform group-hover:scale-110" />
          {!collapsed && <span className="text-sm font-medium">Help & Support</span>}
        </Link>

        {/* User Profile / Login */}
        {user ? (
          <div className="flex items-center gap-3 px-4 py-3 mt-2 bg-gray-50 dark:bg-gray-900 rounded-xl">
            <div className="w-10 h-10 rounded-full bg-gradient-to-br from-teal-400 to-blue-500 flex items-center justify-center text-white font-bold">
              {user.email?.charAt(0).toUpperCase()}
            </div>
            {!collapsed && (
              <div className="flex-1 min-w-0">
                <p className="text-sm font-medium text-gray-900 dark:text-white truncate">
                  {user.user_metadata?.full_name || user.email?.split('@')[0]}
                </p>
                <p className="text-xs text-gray-500 dark:text-gray-400 truncate">{user.email}</p>
              </div>
            )}
          </div>
        ) : (
          <Link
            href="/login"
            className="flex items-center justify-center gap-2 px-4 py-3 mt-2 bg-teal-500 hover:bg-teal-600 text-white rounded-xl font-medium transition-colors"
          >
            {!collapsed && <span>Sign In</span>}
            {collapsed && <User className="w-5 h-5" />}
          </Link>
        )}
      </div>
    </aside>
  )
}
