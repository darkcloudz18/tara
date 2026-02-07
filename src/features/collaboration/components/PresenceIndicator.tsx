'use client'

import { useState, useEffect } from 'react'
import { Users } from 'lucide-react'
import { PresenceState } from '../types'
import { collaborationService } from '../services/collaborationService'

interface PresenceIndicatorProps {
  itineraryId: string
  userId: string
  userInfo: {
    username: string
    photo_url?: string
  }
}

export default function PresenceIndicator({
  itineraryId,
  userId,
  userInfo,
}: PresenceIndicatorProps) {
  const [presences, setPresences] = useState<PresenceState[]>([])
  const [showList, setShowList] = useState(false)

  useEffect(() => {
    const unsubscribe = collaborationService.subscribeToPresence(
      itineraryId,
      userId,
      userInfo,
      setPresences
    )

    return () => unsubscribe()
  }, [itineraryId, userId, userInfo])

  if (presences.length === 0) return null

  return (
    <div className="relative">
      <button
        onClick={() => setShowList(!showList)}
        className="flex items-center gap-2 px-3 py-1.5 bg-green-100 dark:bg-green-900/30 text-green-700 dark:text-green-400 rounded-full text-sm font-medium hover:bg-green-200 dark:hover:bg-green-900/50 transition-colors"
      >
        {/* Stacked Avatars */}
        <div className="flex -space-x-2">
          {presences.slice(0, 3).map((p) => (
            <div
              key={p.user_id}
              className="w-6 h-6 rounded-full bg-gradient-to-br from-teal-400 to-blue-500 border-2 border-white dark:border-gray-900 flex items-center justify-center text-white text-xs font-bold overflow-hidden"
              title={p.username}
            >
              {p.photo_url ? (
                <img src={p.photo_url} alt="" className="w-full h-full object-cover" />
              ) : (
                p.username[0].toUpperCase()
              )}
            </div>
          ))}
        </div>

        {/* Count */}
        <span>
          {presences.length} online
        </span>

        {/* Live dot */}
        <span className="w-2 h-2 bg-green-500 rounded-full animate-pulse" />
      </button>

      {/* Dropdown List */}
      {showList && (
        <div className="absolute right-0 top-full mt-2 w-64 bg-white dark:bg-gray-800 rounded-xl shadow-lg border border-gray-200 dark:border-gray-700 py-2 z-20">
          <div className="px-3 py-2 border-b border-gray-100 dark:border-gray-700">
            <p className="text-sm font-medium text-gray-900 dark:text-white flex items-center gap-2">
              <Users className="w-4 h-4" />
              Editing Now
            </p>
          </div>
          <div className="max-h-48 overflow-y-auto">
            {presences.map((p) => (
              <div
                key={p.user_id}
                className="flex items-center gap-3 px-3 py-2 hover:bg-gray-50 dark:hover:bg-gray-700/50"
              >
                <div className="relative">
                  <div className="w-8 h-8 rounded-full bg-gradient-to-br from-teal-400 to-blue-500 flex items-center justify-center text-white text-sm font-bold overflow-hidden">
                    {p.photo_url ? (
                      <img src={p.photo_url} alt="" className="w-full h-full object-cover" />
                    ) : (
                      p.username[0].toUpperCase()
                    )}
                  </div>
                  <span className="absolute -bottom-0.5 -right-0.5 w-3 h-3 bg-green-500 border-2 border-white dark:border-gray-800 rounded-full" />
                </div>
                <div>
                  <p className="text-sm font-medium text-gray-900 dark:text-white">
                    {p.username}
                  </p>
                  <p className="text-xs text-green-600 dark:text-green-400">Online</p>
                </div>
              </div>
            ))}
          </div>
        </div>
      )}
    </div>
  )
}
