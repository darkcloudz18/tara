'use client'

import { useState, useEffect } from 'react'
import { Wallet, TrendingUp, TrendingDown, Plus, Loader2 } from 'lucide-react'
import { budgetService, BudgetSummary, Expense } from '../services/budgetService'

interface BudgetWidgetProps {
  itineraryId: string
  activities: { estimated_cost?: number; place_type?: string }[]
  totalBudget?: number
  isOwner?: boolean
  className?: string
}

const CATEGORY_LABELS: Record<string, string> = {
  transport: 'Transport',
  food: 'Food & Dining',
  accommodation: 'Accommodation',
  activities: 'Activities',
  shopping: 'Shopping',
  other: 'Other',
}

const CATEGORY_COLORS: Record<string, string> = {
  transport: 'bg-blue-500',
  food: 'bg-orange-500',
  accommodation: 'bg-purple-500',
  activities: 'bg-teal-500',
  shopping: 'bg-pink-500',
  other: 'bg-gray-500',
}

export default function BudgetWidget({
  itineraryId,
  activities,
  totalBudget,
  isOwner = false,
  className = '',
}: BudgetWidgetProps) {
  const [summary, setSummary] = useState<BudgetSummary | null>(null)
  const [loading, setLoading] = useState(true)
  const [showAddExpense, setShowAddExpense] = useState(false)

  useEffect(() => {
    loadSummary()
  }, [itineraryId])

  const loadSummary = async () => {
    setLoading(true)
    const data = await budgetService.getBudgetSummary(itineraryId, activities, totalBudget)
    setSummary(data)
    setLoading(false)
  }

  if (loading) {
    return (
      <div className={`bg-white dark:bg-gray-800 rounded-xl p-6 ${className}`}>
        <div className="flex items-center justify-center gap-2 text-gray-500">
          <Loader2 className="w-5 h-5 animate-spin" />
          <span className="text-sm">Loading budget...</span>
        </div>
      </div>
    )
  }

  if (!summary) return null

  const isOverBudget = summary.remaining < 0
  const progressPercent = Math.min(summary.percentUsed, 100)

  return (
    <div className={`bg-white dark:bg-gray-800 rounded-xl border border-gray-200 dark:border-gray-700 overflow-hidden ${className}`}>
      {/* Header */}
      <div className="p-4 border-b border-gray-200 dark:border-gray-700">
        <div className="flex items-center justify-between">
          <h3 className="font-semibold text-gray-900 dark:text-white flex items-center gap-2">
            <Wallet className="w-5 h-5 text-teal-500" />
            Budget Tracker
          </h3>
          {isOwner && (
            <button
              onClick={() => setShowAddExpense(true)}
              className="p-2 text-teal-600 hover:bg-teal-50 dark:hover:bg-teal-900/30 rounded-lg transition-colors"
            >
              <Plus className="w-5 h-5" />
            </button>
          )}
        </div>
      </div>

      {/* Summary */}
      <div className="p-4">
        {/* Progress bar */}
        <div className="mb-4">
          <div className="flex justify-between text-sm mb-2">
            <span className="text-gray-600 dark:text-gray-400">
              ₱{summary.totalActual.toLocaleString()} spent
            </span>
            <span className="text-gray-600 dark:text-gray-400">
              ₱{summary.totalEstimated.toLocaleString()} budget
            </span>
          </div>
          <div className="h-3 bg-gray-200 dark:bg-gray-700 rounded-full overflow-hidden">
            <div
              className={`h-full transition-all duration-500 ${
                isOverBudget ? 'bg-red-500' : 'bg-teal-500'
              }`}
              style={{ width: `${progressPercent}%` }}
            />
          </div>
        </div>

        {/* Remaining */}
        <div className={`p-3 rounded-lg ${
          isOverBudget
            ? 'bg-red-50 dark:bg-red-900/20'
            : 'bg-teal-50 dark:bg-teal-900/20'
        }`}>
          <div className="flex items-center justify-between">
            <span className={`text-sm ${
              isOverBudget
                ? 'text-red-700 dark:text-red-300'
                : 'text-teal-700 dark:text-teal-300'
            }`}>
              {isOverBudget ? 'Over budget' : 'Remaining'}
            </span>
            <span className={`font-bold text-lg flex items-center gap-1 ${
              isOverBudget
                ? 'text-red-600 dark:text-red-400'
                : 'text-teal-600 dark:text-teal-400'
            }`}>
              {isOverBudget ? <TrendingUp className="w-4 h-4" /> : <TrendingDown className="w-4 h-4" />}
              ₱{Math.abs(summary.remaining).toLocaleString()}
            </span>
          </div>
        </div>

        {/* By Category */}
        {Object.keys(summary.byCategory).length > 0 && (
          <div className="mt-4 space-y-2">
            <h4 className="text-sm font-medium text-gray-700 dark:text-gray-300">By Category</h4>
            {Object.entries(summary.byCategory)
              .filter(([_, values]) => values.estimated > 0 || values.actual > 0)
              .map(([category, values]) => {
                const catPercent = values.estimated > 0
                  ? (values.actual / values.estimated) * 100
                  : 0
                return (
                  <div key={category} className="flex items-center gap-3">
                    <div className={`w-2 h-2 rounded-full ${CATEGORY_COLORS[category] || 'bg-gray-400'}`} />
                    <span className="text-sm text-gray-600 dark:text-gray-400 flex-1">
                      {CATEGORY_LABELS[category] || category}
                    </span>
                    <span className="text-sm font-medium text-gray-900 dark:text-white">
                      ₱{values.actual.toLocaleString()}
                    </span>
                    <span className="text-xs text-gray-500 dark:text-gray-400">
                      / ₱{values.estimated.toLocaleString()}
                    </span>
                  </div>
                )
              })}
          </div>
        )}
      </div>

      {/* Add Expense Modal would go here */}
      {showAddExpense && (
        <AddExpenseModal
          itineraryId={itineraryId}
          onClose={() => setShowAddExpense(false)}
          onAdd={() => {
            setShowAddExpense(false)
            loadSummary()
          }}
        />
      )}
    </div>
  )
}

