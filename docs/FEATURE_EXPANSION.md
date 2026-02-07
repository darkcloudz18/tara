# Tara App Feature Expansion

This document covers the comprehensive feature expansion implemented for the Tara travel platform.

---

## Table of Contents

1. [PWA Foundation](#1-pwa-foundation)
2. [Search & Discovery](#2-search--discovery)
3. [Notifications System](#3-notifications-system)
4. [Onboarding Flow](#4-onboarding-flow)
5. [Trip Templates Enhancement](#5-trip-templates-enhancement)
6. [UX Polish](#6-ux-polish)
7. [Trip Sharing Improvements](#7-trip-sharing-improvements)
8. [Shared Components](#8-shared-components)
9. [Setup & Configuration](#9-setup--configuration)

---

## 1. PWA Foundation

Progressive Web App support enables users to install Tara on their devices for a native app-like experience.

### Files Added/Modified

| File | Description |
|------|-------------|
| `public/manifest.json` | PWA manifest with app metadata |
| `next.config.js` | next-pwa configuration |
| `src/components/pwa/InstallPrompt.tsx` | Install banner component |
| `src/app/layout.tsx` | Manifest and icon links |

### Features

- **App Installation**: Users can install Tara to their home screen
- **Offline Support**: Caching strategies for Supabase data, images, and static assets
- **iOS Support**: Special instructions for iOS users (Add to Home Screen)
- **Smart Prompts**: Install banner appears after initial visit, respects 7-day dismissal

### Manifest Configuration

```json
{
  "name": "Tara - Travel Philippines",
  "short_name": "Tara",
  "theme_color": "#14b8a6",
  "display": "standalone",
  "start_url": "/"
}
```

### Caching Strategies

| Content Type | Strategy | Cache Duration |
|--------------|----------|----------------|
| Supabase API | NetworkFirst | 1 hour |
| Images | CacheFirst | 30 days |
| JS/CSS | StaleWhileRevalidate | 1 day |

### Required: Add PWA Icons

Place icon files in `public/icons/`:
- `icon-72x72.png`
- `icon-96x96.png`
- `icon-128x128.png`
- `icon-144x144.png`
- `icon-152x152.png`
- `icon-192x192.png`
- `icon-384x384.png`
- `icon-512x512.png`

---

## 2. Search & Discovery

A dedicated search experience with filters and search history.

### Files Added

| File | Description |
|------|-------------|
| `src/app/(main)/search/page.tsx` | Search page |
| `src/features/search/services/searchService.ts` | Search logic & history |
| `src/features/search/components/SearchFilters.tsx` | Filter UI |
| `src/features/search/index.ts` | Barrel exports |

### Features

- **Full-text Search**: Search places by name, description, location
- **Category Filters**: All, Stay, Eat, See, Do
- **Advanced Filters**: Destination, rating (3+, 4+, 4.5+), price range
- **Search History**: Recent searches stored in localStorage
- **Popular Destinations**: Quick access to Boracay, Palawan, Siargao, etc.

### Usage

```tsx
import { searchService } from '@/features/search'

// Search with filters
const results = await searchService.search({
  query: 'beach',
  category: 'see',
  minRating: 4,
  destination: 'Palawan'
})

// Manage search history
searchService.addToSearchHistory('Boracay')
const history = searchService.getSearchHistory()
searchService.clearSearchHistory()
```

### Route

- **URL**: `/search`
- **Query Params**: `?q=search+term`

---

## 3. Notifications System

Real-time notifications with Supabase Realtime integration.

### Files Added

| File | Description |
|------|-------------|
| `src/app/(main)/notifications/page.tsx` | Notifications page |
| `src/features/notifications/services/notificationService.ts` | CRUD & realtime |
| `src/features/notifications/types.ts` | TypeScript types |
| `src/features/notifications/index.ts` | Barrel exports |

### Notification Types

```typescript
type NotificationType =
  | 'trip_shared'        // Someone shared a trip with you
  | 'collaborator_joined' // Someone joined your trip
  | 'trip_reminder'       // Upcoming trip reminder
  | 'place_recommendation'// New place suggestion
  | 'trip_comment'        // Comment on your trip
  | 'system'              // System announcements
```

### Features

- **Real-time Updates**: New notifications appear instantly via Supabase Realtime
- **Mark as Read**: Individual or mark all as read
- **Delete/Clear**: Remove individual or all notifications
- **Dynamic Badge**: Sidebar shows unread count in real-time
- **Click Actions**: Navigate to relevant trip/page on click

### Usage

```tsx
import { notificationService } from '@/features/notifications'

// Fetch notifications
const notifications = await notificationService.getAll(userId)
const unreadCount = await notificationService.getUnreadCount(userId)

// Mark as read
await notificationService.markAsRead(notificationId)
await notificationService.markAllAsRead(userId)

// Real-time subscription
const unsubscribe = notificationService.subscribeToNotifications(
  userId,
  (notification) => console.log('New:', notification)
)
```

### Database Table Required

```sql
CREATE TABLE notifications (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id UUID REFERENCES auth.users(id),
  type TEXT NOT NULL,
  title TEXT NOT NULL,
  message TEXT NOT NULL,
  is_read BOOLEAN DEFAULT false,
  data JSONB DEFAULT '{}',
  created_at TIMESTAMPTZ DEFAULT now()
);

-- Enable realtime
ALTER PUBLICATION supabase_realtime ADD TABLE notifications;
```

---

## 4. Onboarding Flow

First-time user experience with welcome modal and feature tooltips.

### Files Added

| File | Description |
|------|-------------|
| `src/hooks/useOnboarding.ts` | Onboarding state hook |
| `src/features/onboarding/components/WelcomeModal.tsx` | Welcome flow |
| `src/features/onboarding/components/FeatureTooltip.tsx` | Contextual tooltips |
| `src/features/onboarding/index.ts` | Barrel exports |

### Welcome Modal Steps

1. **Welcome to Tara!** - App introduction
2. **Discover Places** - How to browse and save
3. **Build Your Trip** - Trip creation explanation

### Features

- **First-time Detection**: Shows only for new users (localStorage)
- **Skip Option**: Users can skip at any time
- **Progress Dots**: Visual progress indicator
- **Feature Tooltips**: Highlight specific UI elements post-onboarding

### Usage

```tsx
import { useOnboarding } from '@/hooks/useOnboarding'

function MyComponent() {
  const {
    shouldShowOnboarding,
    completeOnboarding,
    hasShownTooltip,
    markTooltipShown,
    resetOnboarding // For testing
  } = useOnboarding()

  // Check if tooltip should show
  if (!hasShownTooltip('add-to-trip-button')) {
    // Show tooltip, then mark as shown
    markTooltipShown('add-to-trip-button')
  }
}
```

```tsx
import { FeatureTooltip } from '@/features/onboarding'

<FeatureTooltip
  id="search-button"
  title="Search Places"
  description="Find beaches, restaurants, and attractions"
  position="bottom"
>
  <button>Search</button>
</FeatureTooltip>
```

---

## 5. Trip Templates Enhancement

Enhanced templates with day-by-day itineraries and preview modal.

### Files Added/Modified

| File | Description |
|------|-------------|
| `src/app/(main)/templates/page.tsx` | Templates browsing page |
| `src/features/planner/components/TemplatePreviewModal.tsx` | Preview modal |
| `src/features/planner/data/tripTemplates.ts` | Enhanced with activities |

### Template Structure

```typescript
interface TripTemplate {
  id: string
  slug: string
  destination: string
  title: string
  duration: number
  description: string
  highlights: string[]
  image: string
  estimatedBudget: number
  bestFor: string[]
  bestMonths: string[]
  suggestedDays?: TemplateDay[] // NEW
}

interface TemplateDay {
  dayNumber: number
  title: string
  activities: TemplateActivity[]
}

interface TemplateActivity {
  name: string
  time: string      // "09:00 AM"
  duration: string  // "2 hours"
  cost: number
  category: 'see' | 'eat' | 'do' | 'stay'
  description?: string
}
```

### Features

- **Template Preview**: View full day-by-day itinerary before using
- **Filter Templates**: By destination, duration (2-3, 4-5, 6+ days), budget
- **One-click Create**: Create trip from template instantly
- **Activity Details**: Time, cost, category for each activity

### Route

- **URL**: `/templates`

---

## 6. UX Polish

Loading states, animations, and empty state illustrations.

### Files Added

| File | Description |
|------|-------------|
| `src/components/ui/Skeleton.tsx` | Loading skeleton components |
| `src/components/layout/PageTransition.tsx` | Page animations |
| `src/components/illustrations/NoTrips.tsx` | Empty trips illustration |
| `src/components/illustrations/NoResults.tsx` | No search results |
| `src/components/illustrations/NoNotifications.tsx` | No notifications |
| `src/app/globals.css` | Animation keyframes |

### Skeleton Components

```tsx
import {
  Skeleton,
  PlaceCardSkeleton,
  TripCardSkeleton,
  ProfileSkeleton,
  NotificationSkeleton,
  SearchResultSkeleton,
  PlaceCardSkeletonGrid,
  TripCardSkeletonList
} from '@/components/ui/Skeleton'

// Usage
{loading ? <PlaceCardSkeletonGrid count={6} /> : <PlaceCards />}
```

### Page Transitions

```tsx
import PageTransition, {
  FadeTransition,
  ScaleTransition,
  SlideUpTransition
} from '@/components/layout/PageTransition'

// Wrap page content
<PageTransition>
  <YourPageContent />
</PageTransition>

// For modals
<ScaleTransition isVisible={showModal}>
  <ModalContent />
</ScaleTransition>
```

### CSS Animations

```css
.animate-slide-up  /* Slide up with fade */
.animate-fade-in   /* Simple fade */
.animate-scale-in  /* Scale with fade */
```

### Empty State Illustrations

```tsx
import { NoTrips, NoResults, NoNotifications } from '@/components/illustrations'

{trips.length === 0 && (
  <div className="text-center py-12">
    <NoTrips className="mx-auto mb-4" />
    <p>No trips yet</p>
  </div>
)}
```

---

## 7. Trip Sharing Improvements

Enhanced sharing with analytics and preview.

### Files Added/Modified

| File | Description |
|------|-------------|
| `src/app/trip/[id]/page.tsx` | Added view/copy counts |
| `src/features/planner/components/SharePreview.tsx` | Share preview modal |

### Features

- **View Count**: Auto-incremented when trip page is visited
- **Copy Count**: Track how many times trip was copied
- **Share Preview Modal**:
  - OG image preview
  - Copy link button
  - Suggested share caption
  - Social media buttons (Twitter, Facebook, WhatsApp)

### Usage

```tsx
import SharePreview from '@/features/planner/components/SharePreview'

<SharePreview
  isOpen={showSharePreview}
  onClose={() => setShowSharePreview(false)}
  itinerary={itinerary}
/>
```

### Display Stats on Trip Page

The public trip page now shows:
- Days count
- Activities count
- Estimated budget
- Views count (if > 0)
- Copies count (if > 0)

---

## 8. Shared Components

### Toast Notifications

Global toast system for user feedback.

```tsx
import { useToast } from '@/contexts/ToastContext'

function MyComponent() {
  const { success, error, info, warning, showToast } = useToast()

  // Simple usage
  success('Trip created!')
  error('Failed to save', 'Please try again')

  // Advanced usage
  showToast({
    type: 'success',
    title: 'Trip saved',
    message: 'Your changes have been saved',
    duration: 5000, // ms, 0 for persistent
    action: {
      label: 'View',
      onClick: () => router.push('/planner')
    }
  })
}
```

### Toast Types

| Type | Color | Icon |
|------|-------|------|
| `success` | Green | CheckCircle |
| `error` | Red | XCircle |
| `warning` | Yellow | AlertCircle |
| `info` | Blue | Info |

---

## 9. Setup & Configuration

### New Dependencies

```bash
npm install next-pwa framer-motion
```

### Environment Variables

No new environment variables required.

### Database Migrations

Create the notifications table (see Section 3).

### PWA Icons

Generate and add icons to `public/icons/` (see Section 1).

### Build Verification

```bash
npm run build
```

Expected output: Build successful with no TypeScript errors.

---

## File Structure Summary

```
src/
├── app/
│   ├── (main)/
│   │   ├── notifications/page.tsx   # NEW
│   │   ├── search/page.tsx          # NEW
│   │   └── templates/page.tsx       # NEW
│   ├── trip/[id]/page.tsx           # MODIFIED
│   ├── globals.css                  # MODIFIED
│   └── layout.tsx                   # MODIFIED
├── components/
│   ├── illustrations/               # NEW
│   │   ├── NoTrips.tsx
│   │   ├── NoResults.tsx
│   │   ├── NoNotifications.tsx
│   │   └── index.ts
│   ├── layout/
│   │   ├── PageTransition.tsx       # NEW
│   │   └── Sidebar.tsx              # MODIFIED
│   ├── pwa/
│   │   └── InstallPrompt.tsx        # NEW
│   ├── ui/
│   │   ├── Skeleton.tsx             # NEW
│   │   └── Toast.tsx                # NEW
│   └── Providers.tsx                # MODIFIED
├── contexts/
│   └── ToastContext.tsx             # NEW
├── features/
│   ├── notifications/               # NEW
│   │   ├── services/notificationService.ts
│   │   ├── types.ts
│   │   └── index.ts
│   ├── onboarding/                  # NEW
│   │   ├── components/
│   │   │   ├── WelcomeModal.tsx
│   │   │   └── FeatureTooltip.tsx
│   │   └── index.ts
│   ├── planner/
│   │   ├── components/
│   │   │   ├── SharePreview.tsx     # NEW
│   │   │   └── TemplatePreviewModal.tsx  # NEW
│   │   └── data/tripTemplates.ts    # MODIFIED
│   └── search/                      # NEW
│       ├── services/searchService.ts
│       ├── components/SearchFilters.tsx
│       └── index.ts
└── hooks/
    └── useOnboarding.ts             # NEW

public/
├── manifest.json                    # NEW
├── icons/                           # NEW (needs icons)
└── sw.js                            # AUTO-GENERATED
```

---

## Testing Checklist

### PWA
- [ ] Lighthouse PWA audit passes
- [ ] Install prompt appears on mobile Chrome
- [ ] App installs correctly
- [ ] Offline mode shows cached content

### Search
- [ ] Search by place name works
- [ ] Filters apply correctly
- [ ] Recent searches persist
- [ ] Results link to Add to Trip

### Notifications
- [ ] Notifications page loads
- [ ] Real-time updates work
- [ ] Mark as read works
- [ ] Badge updates in sidebar

### Onboarding
- [ ] Welcome modal shows for new users
- [ ] Progress through all steps works
- [ ] Skip button works
- [ ] Doesn't show again after completion

### Templates
- [ ] Templates page loads
- [ ] Filters work correctly
- [ ] Preview modal shows activities
- [ ] "Use Template" creates trip

### UX
- [ ] Skeletons show during loading
- [ ] Page transitions are smooth
- [ ] Empty states show illustrations
- [ ] Toasts appear and dismiss

### Sharing
- [ ] View count increments
- [ ] Share preview shows correctly
- [ ] Social links work
- [ ] Copy link works
