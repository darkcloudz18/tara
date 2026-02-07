'use client'

import { useState, useEffect } from 'react'

interface LocalizedTripStrings {
  trip: string
  trips: string
  myTrips: string
  addToTrip: string
  createTrip: string
  newTrip: string
  viewTrip: string
  planTrip: string
  buildTrip: string
  startTrip: string
}

const ENGLISH_STRINGS: LocalizedTripStrings = {
  trip: 'Trip',
  trips: 'Trips',
  myTrips: 'My Trips',
  addToTrip: 'Add to Trip',
  createTrip: 'Create Trip',
  newTrip: 'New Trip',
  viewTrip: 'View Trip',
  planTrip: 'Plan Trip',
  buildTrip: 'Build Trip',
  startTrip: 'Start Trip',
}

const FILIPINO_STRINGS: LocalizedTripStrings = {
  trip: 'Lakad',
  trips: 'Lakad',
  myTrips: 'My Lakad',
  addToTrip: 'Add to Lakad',
  createTrip: 'Create Lakad',
  newTrip: 'New Lakad',
  viewTrip: 'View Lakad',
  planTrip: 'Plan Lakad',
  buildTrip: 'Build Lakad',
  startTrip: 'Start Lakad',
}

function isInPhilippines(): boolean {
  if (typeof window === 'undefined') return false

  try {
    // Check timezone
    const timezone = Intl.DateTimeFormat().resolvedOptions().timeZone
    if (timezone === 'Asia/Manila') return true

    // Check browser language
    const language = navigator.language?.toLowerCase() || ''
    if (language.includes('fil') || language.includes('tl') || language === 'ph') return true

    // Check all languages
    const languages = navigator.languages?.map(l => l.toLowerCase()) || []
    if (languages.some(l => l.includes('fil') || l.includes('tl') || l.includes('ph'))) return true

    return false
  } catch {
    return false
  }
}

export function useLocalizedTrip(): LocalizedTripStrings & { isFilipino: boolean } {
  const [isFilipino, setIsFilipino] = useState(false)

  useEffect(() => {
    setIsFilipino(isInPhilippines())
  }, [])

  const strings = isFilipino ? FILIPINO_STRINGS : ENGLISH_STRINGS

  return {
    ...strings,
    isFilipino,
  }
}

// For server components or static usage
export function getLocalizedTripStrings(isFilipino: boolean = false): LocalizedTripStrings {
  return isFilipino ? FILIPINO_STRINGS : ENGLISH_STRINGS
}
