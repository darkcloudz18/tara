# Tara Brand Guide

> **Tara** — Filipino for "Let's go!" — is a travel discovery platform for the Philippines.

---

## Brand Identity

### Name & Tagline
- **Name:** Tara
- **Tagline:** Travel Together, Book Better
- **Description:** All-in-one travel platform for the Philippines. Plan trips, discover content, and book with confidence.

### Logo
- **Icon:** 🌴 Palm tree emoji
- **Logo Mark:** Teal gradient rounded square with palm tree
- **Logo Text:** "Tara" in bold, followed by "Travel Philippines" subtitle

```jsx
// Logo Usage
<div className="w-10 h-10 bg-gradient-to-br from-teal-400 to-teal-600 rounded-xl flex items-center justify-center shadow-lg shadow-teal-500/30">
  <span className="text-xl">🌴</span>
</div>
```

---

## Color Palette

### Primary Colors

| Color | Name | Hex | Usage |
|-------|------|-----|-------|
| 🟦 | **Teal 500** | `#14b8a6` | Primary brand color, CTAs, links |
| 🟦 | **Teal 600** | `#0d9488` | Hover states, emphasis |
| 🟦 | **Teal 400** | `#2dd4bf` | Dark mode primary |

### Secondary Colors

| Color | Name | Hex | Usage |
|-------|------|-----|-------|
| 🔴 | **Coral 500** | `#f94545` | Alerts, notifications, badges |
| 🟢 | **Palm 500** | `#47a34a` | Success states, nature themes |
| 🟡 | **Sand 500** | `#e6b77a` | Warm accents, highlights |

### Full Color Scales

#### Teal (Primary)
```css
teal-50:  #f0fdfa  /* Backgrounds */
teal-100: #ccfbf1  /* Light backgrounds */
teal-200: #99f6e4
teal-300: #5eead4
teal-400: #2dd4bf  /* Dark mode primary */
teal-500: #14b8a6  /* Primary */
teal-600: #0d9488  /* Hover */
teal-700: #0f766e
teal-800: #115e59
teal-900: #134e4a
teal-950: #042f2e
```

#### Coral (Accent)
```css
coral-50:  #fff5f5
coral-100: #ffe0e0
coral-200: #ffc7c7
coral-300: #ffa3a3
coral-400: #ff7070
coral-500: #f94545  /* Primary coral */
coral-600: #e72525
coral-700: #c21a1a
coral-800: #a01919
coral-900: #841b1b
```

#### Palm (Nature)
```css
palm-50:  #f3faf3
palm-100: #e3f5e3
palm-200: #c8eac9
palm-300: #9dd89f
palm-400: #6bbf6e
palm-500: #47a34a  /* Primary palm */
palm-600: #358538
palm-700: #2d692f
palm-800: #285429
palm-900: #224524
```

#### Sand (Warm)
```css
sand-50:  #fefdfb
sand-100: #fdf9f3
sand-200: #faf1e4
sand-300: #f5e4cd
sand-400: #efd1ab
sand-500: #e6b77a  /* Primary sand */
sand-600: #d99a4f
sand-700: #c17f3a
sand-800: #9d6633
sand-900: #80542d
```

### Dark Mode

| Element | Light Mode | Dark Mode |
|---------|------------|-----------|
| Background | `white` | `black` / `gray-950` |
| Text Primary | `gray-900` | `white` |
| Text Secondary | `gray-600` | `gray-400` |
| Border | `gray-200` | `gray-800` |
| Card Background | `white` | `gray-900` |
| Primary | `teal-500` | `teal-400` |

---

## Typography

### Font Stack
```css
font-family: system-ui, -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, sans-serif;
```

### Scale

| Style | Size | Weight | Usage |
|-------|------|--------|-------|
| **Display** | 2xl (24px) | Bold | Page titles |
| **Heading** | xl (20px) | Semibold | Section headers |
| **Title** | lg (18px) | Semibold | Card titles |
| **Body** | base (16px) | Regular | Body text |
| **Caption** | sm (14px) | Medium | Captions, labels |
| **Micro** | xs (12px) | Medium | Badges, timestamps |

### Usage Examples
```jsx
// Display
<h1 className="text-2xl font-bold text-gray-900 dark:text-white">

// Heading
<h2 className="text-xl font-semibold text-gray-900 dark:text-white">

// Body
<p className="text-base text-gray-700 dark:text-gray-300">

// Caption
<span className="text-sm text-gray-500 dark:text-gray-400">
```

---

## Iconography

### Icon Library
We use **Lucide React** for consistent, modern icons.

```bash
npm install lucide-react
```

### Core Icons

