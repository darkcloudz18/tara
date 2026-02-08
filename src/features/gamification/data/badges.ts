// Badge and achievement definitions

export interface Badge {
  id: string
  name: string
  description: string
  icon: string
  tier: 'bronze' | 'silver' | 'gold' | 'platinum'
  category: BadgeCategory
  requirement: BadgeRequirement
}

export type BadgeCategory = 'trips' | 'places' | 'social' | 'explorer' | 'special'

export interface BadgeRequirement {
  type: 'count' | 'destination' | 'streak' | 'special'
  target: number | string
  metric?: string
}

export interface UserBadge {
  badgeId: string
  earnedAt: string
  progress?: number
}

export const BADGES: Badge[] = [
  // Trip badges
  {
    id: 'first-trip',
    name: 'First Steps',
    description: 'Plan your first trip',
    icon: '🎒',
    tier: 'bronze',
    category: 'trips',
    requirement: { type: 'count', target: 1, metric: 'trips_planned' },
  },
  {
    id: 'trip-5',
    name: 'Frequent Traveler',
    description: 'Plan 5 trips',
    icon: '✈️',
    tier: 'silver',
    category: 'trips',
    requirement: { type: 'count', target: 5, metric: 'trips_planned' },
  },
  {
    id: 'trip-10',
    name: 'Globetrotter',
    description: 'Plan 10 trips',
    icon: '🌍',
    tier: 'gold',
    category: 'trips',
    requirement: { type: 'count', target: 10, metric: 'trips_planned' },
  },
  {
    id: 'trip-25',
    name: 'Travel Legend',
    description: 'Plan 25 trips',
    icon: '👑',
    tier: 'platinum',
    category: 'trips',
    requirement: { type: 'count', target: 25, metric: 'trips_planned' },
  },

  // Place badges
  {
    id: 'places-10',
    name: 'Place Collector',
    description: 'Add 10 places to trips',
    icon: '📍',
    tier: 'bronze',
    category: 'places',
    requirement: { type: 'count', target: 10, metric: 'places_added' },
  },
  {
    id: 'places-50',
    name: 'Place Hunter',
    description: 'Add 50 places to trips',
    icon: '🗺️',
    tier: 'silver',
    category: 'places',
    requirement: { type: 'count', target: 50, metric: 'places_added' },
  },
  {
    id: 'places-100',
    name: 'Place Master',
    description: 'Add 100 places to trips',
    icon: '🏆',
    tier: 'gold',
    category: 'places',
    requirement: { type: 'count', target: 100, metric: 'places_added' },
  },

  // Social badges
  {
    id: 'first-share',
    name: 'Social Butterfly',
    description: 'Share your first trip publicly',
    icon: '🦋',
    tier: 'bronze',
    category: 'social',
    requirement: { type: 'count', target: 1, metric: 'trips_shared' },
  },
  {
    id: 'followers-10',
    name: 'Rising Star',
    description: 'Get 10 followers',
    icon: '⭐',
    tier: 'silver',
    category: 'social',
    requirement: { type: 'count', target: 10, metric: 'followers' },
  },
  {
    id: 'followers-50',
    name: 'Influencer',
    description: 'Get 50 followers',
    icon: '🌟',
    tier: 'gold',
    category: 'social',
    requirement: { type: 'count', target: 50, metric: 'followers' },
  },
  {
    id: 'helpful',
    name: 'Helpful Traveler',
    description: 'Have 5 of your trips copied by others',
    icon: '🤝',
    tier: 'silver',
    category: 'social',
    requirement: { type: 'count', target: 5, metric: 'trips_copied' },
  },

  // Explorer badges (destination-based)
  {
    id: 'beach-lover',
    name: 'Beach Bum',
    description: 'Visit a beach destination',
    icon: '🏖️',
    tier: 'bronze',
    category: 'explorer',
    requirement: { type: 'destination', target: 'beach' },
  },
  {
    id: 'island-hopper',
    name: 'Island Hopper',
    description: 'Plan trips to 3 different islands',
    icon: '🏝️',
    tier: 'silver',
    category: 'explorer',
    requirement: { type: 'count', target: 3, metric: 'island_destinations' },
  },
  {
    id: 'mountain-climber',
    name: 'Mountain Explorer',
    description: 'Visit a mountain destination',
    icon: '⛰️',
    tier: 'bronze',
    category: 'explorer',
    requirement: { type: 'destination', target: 'mountain' },
  },
  {
    id: 'north-south',
    name: 'North to South',
    description: 'Visit both Luzon and Mindanao',
    icon: '🧭',
    tier: 'gold',
    category: 'explorer',
    requirement: { type: 'special', target: 'north_south' },
  },
  {
    id: 'visayas-explorer',
    name: 'Visayas Explorer',
    description: 'Visit 3 Visayas destinations',
    icon: '🌺',
    tier: 'silver',
    category: 'explorer',
    requirement: { type: 'count', target: 3, metric: 'visayas_destinations' },
  },

  // Special badges
  {
    id: 'early-adopter',
    name: 'Early Adopter',
    description: 'One of the first users of Tara',
    icon: '🚀',
    tier: 'gold',
    category: 'special',
    requirement: { type: 'special', target: 'early_adopter' },
  },
  {
    id: 'detailed-planner',
    name: 'Detailed Planner',
    description: 'Create a trip with 10+ activities',
    icon: '📋',
    tier: 'bronze',
    category: 'special',
    requirement: { type: 'count', target: 10, metric: 'activities_in_trip' },
  },
  {
    id: 'budget-master',
    name: 'Budget Master',
    description: 'Track expenses for a complete trip',
    icon: '💰',
    tier: 'bronze',
    category: 'special',
    requirement: { type: 'special', target: 'budget_tracked' },
  },
]

