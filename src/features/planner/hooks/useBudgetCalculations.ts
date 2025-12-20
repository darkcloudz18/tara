'use client'

import { useMemo } from 'react'
import { Itinerary, ItineraryDay, ItineraryActivity } from '@/types/database'

export interface DayBudget {
  dayId: string
  dayNumber: number
  estimated: number
  actual: number
  difference: number
}

export interface BudgetSummary {
  totalBudget: number
  totalEstimated: number
  totalActual: number
  difference: number
  percentUsed: number
  byDay: DayBudget[]
}

export function useBudgetCalculations(
  itinerary: Itinerary | null,
  days: ItineraryDay[],
  activities: ItineraryActivity[]
): BudgetSummary {
  return useMemo(() => {
    if (!itinerary) {
      return {
        totalBudget: 0,
        totalEstimated: 0,
        totalActual: 0,
        difference: 0,
        percentUsed: 0,
        byDay: [],
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
        estimated,
        actual,
        difference: estimated - actual,
      }
    })

    // Calculate totals
    const totalEstimated = byDay.reduce((sum, d) => sum + d.estimated, 0)
    const totalActual = byDay.reduce((sum, d) => sum + d.actual, 0)
    const totalBudget = itinerary.total_budget || 0

    return {
      totalBudget,
      totalEstimated,
      totalActual,
      difference: totalBudget - totalActual,
      percentUsed: totalBudget > 0 ? (totalActual / totalBudget) * 100 : 0,
      byDay,
    }
  }, [itinerary, days, activities])
}

export function formatCurrency(amount: number, currency: string = 'PHP'): string {
  return new Intl.NumberFormat('en-PH', {
    style: 'currency',
    currency,
    minimumFractionDigits: 0,
    maximumFractionDigits: 0,
  }).format(amount)
}
