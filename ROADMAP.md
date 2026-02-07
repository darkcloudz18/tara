# Tara Roadmap: Path to #1 Travel App in PH

> **Strategy:** Make the best FREE trip planner in the Philippines. Use it as a growth engine to drive bookings later.

## Why This Strategy

| Problem | Solution |
|---------|----------|
| Solo founder, limited resources | Trip planner is a **product**, not a marketplace. You can build it alone. |
| No funding yet | Free tool grows **organically** via sharing. Zero customer acquisition cost. |
| Need traction for investors | A great planner gets shared. "Check out my trip plan!" = free marketing. |
| Future monetization | Once you have users, booking integration generates revenue. |

---

## The Playbook

### Phase 1: Make It Shareable (Virality Engine)
**Goal:** Every trip plan created should be shared on social media.

When someone shares their "5-day Palawan trip" on Facebook/IG, their friends see a beautiful preview card with Tara branding — that's free marketing.

### Phase 2: Reduce Friction to Zero
**Goal:** Anyone can create a trip plan in under 60 seconds.

Pre-made templates for popular routes. No account required to start planning.

### Phase 3: Make It Indispensable
**Goal:** Features that make users come back and recommend to friends.

Budget tracking, offline access, PDF export — things other apps don't do well.

### Phase 4: Monetize
**Goal:** Convert engaged users into paying customers.

"Book this hotel" buttons, premium features, supplier partnerships.

---

## Technical Roadmap

### Sprint 1: Mobile + Shareability (Current)

#### [x] Task 6: Fix Critical Mobile Issues
**Status:** COMPLETED

- [x] Add viewport meta tag to layout.tsx
- [x] Increase touch targets in MobileNav (min 44-48px)
- [x] Add iOS momentum scrolling CSS
- [x] Add scrollbar-hide utility class
- [x] Fix input font-size to prevent iOS zoom (16px min)
- [x] Add safe-area utilities for notched devices

#### [x] Task 7: Homepage Hero Section
**Status:** COMPLETED

- [x] Hero with value proposition: "Plan Your Next Philippine Adventure"
- [x] Big CTA button "Start Planning"
- [x] 4 featured trip template cards
- [x] Social proof: "500+ trips planned"
- [x] Template cards link to /planner/new?template=slug

**Files created:**
- `src/features/home/components/HeroSection.tsx`
- `src/features/home/components/index.ts`

#### [x] Task 2: Pre-made Trip Templates
**Status:** COMPLETED

Created 8 trip templates:
| Template | Duration | Budget |
|----------|----------|--------|
| Palawan Island Paradise | 5 days | ₱15,000 |
| Siargao Surf & Chill | 4 days | ₱12,000 |
| Boracay Beach Escape | 3 days | ₱10,000 |
| Bohol Nature & Heritage | 3 days | ₱8,000 |
| Cebu City & Whale Sharks | 4 days | ₱10,000 |
| Baguio Cool Escape | 3 days | ₱5,000 |
| Batanes Heritage Tour | 4 days | ₱20,000 |
| Coron Underwater World | 4 days | ₱14,000 |

Each template includes:
- Destination, duration, highlights
- Estimated budget per person
- Best months to visit
- Target audience (couples, solo, families, etc.)
- High-quality cover image

**Files created:**
- `src/features/planner/data/tripTemplates.ts`

**Integration:**
- Templates shown on homepage hero
- Clicking template pre-fills the trip wizard with destination, dates, and trip type

---

#### [x] Task 1: Shareable Trip URLs with OG Tags
**Status:** COMPLETED
**Priority:** HIGH - Foundation for virality

**What to build:**
- Public route: `/trip/[id]` - viewable without login
- Database: Add `is_public` and `share_slug` fields to itineraries table
- OG meta tags for social media previews:
  - `og:title` = "5-Day Palawan Adventure | Tara"
  - `og:description` = "Manila → El Nido • 5 days • ₱15,000 budget"
  - `og:image` = Dynamic image with trip summary (use Vercel OG)
- "Planned with Tara" branding on shared pages
- Copy link button

**Files to create/modify:**
```
src/app/trip/[id]/page.tsx          # Public trip view
src/app/trip/[id]/opengraph-image.tsx  # Dynamic OG image
src/app/api/trips/[id]/share/route.ts  # Generate share link
```

**Implementation completed:**
- Public route: `/trip/[id]` - viewable without login
- Dynamic OG image generation at `/trip/[id]/opengraph-image`
- "Planned with Tara" branding on shared pages
- Day-by-day itinerary display
- Trip stats and budget display

**Files created:**
```
src/app/trip/[id]/page.tsx
src/app/trip/[id]/ShareButton.tsx
src/app/trip/[id]/opengraph-image.tsx
src/app/trip/[id]/not-found.tsx
src/features/planner/components/ShareTripButton.tsx
```

---

#### [x] Task 4: Make Share Button Functional
**Status:** COMPLETED

**Implementation:**
- ShareTripButton component with modal
- Public/Private visibility toggle
- Copy link to clipboard
- Native Web Share API for mobile
- Preview link to public trip page

---

#### [x] Task 2: Pre-made Trip Templates
**Priority:** HIGH - Reduces friction

**What to build:**
- 5-10 ready-to-use trip templates
- Template selector on planner/new page
- "Use this template" button
- Templates stored in database or as constants

**Templates to create:**
| Template | Duration | Highlights |
|----------|----------|------------|
| Palawan Island Hopping | 5 days | El Nido, island tours, beaches |
| Siargao Surf & Chill | 4 days | Cloud 9, island life, food |
| Boracay Beach Getaway | 3 days | White Beach, water sports, nightlife |
| Bohol Adventure | 3 days | Chocolate Hills, tarsiers, Panglao |
| Cebu City + Oslob | 4 days | Heritage sites, whale sharks, falls |
| Baguio Cool Escape | 3 days | Pine trees, strawberries, cafes |
| Batanes Heritage | 4 days | Stone houses, rolling hills, culture |
| Coron Underwater | 4 days | Shipwrecks, lakes, snorkeling |