// Simple Add Expense Modal
function AddExpenseModal({
  itineraryId,
  onClose,
  onAdd,
}: {
  itineraryId: string
  onClose: () => void
  onAdd: () => void
}) {
  const [title, setTitle] = useState('')
  const [amount, setAmount] = useState('')
  const [category, setCategory] = useState<Expense['category']>('other')
  const [date, setDate] = useState(new Date().toISOString().split('T')[0])
  const [loading, setLoading] = useState(false)

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()
    if (!title || !amount) return

    setLoading(true)
    await budgetService.addExpense({
      itinerary_id: itineraryId,
      title,
      amount: parseFloat(amount),
      category,
      date,
    })
    setLoading(false)
    onAdd()
  }

  return (
    <div className="fixed inset-0 bg-black/50 flex items-center justify-center p-4 z-50">
      <div className="bg-white dark:bg-gray-800 rounded-xl max-w-md w-full p-6">
        <h3 className="text-lg font-bold text-gray-900 dark:text-white mb-4">Add Expense</h3>

        <form onSubmit={handleSubmit} className="space-y-4">
          <div>
            <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">
              Description
            </label>
            <input
              type="text"
              value={title}
              onChange={(e) => setTitle(e.target.value)}
              placeholder="e.g., Lunch at Jollibee"
              className="w-full px-3 py-2 border border-gray-300 dark:border-gray-600 rounded-lg bg-white dark:bg-gray-700 text-gray-900 dark:text-white"
              required
            />
          </div>

          <div>
            <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">
              Amount (₱)
            </label>
            <input
              type="number"
              value={amount}
              onChange={(e) => setAmount(e.target.value)}
              placeholder="0"
              min="0"
              step="0.01"
              className="w-full px-3 py-2 border border-gray-300 dark:border-gray-600 rounded-lg bg-white dark:bg-gray-700 text-gray-900 dark:text-white"
              required
            />
          </div>

          <div>
            <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">
              Category
            </label>
            <select
              value={category}
              onChange={(e) => setCategory(e.target.value as Expense['category'])}
              className="w-full px-3 py-2 border border-gray-300 dark:border-gray-600 rounded-lg bg-white dark:bg-gray-700 text-gray-900 dark:text-white"
            >
              {Object.entries(CATEGORY_LABELS).map(([key, label]) => (
                <option key={key} value={key}>{label}</option>
              ))}
            </select>
          </div>

          <div>
            <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">
              Date
            </label>
            <input
              type="date"
              value={date}
              onChange={(e) => setDate(e.target.value)}
              className="w-full px-3 py-2 border border-gray-300 dark:border-gray-600 rounded-lg bg-white dark:bg-gray-700 text-gray-900 dark:text-white"
            />
          </div>

          <div className="flex gap-3 pt-2">
            <button
              type="button"
              onClick={onClose}
              className="flex-1 px-4 py-2 border border-gray-300 dark:border-gray-600 rounded-lg text-gray-700 dark:text-gray-300 hover:bg-gray-50 dark:hover:bg-gray-700"
            >
              Cancel
            </button>
            <button
              type="submit"
              disabled={loading}
              className="flex-1 px-4 py-2 bg-teal-600 text-white rounded-lg hover:bg-teal-700 disabled:opacity-50"
            >
              {loading ? 'Adding...' : 'Add Expense'}
            </button>
          </div>
        </form>
      </div>
    </div>
  )
}
