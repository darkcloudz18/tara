import { TRIP_TEMPLATES, TripTemplate, TemplateDay, TemplateActivity } from '@/features/planner/data/tripTemplates'
import { fetchTaraPlaces, DiscoverPlace } from '@/features/planner/services/placeService'

export interface TripPreferences {
  destination?: string
  duration: number // days
  budget: number // PHP
  travelStyle: TravelStyle[]
  groupType: GroupType
  interests: string[]
  startDate?: string
}

export type TravelStyle = 'adventure' | 'relaxation' | 'culture' | 'foodie' | 'photography' | 'nightlife' | 'nature' | 'budget'
export type GroupType = 'solo' | 'couple' | 'family' | 'friends'

export interface GeneratedTrip {
  title: string
  description: string
  destination: string
  duration: number
  estimatedBudget: number
  days: GeneratedDay[]
  highlights: string[]
  tips: string[]
}

export interface GeneratedDay {
  dayNumber: number
  title: string
  activities: GeneratedActivity[]
  dailyBudget: number
}

export interface GeneratedActivity {
  name: string
  time: string
  duration: string
  cost: number
  category: 'see' | 'eat' | 'do' | 'stay'
  description?: string
  placeId?: string
}

// Philippine destinations with their characteristics
const DESTINATION_DATA: Record<string, {
  keywords: string[]
  styles: TravelStyle[]
  avgDailyCost: number
  bestFor: GroupType[]
}> = {
  'Palawan': {
    keywords: ['island', 'beach', 'lagoon', 'el nido', 'coron', 'underground river', 'snorkel', 'dive'],
    styles: ['adventure', 'nature', 'photography', 'relaxation'],
    avgDailyCost: 3000,
    bestFor: ['couple', 'friends', 'solo'],
  },
  'Boracay': {
    keywords: ['beach', 'party', 'nightlife', 'white sand', 'sunset', 'sailing'],
    styles: ['relaxation', 'nightlife', 'photography'],
    avgDailyCost: 3500,
    bestFor: ['couple', 'friends'],
  },
  'Siargao': {
    keywords: ['surf', 'surfing', 'island', 'cloud 9', 'chill', 'beach', 'lagoon'],
    styles: ['adventure', 'relaxation', 'nature'],
    avgDailyCost: 2500,
    bestFor: ['solo', 'friends'],
  },
  'Cebu': {
    keywords: ['whale shark', 'oslob', 'waterfall', 'kawasan', 'lechon', 'city', 'historic'],
    styles: ['adventure', 'foodie', 'culture'],
    avgDailyCost: 2500,
    bestFor: ['couple', 'friends', 'family'],
  },
  'Bohol': {
    keywords: ['chocolate hills', 'tarsier', 'beach', 'nature', 'panglao', 'river cruise'],
    styles: ['nature', 'culture', 'relaxation'],
    avgDailyCost: 2000,
    bestFor: ['family', 'couple'],
  },
  'Baguio': {
    keywords: ['mountain', 'cool', 'cold', 'pine', 'strawberry', 'cafe', 'art'],
    styles: ['relaxation', 'culture', 'foodie'],
    avgDailyCost: 1500,
    bestFor: ['couple', 'friends', 'family'],
  },
  'Batanes': {
    keywords: ['rolling hills', 'stone house', 'lighthouse', 'cliff', 'scenic', 'heritage'],
    styles: ['photography', 'culture', 'nature'],
    avgDailyCost: 4000,
    bestFor: ['couple', 'solo'],
  },
  'Coron': {
    keywords: ['dive', 'shipwreck', 'lake', 'lagoon', 'snorkel', 'island hopping'],
    styles: ['adventure', 'nature', 'photography'],
    avgDailyCost: 3000,
    bestFor: ['couple', 'friends'],
  },
}

