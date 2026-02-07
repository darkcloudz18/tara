// Pre-made trip templates for popular Philippine destinations
// These will be used on the homepage hero and template selector

export interface TripTemplate {
  id: string
  slug: string
  destination: string
  title: string
  duration: number // days
  description: string
  highlights: string[]
  image: string
  startingFrom: string // origin city
  estimatedBudget: number // per person in PHP
  bestFor: string[] // e.g., ['couples', 'adventure', 'budget']
  bestMonths: string[] // e.g., ['Dec', 'Jan', 'Feb']
}

export const TRIP_TEMPLATES: TripTemplate[] = [
  {
    id: 'palawan-island-hopping',
    slug: 'palawan-5-days',
    destination: 'Palawan',
    title: 'Palawan Island Paradise',
    duration: 5,
    description: 'Crystal clear waters, hidden lagoons, and stunning limestone cliffs. The ultimate island hopping experience.',
    highlights: ['El Nido Island Hopping', 'Big Lagoon', 'Secret Beach', 'Nacpan Beach', 'Underground River'],
    image: 'https://images.unsplash.com/photo-1518509562904-e7ef99cdcc86?w=800&q=80',
    startingFrom: 'Manila',
    estimatedBudget: 15000,
    bestFor: ['couples', 'adventure', 'photography'],
    bestMonths: ['Dec', 'Jan', 'Feb', 'Mar', 'Apr'],
  },
  {
    id: 'siargao-surf-chill',
    slug: 'siargao-4-days',
    destination: 'Siargao',
    title: 'Siargao Surf & Chill',
    duration: 4,
    description: 'Ride the famous Cloud 9 waves, explore palm-lined roads, and embrace the island life.',
    highlights: ['Cloud 9 Surfing', 'Sugba Lagoon', 'Magpupungko Rock Pools', 'Island Hopping', 'Coconut Road'],
    image: 'https://images.unsplash.com/photo-1507525428034-b723cf961d3e?w=800&q=80',
    startingFrom: 'Manila',
    estimatedBudget: 12000,
    bestFor: ['solo', 'surfers', 'backpackers'],
    bestMonths: ['Mar', 'Apr', 'May', 'Sep', 'Oct'],
  },
  {
    id: 'boracay-beach-getaway',
    slug: 'boracay-3-days',
    destination: 'Boracay',
    title: 'Boracay Beach Escape',
    duration: 3,
    description: 'White sand beaches, vibrant nightlife, and world-class sunsets on the Philippines\' most famous island.',
    highlights: ['White Beach', 'Puka Shell Beach', 'Ariel\'s Point', 'D\'Mall', 'Sunset Sailing'],
    image: 'https://images.unsplash.com/photo-1519046904884-53103b34b206?w=800&q=80',
    startingFrom: 'Manila',
    estimatedBudget: 10000,
    bestFor: ['couples', 'friends', 'nightlife'],
    bestMonths: ['Nov', 'Dec', 'Jan', 'Feb', 'Mar', 'Apr'],
  },
  {
    id: 'bohol-adventure',
    slug: 'bohol-3-days',
    destination: 'Bohol',
    title: 'Bohol Nature & Heritage',
    duration: 3,
    description: 'See the iconic Chocolate Hills, meet the tiny tarsiers, and relax on Panglao\'s white sand beaches.',
    highlights: ['Chocolate Hills', 'Tarsier Sanctuary', 'Loboc River Cruise', 'Panglao Beach', 'Hinagdanan Cave'],
    image: 'https://images.unsplash.com/photo-1570789210967-2cac24ba7f2b?w=800&q=80',
    startingFrom: 'Manila',
    estimatedBudget: 8000,
    bestFor: ['families', 'nature', 'culture'],
    bestMonths: ['Jan', 'Feb', 'Mar', 'Apr', 'May'],
  },
  {
    id: 'cebu-city-oslob',
    slug: 'cebu-4-days',
    destination: 'Cebu',
    title: 'Cebu City & Whale Sharks',
    duration: 4,
    description: 'Historic streets, delicious lechon, majestic waterfalls, and swim with gentle whale sharks.',
    highlights: ['Whale Shark Swimming', 'Kawasan Falls', 'Magellan\'s Cross', 'Lechon Feast', 'Temple of Leah'],
    image: 'https://images.unsplash.com/photo-1505881502353-a1986add3762?w=800&q=80',
    startingFrom: 'Manila',
    estimatedBudget: 10000,
    bestFor: ['adventure', 'foodies', 'history'],
    bestMonths: ['Jan', 'Feb', 'Mar', 'Apr', 'May'],
  },
  {
    id: 'baguio-cool-escape',
    slug: 'baguio-3-days',
    destination: 'Baguio',
    title: 'Baguio Cool Escape',
    duration: 3,
    description: 'Escape the heat in the City of Pines. Cozy cafes, strawberry farms, and mountain views await.',
    highlights: ['Burnham Park', 'Strawberry Farm', 'Mines View Park', 'Session Road', 'BenCab Museum'],
    image: 'https://images.unsplash.com/photo-1506905925346-21bda4d32df4?w=800&q=80',
    startingFrom: 'Manila',
    estimatedBudget: 5000,
    bestFor: ['couples', 'budget', 'relaxation'],
    bestMonths: ['Nov', 'Dec', 'Jan', 'Feb'],
  },
  {
    id: 'batanes-heritage',
    slug: 'batanes-4-days',
    destination: 'Batanes',
    title: 'Batanes Heritage Tour',
    duration: 4,
    description: 'Rolling hills, stone houses, and dramatic cliffs. Experience the untouched beauty of the northernmost province.',
    highlights: ['Basco Lighthouse', 'Vayang Rolling Hills', 'Sabtang Island', 'Stone Houses', 'Honesty Store'],
    image: 'https://images.unsplash.com/photo-1501785888041-af3ef285b470?w=800&q=80',
    startingFrom: 'Manila',
    estimatedBudget: 20000,
    bestFor: ['photography', 'culture', 'adventure'],
    bestMonths: ['Mar', 'Apr', 'May', 'Jun'],
  },
  {
    id: 'coron-underwater',
    slug: 'coron-4-days',
    destination: 'Coron',
    title: 'Coron Underwater World',
    duration: 4,
    description: 'Dive into WWII shipwrecks, swim in pristine lakes, and snorkel in coral gardens.',
    highlights: ['Kayangan Lake', 'Twin Lagoon', 'Shipwreck Diving', 'Barracuda Lake', 'Island Hopping'],
    image: 'https://images.unsplash.com/photo-1544551763-46a013bb70d5?w=800&q=80',
    startingFrom: 'Manila',
    estimatedBudget: 14000,
    bestFor: ['divers', 'snorkeling', 'adventure'],
    bestMonths: ['Dec', 'Jan', 'Feb', 'Mar', 'Apr'],
  },
]

// Get featured templates for homepage (top 4)
export const getFeaturedTemplates = () => TRIP_TEMPLATES.slice(0, 4)

// Get template by slug
export const getTemplateBySlug = (slug: string) =>
  TRIP_TEMPLATES.find(t => t.slug === slug)

// Get template by destination
export const getTemplatesByDestination = (destination: string) =>
  TRIP_TEMPLATES.filter(t =>
    t.destination.toLowerCase().includes(destination.toLowerCase())
  )
