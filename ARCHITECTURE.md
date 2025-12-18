# Tara - Application Architecture

## Architecture Principles

### 1. Clean Architecture
- **Separation of Concerns**: Each layer has a single, well-defined purpose
- **Dependency Rule**: Dependencies point inward (UI → Business Logic → Data)
- **Framework Independence**: Business logic doesn't depend on frameworks
- **Testability**: Each layer can be tested independently

### 2. Domain-Driven Design (DDD)
- Business logic is organized around domain concepts
- Clear domain models and entities
- Repository pattern for data access
- Service layer for business operations

### 3. Feature-Based Structure
- Code organized by feature, not technical layer
- Each feature is self-contained and modular
- Easy to add/remove features
- Teams can work on different features independently

---

## Project Structure

```
src/
├── app/                          # Next.js App Router (UI Layer)
│   ├── (public)/                # Public routes (no auth required)
│   │   ├── layout.tsx
│   │   ├── page.tsx            # Landing page
│   │   ├── explore/            # Browse content without login
│   │   └── destinations/       # Public destination pages
│   │
│   ├── (auth)/                  # Authentication routes
│   │   ├── layout.tsx
│   │   ├── login/
│   │   ├── register/
│   │   └── reset-password/
│   │
│   ├── (app)/                   # Protected app routes
│   │   ├── layout.tsx          # Main app layout with nav
│   │   ├── feed/               # Social feed
│   │   ├── planner/            # Trip planner
│   │   ├── bookings/           # My bookings
│   │   ├── profile/            # User profile
│   │   ├── messages/           # Chat/messaging
│   │   └── settings/           # User settings
│   │
│   ├── (creator)/               # Creator-specific routes
│   │   ├── layout.tsx
│   │   ├── dashboard/          # Creator analytics
│   │   ├── content/            # Content management
│   │   └── earnings/           # Earnings & payouts
│   │
│   ├── (supplier)/              # Supplier-specific routes
│   │   ├── layout.tsx
│   │   ├── dashboard/          # Supplier analytics
│   │   ├── listings/           # Manage listings
│   │   ├── bookings/           # Manage bookings
│   │   └── earnings/           # Revenue & payouts
│   │
│   ├── (admin)/                 # Admin routes
│   │   ├── layout.tsx
│   │   ├── users/
│   │   ├── content/
│   │   └── reports/
│   │
│   ├── api/                     # API routes
│   │   ├── auth/               # Authentication endpoints
│   │   ├── posts/              # Posts CRUD
│   │   ├── itineraries/        # Itineraries CRUD
│   │   ├── bookings/           # Bookings CRUD
│   │   ├── payments/           # Payment processing
│   │   ├── search/             # Search endpoints
│   │   └── webhooks/           # Payment webhooks, etc.
│   │
│   ├── globals.css              # Global styles
│   └── layout.tsx               # Root layout
│
├── features/                     # Feature modules (Business Logic)
│   ├── auth/
│   │   ├── components/         # Auth-specific components
│   │   ├── hooks/              # useAuth, useUser
│   │   ├── services/           # Authentication service
│   │   ├── types.ts            # Auth types
│   │   └── utils.ts            # Auth utilities
│   │
│   ├── social/
│   │   ├── components/         # Post, Comment, Like components
│   │   ├── hooks/              # usePosts, useComments
│   │   ├── services/           # Social service
│   │   ├── types.ts
│   │   └── utils.ts
│   │
│   ├── planner/
│   │   ├── components/         # Itinerary, Day, Activity components
│   │   ├── hooks/              # useItinerary, usePlaces
│   │   ├── services/           # Planner service
│   │   ├── types.ts
│   │   └── utils.ts
│   │
│   ├── booking/
│   │   ├── components/         # Booking flow components
│   │   ├── hooks/              # useBookings, useListings
│   │   ├── services/           # Booking service
│   │   ├── types.ts
│   │   └── utils.ts
│   │
│   ├── payment/
│   │   ├── components/         # Payment forms
│   │   ├── hooks/              # usePayment
│   │   ├── services/           # Payment service
│   │   ├── providers/          # PayMongo, GCash providers
│   │   ├── types.ts
│   │   └── utils.ts
│   │
│   ├── search/
│   │   ├── components/         # Search, Filters
│   │   ├── hooks/              # useSearch
│   │   ├── services/           # Search service
│   │   ├── types.ts
│   │   └── utils.ts
│   │
│   ├── creator/
│   │   ├── components/         # Creator dashboard components
│   │   ├── hooks/              # useCreatorStats
│   │   ├── services/           # Creator service
│   │   ├── types.ts
│   │   └── utils.ts
│   │
│   └── supplier/
│       ├── components/         # Supplier dashboard components
│       ├── hooks/              # useSupplierStats
│       ├── services/           # Supplier service
│       ├── types.ts
│       └── utils.ts
│
├── shared/                       # Shared/Common code
│   ├── components/              # Reusable UI components
│   │   ├── ui/                 # Basic UI elements
│   │   │   ├── Button.tsx
│   │   │   ├── Input.tsx
│   │   │   ├── Modal.tsx
│   │   │   ├── Card.tsx
│   │   │   └── ...
│   │   ├── layout/             # Layout components
│   │   │   ├── Header.tsx
│   │   │   ├── Footer.tsx
│   │   │   ├── Sidebar.tsx
│   │   │   └── Nav.tsx
│   │   └── common/             # Common components
│   │       ├── Avatar.tsx
│   │       ├── ImageUpload.tsx
│   │       ├── LocationPicker.tsx
│   │       └── ...
│   │
│   ├── hooks/                   # Shared hooks
│   │   ├── useMediaQuery.ts
│   │   ├── useDebounce.ts
│   │   ├── useIntersectionObserver.ts
│   │   └── ...
│   │
│   ├── utils/                   # Utility functions
│   │   ├── format.ts           # Date, currency formatting
│   │   ├── validation.ts       # Input validation
│   │   ├── string.ts           # String manipulation
│   │   └── ...
│   │
│   ├── constants/               # App constants
│   │   ├── routes.ts
│   │   ├── config.ts
│   │   └── ...
│   │
│   └── types/                   # Shared types
│       ├── common.ts
│       ├── api.ts
│       └── ...
│
├── lib/                          # Core libraries and configurations
│   ├── supabase/
│   │   ├── client.ts           # Supabase client
│   │   ├── server.ts           # Server-side Supabase
│   │   ├── auth.ts             # Auth helpers
│   │   └── storage.ts          # File storage helpers
│   │
│   ├── api/
│   │   ├── client.ts           # API client
│   │   ├── endpoints.ts        # API endpoints
│   │   └── types.ts            # API types
│   │
│   ├── db/
│   │   ├── schema.ts           # Database schema types
│   │   ├── queries.ts          # Reusable queries
│   │   └── migrations/         # Database migrations
│   │
│   └── integrations/            # Third-party integrations
│       ├── google-maps/
│       ├── paymongo/
│       ├── gcash/
│       └── sendgrid/
│
├── repositories/                 # Data Access Layer
│   ├── base.repository.ts      # Base repository with common methods
│   ├── user.repository.ts
│   ├── post.repository.ts
│   ├── itinerary.repository.ts
│   ├── booking.repository.ts
│   └── ...
│
├── services/                     # Business Logic Layer
│   ├── auth.service.ts
│   ├── social.service.ts
│   ├── planner.service.ts
│   ├── booking.service.ts
│   ├── payment.service.ts
│   └── ...
│
├── middleware/                   # Next.js middleware
│   └── auth.middleware.ts
│
├── types/                        # Global TypeScript types
│   ├── database.ts             # Database types
│   ├── models.ts               # Domain models
│   └── index.ts
│
└── config/                       # Configuration files
    ├── site.ts                 # Site config
    ├── navigation.ts           # Navigation config
    └── features.ts             # Feature flags
```