| Icon | Name | Usage |
|------|------|-------|
| `Compass` | Navigation | Discover page |
| `Search` | Search | Search functionality |
| `Map` | Destinations | Location pages |
| `Heart` | Like | Social interactions |
| `MessageCircle` | Comment | Comments |
| `Send` | Share | Sharing content |
| `Star` | Rating | Reviews and ratings |
| `MapPin` | Location | Address/location info |
| `Calendar` | Dates | Trip dates |
| `PlusCircle` | Create | New trip/content |
| `Bell` | Notifications | Alerts |
| `User` | Account | Profile/settings |
| `Moon` / `Sun` | Theme | Dark/light toggle |

### Custom Icons

#### Bucket Icon (Bucket List)
```jsx
import BucketIcon from '@/components/icons/BucketIcon'

// Empty bucket
<BucketIcon className="w-6 h-6 text-gray-900" />

// Filled bucket (added to list)
<BucketIcon className="w-6 h-6 text-teal-500" filled />
```

### Category Emojis

| Category | Emoji | Label |
|----------|-------|-------|
| All | 🌴 | All |
| Beaches | 🏖️ | Beaches |
| Islands | 🏝️ | Islands |
| Mountains | ⛰️ | Mountains |
| Food | 🍜 | Food Spots |
| Heritage | 🏛️ | Heritage |
| Adventure | 🏄 | Adventure |
| Stays | 🏨 | Stays |

### Place Type Icons

| Type | Emoji | Category |
|------|-------|----------|
| Stay | 🏨 | Accommodation |
| Eat | 🍜 | Food & Dining |
| See | 📸 | Attractions |
| Do | 🏄 | Activities |
| Default | 🌴 | General |

---

## Components

### Buttons

#### Primary Button
```jsx
<button className="px-4 py-2 bg-teal-500 hover:bg-teal-600 text-white rounded-lg font-medium transition-colors">
  Button Text
</button>
```

#### Secondary Button
```jsx
<button className="px-4 py-2 bg-gray-100 dark:bg-gray-800 text-gray-700 dark:text-gray-300 rounded-lg font-medium hover:bg-gray-200 dark:hover:bg-gray-700 transition-colors">
  Button Text
</button>
```

#### Icon Button
```jsx
<button className="p-2 hover:bg-gray-100 dark:hover:bg-gray-800 rounded-full transition-colors">
  <Icon className="w-6 h-6 text-gray-600 dark:text-gray-300" />
</button>
```

#### Pill Button (Category Filter)
```jsx
// Active
<button className="flex items-center gap-2 px-4 py-2 rounded-full bg-teal-500 text-white shadow-md">
  <span>🏖️</span>
  <span className="text-sm font-medium">Beaches</span>
</button>

// Inactive
<button className="flex items-center gap-2 px-4 py-2 rounded-full bg-gray-100 dark:bg-gray-800 text-gray-700 dark:text-gray-300 hover:bg-gray-200 dark:hover:bg-gray-700">
  <span>🏖️</span>
  <span className="text-sm font-medium">Beaches</span>
</button>
```

### Cards

#### Place Card
```jsx
<article className="bg-white dark:bg-black">
  {/* Header with emoji avatar */}
  <div className="flex items-center gap-3 px-4 py-3">
    <div className="w-10 h-10 rounded-full bg-gradient-to-br from-teal-400 to-teal-600 flex items-center justify-center">
      🏨
    </div>
    <div>
      <span className="font-semibold text-sm">Location</span>
      <span className="text-xs text-gray-500">Category</span>
    </div>
  </div>

  {/* Square image */}
  <div className="aspect-square overflow-hidden">
    <img className="w-full h-full object-cover" />
  </div>

  {/* Actions */}
  <div className="flex items-center justify-between px-4 pt-3">
    <div className="flex items-center gap-4">
      <Heart /> <MessageCircle /> <Send />
    </div>
    <BucketIcon />
  </div>
</article>
```

### Badges

#### Partner Badge
```jsx
<div className="px-2.5 py-1 bg-amber-400 text-amber-900 text-xs font-bold rounded-lg">
  PARTNER
</div>
```

#### Notification Badge
```jsx
<span className="w-4 h-4 bg-coral-500 text-white text-[10px] font-bold rounded-full flex items-center justify-center">
  3
</span>
```

### Inputs

#### Search Input
```jsx
<div className="relative">
  <MapPin className="absolute left-4 top-1/2 -translate-y-1/2 w-5 h-5 text-gray-400" />
  <input
    type="text"
    placeholder="Where in the Philippines?"
    className="w-full pl-12 pr-12 py-3 bg-gray-100 dark:bg-gray-900 border border-gray-200 dark:border-gray-700 rounded-full text-gray-900 dark:text-white placeholder-gray-500 focus:outline-none focus:ring-2 focus:ring-teal-500 focus:border-transparent"
  />
  <button className="absolute right-2 top-1/2 -translate-y-1/2 p-2 bg-teal-500 hover:bg-teal-600 rounded-full">
    <Search className="w-4 h-4 text-white" />
  </button>
</div>
```