// Parse natural language input to extract preferences
export function parseNaturalLanguage(input: string): Partial<TripPreferences> {
  const lower = input.toLowerCase()
  const preferences: Partial<TripPreferences> = {}

  // Extract destination
  for (const [dest, data] of Object.entries(DESTINATION_DATA)) {
    if (lower.includes(dest.toLowerCase())) {
      preferences.destination = dest
      break
    }
    // Check keywords
    for (const keyword of data.keywords) {
      if (lower.includes(keyword)) {
        preferences.destination = dest
        break
      }
    }
  }

  // Extract duration
  const durationMatch = lower.match(/(\d+)\s*(day|night|d|n)/i)
  if (durationMatch) {
    preferences.duration = parseInt(durationMatch[1])
  }

  // Extract budget
  const budgetMatch = lower.match(/(?:₱|php|p)?\s*(\d{1,3}(?:,?\d{3})*(?:k)?)/i)
  if (budgetMatch) {
    let budget = budgetMatch[1].replace(/,/g, '')
    if (budget.toLowerCase().endsWith('k')) {
      budget = String(parseInt(budget) * 1000)
    }
    preferences.budget = parseInt(budget)
  }

  // Extract travel style
  const styles: TravelStyle[] = []
  if (lower.includes('adventure') || lower.includes('thrill') || lower.includes('exciting')) styles.push('adventure')
  if (lower.includes('relax') || lower.includes('chill') || lower.includes('peaceful')) styles.push('relaxation')
  if (lower.includes('culture') || lower.includes('history') || lower.includes('heritage')) styles.push('culture')
  if (lower.includes('food') || lower.includes('eat') || lower.includes('culinary')) styles.push('foodie')
  if (lower.includes('photo') || lower.includes('instagram') || lower.includes('scenic')) styles.push('photography')
  if (lower.includes('party') || lower.includes('nightlife') || lower.includes('club')) styles.push('nightlife')
  if (lower.includes('nature') || lower.includes('wildlife') || lower.includes('eco')) styles.push('nature')
  if (lower.includes('budget') || lower.includes('cheap') || lower.includes('affordable')) styles.push('budget')
  if (styles.length > 0) preferences.travelStyle = styles

  // Extract group type
  if (lower.includes('solo') || lower.includes('alone') || lower.includes('myself')) {
    preferences.groupType = 'solo'
  } else if (lower.includes('couple') || lower.includes('romantic') || lower.includes('honeymoon') || lower.includes('partner')) {
    preferences.groupType = 'couple'
  } else if (lower.includes('family') || lower.includes('kid') || lower.includes('children')) {
    preferences.groupType = 'family'
  } else if (lower.includes('friend') || lower.includes('group') || lower.includes('barkada')) {
    preferences.groupType = 'friends'
  }

  // Extract interests
  const interests: string[] = []
  if (lower.includes('beach')) interests.push('beach')
  if (lower.includes('mountain') || lower.includes('hik')) interests.push('hiking')
  if (lower.includes('dive') || lower.includes('diving')) interests.push('diving')
  if (lower.includes('snorkel')) interests.push('snorkeling')
  if (lower.includes('surf')) interests.push('surfing')
  if (lower.includes('island')) interests.push('island hopping')
  if (lower.includes('waterfall')) interests.push('waterfalls')
  if (lower.includes('food') || lower.includes('restaurant')) interests.push('food')
  if (lower.includes('shopping')) interests.push('shopping')
  if (interests.length > 0) preferences.interests = interests

  return preferences
}

// Find matching template
function findMatchingTemplate(preferences: TripPreferences): TripTemplate | null {
  let bestMatch: TripTemplate | null = null
  let bestScore = 0

  for (const template of TRIP_TEMPLATES) {
    let score = 0

    // Destination match (highest weight)
    if (preferences.destination && template.destination.toLowerCase() === preferences.destination.toLowerCase()) {
      score += 50
    }

    // Duration match
    const durationDiff = Math.abs(template.duration - preferences.duration)
    if (durationDiff === 0) score += 20
    else if (durationDiff === 1) score += 10
    else if (durationDiff === 2) score += 5

    // Budget match
    const budgetDiff = Math.abs(template.estimatedBudget - preferences.budget)
    if (budgetDiff < 2000) score += 15
    else if (budgetDiff < 5000) score += 10
    else if (budgetDiff < 10000) score += 5

    // Style match
    for (const style of preferences.travelStyle) {
      if (template.bestFor.some(bf => bf.toLowerCase().includes(style))) {
        score += 5
      }
    }

    if (score > bestScore) {
      bestScore = score
      bestMatch = template
    }
  }

  return bestMatch
}

