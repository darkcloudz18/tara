// Google Maps configuration and utilities

export const GOOGLE_MAPS_API_KEY = process.env.NEXT_PUBLIC_GOOGLE_MAPS_API_KEY || ''

export const GOOGLE_MAPS_LIBRARIES: ('places' | 'geometry' | 'drawing' | 'visualization')[] = [
  'places',
]

// Default center for Philippines
export const DEFAULT_CENTER = {
  lat: 12.8797,
  lng: 121.774,
}

// Default zoom for Philippines
export const DEFAULT_ZOOM = 6

// Map styles for a clean look
export const MAP_STYLES = [
  {
    featureType: 'poi',
    elementType: 'labels',
    stylers: [{ visibility: 'off' }],
  },
]

// Map container style
export const MAP_CONTAINER_STYLE = {
  width: '100%',
  height: '100%',
}

// Map options
export const DEFAULT_MAP_OPTIONS: google.maps.MapOptions = {
  disableDefaultUI: false,
  zoomControl: true,
  mapTypeControl: false,
  streetViewControl: false,
  fullscreenControl: true,
}

// Place types for autocomplete
export const PLACE_TYPES = {
  restaurant: { label: 'Restaurant', icon: '🍽️' },
  attraction: { label: 'Attraction', icon: '🏛️' },
  hotel: { label: 'Hotel', icon: '🏨' },
  beach: { label: 'Beach', icon: '🏖️' },
  shopping: { label: 'Shopping', icon: '🛍️' },
  transport: { label: 'Transport', icon: '🚌' },
  activity: { label: 'Activity', icon: '🎯' },
  other: { label: 'Other', icon: '📍' },
} as const

export type PlaceType = keyof typeof PLACE_TYPES

// Marker colors by day (for itinerary map)
export const DAY_COLORS = [
  '#EF4444', // red
  '#F97316', // orange
  '#EAB308', // yellow
  '#22C55E', // green
  '#06B6D4', // cyan
  '#3B82F6', // blue
  '#8B5CF6', // violet
  '#EC4899', // pink
  '#6366F1', // indigo
  '#14B8A6', // teal
]

export function getDayColor(dayNumber: number): string {
  return DAY_COLORS[(dayNumber - 1) % DAY_COLORS.length]
}

// Convert Google Place result to our coordinate format
export function placeToCoordinates(
  place: google.maps.places.PlaceResult
): { x: number; y: number } | undefined {
  if (!place.geometry?.location) return undefined

  return {
    x: place.geometry.location.lat(),
    y: place.geometry.location.lng(),
  }
}

// Convert our coordinate format to Google LatLng
export function coordinatesToLatLng(
  coordinates: { x: number; y: number } | undefined
): google.maps.LatLngLiteral | undefined {
  if (!coordinates) return undefined

  return {
    lat: coordinates.x,
    lng: coordinates.y,
  }
}

// Calculate bounds to fit all markers
export function calculateBounds(
  coordinates: { x: number; y: number }[]
): google.maps.LatLngBounds | undefined {
  if (coordinates.length === 0) return undefined

  const bounds = new google.maps.LatLngBounds()
  coordinates.forEach((coord) => {
    bounds.extend({ lat: coord.x, lng: coord.y })
  })

  return bounds
}