---

## Layout

### Desktop Sidebar
- Width: 260px (expanded) / 72px (collapsed)
- Fixed position on left
- Contains: Logo, Navigation sections, Theme toggle, User profile

### Mobile Bottom Navigation
- Fixed at bottom
- 5 navigation items
- Icons with labels below

### Content Area
- Desktop: Offset by sidebar width (`lg:ml-[260px]`)
- Mobile: Full width with bottom padding for nav
- Max content width: 470px for feed

### Spacing Scale
```css
xs:  4px   (0.25rem)  /* Tight spacing */
sm:  8px   (0.5rem)   /* Small gaps */
md:  16px  (1rem)     /* Default spacing */
lg:  24px  (1.5rem)   /* Section gaps */
xl:  32px  (2rem)     /* Large sections */
2xl: 48px  (3rem)     /* Page sections */
```

### Border Radius
```css
rounded-lg:   8px    /* Buttons, inputs */
rounded-xl:   12px   /* Cards, modals */
rounded-2xl:  16px   /* Large cards */
rounded-full: 9999px /* Pills, avatars */
```

---

## Motion & Transitions

### Standard Transition
```css
transition-colors  /* Color changes */
transition-all     /* Multiple properties */
duration-300       /* 300ms for smooth feel */
```

### Hover Effects
```jsx
// Scale on hover
<Icon className="transition-transform group-hover:scale-110" />

// Opacity on hover
<button className="hover:opacity-60 transition-opacity">

// Background change
<button className="hover:bg-gray-100 dark:hover:bg-gray-800 transition-colors">
```

### Loading States
```jsx
// Spinner
<Loader2 className="w-8 h-8 text-teal-500 animate-spin" />

// Skeleton
<div className="bg-gray-200 dark:bg-gray-800 animate-pulse rounded" />
```

---

## Brand Voice

### Tone
- **Friendly:** Like a local friend showing you around
- **Enthusiastic:** Excited about Philippine travel
- **Helpful:** Practical tips and recommendations
- **Casual:** Use of "Tara!" (Let's go!)

### Copywriting Guidelines

| Do | Don't |
|----|-------|
| "Tara, let's explore!" | "Click here to browse" |
| "Add to Bucket List" | "Save to favorites" |
| "Where in the Philippines?" | "Enter destination" |
| "Discover places" | "View listings" |
| "Plan your trip" | "Create itinerary" |

### Key Phrases
- "Tara!" — Let's go!
- "Bucket List" — Saved places to visit
- "Discover" — Browse and explore
- "Travel Together, Book Better" — Tagline

---

## File Structure

```
src/
├── components/
│   ├── icons/
│   │   └── BucketIcon.tsx     # Custom bucket icon
│   └── layout/
│       ├── Header.tsx          # Top header with search
│       ├── Sidebar.tsx         # Desktop sidebar nav
│       └── MobileNav.tsx       # Mobile bottom nav
├── contexts/
│   └── ThemeContext.tsx        # Dark mode provider
├── features/
│   └── discover/
│       └── components/
│           └── PlaceCard.tsx   # Main feed card
└── app/
    ├── globals.css             # Global styles
    └── layout.tsx              # Root layout
```

---

## Tailwind Config Reference

```js
// tailwind.config.js
module.exports = {
  darkMode: 'class',
  theme: {
    extend: {
      colors: {
        teal: { /* Primary brand */ },
        coral: { /* Alerts, accents */ },
        palm: { /* Nature, success */ },
        sand: { /* Warm accents */ },
        primary: { /* Alias to teal */ },
      },
    },
  },
}
```

---

## Quick Reference

### Color Classes
```jsx
// Primary actions
bg-teal-500 hover:bg-teal-600 text-white

// Secondary actions
bg-gray-100 dark:bg-gray-800 text-gray-700 dark:text-gray-300

// Active/selected state
bg-teal-50 dark:bg-teal-900/30 text-teal-600 dark:text-teal-400

// Danger/alert
bg-coral-500 text-white

// Partner/featured
bg-amber-400 text-amber-900
```

### Common Patterns
```jsx
// Dark mode text
text-gray-900 dark:text-white

// Dark mode secondary text
text-gray-600 dark:text-gray-400

// Dark mode border
border-gray-200 dark:border-gray-800

// Dark mode background
bg-white dark:bg-black
bg-gray-100 dark:bg-gray-900
```