// Generate activities for a day
function generateDayActivities(
  dayNumber: number,
  destination: string,
  dailyBudget: number,
  preferences: TripPreferences,
  isFirstDay: boolean,
  isLastDay: boolean
): GeneratedActivity[] {
  const activities: GeneratedActivity[] = []
  let remainingBudget = dailyBudget

  if (isFirstDay) {
    // First day: arrival activities
    activities.push({
      name: `Arrive in ${destination}`,
      time: '10:00 AM',
      duration: '2 hours',
      cost: 0,
      category: 'do',
      description: 'Arrive and get settled',
    })
    activities.push({
      name: 'Check-in at accommodation',
      time: '12:00 PM',
      duration: '1 hour',
      cost: Math.min(remainingBudget * 0.4, 2000),
      category: 'stay',
    })
    remainingBudget -= activities[activities.length - 1].cost
    activities.push({
      name: 'Lunch at local restaurant',
      time: '01:30 PM',
      duration: '1 hour',
      cost: Math.min(remainingBudget * 0.15, 500),
      category: 'eat',
    })
    remainingBudget -= activities[activities.length - 1].cost
    activities.push({
      name: 'Explore the area',
      time: '03:00 PM',
      duration: '3 hours',
      cost: 0,
      category: 'see',
    })
    activities.push({
      name: 'Dinner',
      time: '07:00 PM',
      duration: '1.5 hours',
      cost: Math.min(remainingBudget * 0.2, 700),
      category: 'eat',
    })
  } else if (isLastDay) {
    // Last day: departure activities
    activities.push({
      name: 'Breakfast',
      time: '07:00 AM',
      duration: '1 hour',
      cost: Math.min(remainingBudget * 0.1, 300),
      category: 'eat',
    })
    activities.push({
      name: 'Pack and check-out',
      time: '09:00 AM',
      duration: '1 hour',
      cost: 0,
      category: 'do',
    })
    activities.push({
      name: 'Last-minute shopping/sightseeing',
      time: '10:00 AM',
      duration: '2 hours',
      cost: Math.min(remainingBudget * 0.3, 1000),
      category: 'do',
    })
    activities.push({
      name: 'Lunch',
      time: '12:30 PM',
      duration: '1 hour',
      cost: Math.min(remainingBudget * 0.15, 500),
      category: 'eat',
    })
    activities.push({
      name: `Depart from ${destination}`,
      time: '03:00 PM',
      duration: '2 hours',
      cost: 0,
      category: 'do',
    })
  } else {
    // Regular day: full activities
    activities.push({
      name: 'Breakfast',
      time: '07:30 AM',
      duration: '1 hour',
      cost: Math.min(remainingBudget * 0.1, 300),
      category: 'eat',
    })
    remainingBudget -= activities[activities.length - 1].cost

    // Main activity based on preferences
    const mainActivityCost = Math.min(remainingBudget * 0.4, 1500)
    if (preferences.interests?.includes('island hopping') || preferences.interests?.includes('beach')) {
      activities.push({
        name: 'Island Hopping Tour',
        time: '09:00 AM',
        duration: '6 hours',
        cost: mainActivityCost,
        category: 'do',
        description: 'Visit multiple islands, swim, snorkel, and enjoy lunch on the beach',
      })
    } else if (preferences.interests?.includes('diving')) {
      activities.push({
        name: 'Diving Adventure',
        time: '08:00 AM',
        duration: '5 hours',
        cost: mainActivityCost,
        category: 'do',
        description: 'Explore underwater sites with a certified dive guide',
      })
    } else if (preferences.interests?.includes('hiking')) {
      activities.push({
        name: 'Mountain/Nature Trek',
        time: '06:00 AM',
        duration: '5 hours',
        cost: mainActivityCost,
        category: 'do',
        description: 'Guided trek through scenic trails',
      })
    } else {
      activities.push({
        name: 'Sightseeing Tour',
        time: '09:00 AM',
        duration: '4 hours',
        cost: mainActivityCost,
        category: 'see',
        description: `Explore the best attractions in ${destination}`,
      })
    }
    remainingBudget -= mainActivityCost

    activities.push({
      name: 'Lunch',
      time: '01:00 PM',
      duration: '1.5 hours',
      cost: Math.min(remainingBudget * 0.2, 500),
      category: 'eat',
    })
    remainingBudget -= activities[activities.length - 1].cost

    // Afternoon activity
    activities.push({
      name: preferences.travelStyle.includes('relaxation') ? 'Beach/Pool Relaxation' : 'Explore Local Area',
      time: '03:00 PM',
      duration: '2 hours',
      cost: Math.min(remainingBudget * 0.15, 300),
      category: 'see',
    })
    remainingBudget -= activities[activities.length - 1].cost

    // Evening
    if (preferences.travelStyle.includes('nightlife')) {
      activities.push({
        name: 'Dinner & Night Out',
        time: '07:00 PM',
        duration: '4 hours',
        cost: remainingBudget,
        category: 'eat',
        description: 'Dinner followed by bars and nightlife',
      })
    } else {
      activities.push({
        name: 'Dinner',
        time: '07:00 PM',
        duration: '1.5 hours',
        cost: Math.min(remainingBudget * 0.8, 800),
        category: 'eat',
      })
    }
  }

  return activities
}

