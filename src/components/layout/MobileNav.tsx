'use client'

import Link from 'next/link'
import { usePathname } from 'next/navigation'
import { Compass, Map, PlusCircle, User } from 'lucide-react'

interface MobileNavProps {
  user: any
}

type NavItem = {
  icon: typeof Compass
  label: string
  realHref: string
}

const navItems: NavItem[] = [
  { icon: Compass, label: 'Discover', realHref: '/' },
  { icon: PlusCircle, label: 'Create', realHref: '/trip/new' },
  { icon: Map, label: 'My lakad', realHref: '/dashboard' },
  { icon: User, label: 'Profile', realHref: '/profile' },
]

export default function MobileNav({ user }: MobileNavProps) {
  const pathname = usePathname()

  const isActive = (realHref: string) => {
    if (realHref === '/') return pathname === '/'
    return pathname.startsWith(realHref)
  }

  const hrefFor = (realHref: string) => {
    if (realHref === '/' || user) return realHref
    return `/login?redirect=${encodeURIComponent(realHref)}`
  }

  return (
    <nav className="fixed bottom-0 left-0 right-0 bg-white dark:bg-gray-950 border-t border-gray-200 dark:border-gray-800 z-50 lg:hidden pb-[env(safe-area-inset-bottom)]">
      <div className="flex items-center justify-around px-1">
        {navItems.map((item) => {
          const Icon = item.icon
          const active = isActive(item.realHref)

          return (
            <Link
              key={item.label}
              href={hrefFor(item.realHref)}
              className={`flex flex-col items-center justify-center min-w-[64px] min-h-[56px] px-2 py-2 rounded-xl transition-colors active:bg-gray-100 dark:active:bg-gray-800 ${
                active
                  ? 'bg-gray-100 dark:bg-gray-800 text-gray-900 dark:text-white'
                  : 'text-gray-500 dark:text-gray-400'
              }`}
            >
              <Icon className="w-7 h-7" />
              <span className="text-[11px] font-medium mt-0.5">{item.label}</span>
            </Link>
          )
        })}
      </div>
    </nav>
  )
}
