'use client'

import { Compass, Bookmark } from 'lucide-react'

export type TabType = 'discover' | 'bucketlist'

interface BottomNavProps {
  activeTab: TabType
  onTabChange: (tab: TabType) => void
  itemCount: number
}

export default function BottomNav({
  activeTab,
  onTabChange,
  itemCount,
}: BottomNavProps) {
  return (
    <div className="bg-white border-t border-gray-200 px-4 py-2 safe-area-pb">
      <div className="flex items-center justify-around max-w-md mx-auto">
        {/* Discover Tab */}
        <button
          onClick={() => onTabChange('discover')}
          className={`flex flex-col items-center gap-1 px-6 py-2 rounded-xl transition-colors ${
            activeTab === 'discover'
              ? 'text-primary-600'
              : 'text-gray-400 hover:text-gray-600'
          }`}
        >
          <Compass
            className={`w-6 h-6 ${activeTab === 'discover' ? 'stroke-[2.5]' : ''}`}
          />
          <span className="text-xs font-medium">Discover</span>
        </button>

        {/* Bucket List Tab */}
        <button
          onClick={() => onTabChange('bucketlist')}
          className={`flex flex-col items-center gap-1 px-6 py-2 rounded-xl transition-colors relative ${
            activeTab === 'bucketlist'
              ? 'text-primary-600'
              : 'text-gray-400 hover:text-gray-600'
          }`}
        >
          <div className="relative">
            <Bookmark
              className={`w-6 h-6 ${activeTab === 'bucketlist' ? 'stroke-[2.5] fill-primary-600' : ''}`}
            />
            {itemCount > 0 && (
              <span className="absolute -top-1.5 -right-2.5 min-w-[18px] h-[18px] flex items-center justify-center px-1 bg-primary-600 text-white text-[10px] font-bold rounded-full">
                {itemCount > 99 ? '99+' : itemCount}
              </span>
            )}
          </div>
          <span className="text-xs font-medium">Bucket List</span>
        </button>
      </div>
    </div>
  )
}
