'use client'

import Link from 'next/link'
import { usePathname } from 'next/navigation'
import {
  Home,
  Search,
  Compass,
  Bookmark,
  PlusSquare,
  Bell,
  LayoutDashboard,
  User,
  Menu,
  MapPin,
} from 'lucide-react'
import { useState } from 'react'

interface NavItem {
  icon: React.ComponentType<{ className?: string }>
  label: string
  href: string
  requiresAuth?: boolean
}

const navItems: NavItem[] = [
  { icon: Home, label: 'Home', href: '/' },
  { icon: Search, label: 'Search', href: '/search' },
  { icon: Compass, label: 'Explore', href: '/explore' },
  { icon: MapPin, label: 'Destinations', href: '/destinations' },
  { icon: Bookmark, label: 'Bucket List', href: '/planner', requiresAuth: true },
  { icon: PlusSquare, label: 'Create Trip', href: '/planner/create', requiresAuth: true },
  { icon: Bell, label: 'Notifications', href: '/notifications', requiresAuth: true },
]

const bottomNavItems: NavItem[] = [
  { icon: LayoutDashboard, label: 'Dashboard', href: '/dashboard', requiresAuth: true },
  { icon: User, label: 'Profile', href: '/profile', requiresAuth: true },
]

interface SidebarProps {
  user: any
}

export default function Sidebar({ user }: SidebarProps) {
  const pathname = usePathname()
  const [collapsed, setCollapsed] = useState(false)

  const isActive = (href: string) => {
    if (href === '/') return pathname === '/'
    return pathname.startsWith(href)
  }

  const NavLink = ({ item }: { item: NavItem }) => {
    const active = isActive(item.href)
    const Icon = item.icon

    // If requires auth and not logged in, redirect to login
    const href = item.requiresAuth && !user ? '/login' : item.href

    return (
      <Link
        href={href}
        className={`flex items-center gap-4 px-3 py-3 rounded-lg transition-all hover:bg-gray-100 group ${
          active ? 'font-semibold' : 'font-normal'
        }`}
      >
        <Icon
          className={`w-6 h-6 transition-transform group-hover:scale-110 ${
            active ? 'text-gray-900' : 'text-gray-700'
          }`}
        />
        {!collapsed && (
          <span className={`text-base ${active ? 'text-gray-900' : 'text-gray-700'}`}>
            {item.label}
          </span>
        )}
      </Link>
    )
  }

  return (
    <aside
      className={`fixed left-0 top-0 h-full bg-white border-r border-gray-200 z-40 transition-all duration-300 ${
        collapsed ? 'w-[72px]' : 'w-[245px]'
      } hidden lg:flex flex-col`}
    >
      {/* Logo */}
      <div className="px-3 pt-6 pb-4">
        <Link href="/" className="flex items-center gap-2 px-3 py-2">
          <span className="text-2xl">🌴</span>
          {!collapsed && (
            <span className="text-xl font-bold bg-gradient-to-r from-primary-600 to-blue-600 bg-clip-text text-transparent">
              Tara
            </span>
          )}
        </Link>
      </div>

      {/* Main Navigation */}
      <nav className="flex-1 px-3 space-y-1">
        {navItems.map((item) => (
          <NavLink key={item.href} item={item} />
        ))}
      </nav>

      {/* Bottom Navigation */}
      <div className="px-3 pb-6 space-y-1 border-t border-gray-100 pt-4">
        {bottomNavItems.map((item) => (
          <NavLink key={item.href} item={item} />
        ))}

        {/* More Menu */}
        <button
          onClick={() => setCollapsed(!collapsed)}
          className="flex items-center gap-4 px-3 py-3 rounded-lg transition-all hover:bg-gray-100 w-full group"
        >
          <Menu className="w-6 h-6 text-gray-700 transition-transform group-hover:scale-110" />
          {!collapsed && <span className="text-base text-gray-700">More</span>}
        </button>
      </div>
    </aside>
  )
}
