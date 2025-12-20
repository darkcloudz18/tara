'use client'

import { useRef, useEffect, useState } from 'react'
import { useGoogleMaps } from '../hooks/useGoogleMaps'
import { placeToCoordinates, PLACE_TYPES, PlaceType } from '@/lib/google-maps'

export interface PlaceResult {
  name: string
  address: string
  coordinates?: { x: number; y: number }
  placeId?: string
}

interface PlacesAutocompleteProps {
  value: string
  onChange: (value: string) => void
  onPlaceSelect: (place: PlaceResult) => void
  placeholder?: string
  className?: string
  disabled?: boolean
}

export default function PlacesAutocomplete({
  value,
  onChange,
  onPlaceSelect,
  placeholder = 'Search for a place...',
  className = '',
  disabled = false,
}: PlacesAutocompleteProps) {
  const inputRef = useRef<HTMLInputElement>(null)
  const autocompleteRef = useRef<google.maps.places.Autocomplete | null>(null)
  const { isLoaded } = useGoogleMaps()
  const [isFocused, setIsFocused] = useState(false)

  useEffect(() => {
    if (!isLoaded || !inputRef.current || autocompleteRef.current) return

    // Restrict to Philippines for better local results
    autocompleteRef.current = new google.maps.places.Autocomplete(inputRef.current, {
      componentRestrictions: { country: 'ph' },
      fields: ['name', 'formatted_address', 'geometry', 'place_id'],
    })

    autocompleteRef.current.addListener('place_changed', () => {
      const place = autocompleteRef.current?.getPlace()
      if (!place) return

      const result: PlaceResult = {
        name: place.name || '',
        address: place.formatted_address || '',
        coordinates: placeToCoordinates(place),
        placeId: place.place_id,
      }

      onPlaceSelect(result)
      onChange(place.name || place.formatted_address || '')
    })

    return () => {
      if (autocompleteRef.current) {
        google.maps.event.clearInstanceListeners(autocompleteRef.current)
      }
    }
  }, [isLoaded, onPlaceSelect, onChange])

  return (
    <div className="relative">
      <input
        ref={inputRef}
        type="text"
        value={value}
        onChange={(e) => onChange(e.target.value)}
        onFocus={() => setIsFocused(true)}
        onBlur={() => setIsFocused(false)}
        placeholder={placeholder}
        disabled={disabled || !isLoaded}
        className={`input-field ${className}`}
      />
      {!isLoaded && (
        <div className="absolute right-3 top-1/2 -translate-y-1/2">
          <div className="w-4 h-4 border-2 border-gray-300 border-t-primary-600 rounded-full animate-spin" />
        </div>
      )}
    </div>
  )
}

// Place type selector component
interface PlaceTypeSelectorProps {
  value: PlaceType | undefined
  onChange: (value: PlaceType) => void
  className?: string
}

export function PlaceTypeSelector({
  value,
  onChange,
  className = '',
}: PlaceTypeSelectorProps) {
  return (
    <div className={`flex flex-wrap gap-2 ${className}`}>
      {(Object.entries(PLACE_TYPES) as [PlaceType, { label: string; icon: string }][]).map(
        ([type, { label, icon }]) => (
          <button
            key={type}
            type="button"
            onClick={() => onChange(type)}
            className={`px-3 py-1.5 rounded-full text-sm font-medium transition-colors ${
              value === type
                ? 'bg-primary-600 text-white'
                : 'bg-gray-100 text-gray-700 hover:bg-gray-200'
            }`}
          >
            {icon} {label}
          </button>
        )
      )}
    </div>
  )
}