---

## Layer Architecture

### 1. Presentation Layer (UI)
**Location:** `src/app/`, `src/features/*/components/`

**Responsibilities:**
- Render UI components
- Handle user interactions
- Display data
- Route navigation

**Rules:**
- Can call Hooks and Services
- Cannot directly access Repositories or Database
- Should be as thin as possible (logic-free)

**Example:**
```typescript
// src/app/(app)/feed/page.tsx
import { usePosts } from '@/features/social/hooks/usePosts'
import { PostCard } from '@/features/social/components/PostCard'

export default function FeedPage() {
  const { posts, loading } = usePosts()

  if (loading) return <Loader />

  return (
    <div>
      {posts.map(post => <PostCard key={post.id} post={post} />)}
    </div>
  )
}
```

### 2. Business Logic Layer (Services & Hooks)
**Location:** `src/services/`, `src/features/*/services/`, `src/features/*/hooks/`

**Responsibilities:**
- Implement business rules
- Orchestrate data operations
- Handle complex logic
- Manage state

**Rules:**
- Can call Repositories
- Cannot directly access Database
- Should be framework-agnostic (pure TypeScript)

**Example:**
```typescript
// src/features/booking/services/booking.service.ts
import { bookingRepository } from '@/repositories/booking.repository'
import { paymentService } from '@/features/payment/services/payment.service'

export class BookingService {
  async createBooking(data: CreateBookingInput): Promise<Booking> {
    // Business logic
    if (data.checkIn < new Date()) {
      throw new Error('Check-in date must be in the future')
    }

    // Calculate total cost
    const listing = await listingRepository.findById(data.listingId)
    const nights = calculateNights(data.checkIn, data.checkOut)
    const totalCost = listing.price * nights

    // Create booking
    const booking = await bookingRepository.create({
      ...data,
      totalCost,
      status: 'pending'
    })

    return booking
  }
}

export const bookingService = new BookingService()
```

