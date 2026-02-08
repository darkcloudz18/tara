'use client'

import { useState } from 'react'
import {
  Badge,
  UserBadge,
  BADGES,
  BADGE_TIERS,
  BADGE_CATEGORIES,
  getBadgeById,
  calculatePoints,
  getUserLevel,
  BadgeCategory,
} from '../data/badges'

interface BadgeDisplayProps {
  earnedBadges: UserBadge[]
  showAll?: boolean
}

export default function BadgeDisplay({ earnedBadges, showAll = false }: BadgeDisplayProps) {
  const [selectedCategory, setSelectedCategory] = useState<BadgeCategory | 'all'>('all')
  const [selectedBadge, setSelectedBadge] = useState<Badge | null>(null)

  const points = calculatePoints(earnedBadges)
  const { level, title, nextLevel } = getUserLevel(points)
  const earnedBadgeIds = new Set(earnedBadges.map((b) => b.badgeId))

  const displayBadges = showAll
    ? BADGES.filter((b) => selectedCategory === 'all' || b.category === selectedCategory)
    : BADGES.filter((b) => earnedBadgeIds.has(b.id))

  return (
    <div className="bg-white dark:bg-gray-900 rounded-xl border border-gray-200 dark:border-gray-800 overflow-hidden">
      {/* Header with level */}
      <div className="bg-gradient-to-r from-teal-500 to-blue-600 px-4 py-4 text-white">
        <div className="flex items-center justify-between">
          <div>
            <p className="text-teal-100 text-sm">Level {level}</p>
            <h3 className="font-bold text-lg">{title}</h3>
          </div>
          <div className="text-right">
            <p className="text-2xl font-bold">{points}</p>
            <p className="text-teal-100 text-sm">points</p>
          </div>
        </div>

        {/* Progress to next level */}
        {nextLevel !== Infinity && (
          <div className="mt-3">
            <div className="flex justify-between text-xs text-teal-100 mb-1">
              <span>Progress to Level {level + 1}</span>
              <span>{nextLevel - points} points needed</span>
            </div>
            <div className="h-2 bg-white/20 rounded-full overflow-hidden">
              <div
                className="h-full bg-white rounded-full transition-all"
                style={{
                  width: `${Math.min(100, (points / nextLevel) * 100)}%`,
                }}
              />
            </div>
          </div>
        )}
      </div>

      {/* Category filter (only if showAll) */}
      {showAll && (
        <div className="px-4 py-3 border-b border-gray-200 dark:border-gray-800 overflow-x-auto">
          <div className="flex gap-2">
            <button
              onClick={() => setSelectedCategory('all')}
              className={`px-3 py-1.5 rounded-full text-sm font-medium whitespace-nowrap ${
                selectedCategory === 'all'
                  ? 'bg-teal-100 dark:bg-teal-900/30 text-teal-700 dark:text-teal-400'
                  : 'bg-gray-100 dark:bg-gray-800 text-gray-600 dark:text-gray-400'
              }`}
            >
              All
            </button>
            {(Object.keys(BADGE_CATEGORIES) as BadgeCategory[]).map((cat) => (
              <button
                key={cat}
                onClick={() => setSelectedCategory(cat)}
                className={`px-3 py-1.5 rounded-full text-sm font-medium whitespace-nowrap ${
                  selectedCategory === cat
                    ? 'bg-teal-100 dark:bg-teal-900/30 text-teal-700 dark:text-teal-400'
                    : 'bg-gray-100 dark:bg-gray-800 text-gray-600 dark:text-gray-400'
                }`}
              >
                {BADGE_CATEGORIES[cat].icon} {BADGE_CATEGORIES[cat].label}
              </button>
            ))}
          </div>
        </div>
      )}

      {/* Badges grid */}
      <div className="p-4">
        <div className="flex items-center justify-between mb-3">
          <h4 className="font-medium text-gray-900 dark:text-white">
            {showAll ? 'All Badges' : 'Earned Badges'}
          </h4>
          <span className="text-sm text-gray-500 dark:text-gray-400">
            {earnedBadges.length}/{BADGES.length}
          </span>
        </div>

        {displayBadges.length === 0 ? (
          <p className="text-center text-gray-500 dark:text-gray-400 py-8">
            No badges earned yet. Start planning trips to unlock badges!
          </p>
        ) : (
          <div className="grid grid-cols-4 sm:grid-cols-6 gap-3">
            {displayBadges.map((badge) => {
              const isEarned = earnedBadgeIds.has(badge.id)
              const tierStyle = BADGE_TIERS[badge.tier]

              return (
                <button
                  key={badge.id}
                  onClick={() => setSelectedBadge(badge)}
                  className={`relative flex flex-col items-center p-2 rounded-xl transition-all ${
                    isEarned
                      ? 'hover:bg-gray-50 dark:hover:bg-gray-800'
                      : 'opacity-40 grayscale hover:opacity-60'
                  }`}
                >
                  <div
                    className={`w-12 h-12 rounded-full flex items-center justify-center text-2xl ${
                      isEarned ? tierStyle.color : 'bg-gray-200 dark:bg-gray-700'
                    }`}
                  >
                    {badge.icon}
                  </div>
                  <span className="text-xs text-gray-700 dark:text-gray-300 mt-1 text-center line-clamp-1">
                    {badge.name}
                  </span>
                </button>
              )
            })}
          </div>
        )}
      </div>

      {/* Badge detail modal */}
      {selectedBadge && (
        <div
          className="fixed inset-0 z-50 flex items-center justify-center bg-black/60 backdrop-blur-sm"
          onClick={() => setSelectedBadge(null)}
        >
          <div
            className="w-full max-w-sm mx-4 bg-white dark:bg-gray-900 rounded-2xl shadow-2xl overflow-hidden"
            onClick={(e) => e.stopPropagation()}
          >
            <div className={`p-6 text-center ${BADGE_TIERS[selectedBadge.tier].color}`}>
              <span className="text-6xl">{selectedBadge.icon}</span>
            </div>
            <div className="p-6 text-center">
              <h3 className="text-xl font-bold text-gray-900 dark:text-white">
                {selectedBadge.name}
              </h3>
              <p className="text-sm text-gray-500 dark:text-gray-400 mt-1">
                {selectedBadge.description}
              </p>
              <div className="mt-4 flex items-center justify-center gap-3">
                <span
                  className={`px-3 py-1 rounded-full text-xs font-medium capitalize ${
                    BADGE_TIERS[selectedBadge.tier].color
                  }`}
                >
                  {selectedBadge.tier}
                </span>
                <span className="text-sm text-gray-500">
                  +{BADGE_TIERS[selectedBadge.tier].points} points
                </span>
              </div>

              {earnedBadgeIds.has(selectedBadge.id) ? (
                <p className="mt-4 text-teal-600 dark:text-teal-400 font-medium">
                  ✓ Badge Earned!
                </p>
              ) : (
                <p className="mt-4 text-gray-500 dark:text-gray-400 text-sm">
                  Keep traveling to unlock this badge
                </p>
              )}
            </div>
            <div className="px-6 pb-6">
              <button
                onClick={() => setSelectedBadge(null)}
                className="w-full py-2 bg-gray-100 dark:bg-gray-800 text-gray-700 dark:text-gray-300 rounded-lg font-medium hover:bg-gray-200 dark:hover:bg-gray-700"
              >
                Close
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  )
}
