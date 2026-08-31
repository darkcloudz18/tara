'use client'

// "Lakad" is a brand vocabulary term, not a language-conditional label
// (see CLAUDE.md: "Never rename to 'trip' or 'plan' in UI copy"). The
// hook previously flipped between an English "Trip" table and a
// Filipino "Lakad" table based on the visitor's timezone, which meant
// English-locale users saw one term and PH-locale users saw another for
// the same UI. That's the definition of vocabulary drift.
//
// Keeping the hook signature so callers don't need to change; the
// English table is gone.

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

const STRINGS: LocalizedTripStrings = {
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

export function useLocalizedTrip(): LocalizedTripStrings & { isFilipino: boolean } {
  // isFilipino stays for callers that branch on it for non-vocab UI
  // (currency, greetings). Vocabulary itself is now unconditional.
  return { ...STRINGS, isFilipino: true }
}

export function getLocalizedTripStrings(): LocalizedTripStrings {
  return STRINGS
}
