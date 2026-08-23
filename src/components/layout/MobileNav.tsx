'use client'

import { useState, useEffect } from 'react'
import Link from 'next/link'
import { usePathname } from 'next/navigation'
import { Compass, PlusCircle, User, Bell } from 'lucide-react'
import { useLocalizedTrip } from '@/hooks/useLocalizedTrip'
import { notificationService } from '@/features/notifications/services/notificationService'

interface MobileNavProps {
  user: any
}

export default function MobileNav({ user }: MobileNavProps) {
  const pathname = usePathname()
  const t = useLocalizedTrip()
  const [unreadCount, setUnreadCount] = useState(0)

  // Fetch notification count
  useEffect(() => {
    if (user) {
      notificationService.getUnreadCount(user.id).then(setUnreadCount)

      // Subscribe to real-time updates
      const unsubscribe = notificationService.subscribeToNotifications(
        user.id,
        () => {
          notificationService.getUnreadCount(user.id).then(setUnreadCount)
        }
      )

      return () => unsubscribe()
    }
  }, [user])

  const isActive = (href: string) => {
    if (href === '/') return pathname === '/'
    return pathname.startsWith(href)
  }

  const navItems = [
    { icon: Compass, label: 'Discover', href: '/', badge: 0 },
    { icon: PlusCircle, label: t.planTrip, href: user ? '/trip/new' : '/login', badge: 0 },
    { icon: Bell, label: 'Alerts', href: user ? '/notifications' : '/login', badge: unreadCount },
    { icon: User, label: 'Profile', href: user ? '/profile' : '/login', badge: 0 },
  ]

  return (
    <nav className="fixed bottom-0 left-0 right-0 bg-white dark:bg-gray-950 border-t border-gray-200 dark:border-gray-800 z-50 lg:hidden pb-[env(safe-area-inset-bottom)]">
      <div className="flex items-center justify-around px-1">
        {navItems.map((item) => {
          const Icon = item.icon
          const active = isActive(item.href)

          return (
            <Link
              key={item.label}
              href={item.href}
              className={`flex flex-col items-center justify-center min-w-[64px] min-h-[56px] px-2 py-2 rounded-xl transition-colors active:bg-gray-100 dark:active:bg-gray-800 ${
                active
                  ? 'text-teal-600 dark:text-teal-400'
                  : 'text-gray-500 dark:text-gray-400'
              }`}
            >
              <div className="relative">
                <Icon className="w-7 h-7" />
                {item.badge > 0 && (
                  <span className="absolute -top-1 -right-1 min-w-[18px] h-[18px] bg-coral-500 text-white text-[10px] font-bold rounded-full flex items-center justify-center px-1">
                    {item.badge > 9 ? '9+' : item.badge}
                  </span>
                )}
              </div>
              <span className="text-[11px] font-medium mt-0.5">{item.label}</span>
            </Link>
          )
        })}
      </div>
    </nav>
  )
}
