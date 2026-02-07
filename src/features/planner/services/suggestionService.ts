import { supabase } from '@/lib/supabase'

export interface TransportSuggestion {
  id: string
  type: 'flight' | 'bus' | 'ferry' | 'van' | 'car_rental'
  provider: string
  from: string
  to: string
  departure_time: string
  arrival_time: string
  duration_minutes: number
  price: number
  is_supplier: boolean
  supplier_id?: string
  listing_id?: string
  details?: {
    airline?: string
    flight_number?: string
    bus_company?: string
    vessel_name?: string
  }
}

export interface AccommodationSuggestion {
  id: string
  name: string
  type: 'hotel' | 'resort' | 'hostel' | 'airbnb' | 'guesthouse'
  location: string
  address?: string
  price_per_night: number
  rating: number
  review_count: number
  amenities: string[]
  photos: string[]
  is_supplier: boolean
  supplier_id?: string
  listing_id?: string
}

export interface ActivitySuggestion {
  id: string
  name: string
  category: 'activity' | 'food' | 'nightlife' | 'attraction' | 'tour' | 'beach' | 'nature'
  location: string
  description?: string
  duration_minutes?: number
  price?: number
  rating: number
  review_count: number
  photos: string[]
  opening_hours?: string
  best_time?: string
  is_supplier: boolean
  supplier_id?: string
  listing_id?: string
  tags?: string[]
}

export interface DaySuggestion {
  day_number: number
  date: string
  title: string
  activities: TimeSlotSuggestion[]
}

export interface TimeSlotSuggestion {
  time: string
  type: 'transport' | 'accommodation' | 'activity' | 'meal' | 'free_time'
  title: string
  description?: string
  location?: string
  duration_minutes: number
  suggestions: (TransportSuggestion | AccommodationSuggestion | ActivitySuggestion)[]
  selected?: TransportSuggestion | AccommodationSuggestion | ActivitySuggestion
}

// Philippine destinations with transport routes
const TRANSPORT_ROUTES: Record<string, { to: string; types: ('flight' | 'bus' | 'ferry' | 'van')[] }[]> = {
  'manila': [
    { to: 'palawan', types: ['flight'] },
    { to: 'puerto princesa', types: ['flight'] },
    { to: 'el nido', types: ['flight'] },
    { to: 'coron', types: ['flight'] },
    { to: 'cebu', types: ['flight', 'ferry'] },
    { to: 'boracay', types: ['flight'] },
    { to: 'siargao', types: ['flight'] },
    { to: 'bohol', types: ['flight'] },
    { to: 'baguio', types: ['bus', 'van'] },
    { to: 'batangas', types: ['bus', 'van'] },
    { to: 'tagaytay', types: ['bus', 'van'] },
  ],
  'cebu': [
    { to: 'bohol', types: ['ferry'] },
    { to: 'siargao', types: ['flight'] },
    { to: 'boracay', types: ['flight'] },
    { to: 'manila', types: ['flight', 'ferry'] },
  ],
}

// Mock transport data (in production, this would come from a transport API/database)
function generateMockTransport(from: string, to: string, type: 'flight' | 'bus' | 'ferry' | 'van'): TransportSuggestion[] {
  const suggestions: TransportSuggestion[] = []
  const baseId = `${type}-${from}-${to}`

  const providers = {
    flight: ['Philippine Airlines', 'Cebu Pacific', 'AirAsia'],
    bus: ['Victory Liner', 'Genesis', 'Solid North'],
    ferry: ['2GO Travel', 'FastCat', 'Montenegro Lines'],
    van: ['JoyBus', 'Partas', 'Private Van'],
  }

  const durations = {
    flight: [60, 90, 120],
    bus: [300, 360, 420],
    ferry: [720, 840, 960],
    van: [240, 300, 360],
  }

  const basePrices = {
    flight: [2500, 3500, 4500],
    bus: [500, 700, 900],
    ferry: [1200, 1800, 2500],
    van: [800, 1000, 1500],
  }

  const departureTimes = ['06:00', '08:00', '10:00', '14:00', '18:00']

  providers[type].forEach((provider, i) => {
    departureTimes.slice(0, 2).forEach((time, j) => {
      const duration = durations[type][i % durations[type].length]
      const price = basePrices[type][i % basePrices[type].length] + (j * 200)

      const [hours, mins] = time.split(':').map(Number)
      const arrivalHours = hours + Math.floor(duration / 60)
      const arrivalMins = mins + (duration % 60)
      const arrivalTime = `${String(arrivalHours % 24).padStart(2, '0')}:${String(arrivalMins % 60).padStart(2, '0')}`

      suggestions.push({
        id: `${baseId}-${i}-${j}`,
        type,
        provider,
        from: from.charAt(0).toUpperCase() + from.slice(1),
        to: to.charAt(0).toUpperCase() + to.slice(1),
        departure_time: time,
        arrival_time: arrivalTime,
        duration_minutes: duration,
        price,
        is_supplier: false,
        details: type === 'flight' ? {
          airline: provider,
          flight_number: `${provider.substring(0, 2).toUpperCase()}${100 + i * 10 + j}`,
        } : undefined,
      })
    })
  })

  return suggestions
}