### 3. Data Access Layer (Repositories)
**Location:** `src/repositories/`

**Responsibilities:**
- CRUD operations
- Database queries
- Data transformation (DB ↔ Domain models)

**Rules:**
- Direct access to Database/ORM
- No business logic
- Return domain models, not database rows

**Example:**
```typescript
// src/repositories/booking.repository.ts
import { supabase } from '@/lib/supabase/client'
import { Booking } from '@/types/models'

export class BookingRepository {
  async create(data: CreateBookingData): Promise<Booking> {
    const { data: booking, error } = await supabase
      .from('bookings')
      .insert(data)
      .select()
      .single()

    if (error) throw error

    return this.toDomainModel(booking)
  }

  async findById(id: string): Promise<Booking | null> {
    const { data, error } = await supabase
      .from('bookings')
      .select('*')
      .eq('id', id)
      .single()

    if (error) return null

    return this.toDomainModel(data)
  }

  private toDomainModel(data: any): Booking {
    // Transform database row to domain model
    return {
      id: data.id,
      userId: data.user_id,
      listingId: data.listing_id,
      checkIn: new Date(data.check_in),
      checkOut: new Date(data.check_out),
      totalCost: parseFloat(data.total_cost),
      status: data.status,
      createdAt: new Date(data.created_at)
    }
  }
}

export const bookingRepository = new BookingRepository()
```

### 4. Integration Layer
**Location:** `src/lib/integrations/`

**Responsibilities:**
- Integrate with third-party APIs
- Abstract external dependencies
- Handle API-specific logic

**Example:**
```typescript
// src/lib/integrations/paymongo/client.ts
export class PayMongoClient {
  private apiKey: string

  constructor(apiKey: string) {
    this.apiKey = apiKey
  }

  async createPaymentIntent(amount: number, currency: string = 'PHP') {
    const response = await fetch('https://api.paymongo.com/v1/payment_intents', {
      method: 'POST',
      headers: {
        'Authorization': `Basic ${btoa(this.apiKey)}`,
        'Content-Type': 'application/json'
      },
      body: JSON.stringify({
        data: {
          attributes: { amount: amount * 100, currency }
        }
      })
    })

    return response.json()
  }
}

export const paymongoClient = new PayMongoClient(process.env.PAYMONGO_SECRET_KEY!)
```

---

## Design Patterns

### 1. Repository Pattern
Abstracts data access logic

```typescript
// repositories/base.repository.ts
export abstract class BaseRepository<T> {
  protected abstract tableName: string

  async findAll(): Promise<T[]> {
    const { data } = await supabase.from(this.tableName).select('*')
    return data || []
  }

  async findById(id: string): Promise<T | null> {
    const { data } = await supabase.from(this.tableName).select('*').eq('id', id).single()
    return data
  }

  // ... other common methods
}
```

### 2. Service Pattern
Encapsulates business logic

```typescript
// services/auth.service.ts
export class AuthService {
  async register(email: string, password: string) {
    // Validation
    // Business rules
    // Call repository
  }

  async login(email: string, password: string) {
    // Authentication logic
  }
}
```

### 3. Custom Hooks Pattern
Encapsulates React state logic

```typescript
// features/social/hooks/usePosts.ts
export function usePosts() {
  const [posts, setPosts] = useState<Post[]>([])
  const [loading, setLoading] = useState(true)

  useEffect(() => {
    loadPosts()
  }, [])

  const loadPosts = async () => {
    const data = await postService.getPosts()
    setPosts(data)
    setLoading(false)
  }

  return { posts, loading, refetch: loadPosts }
}
```

