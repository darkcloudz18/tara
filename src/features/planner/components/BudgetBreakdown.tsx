'use client'

import { useState } from 'react'
import {
  Plane,
  Hotel,
  UtensilsCrossed,
  Camera,
  CircleDollarSign,
  Users,
  TrendingDown,
  ChevronDown,
  ChevronUp,
  Lightbulb,
  Calendar,
} from 'lucide-react'
import { BudgetSummary, CategoryBudget, formatCurrency } from '../hooks/useBudgetCalculations'

interface BudgetBreakdownProps {
  budget: BudgetSummary
  travelers?: number
  showTips?: boolean
}

export default function BudgetBreakdown({
  budget,
  travelers = 1,
  showTips = true,
}: BudgetBreakdownProps) {
  const [showDayBreakdown, setShowDayBreakdown] = useState(false)

  const effectiveTravelers = travelers > 0 ? travelers : 1
  const perPerson = budget.totalEstimated / effectiveTravelers
  const perPersonPerDay = budget.byDay.length > 0
    ? perPerson / budget.byDay.length
    : perPerson

  // Get icon component for category
  const getCategoryIcon = (iconName: string) => {
    switch (iconName) {
      case 'plane':
        return Plane
      case 'hotel':
        return Hotel
      case 'utensils':
        return UtensilsCrossed
      case 'camera':
        return Camera
      default:
        return CircleDollarSign
    }
  }

  return (
    <div className="space-y-6">
      {/* Main Cost Summary */}
      <div className="bg-gradient-to-br from-teal-500 to-blue-600 rounded-2xl p-6 text-white">
        <div className="flex items-center justify-between mb-4">
          <h3 className="text-lg font-semibold text-teal-100">Total Trip Cost</h3>
          {effectiveTravelers > 1 && (
            <div className="flex items-center gap-1 text-teal-200 text-sm">
              <Users className="w-4 h-4" />
              <span>{effectiveTravelers} travelers</span>
            </div>
          )}
        </div>

        <div className="text-4xl font-bold mb-2">
          {formatCurrency(budget.totalEstimated)}
        </div>

        <div className="flex flex-wrap gap-4 mt-4">
          <div className="bg-white/10 rounded-xl px-4 py-2">
            <p className="text-xs text-teal-200">Per Person</p>
            <p className="text-lg font-semibold">{formatCurrency(perPerson)}</p>
          </div>
          {budget.byDay.length > 0 && (
            <div className="bg-white/10 rounded-xl px-4 py-2">
              <p className="text-xs text-teal-200">Per Person/Day</p>
              <p className="text-lg font-semibold">{formatCurrency(perPersonPerDay)}</p>
            </div>
          )}
          {budget.byDay.length > 0 && (
            <div className="bg-white/10 rounded-xl px-4 py-2">
              <p className="text-xs text-teal-200">Trip Length</p>
              <p className="text-lg font-semibold">{budget.byDay.length} days</p>
            </div>
          )}
        </div>
      </div>

      {/* Category Breakdown */}
      {budget.byCategory.length > 0 && (
        <div className="bg-white dark:bg-gray-900 rounded-2xl p-6 border border-gray-200 dark:border-gray-800">
          <h3 className="font-semibold text-gray-900 dark:text-white mb-4">
            Spending by Category
          </h3>

          <div className="space-y-4">
            {budget.byCategory.map((category) => (
              <CategoryBar key={category.category} category={category} getCategoryIcon={getCategoryIcon} />
            ))}
          </div>

          {/* Category Legend */}
          <div className="mt-6 pt-4 border-t border-gray-100 dark:border-gray-800">
            <div className="flex flex-wrap gap-3">
              {budget.byCategory.map((category) => {
                const Icon = getCategoryIcon(category.icon)
                return (
                  <div
                    key={category.category}
                    className="flex items-center gap-2 text-sm text-gray-600 dark:text-gray-400"
                  >
                    <div
                      className="w-3 h-3 rounded-full"
                      style={{ backgroundColor: category.color }}
                    />
                    <span>{category.label}</span>
                    <span className="font-medium text-gray-900 dark:text-white">
                      {category.percentage.toFixed(0)}%
                    </span>
                  </div>
                )
              })}
            </div>
          </div>
        </div>
      )}

      {/* Day-by-Day Breakdown */}
      {budget.byDay.length > 0 && (
        <div className="bg-white dark:bg-gray-900 rounded-2xl border border-gray-200 dark:border-gray-800 overflow-hidden">
          <button
            onClick={() => setShowDayBreakdown(!showDayBreakdown)}
            className="w-full px-6 py-4 flex items-center justify-between hover:bg-gray-50 dark:hover:bg-gray-800 transition-colors"
          >
            <div className="flex items-center gap-3">
              <Calendar className="w-5 h-5 text-gray-400" />
              <h3 className="font-semibold text-gray-900 dark:text-white">
                Day-by-Day Breakdown
              </h3>
            </div>
            {showDayBreakdown ? (
              <ChevronUp className="w-5 h-5 text-gray-400" />
            ) : (
              <ChevronDown className="w-5 h-5 text-gray-400" />
            )}
          </button>

          {showDayBreakdown && (
            <div className="px-6 pb-6">
              {/* Day bars */}
              <div className="space-y-3">
                {budget.byDay.map((day) => {
                  const maxDayBudget = Math.max(...budget.byDay.map((d) => d.estimated))
                  const percentage = maxDayBudget > 0 ? (day.estimated / maxDayBudget) * 100 : 0
                  const dayDate = new Date(day.date)

                  return (
                    <div key={day.dayId} className="flex items-center gap-4">
                      <div className="w-20 flex-shrink-0">
                        <p className="text-sm font-medium text-gray-900 dark:text-white">
                          Day {day.dayNumber}
                        </p>
                        <p className="text-xs text-gray-500">
                          {dayDate.toLocaleDateString('en-US', { month: 'short', day: 'numeric' })}
                        </p>
                      </div>
                      <div className="flex-1">
                        <div className="h-8 bg-gray-100 dark:bg-gray-800 rounded-lg overflow-hidden">
                          <div
                            className="h-full bg-gradient-to-r from-teal-400 to-teal-500 rounded-lg flex items-center justify-end px-3 transition-all"
                            style={{ width: `${Math.max(percentage, 15)}%` }}
                          >
                            <span className="text-xs font-medium text-white">
                              {formatCurrency(day.estimated)}
                            </span>
                          </div>
                        </div>
                      </div>
                    </div>
                  )
                })}
              </div>

              {/* Day total */}
              <div className="mt-4 pt-4 border-t border-gray-100 dark:border-gray-800 flex justify-between">
                <span className="text-gray-600 dark:text-gray-400">Total</span>
                <span className="font-semibold text-gray-900 dark:text-white">
                  {formatCurrency(budget.totalEstimated)}
                </span>
              </div>
            </div>
          )}
        </div>
      )}

      {/* Budget Tips */}
      {showTips && budget.totalEstimated > 0 && (
        <BudgetTips budget={budget} perPersonPerDay={perPersonPerDay} />
      )}
    </div>
  )
}

