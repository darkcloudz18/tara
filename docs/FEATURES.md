# Tara App - Feature Documentation

This document covers all features implemented in the Tara travel planning app.

---

## Table of Contents

1. [Maps Integration](#maps-integration)
2. [Weather Forecasts](#weather-forecasts)
3. [Budget Tracking](#budget-tracking)
4. [Calendar Export](#calendar-export)
5. [Photo Uploads](#photo-uploads)
6. [Push Notifications](#push-notifications)
7. [Community Trips](#community-trips)
8. [Multi-Language Support (i18n)](#multi-language-support-i18n)
9. [Offline Support](#offline-support)
10. [Trip Collaboration](#trip-collaboration)
11. [Social Features](#social-features)
12. [PWA Support](#pwa-support)

---

## Maps Integration

**Location:** `src/components/maps/TripMap.tsx`

Interactive maps showing trip activities with markers and route lines using Leaflet (free, no API key required).

### Features
- Activity markers with popup details
- Dashed route lines connecting activities in order
- Auto-centering based on activity locations
- OpenStreetMap tiles (free)

### Usage

```tsx
import { TripMap } from '@/components/maps'

<TripMap
  activities={[
    {
      id: '1',
      title: 'Beach Visit',
      location: 'Boracay',
      coordinates: { lat: 11.9674, lng: 121.9248 },
      day_number: 1,
      start_time: '09:00',
    }
  ]}
  className="h-[400px]"
  showRoute={true}
/>
```

### Props
| Prop | Type | Default | Description |
|------|------|---------|-------------|
| `activities` | `Activity[]` | required | Array of activities with coordinates |
| `className` | `string` | `''` | CSS classes for container |
| `showRoute` | `boolean` | `true` | Show connecting route line |
| `center` | `[number, number]` | auto | Override map center |
| `zoom` | `number` | auto | Override zoom level |

---

## Weather Forecasts

**Location:** `src/components/weather/WeatherWidget.tsx`, `src/lib/weather.ts`

Weather forecasts for trip destinations using the Open-Meteo API (free, no API key required).

### Features
- 7-day forecast display
- Temperature (high/low)
- Weather icons and descriptions
- Precipitation probability
- Support for 20+ Philippine destinations

### Usage

```tsx
import { WeatherWidget } from '@/components/weather'

<WeatherWidget
  destination="Boracay"
  startDate="2024-03-15"
  endDate="2024-03-20"
/>
```

### Supported Destinations
Manila, Cebu, Boracay, Palawan, El Nido, Coron, Siargao, Bohol, Baguio, Davao, Iloilo, Vigan, Sagada, Batanes, Puerto Princesa, Tagaytay, La Union, Zambales, Batangas, Camiguin

### Weather Codes
The widget interprets WMO weather codes and displays appropriate icons:
- ☀️ Clear sky
- ⛅ Partly cloudy
- 🌧️ Rain
- ⛈️ Thunderstorm
- And more...

---

## Budget Tracking

**Location:** `src/features/budget/`

Track actual expenses against estimated budget with category breakdown.

### Features
- Add/edit/delete expenses
- Category-based tracking (transport, food, accommodation, activities, shopping, other)
- Progress bar showing budget usage
- Per-category breakdown
- Over-budget warnings

### Database Table
```sql
CREATE TABLE trip_expenses (
  id UUID PRIMARY KEY,
  itinerary_id UUID REFERENCES itineraries(id),
  activity_id UUID REFERENCES itinerary_activities(id),
  title TEXT NOT NULL,
  amount DECIMAL(10, 2) NOT NULL,
  category TEXT NOT NULL,
  notes TEXT,
  date DATE NOT NULL,
  created_at TIMESTAMPTZ
);
```

### Usage

```tsx
import { BudgetWidget } from '@/features/budget'

<BudgetWidget
  itineraryId="trip-123"
  activities={activities}
  totalBudget={50000}
  isOwner={true}
/>
```

### Service Methods
```typescript
budgetService.getExpenses(itineraryId)
budgetService.addExpense(expense)
budgetService.updateExpense(id, updates)
budgetService.deleteExpense(id, itineraryId)
budgetService.getBudgetSummary(itineraryId, activities, totalBudget)
```

---

## Calendar Export

**Location:** `src/lib/calendar.ts`

Export trip itineraries to calendar apps via ICS files.

### Features
- Generate ICS files compatible with Google Calendar, Apple Calendar, Outlook
- Individual activity events with times and locations
- Trip overview event generation
- Google Calendar direct link generation

### Usage

```typescript
import { generateICS, itineraryToEvents, downloadICS } from '@/lib/calendar'

// Convert itinerary to events
const events = itineraryToEvents(itinerary, days, activities)

// Generate ICS content
const icsContent = generateICS(events, 'My Trip to Palawan')

// Download the file
downloadICS(icsContent, 'palawan-trip.ics')
```

### Google Calendar Link
```typescript
import { getTripGoogleCalendarUrl } from '@/lib/calendar'

const url = getTripGoogleCalendarUrl(itinerary, 'https://tara.ph/trip/123')
// Opens Google Calendar with pre-filled event
```

---

## Photo Uploads

**Location:** `src/lib/storage.ts`, `src/components/PhotoUpload.tsx`

Upload and manage trip photos using Supabase Storage.

### Features
- Client-side image compression before upload
- Multiple photo upload support
- Photo gallery with lightbox viewer
- Delete photos
- Max photos limit

### Usage

```tsx
import PhotoUpload, { PhotoGallery } from '@/components/PhotoUpload'

// Upload component (for editing)
<PhotoUpload
  itineraryId="trip-123"
  activityId="activity-456"
  photos={existingPhotos}
  onPhotosChange={(photos) => setPhotos(photos)}
  maxPhotos={10}
/>

// Gallery component (for viewing)
<PhotoGallery photos={photoUrls} />
```

### Storage Service
```typescript
import { storageService } from '@/lib/storage'

// Upload single photo
const result = await storageService.uploadTripPhoto(file, itineraryId, activityId)

// Compress image before upload
const compressed = await storageService.compressImage(file, 1200, 0.8)

// List photos for a trip
const photos = await storageService.listTripPhotos(itineraryId)

// Delete a photo
await storageService.deletePhoto(path)
```

### Supabase Storage Setup
Create a bucket named `trip-photos` in your Supabase project with appropriate RLS policies.

---

## Push Notifications

**Location:** `src/lib/pushNotifications.ts`, `src/components/NotificationSettings.tsx`

Web Push notifications for trip reminders and collaboration alerts.

### Features
- Permission request handling
- Subscribe/unsubscribe to push notifications
- Local notification fallback
- Notification settings UI component

### Usage

```tsx
import NotificationSettings from '@/components/NotificationSettings'

// Settings toggle component
<NotificationSettings />
```

### Push Service API
```typescript
import { pushService, showAppNotification } from '@/lib/pushNotifications'

// Check if supported
pushService.isSupported()

// Request permission
await pushService.requestPermission()

// Subscribe to push
const subscription = await pushService.subscribe()

// Show local notification
await showAppNotification({
  type: 'trip_reminder',
  title: 'Trip Tomorrow!',
  body: 'Your Boracay trip starts tomorrow',
  url: '/trip/123',
})
```

### Setup for Production
1. Generate VAPID keys: `npx web-push generate-vapid-keys`
2. Set `NEXT_PUBLIC_VAPID_PUBLIC_KEY` environment variable
3. Create backend endpoint to send push notifications
4. Store subscriptions in database

---

## Community Trips

**Location:** `src/app/(main)/community/page.tsx`

Browse and discover public trips shared by other users.

### Features
- Grid view of public trips
- Search by title/description
- Filter by destination
- Sort by: Most Viewed, Most Recent, Most Copied
- Trip cards with stats (views, copies)
- Direct link to copy trips

### URL
```
/community
```

### Data Displayed
- Trip title and cover image
- Destination
- Duration (days)
- Budget
- Creator info
- View and copy counts

---

## Multi-Language Support (i18n)

**Location:** `src/lib/i18n/`

Support for multiple languages with Filipino and English translations.

### Supported Languages
- English (en)
- Filipino (fil)

### Features
- Context-based translation system
- Language switcher component
- Persistent language preference (localStorage)
- Parameter interpolation in translations

### Usage

```tsx
// Wrap app with provider (in Providers.tsx)
import { I18nProvider } from '@/lib/i18n'

<I18nProvider>
  {children}
</I18nProvider>

// Use translations in components
import { useTranslation } from '@/lib/i18n'

function MyComponent() {
  const { t, locale, setLocale } = useTranslation()

  return (
    <div>
      <h1>{t('home.hero.title')}</h1>
      <p>{t('planner.dayNumber', { number: 1 })}</p>
    </div>
  )
}
```

### Language Switcher
```tsx
import LanguageSwitcher from '@/components/LanguageSwitcher'

// Toggle style (compact)
<LanguageSwitcher variant="toggle" />

// Dropdown style
<LanguageSwitcher variant="dropdown" />
```

### Adding Translations
Edit `src/lib/i18n/translations.ts`:
```typescript
export const translations = {
  en: {
    'my.new.key': 'English text',
  },
  fil: {
    'my.new.key': 'Filipino text',
  },
}
```

---

## Offline Support

**Location:** `next.config.js`, `src/app/offline/page.tsx`

Progressive Web App with offline capabilities.

### Features
- Service worker caching via next-pwa
- Offline fallback page
- Cached pages viewable offline
- Cached images and assets
- API response caching

### Caching Strategies

| Resource | Strategy | Cache Duration |
|----------|----------|----------------|
| Pages | NetworkFirst | 1 day |
| Supabase API | NetworkFirst | 1 hour |
| Images | CacheFirst | 30 days |
| JS/CSS | StaleWhileRevalidate | 7 days |
| Weather API | NetworkFirst | 3 hours |
| Map tiles | CacheFirst | 30 days |
| Google Fonts | CacheFirst | 1 year |

### Offline Page
When offline, users are shown `/offline` with:
- Offline status indicator
- List of available offline features
- Retry button
- Connection status indicator

---

## Trip Collaboration

**Location:** `src/features/collaboration/`

Real-time collaboration on trip planning.

### Features
- Invite collaborators by email
- Role-based access (Owner, Editor, Viewer)
- Real-time presence indicators
- Accept/decline invitations
- Remove collaborators

### Database Tables
```sql
-- Trip collaborators
CREATE TABLE trip_collaborators (
  id UUID PRIMARY KEY,
  itinerary_id UUID REFERENCES itineraries(id),
  user_id UUID REFERENCES auth.users(id),
  role TEXT CHECK (role IN ('owner', 'editor', 'viewer')),
  status TEXT CHECK (status IN ('pending', 'accepted', 'declined')),
  invited_by UUID,
  ...
);
```

### Components
```tsx
import {
  InviteCollaboratorModal,
  CollaboratorList,
  PresenceIndicator
} from '@/features/collaboration'

// Show who's online
<PresenceIndicator itineraryId={id} userId={userId} userInfo={userInfo} />

// List collaborators
<CollaboratorList
  collaborators={collaborators}
  ownerId={ownerId}
  currentUserId={currentUserId}
  onUpdate={refresh}
/>

// Invite modal
<InviteCollaboratorModal
  itineraryId={id}
  isOpen={showInvite}
  onClose={() => setShowInvite(false)}
  onInvited={refresh}
/>
```

---

## Social Features

**Location:** `src/features/social/`

Social interactions on shared trips.

### Features
- Like/unlike trips
- Comments with real-time updates
- Save trips to personal collection
- View/copy counts

### Database Tables
```sql
-- Likes
CREATE TABLE trip_likes (
  id UUID PRIMARY KEY,
  itinerary_id UUID REFERENCES itineraries(id),
  user_id UUID REFERENCES auth.users(id),
  UNIQUE(itinerary_id, user_id)
);

-- Comments
CREATE TABLE trip_comments (
  id UUID PRIMARY KEY,
  itinerary_id UUID REFERENCES itineraries(id),
  user_id UUID REFERENCES auth.users(id),
  content TEXT NOT NULL,
  ...
);

-- Saved trips
CREATE TABLE saved_trips (
  id UUID PRIMARY KEY,
  itinerary_id UUID REFERENCES itineraries(id),
  user_id UUID REFERENCES auth.users(id),
  ...
);
```

### Components
```tsx
import { LikeButton, TripComments } from '@/features/social'

<LikeButton itineraryId={id} size="lg" showCount={true} />

<TripComments itineraryId={id} isPublic={true} />
```

---

## PWA Support

**Location:** `public/manifest.json`, `next.config.js`

Full Progressive Web App support.

### Features
- Installable on mobile/desktop
- App icons (72x72 to 512x512)
- Splash screen
- Standalone display mode
- App shortcuts

### Manifest Configuration
```json
{
  "name": "Tara - Travel Philippines",
  "short_name": "Tara",
  "theme_color": "#14b8a6",
  "display": "standalone",
  "shortcuts": [
    {
      "name": "Plan a Trip",
      "url": "/planner/new"
    },
    {
      "name": "Discover",
      "url": "/planner"
    }
  ]
}
```

### Icon Generation
Run to generate all PWA icons:
```bash
npm install sharp
node scripts/generate-icons.js
```

### Install Prompt
The app can be installed when accessed via a supported browser. Users will see an install prompt or can install via browser menu.

---

## Environment Variables

```env
# Supabase
NEXT_PUBLIC_SUPABASE_URL=your-supabase-url
NEXT_PUBLIC_SUPABASE_ANON_KEY=your-anon-key

# Push Notifications (optional)
NEXT_PUBLIC_VAPID_PUBLIC_KEY=your-vapid-public-key

# App URL (for OG images)
NEXT_PUBLIC_APP_URL=https://tara.ph
```

---

## Database Migrations

All migrations are in `supabase/migrations/` with timestamp prefixes:

| Migration | Description |
|-----------|-------------|
| `20260207010000_notifications.sql` | Notifications table |
| `20260207020000_trip_collaborators.sql` | Collaboration system |
| `20260207030000_trip_comments.sql` | Comments on trips |
| `20260207040000_trip_likes.sql` | Likes and saved trips |
| `20260207050000_trip_expenses.sql` | Budget tracking |

Run migrations:
```bash
supabase db push
```

---

## API Reference

### Itinerary Service
```typescript
itineraryService.getAll(userId)
itineraryService.getById(id)
itineraryService.create(userId, data)
itineraryService.update(id, data)
itineraryService.delete(id)
itineraryService.copyItinerary(sourceId, newOwnerId)
itineraryService.getFullItinerary(id, requirePublic)
itineraryService.makePublic(id)
itineraryService.makePrivate(id)
```

### Social Service
```typescript
socialService.getComments(itineraryId)
socialService.addComment(itineraryId, userId, content)
socialService.deleteComment(commentId)
socialService.getLikes(itineraryId)
socialService.toggleLike(itineraryId, userId)
socialService.getSavedTrips(userId)
socialService.toggleSave(itineraryId, userId)
```

### Collaboration Service
```typescript
collaborationService.getCollaborators(itineraryId)
collaborationService.inviteByEmail(input)
collaborationService.acceptInvitation(collaboratorId)
collaborationService.declineInvitation(collaboratorId)
collaborationService.removeCollaborator(collaboratorId)
collaborationService.updateRole(collaboratorId, role)
collaborationService.canEditTrip(itineraryId, userId)
collaborationService.subscribeToPresence(...)
```

---

## Contributing

When adding new features:

1. Create feature folder in `src/features/` with:
   - `components/` - React components
   - `services/` - API/data services
   - `hooks/` - Custom hooks
   - `types.ts` - TypeScript types
   - `index.ts` - Public exports

2. Add database migrations in `supabase/migrations/` with timestamp prefix

3. Add translations in `src/lib/i18n/translations.ts`

4. Update this documentation

---

*Last updated: February 2026*