/**
 * Get transport suggestions between two locations
 */
export async function getTransportSuggestions(
  from: string,
  to: string,
  date: string
): Promise<TransportSuggestion[]> {
  const fromLower = from.toLowerCase()
  const toLower = to.toLowerCase()

  // First, check for supplier transport listings
  const { data: supplierTransport } = await supabase
    .from('listings')
    .select(`
      *,
      supplier:suppliers(id, business_name, verified)
    `)
    .eq('listing_type', 'transport')
    .eq('is_active', true)
    .or(`location.ilike.%${from}%,location.ilike.%${to}%`)

  const supplierSuggestions: TransportSuggestion[] = (supplierTransport || []).map((listing: any) => ({
    id: listing.id,
    type: 'van' as const,
    provider: listing.supplier?.business_name || listing.title,
    from: from,
    to: to,
    departure_time: '08:00',
    arrival_time: '12:00',
    duration_minutes: 240,
    price: listing.price,
    is_supplier: true,
    supplier_id: listing.supplier_id,
    listing_id: listing.id,
  }))

  // Get available routes
  const routes = TRANSPORT_ROUTES[fromLower] || []
  const matchingRoute = routes.find(r =>
    toLower.includes(r.to) || r.to.includes(toLower)
  )

  let mockSuggestions: TransportSuggestion[] = []
  if (matchingRoute) {
    matchingRoute.types.forEach(type => {
      mockSuggestions.push(...generateMockTransport(from, to, type))
    })
  }

  // Prioritize supplier listings
  return [...supplierSuggestions, ...mockSuggestions]
}

/**
 * Get accommodation suggestions for a location
 */
export async function getAccommodationSuggestions(
  location: string,
  checkIn: string,
  checkOut: string
): Promise<AccommodationSuggestion[]> {
  // First, get supplier accommodations (prioritized)
  const { data: supplierAccom } = await supabase
    .from('listings')
    .select(`
      *,
      supplier:suppliers(id, business_name, verified)
    `)
    .in('listing_type', ['hotel', 'resort', 'hostel'])
    .eq('is_active', true)
    .ilike('location', `%${location}%`)
    .order('average_rating', { ascending: false })
    .limit(10)

  const supplierSuggestions: AccommodationSuggestion[] = (supplierAccom || []).map((listing: any) => ({
    id: listing.id,
    name: listing.title,
    type: listing.listing_type,
    location: listing.location,
    address: listing.address,
    price_per_night: listing.price,
    rating: listing.average_rating || 4.0,
    review_count: listing.total_reviews || 0,
    amenities: listing.amenities || [],
    photos: listing.photos || [],
    is_supplier: true,
    supplier_id: listing.supplier_id,
    listing_id: listing.id,
  }))

  // Then, get from places table (curated places)
  const { data: places } = await supabase
    .from('places')
    .select('*')
    .in('place_type', ['hotel', 'resort'])
    .eq('is_active', true)
    .ilike('location', `%${location}%`)
    .order('average_rating', { ascending: false })
    .limit(10)

  const placeSuggestions: AccommodationSuggestion[] = (places || []).map((place: any) => ({
    id: place.id,
    name: place.name,
    type: place.place_type === 'resort' ? 'resort' : 'hotel',
    location: place.location,
    address: place.address,
    price_per_night: place.estimated_cost || 2000,
    rating: place.average_rating || 4.0,
    review_count: place.total_reviews || 0,
    amenities: place.tags || [],
    photos: place.photos || [],
    is_supplier: false,
  }))

  // Prioritize suppliers
  return [...supplierSuggestions, ...placeSuggestions]
}

/**
 * Get activity suggestions for a location
 */