export const BADGE_TIERS = {
  bronze: { color: 'text-amber-700 bg-amber-100', points: 10 },
  silver: { color: 'text-gray-600 bg-gray-200', points: 25 },
  gold: { color: 'text-yellow-600 bg-yellow-100', points: 50 },
  platinum: { color: 'text-purple-600 bg-purple-100', points: 100 },
}

export const BADGE_CATEGORIES = {
  trips: { label: 'Trip Planning', icon: '✈️' },
  places: { label: 'Places', icon: '📍' },
  social: { label: 'Social', icon: '👥' },
  explorer: { label: 'Explorer', icon: '🧭' },
  special: { label: 'Special', icon: '⭐' },
}

// Helper to get badge by ID
export const getBadgeById = (id: string): Badge | undefined => {
  return BADGES.find((b) => b.id === id)
}

// Calculate total points from badges
export const calculatePoints = (earnedBadges: UserBadge[]): number => {
  return earnedBadges.reduce((total, ub) => {
    const badge = getBadgeById(ub.badgeId)
    if (badge) {
      return total + BADGE_TIERS[badge.tier].points
    }
    return total
  }, 0)
}

// Get user level based on points
export const getUserLevel = (points: number): { level: number; title: string; nextLevel: number } => {
  const levels = [
    { min: 0, title: 'Newbie Traveler' },
    { min: 50, title: 'Aspiring Explorer' },
    { min: 150, title: 'Seasoned Traveler' },
    { min: 300, title: 'Expert Planner' },
    { min: 500, title: 'Travel Master' },
    { min: 1000, title: 'Legendary Explorer' },
  ]

  let currentLevel = 1
  let currentTitle = levels[0].title
  let nextLevel = levels[1]?.min || Infinity

  for (let i = levels.length - 1; i >= 0; i--) {
    if (points >= levels[i].min) {
      currentLevel = i + 1
      currentTitle = levels[i].title
      nextLevel = levels[i + 1]?.min || Infinity
      break
    }
  }

  return { level: currentLevel, title: currentTitle, nextLevel }
}
