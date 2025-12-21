'use client'

import Link from 'next/link'
import { usePathname } from 'next/navigation'
import { Home, Search, PlusSquare, Bookmark, User } from 'lucide-react'

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
    { icon: Home, label: 'Home', href: '/' },
    { icon: Search, label: 'Search', href: '/search' },
    { icon: PlusSquare, label: 'Create', href: user ? '/planner/create' : '/login' },
    { icon: Bookmark, label: 'Bucket List', href: user ? '/planner' : '/login' },
    { icon: User, label: 'Profile', href: user ? '/dashboard' : '/login' },
  ]

  return (
    <nav className="fixed bottom-0 left-0 right-0 bg-white border-t border-gray-200 z-50 lg:hidden">
      <div className="flex items-center justify-around py-2">
        {navItems.map((item) => {
          const Icon = item.icon
          const active = isActive(item.href)

          return (
            <Link
              key={item.href}
              href={item.href}
              className={`flex flex-col items-center gap-1 px-4 py-2 ${
                active ? 'text-gray-900' : 'text-gray-500'
              }`}
            >
              <Icon className={`w-6 h-6 ${active ? 'fill-current' : ''}`} />
              <span className="text-xs font-medium">{item.label}</span>
            </Link>
          )
        })}
      </div>
    </nav>
  )
}
