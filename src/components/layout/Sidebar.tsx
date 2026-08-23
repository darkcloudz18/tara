'use client'

import Link from 'next/link'
import { usePathname } from 'next/navigation'
import {
  Compass,
  Map,
  PlusCircle,
  Bell,
  User,
  Moon,
  Sun,
  HelpCircle,
  ChevronRight,
  MapPin,
  Calendar,
} from 'lucide-react'
import { useState, useEffect } from 'react'
import { useTheme } from '@/contexts/ThemeContext'
import TaraLogo from '@/components/icons/TaraLogo'
import { useLocalizedTrip } from '@/hooks/useLocalizedTrip'
import { supabase } from '@/lib/supabase'
import { Itinerary } from '@/types/database'
import { notificationService } from '@/features/notifications/services/notificationService'

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
  const t = useLocalizedTrip()
  const [activeTrip, setActiveTrip] = useState<Itinerary | null>(null)
  const [tripPlaceCount, setTripPlaceCount] = useState(0)
  const [unreadNotifications, setUnreadNotifications] = useState(0)

  // Fetch user's most recent trip
  useEffect(() => {
    if (user) {
      supabase
        .from('itineraries')
        .select('*')
        .eq('user_id', user.id)
        .order('updated_at', { ascending: false })
        .limit(1)
        .single()
        .then(({ data }) => {
          if (data) {
            setActiveTrip(data)
            // Get activity count for this trip
            supabase
              .from('itinerary_days')
              .select('id')
              .eq('itinerary_id', data.id)
              .then(({ data: days }) => {
                if (days && days.length > 0) {
                  supabase
                    .from('itinerary_activities')
                    .select('id', { count: 'exact' })
                    .in('day_id', days.map(d => d.id))
                    .then(({ count }) => {
                      setTripPlaceCount(count || 0)
                    })
                }
              })
          }
        })

      // Fetch notification count
      notificationService.getUnreadCount(user.id).then(setUnreadNotifications)
    }
  }, [user])

  // Subscribe to real-time notifications
  useEffect(() => {
    if (!user) return

    const unsubscribe = notificationService.subscribeToNotifications(
      user.id,
      () => {
        // Update count when new notification arrives
        notificationService.getUnreadCount(user.id).then(setUnreadNotifications)
      }
    )

    return () => unsubscribe()
  }, [user])

  const isActive = (href: string) => {
    if (href === '/') return pathname === '/'
    return pathname.startsWith(href)
  }

  const mainNavItems: NavItem[] = [
    { icon: Compass, label: 'Discover', href: '/' },
  ]

  const tripNavItems: NavItem[] = [
    { icon: Map, label: t.myTrips, href: '/dashboard', requiresAuth: true },
    { icon: PlusCircle, label: `New ${t.trip}`, href: '/trip/new', requiresAuth: true },
  ]

  const accountNavItems: NavItem[] = [
    { icon: Bell, label: 'Notifications', href: '/notifications', requiresAuth: true, badge: unreadNotifications },
    { icon: User, label: 'Profile', href: '/profile', requiresAuth: true },
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
            ? 'bg-gray-100 dark:bg-gray-800 text-gray-900 dark:text-white'
            : 'text-gray-600 dark:text-gray-400 hover:bg-gray-100 dark:hover:bg-gray-800'
        }`}
      >
        <div className="relative">
          <Icon
            className={`w-6 h-6 transition-transform group-hover:scale-110 ${
              active ? 'text-gray-900 dark:text-white' : ''
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

  const formatDate = (dateString: string) => {
    return new Date(dateString).toLocaleDateString('en-US', {
      month: 'short',
      day: 'numeric',
    })
  }

  return (
    <aside
      className={`fixed left-0 top-0 h-full bg-white dark:bg-gray-950 border-r border-gray-200 dark:border-gray-800 z-40 transition-all duration-300 ${
        collapsed ? 'w-[72px]' : 'w-[260px]'
      } hidden lg:flex flex-col`}
    >
      {/* Logo */}
      <div className="px-4 pt-6 pb-4">
        <Link href="/" className="flex items-center gap-3 px-2">
          <div className="w-10 h-10 bg-gradient-to-br from-teal-400 to-teal-600 rounded-xl flex items-center justify-center shadow-lg shadow-teal-500/30">
            <TaraLogo className="w-6 h-6 text-white" />
          </div>
          {!collapsed && (
            <div>
              <span className="text-xl font-bold text-gray-900 dark:text-white">Tara</span>
              <p className="text-xs text-gray-500 dark:text-gray-400">Travel Philippines</p>
            </div>
          )}
        </Link>
      </div>

      {/* Active Trip Widget - Only show for logged in users with a trip */}
      {user && activeTrip && !collapsed && (
        <div className="px-3 mb-4">
          <Link
            href={`/trip/${activeTrip.id}/edit`}
            className="block p-3 bg-gradient-to-br from-teal-500 to-teal-600 rounded-xl text-white hover:from-teal-600 hover:to-teal-700 transition-all group"
          >
            <div className="flex items-center justify-between mb-2">
              <span className="text-xs font-medium text-teal-100 uppercase tracking-wide">
                Building {t.trip}
              </span>
              <ChevronRight className="w-4 h-4 text-teal-200 group-hover:translate-x-0.5 transition-transform" />
            </div>
            <p className="font-bold text-sm truncate mb-1">{activeTrip.title}</p>
            <div className="flex items-center gap-3 text-xs text-teal-100">
              <span className="flex items-center gap-1">
                <MapPin className="w-3 h-3" />
                {tripPlaceCount} places
              </span>
              <span className="flex items-center gap-1">
                <Calendar className="w-3 h-3" />
                {formatDate(activeTrip.start_date)}
              </span>
            </div>
            {/* Progress bar */}
            <div className="mt-2 h-1 bg-teal-400/30 rounded-full overflow-hidden">
              <div
                className="h-full bg-white/80 rounded-full transition-all"
                style={{ width: `${Math.min(tripPlaceCount * 10, 100)}%` }}
              />
            </div>
          </Link>
        </div>
      )}

      {/* Create Trip CTA for users without trips */}
      {user && !activeTrip && !collapsed && (
        <div className="px-3 mb-4">
          <Link
            href="/trip/new"
            className="block p-4 border-2 border-dashed border-teal-300 dark:border-teal-700 rounded-xl text-center hover:bg-teal-50 dark:hover:bg-teal-900/20 transition-colors"
          >
            <PlusCircle className="w-8 h-8 text-teal-500 mx-auto mb-2" />
            <p className="text-sm font-semibold text-teal-600 dark:text-teal-400">
              Start Your {t.trip}
            </p>
            <p className="text-xs text-gray-500 dark:text-gray-400 mt-1">
              Browse & add places
            </p>
          </Link>
        </div>
      )}

      {/* Main Navigation */}
      <nav className="flex-1 px-3 space-y-1 overflow-y-auto">
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
          <p className="px-4 py-2 mt-4 text-xs font-semibold text-gray-400 dark:text-gray-500 uppercase tracking-wider">
            Your {t.trips}
          </p>
        )}
        {tripNavItems.map((item) => (
          <NavLink key={item.href} item={item} />
        ))}

        {/* Account Section */}
        {!collapsed && (
          <p className="px-4 py-2 mt-4 text-xs font-semibold text-gray-400 dark:text-gray-500 uppercase tracking-wider">
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
          <Link
            href="/profile"
            className="flex items-center gap-3 px-4 py-3 mt-2 bg-gray-50 dark:bg-gray-900 rounded-xl hover:bg-gray-100 dark:hover:bg-gray-800 transition-colors"
          >
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
          </Link>
        ) : (
          <Link
            href="/login"
            className="flex items-center gap-3 px-4 py-3 mt-2 rounded-xl text-gray-600 dark:text-gray-400 hover:bg-gray-100 dark:hover:bg-gray-800 transition-colors"
          >
            <User className="w-6 h-6" />
            {!collapsed && <span className="text-sm font-medium">Sign in</span>}
          </Link>
        )}
      </div>
    </aside>
  )
}
