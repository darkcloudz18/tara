// Pre-defined packing list items organized by category

export interface PackingItem {
  id: string
  name: string
  category: PackingCategory
  essential: boolean
  weatherDependent?: 'hot' | 'cold' | 'rainy'
  activityDependent?: string[]
}

export type PackingCategory =
  | 'documents'
  | 'clothing'
  | 'toiletries'
  | 'electronics'
  | 'health'
  | 'beach'
  | 'accessories'
  | 'misc'

export const PACKING_CATEGORIES: Record<PackingCategory, { label: string; icon: string }> = {
  documents: { label: 'Documents', icon: '📄' },
  clothing: { label: 'Clothing', icon: '👕' },
  toiletries: { label: 'Toiletries', icon: '🧴' },
  electronics: { label: 'Electronics', icon: '📱' },
  health: { label: 'Health & Medicine', icon: '💊' },
  beach: { label: 'Beach & Water', icon: '🏖️' },
  accessories: { label: 'Accessories', icon: '🎒' },
  misc: { label: 'Miscellaneous', icon: '📦' },
}

export const PACKING_ITEMS: PackingItem[] = [
  // Documents
  { id: 'passport', name: 'Passport / Valid ID', category: 'documents', essential: true },
  { id: 'tickets', name: 'Flight/Ferry Tickets', category: 'documents', essential: true },
  { id: 'hotel-booking', name: 'Hotel Booking Confirmation', category: 'documents', essential: true },
  { id: 'cash', name: 'Cash (PHP)', category: 'documents', essential: true },
  { id: 'credit-cards', name: 'Credit/Debit Cards', category: 'documents', essential: true },
  { id: 'travel-insurance', name: 'Travel Insurance Documents', category: 'documents', essential: false },
  { id: 'itinerary', name: 'Printed Itinerary', category: 'documents', essential: false },

  // Clothing
  { id: 'tshirts', name: 'T-shirts', category: 'clothing', essential: true },
  { id: 'shorts', name: 'Shorts', category: 'clothing', essential: true, weatherDependent: 'hot' },
  { id: 'pants', name: 'Pants/Jeans', category: 'clothing', essential: true },
  { id: 'underwear', name: 'Underwear', category: 'clothing', essential: true },
  { id: 'socks', name: 'Socks', category: 'clothing', essential: true },
  { id: 'sleepwear', name: 'Sleepwear', category: 'clothing', essential: false },
  { id: 'swimwear', name: 'Swimwear', category: 'clothing', essential: true, activityDependent: ['beach', 'swimming', 'island hopping'] },
  { id: 'jacket', name: 'Light Jacket', category: 'clothing', essential: false, weatherDependent: 'cold' },
  { id: 'rain-jacket', name: 'Rain Jacket', category: 'clothing', essential: false, weatherDependent: 'rainy' },
  { id: 'sandals', name: 'Sandals/Flip-flops', category: 'clothing', essential: true },
  { id: 'walking-shoes', name: 'Comfortable Walking Shoes', category: 'clothing', essential: true },
  { id: 'hiking-shoes', name: 'Hiking Shoes', category: 'clothing', essential: false, activityDependent: ['hiking', 'trekking'] },

  // Toiletries
  { id: 'toothbrush', name: 'Toothbrush & Toothpaste', category: 'toiletries', essential: true },
  { id: 'shampoo', name: 'Shampoo & Conditioner', category: 'toiletries', essential: true },
  { id: 'soap', name: 'Body Wash/Soap', category: 'toiletries', essential: true },
  { id: 'deodorant', name: 'Deodorant', category: 'toiletries', essential: true },
  { id: 'sunscreen', name: 'Sunscreen (SPF 50+)', category: 'toiletries', essential: true },
  { id: 'moisturizer', name: 'Moisturizer', category: 'toiletries', essential: false },
  { id: 'razor', name: 'Razor', category: 'toiletries', essential: false },
  { id: 'insect-repellent', name: 'Insect Repellent', category: 'toiletries', essential: true },

  // Electronics
  { id: 'phone', name: 'Phone & Charger', category: 'electronics', essential: true },
  { id: 'power-bank', name: 'Power Bank', category: 'electronics', essential: true },
  { id: 'camera', name: 'Camera', category: 'electronics', essential: false },
  { id: 'earphones', name: 'Earphones/Headphones', category: 'electronics', essential: false },
  { id: 'adapter', name: 'Universal Adapter', category: 'electronics', essential: false },
  { id: 'waterproof-phone-case', name: 'Waterproof Phone Case', category: 'electronics', essential: false, activityDependent: ['beach', 'island hopping', 'water activities'] },

  // Health
  { id: 'prescription-meds', name: 'Prescription Medications', category: 'health', essential: true },
  { id: 'first-aid', name: 'Basic First Aid Kit', category: 'health', essential: true },
  { id: 'pain-relievers', name: 'Pain Relievers (Paracetamol)', category: 'health', essential: true },
  { id: 'motion-sickness', name: 'Motion Sickness Medicine', category: 'health', essential: false, activityDependent: ['island hopping', 'boat tours'] },
  { id: 'antidiarrheal', name: 'Antidiarrheal Medicine', category: 'health', essential: false },
  { id: 'band-aids', name: 'Band-aids', category: 'health', essential: true },
  { id: 'hand-sanitizer', name: 'Hand Sanitizer', category: 'health', essential: true },
  { id: 'face-masks', name: 'Face Masks', category: 'health', essential: false },

  // Beach & Water
  { id: 'snorkel-gear', name: 'Snorkel Gear', category: 'beach', essential: false, activityDependent: ['snorkeling', 'island hopping'] },
  { id: 'beach-towel', name: 'Beach Towel', category: 'beach', essential: true, activityDependent: ['beach'] },
  { id: 'dry-bag', name: 'Dry Bag', category: 'beach', essential: false, activityDependent: ['island hopping', 'water activities'] },
  { id: 'reef-shoes', name: 'Reef/Aqua Shoes', category: 'beach', essential: false, activityDependent: ['island hopping', 'beach'] },
  { id: 'rashguard', name: 'Rashguard', category: 'beach', essential: false, activityDependent: ['beach', 'surfing', 'snorkeling'] },

  // Accessories
  { id: 'sunglasses', name: 'Sunglasses', category: 'accessories', essential: true },
  { id: 'hat', name: 'Hat/Cap', category: 'accessories', essential: true },
  { id: 'daypack', name: 'Daypack/Small Bag', category: 'accessories', essential: true },
  { id: 'reusable-bottle', name: 'Reusable Water Bottle', category: 'accessories', essential: true },
  { id: 'umbrella', name: 'Umbrella', category: 'accessories', essential: false, weatherDependent: 'rainy' },
  { id: 'travel-pillow', name: 'Travel Pillow', category: 'accessories', essential: false },

  // Misc
  { id: 'plastic-bags', name: 'Plastic/Ziplock Bags', category: 'misc', essential: true },
  { id: 'laundry-bag', name: 'Laundry Bag', category: 'misc', essential: false },
  { id: 'snacks', name: 'Snacks', category: 'misc', essential: false },
  { id: 'books', name: 'Books/Kindle', category: 'misc', essential: false },
  { id: 'travel-games', name: 'Travel Games/Cards', category: 'misc', essential: false },
]