export async function getActivitySuggestions(
  location: string,
  category?: string
): Promise<ActivitySuggestion[]> {
  // First, get supplier activities (prioritized)
  const supplierQuery = supabase
    .from('listings')
    .select(`
      *,
      supplier:suppliers(id, business_name, verified)
    `)
    .in('listing_type', ['tour', 'activity'])
    .eq('is_active', true)
    .ilike('location', `%${location}%`)
    .order('average_rating', { ascending: false })
    .limit(15)

  const { data: supplierActivities } = await supplierQuery

  const supplierSuggestions: ActivitySuggestion[] = (supplierActivities || []).map((listing: any) => ({
    id: listing.id,
    name: listing.title,
    category: listing.listing_type === 'tour' ? 'tour' : 'activity',
    location: listing.location,
    description: listing.description,
    duration_minutes: 180,
    price: listing.price,
    rating: listing.average_rating || 4.0,
    review_count: listing.total_reviews || 0,
    photos: listing.photos || [],
    is_supplier: true,
    supplier_id: listing.supplier_id,
    listing_id: listing.id,
  }))

  // Get from places table
  let placesQuery = supabase
    .from('places')
    .select('*')
    .eq('is_active', true)
    .ilike('location', `%${location}%`)
    .order('average_rating', { ascending: false })
    .limit(20)

  if (category) {
    placesQuery = placesQuery.or(`category.ilike.%${category}%,place_type.ilike.%${category}%`)
  }

  const { data: places } = await placesQuery

  const placeSuggestions: ActivitySuggestion[] = (places || []).map((place: any) => ({
    id: place.id,
    name: place.name,
    category: mapPlaceTypeToCategory(place.place_type, place.category),
    location: place.location,
    description: place.description,
    duration_minutes: 120,
    price: place.estimated_cost,
    rating: place.average_rating || 4.0,
    review_count: place.total_reviews || 0,
    photos: place.photos || [],
    opening_hours: place.opening_hours,
    is_supplier: false,
    tags: place.tags,
  }))

  // Prioritize suppliers
  return [...supplierSuggestions, ...placeSuggestions]
}

function mapPlaceTypeToCategory(placeType: string, category?: string): ActivitySuggestion['category'] {
  if (category?.toLowerCase().includes('food') || placeType === 'restaurant') return 'food'
  if (category?.toLowerCase().includes('beach') || placeType === 'beach') return 'beach'
  if (category?.toLowerCase().includes('night')) return 'nightlife'
  if (category?.toLowerCase().includes('tour')) return 'tour'
  if (category?.toLowerCase().includes('nature')) return 'nature'
  return 'activity'
}

/**
 * Generate a complete itinerary suggestion
 */
