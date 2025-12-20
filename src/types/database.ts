// Tara Database Types

export type UserRole = 'traveler' | 'creator' | 'supplier' | 'admin'
export type ContentType = 'post' | 'story' | 'reel'
export type BookingStatus = 'pending' | 'confirmed' | 'completed' | 'cancelled' | 'refunded'
export type PaymentStatus = 'pending' | 'completed' | 'failed' | 'refunded'
export type PaymentMethod = 'card' | 'gcash' | 'maya' | 'bank_transfer' | 'cash'
export type ListingType = 'hotel' | 'resort' | 'hostel' | 'tour' | 'activity' | 'transport'
export type PlaceType = 'restaurant' | 'hotel' | 'attraction' | 'beach' | 'shopping' | 'activity' | 'transport' | 'other'
export type PriceRange = 'budget' | 'moderate' | 'luxury'

export interface TaraPlace {
  id: string
  name: string
  description?: string
  location: string
  address?: string
  coordinates?: { x: number; y: number }
  place_type: PlaceType
  category?: string
  photos?: string[]
  average_rating: number
  total_reviews: number
  price_range?: PriceRange
  estimated_cost?: number
  opening_hours?: string
  contact_phone?: string
  contact_email?: string
  website?: string
  tags?: string[]
  is_featured: boolean
  is_active: boolean
  created_at: string
  updated_at: string
}

export interface Profile {
  id: string
  email: string
  username?: string
  role: UserRole
  first_name?: string
  last_name?: string
  photo_url?: string
  bio?: string
  location?: string
  phone?: string
  travel_preferences?: {
    interests?: string[]
    budget?: 'budget' | 'moderate' | 'luxury'
  }
  created_at: string
  updated_at: string
}

export interface Creator {
  id: string
  verified: boolean
  total_followers: number
  total_posts: number
  total_views: number
  total_earnings: number
  total_bookings_generated: number
  commission_rate: number
  payout_method?: string
  payout_details?: Record<string, any>
  created_at: string
}

export interface Supplier {
  id: string
  business_name: string
  business_type: ListingType
  description?: string
  location: string
  address?: string
  coordinates?: { x: number; y: number }
  contact_email?: string
  contact_phone?: string
  verified: boolean
  verification_documents?: string[]
  average_rating: number
  total_bookings: number
  total_revenue: number
  created_at: string
}

export interface Post {
  id: string
  user_id: string
  content_type: ContentType
  caption?: string
  media_urls: string[]
  location?: string
  coordinates?: { x: number; y: number }
  hashtags?: string[]
  likes_count: number
  comments_count: number
  views_count: number
  is_affiliate: boolean
  created_at: string
  expires_at?: string
}

export interface Itinerary {
  id: string
  user_id: string
  title: string
  description?: string
  start_date: string
  end_date: string
  destinations: string[]
  is_public: boolean
  cover_image_url?: string
  total_budget?: number
  actual_spent: number
  views_count: number
  copies_count: number
  created_at: string
  updated_at: string
}

export interface ItineraryDay {
  id: string
  itinerary_id: string
  day_number: number
  date: string
  title?: string
  notes?: string
  estimated_budget?: number
  actual_spent: number
  created_at: string
}

export interface ItineraryActivity {
  id: string
  day_id: string
  title: string
  description?: string
  start_time?: string
  end_time?: string
  location: string
  coordinates?: { x: number; y: number }
  place_type?: string
  estimated_cost?: number
  actual_cost?: number
  booking_id?: string
  notes?: string
  order_index: number
  created_at: string
}

export interface Listing {
  id: string
  supplier_id: string
  listing_type: ListingType
  title: string
  description: string
  location: string
  coordinates?: { x: number; y: number }
  price: number
  currency: string
  capacity?: number
  amenities?: string[]
  photos: string[]
  average_rating: number
  total_reviews: number
  total_bookings: number
  is_active: boolean
  created_at: string
  updated_at: string
}

export interface Booking {
  id: string
  user_id: string
  listing_id: string
  itinerary_id?: string
  affiliate_creator_id?: string
  booking_date: string
  check_in?: string
  check_out?: string
  guests: number
  status: BookingStatus
  subtotal: number
  platform_fee: number
  affiliate_commission: number
  total_cost: number
  special_requests?: string
  cancellation_reason?: string
  created_at: string
  updated_at: string
}

export interface Review {
  id: string
  booking_id: string
  user_id: string
  listing_id: string
  rating: number
  cleanliness_rating?: number
  service_rating?: number
  value_rating?: number
  location_rating?: number
  comment?: string
  photos?: string[]
  helpful_count: number
  created_at: string
}

export interface Payment {
  id: string
  booking_id: string
  user_id: string
  amount: number
  payment_method: PaymentMethod
  status: PaymentStatus
  transaction_id?: string
  provider?: string
  metadata?: Record<string, any>
  created_at: string
  completed_at?: string
}

export interface Notification {
  id: string
  user_id: string
  type: string
  title: string
  message: string
  action_url?: string
  read: boolean
  created_at: string
}

// Extended types with relationships
export interface ProfileWithCreator extends Profile {
  creator?: Creator
}

export interface ProfileWithSupplier extends Profile {
  supplier?: Supplier
}

export interface FullProfile extends Profile {
  creator?: Creator
  supplier?: Supplier
}
