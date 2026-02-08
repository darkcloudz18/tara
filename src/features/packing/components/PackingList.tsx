'use client'

import { useState, useEffect } from 'react'
import { Check, Plus, Trash2, Package, ChevronDown, ChevronUp } from 'lucide-react'
import {
  PackingItem,
  PackingCategory,
  PACKING_CATEGORIES,
  generatePackingList,
} from '../data/packingItems'

interface PackingListProps {
  tripId?: string
  destination: string
  duration: number
  activities?: string[]
}

interface CheckedState {
  [itemId: string]: boolean
}

export default function PackingList({
  tripId,
  destination,
  duration,
  activities = [],
}: PackingListProps) {
  const [items, setItems] = useState<PackingItem[]>([])
  const [checked, setChecked] = useState<CheckedState>({})
  const [customItems, setCustomItems] = useState<PackingItem[]>([])
  const [newItemName, setNewItemName] = useState('')
  const [newItemCategory, setNewItemCategory] = useState<PackingCategory>('misc')
  const [expandedCategories, setExpandedCategories] = useState<PackingCategory[]>(
    Object.keys(PACKING_CATEGORIES) as PackingCategory[]
  )
  const [showAddForm, setShowAddForm] = useState(false)

  // Load items based on trip
  useEffect(() => {
    const generatedItems = generatePackingList({
      duration,
      destination,
      activities,
    })
    setItems(generatedItems)

    // Load checked state from localStorage
    const storageKey = `packing-${tripId || 'default'}`
    const saved = localStorage.getItem(storageKey)
    if (saved) {
      const { checked: savedChecked, customItems: savedCustom } = JSON.parse(saved)
      setChecked(savedChecked || {})
      setCustomItems(savedCustom || [])
    }
  }, [tripId, destination, duration, activities])

  // Save to localStorage when state changes
  useEffect(() => {
    const storageKey = `packing-${tripId || 'default'}`
    localStorage.setItem(storageKey, JSON.stringify({ checked, customItems }))
  }, [checked, customItems, tripId])

  const toggleChecked = (itemId: string) => {
    setChecked((prev) => ({
      ...prev,
      [itemId]: !prev[itemId],
    }))
  }

  const toggleCategory = (category: PackingCategory) => {
    setExpandedCategories((prev) =>
      prev.includes(category)
        ? prev.filter((c) => c !== category)
        : [...prev, category]
    )
  }

  const addCustomItem = () => {
    if (!newItemName.trim()) return

    const newItem: PackingItem = {
      id: `custom-${Date.now()}`,
      name: newItemName.trim(),
      category: newItemCategory,
      essential: false,
    }

    setCustomItems((prev) => [...prev, newItem])
    setNewItemName('')
    setShowAddForm(false)
  }

  const removeCustomItem = (itemId: string) => {
    setCustomItems((prev) => prev.filter((item) => item.id !== itemId))
    setChecked((prev) => {
      const { [itemId]: _, ...rest } = prev
      return rest
    })
  }

  // Combine generated and custom items, grouped by category
  const allItems = [...items, ...customItems]
  const groupedItems = Object.keys(PACKING_CATEGORIES).reduce(
    (acc, category) => {
      acc[category as PackingCategory] = allItems.filter(
        (item) => item.category === category
      )
      return acc
    },
    {} as Record<PackingCategory, PackingItem[]>
  )

  // Calculate progress
  const totalItems = allItems.length
  const checkedItems = Object.values(checked).filter(Boolean).length
  const progress = totalItems > 0 ? (checkedItems / totalItems) * 100 : 0

  return (
    <div className="bg-white dark:bg-gray-900 rounded-xl border border-gray-200 dark:border-gray-800">
      {/* Header */}
      <div className="px-4 py-4 border-b border-gray-200 dark:border-gray-800">
        <div className="flex items-center justify-between mb-3">
          <div className="flex items-center gap-2">
            <Package className="w-5 h-5 text-teal-600 dark:text-teal-400" />
            <h3 className="font-semibold text-gray-900 dark:text-white">
              Packing List
            </h3>
          </div>
          <span className="text-sm text-gray-500 dark:text-gray-400">
            {checkedItems}/{totalItems} packed
          </span>
        </div>

        {/* Progress bar */}
        <div className="h-2 bg-gray-100 dark:bg-gray-800 rounded-full overflow-hidden">
          <div
            className="h-full bg-teal-500 rounded-full transition-all duration-300"
            style={{ width: `${progress}%` }}
          />
        </div>
      </div>

      {/* Categories */}
      <div className="divide-y divide-gray-100 dark:divide-gray-800">
        {(Object.keys(PACKING_CATEGORIES) as PackingCategory[]).map((category) => {
          const categoryItems = groupedItems[category]
          if (categoryItems.length === 0) return null

          const isExpanded = expandedCategories.includes(category)
          const categoryChecked = categoryItems.filter((i) => checked[i.id]).length

          return (
            <div key={category}>
              {/* Category header */}
              <button
                onClick={() => toggleCategory(category)}
                className="w-full px-4 py-3 flex items-center justify-between hover:bg-gray-50 dark:hover:bg-gray-800/50"
              >
                <div className="flex items-center gap-2">
                  <span>{PACKING_CATEGORIES[category].icon}</span>
                  <span className="font-medium text-gray-900 dark:text-white">
                    {PACKING_CATEGORIES[category].label}
                  </span>
                  <span className="text-xs text-gray-400">
                    {categoryChecked}/{categoryItems.length}
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
                    const isChecked = checked[item.id] || false

                    return (
                      <div
                        key={item.id}
                        className="flex items-center gap-3 py-2 group"
                      >
                        <button
                          onClick={() => toggleChecked(item.id)}
                          className={`w-5 h-5 rounded border-2 flex items-center justify-center transition-colors ${
                            isChecked
                              ? 'bg-teal-500 border-teal-500 text-white'
                              : 'border-gray-300 dark:border-gray-600 hover:border-teal-500'
                          }`}
                        >
                          {isChecked && <Check className="w-3 h-3" />}
                        </button>
                        <span
                          className={`flex-1 text-sm ${
                            isChecked
                              ? 'text-gray-400 dark:text-gray-500 line-through'
                              : 'text-gray-700 dark:text-gray-300'
                          }`}
                        >
                          {item.name}
                          {item.essential && (
                            <span className="ml-1 text-xs text-red-500">*</span>
                          )}
                        </span>
                        {isCustom && (
                          <button
                            onClick={() => removeCustomItem(item.id)}
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
              value={newItemName}
              onChange={(e) => setNewItemName(e.target.value)}
              placeholder="Item name..."
              className="flex-1 px-3 py-2 text-sm bg-gray-100 dark:bg-gray-800 rounded-lg border-0 focus:outline-none focus:ring-2 focus:ring-teal-500"
              onKeyDown={(e) => e.key === 'Enter' && addCustomItem()}
            />
            <select
              value={newItemCategory}
              onChange={(e) => setNewItemCategory(e.target.value as PackingCategory)}
              className="px-3 py-2 text-sm bg-gray-100 dark:bg-gray-800 rounded-lg border-0 focus:outline-none focus:ring-2 focus:ring-teal-500"
            >
              {(Object.keys(PACKING_CATEGORIES) as PackingCategory[]).map((cat) => (
                <option key={cat} value={cat}>
                  {PACKING_CATEGORIES[cat].label}
                </option>
              ))}
            </select>
            <button
              onClick={addCustomItem}
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
            Add custom item
          </button>
        )}
      </div>
    </div>
  )
}
