export type UserRole = 'customer' | 'worker' | 'admin'
export type BookingStatus = 'pending' | 'accepted' | 'in_progress' | 'completed' | 'cancelled'
export type PaymentStatus = 'pending' | 'completed' | 'failed' | 'refunded'
export type PaymentMethod = 'cash' | 'gcash' | 'card' | 'bank_transfer'

export interface Profile {
  id: string
  email: string
  role: UserRole
  first_name?: string
  last_name?: string
  phone?: string
  photo_url?: string
  address?: string
  city?: string
  barangay?: string
  bio?: string
  created_at: string
  updated_at: string
}

export interface Worker {
  id: string
  hourly_rate: number
  years_experience: number
  verified: boolean
  verification_documents?: string[]
  average_rating: number
  total_jobs_completed: number
  created_at: string
}

export interface ServiceCategory {
  id: string
  name: string
  description?: string
  icon?: string
  created_at: string
}

export interface WorkerService {
  id: string
  worker_id: string
  service_category_id: string
  created_at: string
}

export interface Booking {
  id: string
  customer_id: string
  worker_id: string
  service_category_id: string
  booking_date: string
  start_time: string
  end_time?: string
  status: BookingStatus
  description: string
  address: string
  estimated_hours?: number
  total_cost?: number
  created_at: string
  updated_at: string
}

export interface Review {
  id: string
  booking_id: string
  reviewer_id: string
  reviewee_id: string
  rating: number
  comment?: string
  created_at: string
}

export interface Message {
  id: string
  booking_id: string
  sender_id: string
  receiver_id: string
  message: string
  read: boolean
  created_at: string
}

export interface Payment {
  id: string
  booking_id: string
  amount: number
  payment_method: PaymentMethod
  status: PaymentStatus
  transaction_id?: string
  created_at: string
  updated_at: string
}

// Extended types with relationships
export interface WorkerProfile extends Profile {
  worker?: Worker
  worker_services?: (WorkerService & {
    service_category?: ServiceCategory
  })[]
}