### 4. Provider Pattern
Manage global state and context

```typescript
// features/auth/components/AuthProvider.tsx
export function AuthProvider({ children }: { children: ReactNode }) {
  const [user, setUser] = useState<User | null>(null)

  useEffect(() => {
    // Listen to auth state changes
    const { data } = supabase.auth.onAuthStateChange((_event, session) => {
      setUser(session?.user || null)
    })

    return () => data.subscription.unsubscribe()
  }, [])

  return (
    <AuthContext.Provider value={{ user }}>
      {children}
    </AuthContext.Provider>
  )
}
```

---

## State Management Strategy

### 1. Server State (Data from API/DB)
**Tool:** React Query (TanStack Query) or SWR

**Why:** Automatic caching, refetching, optimistic updates

```typescript
// features/social/hooks/usePosts.ts
import { useQuery } from '@tanstack/react-query'

export function usePosts() {
  return useQuery({
    queryKey: ['posts'],
    queryFn: () => postService.getPosts()
  })
}
```

### 2. Client State (UI state)
**Tool:** React Context + useReducer or Zustand

**Why:** Simple, lightweight, built-in

```typescript
// shared/store/ui.store.ts
import { create } from 'zustand'

interface UIState {
  sidebarOpen: boolean
  toggleSidebar: () => void
}

export const useUIStore = create<UIState>((set) => ({
  sidebarOpen: false,
  toggleSidebar: () => set((state) => ({ sidebarOpen: !state.sidebarOpen }))
}))
```

### 3. Form State
**Tool:** React Hook Form

**Why:** Performance, validation, ease of use

```typescript
import { useForm } from 'react-hook-form'
import { zodResolver } from '@hookform/resolvers/zod'

const schema = z.object({
  email: z.string().email(),
  password: z.string().min(6)
})

export function LoginForm() {
  const { register, handleSubmit } = useForm({
    resolver: zodResolver(schema)
  })

  return (
    <form onSubmit={handleSubmit(onSubmit)}>
      <input {...register('email')} />
      <input {...register('password')} type="password" />
    </form>
  )
}
```

---

## API Design

### RESTful Endpoints

```
Authentication:
POST   /api/auth/register
POST   /api/auth/login
POST   /api/auth/logout
POST   /api/auth/reset-password

Posts:
GET    /api/posts              # List posts
POST   /api/posts              # Create post
GET    /api/posts/:id          # Get single post
PUT    /api/posts/:id          # Update post
DELETE /api/posts/:id          # Delete post
POST   /api/posts/:id/like     # Like post
POST   /api/posts/:id/comment  # Comment on post

Itineraries:
GET    /api/itineraries
POST   /api/itineraries
GET    /api/itineraries/:id
PUT    /api/itineraries/:id
DELETE /api/itineraries/:id

Bookings:
GET    /api/bookings
POST   /api/bookings
GET    /api/bookings/:id
PUT    /api/bookings/:id/cancel
```

### API Response Format

```typescript
// Success response
{
  success: true,
  data: { ... },
  meta: {
    page: 1,
    perPage: 20,
    total: 100
  }
}

// Error response
{
  success: false,
  error: {
    code: 'VALIDATION_ERROR',
    message: 'Invalid input',
    details: [
      { field: 'email', message: 'Email is required' }
    ]
  }
}
```

---

## Testing Strategy

### 1. Unit Tests
Test individual functions, utilities, services

```typescript
// __tests__/utils/format.test.ts
import { formatCurrency } from '@/shared/utils/format'

describe('formatCurrency', () => {
  it('should format PHP currency', () => {
    expect(formatCurrency(1000)).toBe('₱1,000.00')
  })
})
```

### 2. Integration Tests
Test feature workflows

```typescript
// __tests__/features/booking.test.ts
describe('Booking flow', () => {
  it('should create booking and process payment', async () => {
    const booking = await bookingService.createBooking(mockData)
    const payment = await paymentService.processPayment(booking.id)

    expect(booking.status).toBe('confirmed')
    expect(payment.status).toBe('completed')
  })
})
```

### 3. End-to-End Tests (E2E)
Test user workflows with Playwright

```typescript
// __tests__/e2e/booking.spec.ts
test('user can book a hotel', async ({ page }) => {
  await page.goto('/listings/123')
  await page.click('button:has-text("Book Now")')
  await page.fill('[name="checkIn"]', '2025-06-01')
  await page.fill('[name="checkOut"]', '2025-06-05')
  await page.click('button:has-text("Confirm Booking")')
  await expect(page).toHaveURL(/\/bookings\/.*/)
})
```

