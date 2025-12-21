'use client'

import { useState, useRef } from 'react'
import { ChevronLeft, ChevronRight } from 'lucide-react'

interface Destination {
  id: string
  name: string
  image: string
  shortName: string
}

const destinations: Destination[] = [
  {
    id: 'boracay',
    name: 'Boracay',
    image: 'https://images.unsplash.com/photo-1507525428034-b723cf961d3e?w=150&h=150&fit=crop',
    shortName: 'Boracay',
  },
  {
    id: 'palawan',
    name: 'Palawan',
    image: 'https://images.unsplash.com/photo-1518509562904-e7ef99cdcc86?w=150&h=150&fit=crop',
    shortName: 'Palawan',
  },
  {
    id: 'cebu',
    name: 'Cebu',
    image: 'https://images.unsplash.com/photo-1505881502353-a1986add3762?w=150&h=150&fit=crop',
    shortName: 'Cebu',
  },
  {
    id: 'siargao',
    name: 'Siargao',
    image: 'https://images.unsplash.com/photo-1506905925346-21bda4d32df4?w=150&h=150&fit=crop',
    shortName: 'Siargao',
  },
  {
    id: 'bohol',
    name: 'Bohol',
    image: 'https://images.unsplash.com/photo-1551918120-9739cb430c6d?w=150&h=150&fit=crop',
    shortName: 'Bohol',
  },
  {
    id: 'batanes',
    name: 'Batanes',
    image: 'https://images.unsplash.com/photo-1580889272677-1892a2c382bb?w=150&h=150&fit=crop',
    shortName: 'Batanes',
  },
  {
    id: 'manila',
    name: 'Manila',
    image: 'https://images.unsplash.com/photo-1518509562904-e7ef99cdcc86?w=150&h=150&fit=crop',
    shortName: 'Manila',
  },
  {
    id: 'baguio',
    name: 'Baguio',
    image: 'https://images.unsplash.com/photo-1506905925346-21bda4d32df4?w=150&h=150&fit=crop',
    shortName: 'Baguio',
  },
]

interface DestinationStoriesProps {
  onSelect?: (destination: string | null) => void
  selected?: string | null
}

export default function DestinationStories({ onSelect, selected }: DestinationStoriesProps) {
  const scrollRef = useRef<HTMLDivElement>(null)
  const [showLeftArrow, setShowLeftArrow] = useState(false)
  const [showRightArrow, setShowRightArrow] = useState(true)

  const scroll = (direction: 'left' | 'right') => {
    if (scrollRef.current) {
      const scrollAmount = 200
      scrollRef.current.scrollBy({
        left: direction === 'left' ? -scrollAmount : scrollAmount,
        behavior: 'smooth',
      })
    }
  }

  const handleScroll = () => {
    if (scrollRef.current) {
      const { scrollLeft, scrollWidth, clientWidth } = scrollRef.current
      setShowLeftArrow(scrollLeft > 0)
      setShowRightArrow(scrollLeft < scrollWidth - clientWidth - 10)
    }
  }

  const handleDestinationClick = (destinationId: string) => {
    if (selected === destinationId) {
      onSelect?.(null) // Deselect
    } else {
      onSelect?.(destinationId)
    }
  }

  return (
    <div className="relative bg-white border-b border-gray-200 py-4">
      {/* Left Arrow */}
      {showLeftArrow && (
        <button
          onClick={() => scroll('left')}
          className="absolute left-2 top-1/2 -translate-y-1/2 z-10 w-8 h-8 bg-white rounded-full shadow-lg flex items-center justify-center hover:bg-gray-50"
        >
          <ChevronLeft className="w-5 h-5 text-gray-600" />
        </button>
      )}

      {/* Stories Container */}
      <div
        ref={scrollRef}
        onScroll={handleScroll}
        className="flex gap-4 overflow-x-auto scrollbar-hide px-4"
        style={{ scrollbarWidth: 'none', msOverflowStyle: 'none' }}
      >
        {destinations.map((destination) => (
          <button
            key={destination.id}
            onClick={() => handleDestinationClick(destination.id)}
            className="flex flex-col items-center gap-1 flex-shrink-0"
          >
            {/* Story Ring */}
            <div
              className={`p-[3px] rounded-full ${
                selected === destination.id
                  ? 'bg-gray-300'
                  : 'bg-gradient-to-tr from-yellow-400 via-red-500 to-purple-600'
              }`}
            >
              <div className="p-[2px] bg-white rounded-full">
                <img
                  src={destination.image}
                  alt={destination.name}
                  className="w-14 h-14 rounded-full object-cover"
                />
              </div>
            </div>
            {/* Name */}
            <span
              className={`text-xs truncate w-16 text-center ${
                selected === destination.id ? 'font-semibold text-gray-900' : 'text-gray-600'
              }`}
            >
              {destination.shortName}
            </span>
          </button>
        ))}
      </div>

      {/* Right Arrow */}
      {showRightArrow && (
        <button
          onClick={() => scroll('right')}
          className="absolute right-2 top-1/2 -translate-y-1/2 z-10 w-8 h-8 bg-white rounded-full shadow-lg flex items-center justify-center hover:bg-gray-50"
        >
          <ChevronRight className="w-5 h-5 text-gray-600" />
        </button>
      )}
    </div>
  )
}