export async function generateItinerarySuggestion(
  origin: string,
  destination: string,
  startDate: string,
  endDate: string
): Promise<DaySuggestion[]> {
  const start = new Date(startDate)
  const end = new Date(endDate)
  const totalDays = Math.ceil((end.getTime() - start.getTime()) / (1000 * 60 * 60 * 24)) + 1

  // Fetch all suggestions in parallel
  const [transport, accommodations, activities] = await Promise.all([
    getTransportSuggestions(origin, destination, startDate),
    getAccommodationSuggestions(destination, startDate, endDate),
    getActivitySuggestions(destination),
  ])

  // Categorize activities
  const foodActivities = activities.filter(a => a.category === 'food')
  const tourActivities = activities.filter(a => ['tour', 'activity', 'beach', 'nature'].includes(a.category))
  const nightlifeActivities = activities.filter(a => a.category === 'nightlife')

  const daySuggestions: DaySuggestion[] = []

  for (let i = 0; i < totalDays; i++) {
    const currentDate = new Date(start)
    currentDate.setDate(start.getDate() + i)
    const dateStr = currentDate.toISOString().split('T')[0]

    const timeSlots: TimeSlotSuggestion[] = []

    if (i === 0) {
      // Day 1: Travel day
      timeSlots.push({
        time: '06:00',
        type: 'transport',
        title: `Travel from ${origin} to ${destination}`,
        description: 'Departure',
        location: origin,
        duration_minutes: transport[0]?.duration_minutes || 120,
        suggestions: transport,
      })

      const arrivalTime = transport[0]?.arrival_time || '10:00'
      timeSlots.push({
        time: arrivalTime,
        type: 'transport',
        title: `Arrive in ${destination}`,
        description: 'Transfer to hotel',
        location: destination,
        duration_minutes: 60,
        suggestions: transport.filter(t => t.type === 'van'),
      })

      timeSlots.push({
        time: '12:00',
        type: 'accommodation',
        title: 'Check-in to accommodation',
        description: 'Hotel/Resort check-in',
        location: destination,
        duration_minutes: 60,
        suggestions: accommodations,
      })

      timeSlots.push({
        time: '13:00',
        type: 'meal',
        title: 'Lunch',
        description: 'Try local cuisine',
        location: destination,
        duration_minutes: 90,
        suggestions: foodActivities.slice(0, 5),
      })

      timeSlots.push({
        time: '15:00',
        type: 'activity',
        title: 'Explore the area',
        description: 'Light activity after travel',
        location: destination,
        duration_minutes: 180,
        suggestions: tourActivities.slice(0, 5),
      })

      timeSlots.push({
        time: '19:00',
        type: 'meal',
        title: 'Dinner',
        description: 'Evening dining',
        location: destination,
        duration_minutes: 120,
        suggestions: foodActivities.slice(5, 10),
      })

      daySuggestions.push({
        day_number: i + 1,
        date: dateStr,
        title: `Arrival Day - ${destination}`,
        activities: timeSlots,
      })
    } else if (i === totalDays - 1) {
      // Last day: Departure
      timeSlots.push({
        time: '07:00',
        type: 'meal',
        title: 'Breakfast',
        description: 'Morning meal',
        location: destination,
        duration_minutes: 60,
        suggestions: foodActivities.slice(0, 3),
      })

      timeSlots.push({
        time: '09:00',
        type: 'accommodation',
        title: 'Check-out',
        description: 'Hotel check-out',
        location: destination,
        duration_minutes: 60,
        suggestions: [],
      })

      timeSlots.push({
        time: '10:00',
        type: 'activity',
        title: 'Last-minute shopping/sightseeing',
        description: 'Final exploration',
        location: destination,
        duration_minutes: 120,
        suggestions: tourActivities.slice(10, 15),
      })

      timeSlots.push({
        time: '12:00',
        type: 'meal',
        title: 'Lunch',
        description: 'Last meal in destination',
        location: destination,
        duration_minutes: 90,
        suggestions: foodActivities.slice(0, 5),
      })

      timeSlots.push({
        time: '14:00',
        type: 'transport',
        title: `Transfer to airport/terminal`,
        description: 'Head to departure point',
        location: destination,
        duration_minutes: 60,
        suggestions: transport.filter(t => t.type === 'van'),
      })

      timeSlots.push({
        time: '16:00',
        type: 'transport',
        title: `Depart ${destination} to ${origin}`,
        description: 'Return journey',
        location: destination,
        duration_minutes: transport[0]?.duration_minutes || 120,
        suggestions: transport,
      })

      daySuggestions.push({
        day_number: i + 1,
        date: dateStr,
        title: `Departure Day`,
        activities: timeSlots,
      })
    } else {
      // Middle days: Full activity days
      const activityOffset = (i - 1) * 3

      timeSlots.push({
        time: '07:00',
        type: 'meal',
        title: 'Breakfast',
        description: 'Start your day',
        location: destination,
        duration_minutes: 60,
        suggestions: foodActivities.slice(0, 3),
      })

      timeSlots.push({
        time: '08:30',
        type: 'activity',
        title: 'Morning Activity',
        description: 'Best time for outdoor activities',
        location: destination,
        duration_minutes: 180,
        suggestions: tourActivities.slice(activityOffset, activityOffset + 5),
      })

      timeSlots.push({
        time: '12:00',
        type: 'meal',
        title: 'Lunch',
        description: 'Midday break',
        location: destination,
        duration_minutes: 90,
        suggestions: foodActivities.slice(3, 8),
      })

      timeSlots.push({
        time: '14:00',
        type: 'activity',
        title: 'Afternoon Activity',
        description: 'Continue exploring',
        location: destination,
        duration_minutes: 180,
        suggestions: tourActivities.slice(activityOffset + 5, activityOffset + 10),
      })

      timeSlots.push({
        time: '17:30',
        type: 'free_time',
        title: 'Free Time / Rest',
        description: 'Relax before dinner',
        location: destination,
        duration_minutes: 90,
        suggestions: [],
      })

      timeSlots.push({
        time: '19:00',
        type: 'meal',
        title: 'Dinner',
        description: 'Evening dining',
        location: destination,
        duration_minutes: 120,
        suggestions: foodActivities.slice(5, 10),
      })

      if (nightlifeActivities.length > 0 && i % 2 === 0) {
        timeSlots.push({
          time: '21:00',
          type: 'activity',
          title: 'Nightlife',
          description: 'Evening entertainment',
          location: destination,
          duration_minutes: 180,
          suggestions: nightlifeActivities,
        })
      }

      daySuggestions.push({
        day_number: i + 1,
        date: dateStr,
        title: `Day ${i + 1} - Explore ${destination}`,
        activities: timeSlots,
      })
    }
  }

  return daySuggestions
}

/**
 * Get popular destinations for autocomplete
 */
export async function getPopularDestinations(): Promise<string[]> {
  const { data } = await supabase
    .from('places')
    .select('location')
    .eq('is_active', true)

  const locations = new Set<string>()
  data?.forEach((p: any) => {
    if (p.location) {
      // Extract city/area name
      const parts = p.location.split(',')
      locations.add(parts[0].trim())
    }
  })

  return Array.from(locations).sort()
}
