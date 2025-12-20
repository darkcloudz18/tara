'use client'

import { Bed, UtensilsCrossed, Camera, Compass } from 'lucide-react'
import { PlaceCategory } from '../../services/placeService'

interface CategoryFilterProps {
  selected: PlaceCategory
  onChange: (category: PlaceCategory) => void
}

const CATEGORIES: {
  id: PlaceCategory
  label: string
  icon: React.ElementType
  color: string
  activeColor: string
}[] = [
  {
    id: 'all',
    label: 'All',
    icon: Compass,
    color: 'text-gray-500 bg-gray-100',
    activeColor: 'text-primary-700 bg-primary-100',
  },
  {
    id: 'stay',
    label: 'Stay',
    icon: Bed,
    color: 'text-gray-500 bg-gray-100',
    activeColor: 'text-blue-700 bg-blue-100',
  },
  {
    id: 'eat',
    label: 'Eat',
    icon: UtensilsCrossed,
    color: 'text-gray-500 bg-gray-100',
    activeColor: 'text-orange-700 bg-orange-100',
  },
  {
    id: 'see',
    label: 'See',
    icon: Camera,
    color: 'text-gray-500 bg-gray-100',
    activeColor: 'text-purple-700 bg-purple-100',
  },
  {
    id: 'do',
    label: 'Do',
    icon: Compass,
    color: 'text-gray-500 bg-gray-100',
    activeColor: 'text-green-700 bg-green-100',
  },
]

export default function CategoryFilter({
  selected,
  onChange,
}: CategoryFilterProps) {
  return (
    <div className="flex gap-2 overflow-x-auto pb-2 -mx-4 px-4 scrollbar-hide">
      {CATEGORIES.map((cat) => {
        const Icon = cat.icon
        const isActive = selected === cat.id
        return (
          <button
            key={cat.id}
            onClick={() => onChange(cat.id)}
            className={`flex items-center gap-2 px-4 py-2.5 rounded-xl font-medium text-sm whitespace-nowrap transition-all ${
              isActive ? cat.activeColor : cat.color
            }`}
          >
            <Icon className="w-4 h-4" />
            {cat.label}
          </button>
        )
      })}
    </div>
  )
}
