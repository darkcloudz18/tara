'use client'

import { MapPin } from 'lucide-react'

interface DestinationFilterProps {
  destinations: string[]
  selected: string
  onChange: (destination: string) => void
}

export default function DestinationFilter({
  destinations,
  selected,
  onChange,
}: DestinationFilterProps) {
  return (
    <div className="flex gap-2 overflow-x-auto pb-3 -mx-4 px-4 scrollbar-hide">
      {/* All option */}
      <button
        onClick={() => onChange('all')}
        className={`flex items-center gap-1.5 px-4 py-2 rounded-full text-sm font-medium whitespace-nowrap transition-all ${
          selected === 'all'
            ? 'bg-primary-600 text-white'
            : 'bg-gray-100 text-gray-600 hover:bg-gray-200'
        }`}
      >
        <MapPin className="w-4 h-4" />
        All Destinations
      </button>

      {/* Destination pills */}
      {destinations.map((dest) => (
        <button
          key={dest}
          onClick={() => onChange(dest)}
          className={`px-4 py-2 rounded-full text-sm font-medium whitespace-nowrap transition-all ${
            selected === dest
              ? 'bg-primary-600 text-white'
              : 'bg-gray-100 text-gray-600 hover:bg-gray-200'
          }`}
        >
          {dest}
        </button>
      ))}
    </div>
  )
}
