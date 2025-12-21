'use client'

import Link from 'next/link'
import { User } from 'lucide-react'

interface Creator {
  id: string
  name: string
  handle: string
  avatar: string | null
  followers: string
}

const suggestedCreators: Creator[] = [
  {
    id: '1',
    name: 'Travel with Juan',
    handle: 'travelwithjuan',
    avatar: null,
    followers: '12.5K followers',
  },
  {
    id: '2',
    name: 'Pinoy Explorer',
    handle: 'pinoyexplorer',
    avatar: null,
    followers: '8.2K followers',
  },
  {
    id: '3',
    name: 'Island Hopper PH',
    handle: 'islandhopperph',
    avatar: null,
    followers: '5.1K followers',
  },
  {
    id: '4',
    name: 'Backpack Buddy',
    handle: 'backpackbuddy',
    avatar: null,
    followers: '3.8K followers',
  },
  {
    id: '5',
    name: 'Foodtrip Manila',
    handle: 'foodtripmnl',
    avatar: null,
    followers: '15.3K followers',
  },
]

interface RightSidebarProps {
  user: any
}

export default function RightSidebar({ user }: RightSidebarProps) {
  return (
    <aside className="hidden xl:block w-[320px] flex-shrink-0">
      <div className="fixed w-[320px] pt-8 px-4">
        {/* User Profile */}
        {user ? (
          <div className="flex items-center justify-between mb-6">
            <div className="flex items-center gap-3">
              <div className="w-11 h-11 rounded-full bg-gray-200 dark:bg-gray-700 flex items-center justify-center">
                {user.user_metadata?.avatar_url ? (
                  <img
                    src={user.user_metadata.avatar_url}
                    alt=""
                    className="w-11 h-11 rounded-full object-cover"
                  />
                ) : (
                  <User className="w-6 h-6 text-gray-500 dark:text-gray-400" />
                )}
              </div>
              <div>
                <p className="text-sm font-semibold text-gray-900 dark:text-white">
                  {user.user_metadata?.full_name || user.email?.split('@')[0]}
                </p>
                <p className="text-sm text-gray-500 dark:text-gray-400">
                  {user.email}
                </p>
              </div>
            </div>
            <Link href="/dashboard" className="text-xs font-semibold text-primary-600 dark:text-primary-400 hover:text-primary-700 dark:hover:text-primary-300">
              Dashboard
            </Link>
          </div>
        ) : (
          <div className="flex items-center justify-between mb-6 p-4 bg-gray-50 dark:bg-gray-900 rounded-xl">
            <p className="text-sm text-gray-600 dark:text-gray-400">Sign in to save places</p>
            <Link href="/login" className="text-xs font-semibold text-primary-600 dark:text-primary-400 hover:text-primary-700 dark:hover:text-primary-300">
              Log in
            </Link>
          </div>
        )}

        {/* Suggested Creators */}
        <div className="mb-4">
          <div className="flex items-center justify-between mb-4">
            <span className="text-sm font-semibold text-gray-500 dark:text-gray-400">Suggested creators</span>
            <Link href="/creators" className="text-xs font-semibold text-gray-900 dark:text-white hover:text-gray-600 dark:hover:text-gray-300">
              See All
            </Link>
          </div>

          <div className="space-y-3">
            {suggestedCreators.map((creator) => (
              <div key={creator.id} className="flex items-center justify-between">
                <div className="flex items-center gap-3">
                  <div className="w-8 h-8 rounded-full bg-gradient-to-br from-primary-400 to-blue-500 flex items-center justify-center">
                    {creator.avatar ? (
                      <img
                        src={creator.avatar}
                        alt=""
                        className="w-8 h-8 rounded-full object-cover"
                      />
                    ) : (
                      <span className="text-white text-xs font-bold">
                        {creator.name.charAt(0)}
                      </span>
                    )}
                  </div>
                  <div>
                    <p className="text-sm font-semibold text-gray-900 dark:text-white">{creator.handle}</p>
                    <p className="text-xs text-gray-500 dark:text-gray-400">{creator.followers}</p>
                  </div>
                </div>
                <button className="text-xs font-semibold text-primary-600 dark:text-primary-400 hover:text-primary-700 dark:hover:text-primary-300">
                  Follow
                </button>
              </div>
            ))}
          </div>
        </div>

        {/* Popular Destinations */}
        <div className="mb-4">
          <div className="flex items-center justify-between mb-4">
            <span className="text-sm font-semibold text-gray-500 dark:text-gray-400">Trending destinations</span>
            <Link href="/destinations" className="text-xs font-semibold text-gray-900 dark:text-white hover:text-gray-600 dark:hover:text-gray-300">
              See All
            </Link>
          </div>

          <div className="flex flex-wrap gap-2">
            {['Boracay', 'Palawan', 'Siargao', 'Cebu', 'Bohol', 'Batanes'].map((dest) => (
              <Link
                key={dest}
                href={`/explore?destination=${dest.toLowerCase()}`}
                className="px-3 py-1.5 bg-gray-100 dark:bg-gray-800 hover:bg-gray-200 dark:hover:bg-gray-700 rounded-full text-xs font-medium text-gray-700 dark:text-gray-300 transition-colors"
              >
                {dest}
              </Link>
            ))}
          </div>
        </div>

        {/* Footer Links */}
        <div className="mt-8 text-xs text-gray-400 dark:text-gray-500">
          <div className="flex flex-wrap gap-x-2 gap-y-1 mb-4">
            <Link href="/about" className="hover:underline">About</Link>
            <span>·</span>
            <Link href="/help" className="hover:underline">Help</Link>
            <span>·</span>
            <Link href="/terms" className="hover:underline">Terms</Link>
            <span>·</span>
            <Link href="/privacy" className="hover:underline">Privacy</Link>
            <span>·</span>
            <Link href="/creators/join" className="hover:underline">Creators</Link>
          </div>
          <p>© 2025 Tara Philippines</p>
        </div>
      </div>
    </aside>
  )
}
