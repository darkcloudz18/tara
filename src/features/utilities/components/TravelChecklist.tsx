'use client'

import { useState, useEffect } from 'react'
import { Check, Plus, Trash2, ClipboardList, ChevronDown, ChevronUp, Calendar } from 'lucide-react'

interface ChecklistItem {
  id: string
  text: string
  dueDate?: string
  completed: boolean
  category: ChecklistCategory
}

type ChecklistCategory = 'before_trip' | 'day_before' | 'day_of' | 'during_trip'

const CATEGORY_INFO: Record<ChecklistCategory, { label: string; icon: string }> = {
  before_trip: { label: 'Before Your Trip', icon: '📋' },
  day_before: { label: 'Day Before', icon: '📅' },
  day_of: { label: 'Day of Travel', icon: '✈️' },
  during_trip: { label: 'During Your Trip', icon: '🌴' },
}

const DEFAULT_CHECKLIST: Omit<ChecklistItem, 'id' | 'completed'>[] = [
  // Before trip
  { text: 'Book flights', category: 'before_trip' },
  { text: 'Book accommodations', category: 'before_trip' },
  { text: 'Research destination', category: 'before_trip' },
  { text: 'Check passport validity', category: 'before_trip' },
  { text: 'Get travel insurance', category: 'before_trip' },
  { text: 'Book tours/activities', category: 'before_trip' },
  { text: 'Notify bank of travel', category: 'before_trip' },
  { text: 'Check weather forecast', category: 'before_trip' },

  // Day before
  { text: 'Pack luggage', category: 'day_before' },
  { text: 'Charge all devices', category: 'day_before' },
  { text: 'Download offline maps', category: 'day_before' },
  { text: 'Print/save boarding passes', category: 'day_before' },
  { text: 'Confirm reservations', category: 'day_before' },
  { text: 'Prepare travel documents', category: 'day_before' },
  { text: 'Withdraw cash (PHP)', category: 'day_before' },
  { text: 'Set out-of-office email', category: 'day_before' },

  // Day of travel
  { text: 'Double-check luggage', category: 'day_of' },
  { text: 'Check flight status', category: 'day_of' },
  { text: 'Arrive early at airport', category: 'day_of' },
  { text: 'Secure home (lock doors, etc.)', category: 'day_of' },

  // During trip
  { text: 'Check in to hotel', category: 'during_trip' },
  { text: 'Reconfirm return flight', category: 'during_trip' },
  { text: 'Keep receipts for expenses', category: 'during_trip' },
  { text: 'Stay hydrated', category: 'during_trip' },
]

interface TravelChecklistProps {
  tripId?: string
  startDate?: string
}

