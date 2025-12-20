'use client'

import { BudgetSummary as BudgetSummaryType, formatCurrency } from '../hooks/useBudgetCalculations'
import { getDayColor } from '@/lib/google-maps'

interface BudgetSummaryProps {
  budget: BudgetSummaryType
  compact?: boolean
}

export default function BudgetSummary({ budget, compact = false }: BudgetSummaryProps) {
  const isOverBudget = budget.totalActual > budget.totalBudget && budget.totalBudget > 0
  const percentUsed = Math.min(budget.percentUsed, 100)

  if (compact) {
    return (
      <div className="flex items-center gap-4 text-sm">
        {budget.totalBudget > 0 && (
          <div className="flex items-center gap-2">
            <span className="text-gray-600">Budget:</span>
            <span className="font-medium">{formatCurrency(budget.totalBudget)}</span>
          </div>
        )}
        <div className="flex items-center gap-2">
          <span className="text-gray-600">Spent:</span>
          <span className={`font-medium ${isOverBudget ? 'text-red-600' : 'text-primary-600'}`}>
            {formatCurrency(budget.totalActual)}
          </span>
        </div>
      </div>
    )
  }

  return (
    <div className="card">
      <h3 className="font-semibold text-gray-900 mb-4">Budget Overview</h3>

      {/* Progress Bar */}
      {budget.totalBudget > 0 && (
        <div className="mb-4">
          <div className="flex justify-between text-sm mb-1">
            <span className="text-gray-600">
              {formatCurrency(budget.totalActual)} of {formatCurrency(budget.totalBudget)}
            </span>
            <span className={isOverBudget ? 'text-red-600 font-medium' : 'text-gray-600'}>
              {budget.percentUsed.toFixed(0)}%
            </span>
          </div>
          <div className="h-2 bg-gray-200 rounded-full overflow-hidden">
            <div
              className={`h-full rounded-full transition-all ${
                isOverBudget ? 'bg-red-500' : 'bg-primary-500'
              }`}
              style={{ width: `${percentUsed}%` }}
            />
          </div>
        </div>
      )}

      {/* Summary Stats */}
      <div className="grid grid-cols-2 gap-4 mb-4">
        <div className="p-3 bg-gray-50 rounded-lg">
          <p className="text-xs text-gray-500 mb-1">Estimated</p>
          <p className="text-lg font-semibold text-gray-900">
            {formatCurrency(budget.totalEstimated)}
          </p>
        </div>
        <div className="p-3 bg-gray-50 rounded-lg">
          <p className="text-xs text-gray-500 mb-1">Actual Spent</p>
          <p className={`text-lg font-semibold ${isOverBudget ? 'text-red-600' : 'text-primary-600'}`}>
            {formatCurrency(budget.totalActual)}
          </p>
        </div>
      </div>

      {/* Remaining / Over Budget */}
      {budget.totalBudget > 0 && (
        <div className={`p-3 rounded-lg ${isOverBudget ? 'bg-red-50' : 'bg-green-50'}`}>
          <p className="text-xs text-gray-600 mb-1">
            {isOverBudget ? 'Over Budget' : 'Remaining'}
          </p>
          <p className={`text-lg font-semibold ${isOverBudget ? 'text-red-600' : 'text-green-600'}`}>
            {isOverBudget ? '+' : ''}{formatCurrency(Math.abs(budget.difference))}
          </p>
        </div>
      )}

      {/* By Day Breakdown */}
      {budget.byDay.length > 0 && (
        <div className="mt-4 pt-4 border-t border-gray-100">
          <h4 className="text-sm font-medium text-gray-700 mb-3">By Day</h4>
          <div className="space-y-2">
            {budget.byDay.map((dayBudget) => (
              <div key={dayBudget.dayId} className="flex items-center gap-3 text-sm">
                <div
                  className="w-6 h-6 rounded-full flex items-center justify-center text-white text-xs font-medium"
                  style={{ backgroundColor: getDayColor(dayBudget.dayNumber) }}
                >
                  {dayBudget.dayNumber}
                </div>
                <div className="flex-1 flex items-center justify-between">
                  <span className="text-gray-600">Day {dayBudget.dayNumber}</span>
                  <div className="flex items-center gap-3">
                    {dayBudget.estimated > 0 && (
                      <span className="text-gray-400">
                        Est: {formatCurrency(dayBudget.estimated)}
                      </span>
                    )}
                    <span className="font-medium text-gray-900">
                      {formatCurrency(dayBudget.actual)}
                    </span>
                  </div>
                </div>
              </div>
            ))}
          </div>
        </div>
      )}
    </div>
  )
}