// Generate packing list based on trip details
export function generatePackingList(config: {
  duration: number
  destination: string
  activities: string[]
  weather?: 'hot' | 'cold' | 'rainy'
}): PackingItem[] {
  const { duration, destination, activities, weather } = config

  // Start with essential items
  let items = PACKING_ITEMS.filter((item) => {
    // Always include essential items
    if (item.essential) return true

    // Include weather-dependent items
    if (item.weatherDependent && item.weatherDependent === weather) return true

    // Include activity-dependent items
    if (item.activityDependent) {
      const activityMatch = item.activityDependent.some((a) =>
        activities.some((activity) => activity.toLowerCase().includes(a.toLowerCase()))
      )
      if (activityMatch) return true
    }

    return false
  })

  // Check if beach destination
  const beachDestinations = ['boracay', 'palawan', 'siargao', 'cebu', 'bohol', 'coron', 'el nido']
  const isBeachTrip = beachDestinations.some((d) =>
    destination.toLowerCase().includes(d)
  )

  if (isBeachTrip) {
    // Add beach-related items
    const beachItems = PACKING_ITEMS.filter(
      (item) => item.category === 'beach' && !items.find((i) => i.id === item.id)
    )
    items = [...items, ...beachItems]
  }

  // Check if mountain/cold destination
  const coldDestinations = ['baguio', 'sagada', 'batanes']
  const isColdTrip = coldDestinations.some((d) =>
    destination.toLowerCase().includes(d)
  )

  if (isColdTrip) {
    // Add cold weather items
    const coldItems = PACKING_ITEMS.filter(
      (item) => item.weatherDependent === 'cold' && !items.find((i) => i.id === item.id)
    )
    items = [...items, ...coldItems]
  }

  return items
}
