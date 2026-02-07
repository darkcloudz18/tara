'use client'

import Link from 'next/link'
import { usePathname } from 'next/navigation'
import { Compass, Search, PlusCircle, User } from 'lucide-react'
import BucketIcon from '@/components/icons/BucketIcon'

interface MobileNavProps {
  user: any
}

export default function MobileNav({ user }: MobileNavProps) {
  const pathname = usePathname()

  const isActive = (href: string) => {
    if (href === '/') return pathname === '/'
    return pathname.startsWith(href)
  }

  const navItems = [
    { icon: Compass, label: 'Discover', href: '/' },
    { icon: Search, label: 'Search', href: '/search' },
    { icon: PlusCircle, label: 'Plan Trip', href: user ? '/planner/new' : '/login' },
    { icon: () => <BucketIcon className="w-7 h-7" />, label: 'Bucket List', href: user ? '/planner' : '/login' },
    { icon: User, label: 'Profile', href: user ? '/profile' : '/login' },
  ]

  return (
    <nav className="fixed bottom-0 left-0 right-0 bg-white dark:bg-gray-950 border-t border-gray-200 dark:border-gray-800 z-50 lg:hidden pb-[env(safe-area-inset-bottom)]">
      <div className="flex items-center justify-around px-1">
        {navItems.map((item) => {
          const Icon = item.icon
          const active = isActive(item.href)

          return (
            <Link
              key={item.href}
              href={item.href}
              className={`flex flex-col items-center justify-center min-w-[64px] min-h-[56px] px-2 py-2 rounded-xl transition-colors active:bg-gray-100 dark:active:bg-gray-800 ${
                active
                  ? 'text-teal-600 dark:text-teal-400'
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