**Files to create/modify:**
```
src/features/planner/data/tripTemplates.ts
src/features/planner/components/TemplateSelector.tsx
src/app/(main)/planner/new/page.tsx  # Add template selection
```

---

### Sprint 2: Differentiation

#### [x] Task 3: Detailed Budget Breakdown
**Status:** COMPLETED

**Implementation:**
- Total trip cost with per-person and per-person/day breakdown
- Category breakdown with visual bars (Transport, Accommodation, Activities, Food)
- Day-by-day spending chart (collapsible)
- Contextual budget tips for PH travelers
- Color-coded categories with icons

**UI:**
```
┌─────────────────────────────────────┐
│ Total Trip Cost                     │
│ ₱15,420                             │
│ [Per Person: ₱7,710] [Per Day: ₱3k] │
├─────────────────────────────────────┤
│ Transport     ████████░░  ₱5,200   │
│ Accommodation ██████░░░░  ₱4,000   │
│ Activities    ████░░░░░░  ₱3,500   │
│ Food          ███░░░░░░░  ₱2,720   │
├─────────────────────────────────────┤
│ 💡 Budget Tips                      │
│ - Consider hostels to save 30-50%  │
│ - Book flights 2-3 months ahead    │
└─────────────────────────────────────┘
```

**Files created/modified:**
```
src/features/planner/components/BudgetBreakdown.tsx (NEW)
src/features/planner/hooks/useBudgetCalculations.ts (enhanced)
src/app/(main)/planner/new/page.tsx (integrated)
src/app/(main)/planner/[id]/page.tsx (integrated)
```

---

#### [x] Task 5: PDF Export
**Status:** COMPLETED

**Implementation:**
- Beautiful PDF layout with Tara branding
- Day-by-day itinerary with times, activities, locations
- Budget summary by category
- Per-person cost breakdown
- Professional footer with page numbers
- Available on saved itineraries AND public shared trips

**Library used:** `@react-pdf/renderer`

**Files created:**
```
src/features/planner/components/ItineraryPDF.tsx (PDF template)
src/features/planner/components/DownloadPDFButton.tsx
src/app/trip/[id]/TripActions.tsx (share + download)
```

**Integration:**
- /planner/[id] - Download button in header
- /trip/[id] - Download button for visitors

---

### Sprint 3: Growth & Polish

#### [ ] SEO Landing Pages
**Priority:** MEDIUM - Organic traffic

**What to build:**
- `/destinations/[destination]` pages
- `/itinerary/[destination]-[days]-days` pages
- Target searches like "palawan 5 day itinerary"

#### [ ] User Accounts & Saved Trips
**Priority:** MEDIUM - Retention

**What to build:**
- Save trips to account
- Trip history
- Edit saved trips

#### [ ] Social Proof
**Priority:** LOW - After traction

**What to build:**
- "X people planned trips to Palawan this week"
- User testimonials
- Trip completion badges

---

## Success Metrics

### Phase 1 (Shareability)
- [ ] 100 trips created
- [ ] 20% of trips get shared (share rate)
- [ ] Shared links get 2+ clicks on average

### Phase 2 (Growth)
- [ ] 1,000 monthly active users
- [ ] 50 trips created per day
- [ ] 4+ star App Store rating (when mobile app launches)

### Phase 3 (Monetization)
- [ ] First booking through platform
- [ ] 10 supplier partnerships
- [ ] ₱100k GMV (gross merchandise value)

---

## Tech Stack Reference

| Layer | Technology |
|-------|-----------|
| Frontend | Next.js 14, React 18, TypeScript |
| Styling | Tailwind CSS |
| Database | Supabase (PostgreSQL) |
| Auth | Supabase Auth |
| Storage | Supabase Storage |
| Hosting | Vercel |
| Analytics | (TODO: Add Mixpanel or PostHog) |

---

## Quick Commands

```bash
# Development
npm run dev

# Build
npm run build

# Database migrations
npx supabase db push

# Generate types from Supabase
npx supabase gen types typescript --local > src/types/database.ts
```

---

## Notes

- **Mobile-first**: 95% of PH internet users are on mobile. Test everything on phone first.
- **Offline-friendly**: Many travelers have spotty internet. PDF export and PWA features help.
- **Filipino-first**: Support GCash/Maya, use Filipino-friendly copy, focus on domestic routes.
- **Budget-conscious**: Most users are budget travelers. Always show prices, offer alternatives.

---

*Last updated: February 7, 2026*

---

## Changelog

### February 7, 2026
- [x] Fixed critical mobile issues (viewport, touch targets, iOS scrolling)
- [x] Added homepage hero section with trip planner CTA
- [x] Created 8 pre-made trip templates for popular PH destinations
- [x] Templates integrate with trip wizard (pre-fill on selection)
- [x] Added shareable trip URLs (`/trip/[id]`) with public view
- [x] Added dynamic OG image generation for social media previews
- [x] Added ShareTripButton with public/private toggle
- [x] Share functionality: copy link, native share API, preview
- [x] Added comprehensive BudgetBreakdown component with category/day breakdown
- [x] Per-person and per-day cost calculations
- [x] Contextual budget tips for Filipino travelers
- [x] Added PDF export with beautiful layout and Tara branding
- [x] PDF includes day-by-day itinerary, budget summary, per-person costs
- [x] PDF download available on saved trips and public shared trips
