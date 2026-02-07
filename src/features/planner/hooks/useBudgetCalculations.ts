'use client'

import { useMemo } from 'react'
import { Itinerary, ItineraryDay, ItineraryActivity } from '@/types/database'

export interface DayBudget {
  dayId: string
  dayNumber: number
  date: string
  estimated: number
  actual: number
  difference: number
}

export interface CategoryBudget {
  category: string
  label: string
  icon: string
  color: string
  estimated: number
  actual: number
  percentage: number
  itemCount: number
}

export interface BudgetSummary {
  totalBudget: number
  totalEstimated: number
  totalActual: number
  difference: number
  percentUsed: number
  perPersonCost: number
  travelers: number
  byDay: DayBudget[]
  byCategory: CategoryBudget[]
}

// Category definitions with colors
const CATEGORY_CONFIG: Record<string, { label: string; icon: string; color: string }> = {
  transport: { label: 'Transport', icon: 'plane', color: '#3B82F6' }, // blue
  accommodation: { label: 'Accommodation', icon: 'hotel', color: '#8B5CF6' }, // purple
  activity: { label: 'Activities', icon: 'camera', color: '#14B8A6' }, // teal
  meal: { label: 'Food & Dining', icon: 'utensils', color: '#F97316' }, // orange
  food: { label: 'Food & Dining', icon: 'utensils', color: '#F97316' }, // orange
  other: { label: 'Other', icon: 'circle', color: '#6B7280' }, // gray
}

export function useBudgetCalculations(
  itinerary: Itinerary | null,
  days: ItineraryDay[],
  activities: ItineraryActivity[],
  travelers: number = 1
): BudgetSummary {
  return useMemo(() => {
    if (!itinerary) {
      return {
        totalBudget: 0,
        totalEstimated: 0,
        totalActual: 0,
        difference: 0,
        percentUsed: 0,
        perPersonCost: 0,
        travelers: 1,
        byDay: [],
        byCategory: [],
      }
    }

    // Calculate budget by day
    const byDay: DayBudget[] = days.map((day) => {
      const dayActivities = activities.filter((a) => a.day_id === day.id)

      const estimated = dayActivities.reduce(
        (sum, a) => sum + (a.estimated_cost || 0),
        0
      )
      const actual = dayActivities.reduce(
        (sum, a) => sum + (a.actual_cost || 0),
        0
      )

      return {
        dayId: day.id,
        dayNumber: day.day_number,
        date: day.date,
        estimated,
        actual,
        difference: estimated - actual,
      }
    })

    // Calculate budget by category
    const categoryTotals: Record<string, { estimated: number; actual: number; count: number }> = {}

    activities.forEach((activity) => {
      // Normalize category from place_type
      let category = (activity.place_type || 'other').toLowerCase()

      // Map common variations
      if (category.includes('transport') || category.includes('flight') || category.includes('bus') || category.includes('ferry')) {
        category = 'transport'
      } else if (category.includes('hotel') || category.includes('resort') || category.includes('accommodation') || category.includes('stay')) {
        category = 'accommodation'
      } else if (category.includes('food') || category.includes('meal') || category.includes('restaurant') || category.includes('dining')) {
        category = 'meal'
      } else if (category.includes('activity') || category.includes('tour') || category.includes('attraction') || category.includes('beach')) {
        category = 'activity'
      } else if (!CATEGORY_CONFIG[category]) {
        category = 'other'
      }

      if (!categoryTotals[category]) {
        categoryTotals[category] = { estimated: 0, actual: 0, count: 0 }
      }

      categoryTotals[category].estimated += activity.estimated_cost || 0
      categoryTotals[category].actual += activity.actual_cost || 0
      categoryTotals[category].count += 1
    })

    // Calculate totals
    const totalEstimated = byDay.reduce((sum, d) => sum + d.estimated, 0)
    const totalActual = byDay.reduce((sum, d) => sum + d.actual, 0)
    const totalBudget = itinerary.total_budget || totalEstimated
    const effectiveTravelers = travelers > 0 ? travelers : 1

    // Build category breakdown
    const byCategory: CategoryBudget[] = Object.entries(categoryTotals)
      .filter(([_, data]) => data.estimated > 0 || data.actual > 0)
      .map(([category, data]) => {
        const config = CATEGORY_CONFIG[category] || CATEGORY_CONFIG.other
        return {
          category,
          label: config.label,
          icon: config.icon,
          color: config.color,
          estimated: data.estimated,
          actual: data.actual,
          percentage: totalEstimated > 0 ? (data.estimated / totalEstimated) * 100 : 0,
          itemCount: data.count,
        }
      })
      .sort((a, b) => b.estimated - a.estimated) // Sort by highest spend first

    return {
      totalBudget,
      totalEstimated,
      totalActual,
      difference: totalBudget - totalActual,
      percentUsed: totalBudget > 0 ? (totalActual / totalBudget) * 100 : 0,
      perPersonCost: totalEstimated / effectiveTravelers,
      travelers: effectiveTravelers,
      byDay,
      byCategory,
    }
  }, [itinerary, days, activities, travelers])
}

export function formatCurrency(amount: number, currency: string = 'PHP'): string {
  return new Intl.NumberFormat('en-PH', {
    style: 'currency',
    currency,
    minimumFractionDigits: 0,
    maximumFractionDigits: 0,
  }).format(amount)
}