// Main function: Generate a trip
export async function generateTrip(preferences: TripPreferences): Promise<GeneratedTrip> {
  // Find matching template
  const template = findMatchingTemplate(preferences)
  const destination = preferences.destination || template?.destination || 'Palawan'

  // Calculate daily budget
  const dailyBudget = preferences.budget / preferences.duration

  // Generate days
  const days: GeneratedDay[] = []
  for (let i = 1; i <= preferences.duration; i++) {
    const isFirstDay = i === 1
    const isLastDay = i === preferences.duration

    let dayActivities: GeneratedActivity[]

    // Use template activities if available
    if (template?.suggestedDays && i <= template.suggestedDays.length) {
      const templateDay = template.suggestedDays[i - 1]
      dayActivities = templateDay.activities.map(a => ({
        ...a,
        cost: Math.round(a.cost * (preferences.budget / template.estimatedBudget)),
      }))
    } else {
      dayActivities = generateDayActivities(i, destination, dailyBudget, preferences, isFirstDay, isLastDay)
    }

    const dayBudget = dayActivities.reduce((sum, a) => sum + a.cost, 0)

    days.push({
      dayNumber: i,
      title: template?.suggestedDays?.[i - 1]?.title || getDayTitle(i, preferences.duration, destination),
      activities: dayActivities,
      dailyBudget: dayBudget,
    })
  }

  // Generate title
  const styleDesc = preferences.travelStyle[0] ? `${capitalize(preferences.travelStyle[0])} ` : ''
  const groupDesc = preferences.groupType === 'solo' ? 'Solo ' : preferences.groupType === 'couple' ? 'Romantic ' : ''

  // Generate tips
  const tips = generateTips(destination, preferences)

  return {
    title: `${groupDesc}${styleDesc}${destination} Adventure`,
    description: template?.description || `A ${preferences.duration}-day ${preferences.travelStyle.join(', ')} trip to ${destination}`,
    destination,
    duration: preferences.duration,
    estimatedBudget: days.reduce((sum, d) => sum + d.dailyBudget, 0),
    days,
    highlights: template?.highlights || getDefaultHighlights(destination),
    tips,
  }
}

function getDayTitle(dayNumber: number, totalDays: number, destination: string): string {
  if (dayNumber === 1) return `Arrival in ${destination}`
  if (dayNumber === totalDays) return 'Departure Day'
  return `Day ${dayNumber} - ${destination} Exploration`
}

function capitalize(str: string): string {
  return str.charAt(0).toUpperCase() + str.slice(1)
}

function getDefaultHighlights(destination: string): string[] {
  const data = DESTINATION_DATA[destination]
  if (!data) return ['Local attractions', 'Scenic views', 'Local cuisine']
  return data.keywords.slice(0, 5).map(k => capitalize(k))
}

function generateTips(destination: string, preferences: TripPreferences): string[] {
  const tips: string[] = []

  tips.push(`Best time to visit ${destination}: Check weather forecasts before your trip`)
  tips.push('Book accommodations and tours in advance during peak season')

  if (preferences.travelStyle.includes('budget')) {
    tips.push('Look for local eateries ("carinderias") for affordable meals')
    tips.push('Use public transport or shared vans instead of private transfers')
  }

  if (preferences.groupType === 'family') {
    tips.push('Check if attractions are family-friendly and have facilities for children')
  }

  if (preferences.interests?.includes('diving') || preferences.interests?.includes('snorkeling')) {
    tips.push('Bring reef-safe sunscreen to protect marine life')
  }

  tips.push('Always carry cash as some areas may not accept cards')
  tips.push('Download offline maps before your trip')

  return tips.slice(0, 5)
}

// Quick suggestions based on partial input
export function getQuickSuggestions(input: string): string[] {
  const suggestions: string[] = []
  const lower = input.toLowerCase()

  if (lower.includes('beach') || lower.includes('island')) {
    suggestions.push('5 days in Palawan for island hopping')
    suggestions.push('3 days Boracay beach getaway')
    suggestions.push('4 days Siargao surf trip')
  } else if (lower.includes('mountain') || lower.includes('cool') || lower.includes('cold')) {
    suggestions.push('3 days Baguio cool escape')
    suggestions.push('4 days Batanes scenic tour')
  } else if (lower.includes('adventure')) {
    suggestions.push('4 days Cebu whale shark + waterfalls')
    suggestions.push('4 days Coron diving adventure')
  } else if (lower.includes('family')) {
    suggestions.push('3 days Bohol family trip')
    suggestions.push('4 days Cebu family adventure')
  } else if (lower.includes('romantic') || lower.includes('couple')) {
    suggestions.push('5 days romantic Palawan')
    suggestions.push('3 days Boracay couple getaway')
  } else {
    // Default suggestions
    suggestions.push('5 days Palawan island hopping')
    suggestions.push('3 days Boracay beach escape')
    suggestions.push('4 days Cebu adventure')
    suggestions.push('3 days Bohol nature trip')
  }

  return suggestions.slice(0, 4)
}