export default function TravelChecklist({ tripId, startDate }: TravelChecklistProps) {
  const [items, setItems] = useState<ChecklistItem[]>([])
  const [expandedCategories, setExpandedCategories] = useState<ChecklistCategory[]>(
    Object.keys(CATEGORY_INFO) as ChecklistCategory[]
  )
  const [newItemText, setNewItemText] = useState('')
  const [newItemCategory, setNewItemCategory] = useState<ChecklistCategory>('before_trip')
  const [showAddForm, setShowAddForm] = useState(false)

  // Load checklist
  useEffect(() => {
    const storageKey = `checklist-${tripId || 'default'}`
    const saved = localStorage.getItem(storageKey)

    if (saved) {
      setItems(JSON.parse(saved))
    } else {
      // Initialize with default checklist
      const defaultItems: ChecklistItem[] = DEFAULT_CHECKLIST.map((item, index) => ({
        ...item,
        id: `default-${index}`,
        completed: false,
      }))
      setItems(defaultItems)
    }
  }, [tripId])

  // Save to localStorage
  useEffect(() => {
    if (items.length > 0) {
      const storageKey = `checklist-${tripId || 'default'}`
      localStorage.setItem(storageKey, JSON.stringify(items))
    }
  }, [items, tripId])

  const toggleCompleted = (itemId: string) => {
    setItems((prev) =>
      prev.map((item) =>
        item.id === itemId ? { ...item, completed: !item.completed } : item
      )
    )
  }

  const toggleCategory = (category: ChecklistCategory) => {
    setExpandedCategories((prev) =>
      prev.includes(category)
        ? prev.filter((c) => c !== category)
        : [...prev, category]
    )
  }

  const addItem = () => {
    if (!newItemText.trim()) return

    const newItem: ChecklistItem = {
      id: `custom-${Date.now()}`,
      text: newItemText.trim(),
      category: newItemCategory,
      completed: false,
    }

    setItems((prev) => [...prev, newItem])
    setNewItemText('')
    setShowAddForm(false)
  }

  const removeItem = (itemId: string) => {
    setItems((prev) => prev.filter((item) => item.id !== itemId))
  }

  // Group items by category
  const groupedItems = (Object.keys(CATEGORY_INFO) as ChecklistCategory[]).reduce(
    (acc, category) => {
      acc[category] = items.filter((item) => item.category === category)
      return acc
    },
    {} as Record<ChecklistCategory, ChecklistItem[]>
  )

  // Calculate progress
  const totalItems = items.length
  const completedItems = items.filter((i) => i.completed).length
  const progress = totalItems > 0 ? (completedItems / totalItems) * 100 : 0

  return (
    <div className="bg-white dark:bg-gray-900 rounded-xl border border-gray-200 dark:border-gray-800">
      {/* Header */}
      <div className="px-4 py-4 border-b border-gray-200 dark:border-gray-800">
        <div className="flex items-center justify-between mb-3">
          <div className="flex items-center gap-2">
            <ClipboardList className="w-5 h-5 text-teal-600 dark:text-teal-400" />
            <h3 className="font-semibold text-gray-900 dark:text-white">
              Travel Checklist
            </h3>
          </div>
          <span className="text-sm text-gray-500 dark:text-gray-400">
            {completedItems}/{totalItems} done
          </span>
        </div>

        {/* Progress bar */}
        <div className="h-2 bg-gray-100 dark:bg-gray-800 rounded-full overflow-hidden">
          <div
            className="h-full bg-teal-500 rounded-full transition-all duration-300"
            style={{ width: `${progress}%` }}
          />
        </div>

        {startDate && (
          <div className="mt-3 flex items-center gap-2 text-sm text-gray-500 dark:text-gray-400">
            <Calendar className="w-4 h-4" />
            Trip starts: {new Date(startDate).toLocaleDateString()}
          </div>
        )}
      </div>

      {/* Categories */}
      <div className="divide-y divide-gray-100 dark:divide-gray-800">
        {(Object.keys(CATEGORY_INFO) as ChecklistCategory[]).map((category) => {
          const categoryItems = groupedItems[category]
          const isExpanded = expandedCategories.includes(category)
          const categoryCompleted = categoryItems.filter((i) => i.completed).length

          return (
            <div key={category}>
              {/* Category header */}
              <button
                onClick={() => toggleCategory(category)}
                className="w-full px-4 py-3 flex items-center justify-between hover:bg-gray-50 dark:hover:bg-gray-800/50"
              >
                <div className="flex items-center gap-2">
                  <span>{CATEGORY_INFO[category].icon}</span>
                  <span className="font-medium text-gray-900 dark:text-white">
                    {CATEGORY_INFO[category].label}
                  </span>
                  <span className="text-xs text-gray-400">
                    {categoryCompleted}/{categoryItems.length}
                  </span>
                </div>
                {isExpanded ? (
                  <ChevronUp className="w-5 h-5 text-gray-400" />
                ) : (
                  <ChevronDown className="w-5 h-5 text-gray-400" />
                )}
              </button>

              {/* Items */}
              {isExpanded && (
                <div className="px-4 pb-3 space-y-1">
                  {categoryItems.map((item) => {
                    const isCustom = item.id.startsWith('custom-')

                    return (
                      <div
                        key={item.id}
                        className="flex items-center gap-3 py-2 group"
                      >
                        <button
                          onClick={() => toggleCompleted(item.id)}
                          className={`w-5 h-5 rounded border-2 flex items-center justify-center transition-colors ${
                            item.completed
                              ? 'bg-teal-500 border-teal-500 text-white'
                              : 'border-gray-300 dark:border-gray-600 hover:border-teal-500'
                          }`}
                        >
                          {item.completed && <Check className="w-3 h-3" />}
                        </button>
                        <span
                          className={`flex-1 text-sm ${
                            item.completed
                              ? 'text-gray-400 dark:text-gray-500 line-through'
                              : 'text-gray-700 dark:text-gray-300'
                          }`}
                        >
                          {item.text}
                        </span>
                        {isCustom && (
                          <button
                            onClick={() => removeItem(item.id)}
                            className="p-1 text-gray-400 hover:text-red-500 opacity-0 group-hover:opacity-100 transition-opacity"
                          >
                            <Trash2 className="w-4 h-4" />
                          </button>
                        )}
                      </div>
                    )
                  })}
                </div>
              )}
            </div>
          )
        })}
      </div>

      {/* Add custom item */}
      <div className="px-4 py-3 border-t border-gray-200 dark:border-gray-800">
        {showAddForm ? (
          <div className="flex gap-2">
            <input
              type="text"
              value={newItemText}
              onChange={(e) => setNewItemText(e.target.value)}
              placeholder="New task..."
              className="flex-1 px-3 py-2 text-sm bg-gray-100 dark:bg-gray-800 rounded-lg border-0 focus:outline-none focus:ring-2 focus:ring-teal-500"
              onKeyDown={(e) => e.key === 'Enter' && addItem()}
            />
            <select
              value={newItemCategory}
              onChange={(e) => setNewItemCategory(e.target.value as ChecklistCategory)}
              className="px-3 py-2 text-sm bg-gray-100 dark:bg-gray-800 rounded-lg border-0"
            >
              {(Object.keys(CATEGORY_INFO) as ChecklistCategory[]).map((cat) => (
                <option key={cat} value={cat}>
                  {CATEGORY_INFO[cat].label}
                </option>
              ))}
            </select>
            <button
              onClick={addItem}
              className="px-4 py-2 bg-teal-600 text-white text-sm font-medium rounded-lg hover:bg-teal-700"
            >
              Add
            </button>
            <button
              onClick={() => setShowAddForm(false)}
              className="px-4 py-2 text-gray-500 text-sm hover:text-gray-700"
            >
              Cancel
            </button>
          </div>
        ) : (
          <button
            onClick={() => setShowAddForm(true)}
            className="flex items-center gap-2 text-sm text-teal-600 dark:text-teal-400 hover:underline"
          >
            <Plus className="w-4 h-4" />
            Add custom task
          </button>
        )}
      </div>
    </div>
  )
}