// Category Bar Component
function CategoryBar({
  category,
  getCategoryIcon,
}: {
  category: CategoryBudget
  getCategoryIcon: (icon: string) => any
}) {
  const Icon = getCategoryIcon(category.icon)

  return (
    <div className="space-y-2">
      <div className="flex items-center justify-between">
        <div className="flex items-center gap-2">
          <div
            className="w-8 h-8 rounded-lg flex items-center justify-center"
            style={{ backgroundColor: `${category.color}20` }}
          >
            <Icon className="w-4 h-4" style={{ color: category.color }} />
          </div>
          <span className="text-sm font-medium text-gray-900 dark:text-white">
            {category.label}
          </span>
        </div>
        <div className="text-right">
          <span className="text-sm font-semibold text-gray-900 dark:text-white">
            {formatCurrency(category.estimated)}
          </span>
          <span className="text-xs text-gray-500 ml-2">
            ({category.percentage.toFixed(0)}%)
          </span>
        </div>
      </div>
      <div className="h-2 bg-gray-100 dark:bg-gray-800 rounded-full overflow-hidden">
        <div
          className="h-full rounded-full transition-all"
          style={{
            width: `${category.percentage}%`,
            backgroundColor: category.color,
          }}
        />
      </div>
    </div>
  )
}

// Budget Tips Component
function BudgetTips({
  budget,
  perPersonPerDay,
}: {
  budget: BudgetSummary
  perPersonPerDay: number
}) {
  const tips: string[] = []

  // Generate contextual tips
  const accommodationCategory = budget.byCategory.find((c) => c.category === 'accommodation')
  const transportCategory = budget.byCategory.find((c) => c.category === 'transport')
  const foodCategory = budget.byCategory.find((c) => c.category === 'meal')

  if (accommodationCategory && accommodationCategory.percentage > 40) {
    tips.push('Consider hostels or guesthouses to reduce accommodation costs by 30-50%')
  }

  if (transportCategory && transportCategory.percentage > 30) {
    tips.push('Book flights 2-3 months ahead for better rates. Consider bus/ferry for shorter routes')
  }

  if (!foodCategory || (foodCategory && foodCategory.percentage < 15)) {
    tips.push('Budget ₱300-500/day for meals at local eateries (carinderia)')
  }

  if (perPersonPerDay > 3000) {
    tips.push('This is a mid-range to premium budget. You can find similar experiences for less!')
  } else if (perPersonPerDay < 1500) {
    tips.push('Great budget! Perfect for backpackers. Consider joining group tours to save more')
  }

  // Always add some general tips
  tips.push('Bring a reusable water bottle - refills are free at many spots')
  tips.push('Travel during off-peak months (June-November) for 20-40% lower prices')

  // Only show first 3 tips
  const displayTips = tips.slice(0, 3)

  if (displayTips.length === 0) return null

  return (
    <div className="bg-amber-50 dark:bg-amber-900/20 rounded-2xl p-6 border border-amber-200 dark:border-amber-800">
      <div className="flex items-center gap-2 mb-4">
        <Lightbulb className="w-5 h-5 text-amber-600 dark:text-amber-400" />
        <h3 className="font-semibold text-amber-900 dark:text-amber-100">Budget Tips</h3>
      </div>
      <ul className="space-y-2">
        {displayTips.map((tip, index) => (
          <li
            key={index}
            className="flex items-start gap-2 text-sm text-amber-800 dark:text-amber-200"
          >
            <TrendingDown className="w-4 h-4 mt-0.5 flex-shrink-0 text-amber-600" />
            <span>{tip}</span>
          </li>
        ))}
      </ul>
    </div>
  )
}
