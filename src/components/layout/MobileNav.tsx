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
    { icon: () => <BucketIcon className="w-6 h-6" />, label: 'Bucket List', href: user ? '/planner' : '/login' },
    { icon: User, label: 'Account', href: user ? '/dashboard' : '/login' },
  ]

  return (
    <nav className="fixed bottom-0 left-0 right-0 bg-white dark:bg-gray-950 border-t border-gray-200 dark:border-gray-800 z-50 lg:hidden safe-area-bottom">
      <div className="flex items-center justify-around py-2 px-2">
        {navItems.map((item) => {
          const Icon = item.icon
          const active = isActive(item.href)

          return (
            <Link
              key={item.href}
              href={item.href}
              className={`flex flex-col items-center gap-1 px-3 py-2 rounded-xl transition-colors ${
                active
                  ? 'text-teal-600 dark:text-teal-400'
                  : 'text-gray-500 dark:text-gray-400'
              }`}
            >
              <Icon className="w-6 h-6" />
              <span className="text-[10px] font-medium">{item.label}</span>
            </Link>
          )
        })}
      </div>
    </nav>
  )
}
