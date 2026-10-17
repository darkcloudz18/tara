'use client'

import { Wallet } from 'lucide-react'
import type { BudgetSummary } from '../hooks/useBudgetCalculations'

interface Props {
  budget: BudgetSummary
}

/**
 * Compact running-cost readout for the builder header. Reads from the
 * same useBudgetCalculations the sidebar does, so it stays in sync as the
 * user edits — add a place, delete a day, change estimated_cost, this
 * updates on the next render.
 */
export default function RunningCostChip({ budget }: Props) {
  if (budget.totalEstimated <= 0) return null

  const total = Math.round(budget.totalEstimated)
  const perPerson = budget.travelers > 1 ? Math.round(budget.perPersonCost) : null

  return (
    <div className="inline-flex items-center gap-2 px-3 py-1.5 rounded-full bg-gray-100 dark:bg-gray-800 text-sm">
      <Wallet className="w-4 h-4 text-gray-500 dark:text-gray-400" aria-hidden="true" />
      <span className="font-medium text-gray-900 dark:text-white tabular-nums">
        ₱{formatMoney(total)}
      </span>
      <span className="text-gray-500 dark:text-gray-400">running total</span>
      {perPerson !== null && (
        <span className="text-xs text-gray-500 dark:text-gray-400">
          · ₱{formatMoney(perPerson)}/person
        </span>
      )}
    </div>
  )
}

function formatMoney(n: number): string {
  if (n >= 1000) return `${(n / 1000).toFixed(n >= 10000 ? 0 : 1)}k`
  return n.toLocaleString()
}