---

## Performance Optimization

### 1. Code Splitting
- Route-based splitting (automatic with Next.js App Router)
- Dynamic imports for heavy components

```typescript
const HeavyComponent = dynamic(() => import('./HeavyComponent'), {
  loading: () => <Skeleton />
})
```

### 2. Image Optimization
- Use Next.js Image component
- Lazy loading
- WebP format
- CDN delivery

```typescript
import Image from 'next/image'

<Image
  src="/photo.jpg"
  alt="Travel photo"
  width={800}
  height={600}
  loading="lazy"
/>
```

### 3. Database Optimization
- Proper indexing
- Query optimization
- Pagination
- Caching (Redis)

### 4. Caching Strategy
- Browser cache
- CDN cache
- API response cache
- Static page generation where possible

---

## Security Best Practices

### 1. Authentication
- JWT tokens
- Refresh tokens
- HTTP-only cookies
- CSRF protection

### 2. Authorization
- Row Level Security (RLS) in Supabase
- Role-based access control (RBAC)
- Check permissions on every request

### 3. Input Validation
- Zod schemas for validation
- Sanitize user input
- Prevent SQL injection (use ORMs)
- Prevent XSS attacks

### 4. Data Protection
- HTTPS everywhere
- Encrypt sensitive data
- Secure payment processing
- GDPR compliance

---

## Scalability Considerations

### 1. Database
- Use connection pooling
- Read replicas for scaling reads
- Sharding for very large datasets
- Database query optimization

### 2. File Storage
- CDN for images/videos
- Separate storage service (Cloudinary, S3)
- Image optimization pipeline

### 3. Background Jobs
- Queue system for long-running tasks (Bull, BullMQ)
- Email sending
- Payment processing
- Report generation

### 4. Caching
- Redis for session storage
- API response caching
- Database query caching

---

## Development Workflow

### 1. Feature Development
1. Create feature branch: `git checkout -b feature/trip-planner`
2. Implement feature in `/features/planner/`
3. Write tests
4. Create pull request
5. Code review
6. Merge to main

### 2. Database Changes
1. Create migration file
2. Test migration locally
3. Run migration in staging
4. Deploy to production

### 3. Deployment
1. Push to GitHub
2. Automatic deployment via Vercel/Railway
3. Run database migrations
4. Smoke tests
5. Monitor errors (Sentry)

---

## Monitoring & Observability

### 1. Error Tracking
- Sentry for error monitoring
- Log aggregation (Logtail, Datadog)

### 2. Performance Monitoring
- Web Vitals
- Lighthouse CI
- Real User Monitoring (RUM)

### 3. Analytics
- Google Analytics
- Mixpanel for product analytics
- Custom event tracking

---

## Future-Proofing Strategies

### 1. Modularity
- Features are independent modules
- Easy to add/remove features
- Microservices-ready architecture

### 2. API-First
- Well-defined API contracts
- Easy to add mobile apps later
- Third-party integrations possible

### 3. Configuration-Driven
- Feature flags
- Environment-based configs
- A/B testing ready

### 4. Documentation
- Code comments
- API documentation (Swagger/OpenAPI)
- Architecture decision records (ADRs)

---

## Technology Stack Summary

| Layer | Technology |
|-------|-----------|
| Frontend | Next.js 14, React, TypeScript |
| Styling | Tailwind CSS |
| State Management | React Query, Zustand |
| Forms | React Hook Form + Zod |
| Database | Supabase (PostgreSQL) |
| Auth | Supabase Auth |
| File Storage | Supabase Storage / Cloudinary |
| Payments | PayMongo, Xendit |
| Maps | Google Maps API |
| Email | SendGrid |
| SMS | Twilio |
| Analytics | Google Analytics, Mixpanel |
| Error Tracking | Sentry |
| Testing | Jest, React Testing Library, Playwright |
| CI/CD | GitHub Actions |
| Hosting | Vercel / Railway |

---

This architecture is designed to be:
- ✅ **Scalable**: Can handle growth from 100 to 1M+ users
- ✅ **Maintainable**: Clear structure, easy to understand
- ✅ **Testable**: Each layer can be tested independently
- ✅ **Flexible**: Easy to add new features or change existing ones
- ✅ **Future-proof**: Modern patterns, ready for mobile apps, microservices
