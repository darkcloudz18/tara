# Task 03 — Phase 1.6 light-mode default and teal discipline

**Status:** planned work from `docs/build-plan.md` Phase 1.6.
**Scope:** the two flagship visual-language changes the build plan says would ship if only two changes could — light as default, and teal reserved for primary action. Plus a sentence-case copy sweep and a contrast spot-check.

**Explicitly not** in scope for this task:

- Photography-driven hero (replaces the current gradient). Its own branch — needs a chosen image, `next/image` priority, AVIF/WebP, and a scrim that contrasts across arbitrary images. Do after this task lands.
- Display face for destination names / hero headlines. The build plan itself flags this as optional and prefers restraint.
- Wholesale `trip` → `lakad` vocabulary sweep across ~90 files.
- Mobile bottom tabs (Phase 1 Step 5, own branch).

## Observations

Ground truth as of `main @ 80fd836`.

**Theme default is system-following, not hard-light.** `src/app/layout.tsx:89-102` inline script:

```js
var isDark = theme === 'dark' || (theme === 'system' && systemDark) || (!theme && systemDark);
```

That third clause is the load-bearing one — with no stored preference, a visitor whose OS is in dark mode sees dark. The build plan is explicit: for this product, "light is the default, dark is the option." First-time paint should be light regardless of OS. Users can toggle to dark and it persists.

`ThemeContext.tsx:17` initializes `theme` state to `'system'` for the same reason. Change to `'light'` so the client-side hydration matches the light-first script.

**Teal is doing at least five jobs.** 372 matches for `text-teal|bg-teal|border-teal|from-teal|to-teal|via-teal` across 72 files. The specific known violations from the build plan:

| Element | Where | Now | Should be |
|---|---|---|---|
| Price text | template cards, place cards | `text-teal-*` | primary text, medium weight |
| Active nav state | `Sidebar.tsx:129-130`, `MobileNav.tsx:61-62` | teal text + bg | subtle background, neutral text |
| Search submit button | `Header.tsx:79-82` | `bg-teal-500` | neutral, or fold into input |
| Template card hover copy | `HeroSection.tsx` "from ₱" and "Use template" | teal | neutral for price, drop hover-only |
| Empty-state / decorative icons | `HomeClient.tsx` "Clear filters", etc. | teal | keep if it's a CTA (Clear filters is), demote otherwise |
| Sign In button | already demoted | text link | ✓ done in Task 02 |

Everything else that reads as a **primary action** — install button, "Try again", "Book on Klook" when built, "Clear filters", "Add to trip" — should **keep** teal. The rule is "one job for teal", not "no teal anywhere."

**Copy is a mix of Title Case and sentence case.** Task 02 sentence-cased the hero CTAs and sidebar Sign In. Remaining Title Case examples spotted in earlier reads:
- Sidebar's `Start Your Trip` (`Sidebar.tsx:227`)
- `Building Trip` label (`Sidebar.tsx:192`)
- Hero `Plan Your Next / Continue Building / Your Dream Trip` (`HeroSection.tsx:64-72`)
- `Create New Trip` (`HeroSection.tsx:114`)
- Global error `Something went wrong`, `Try Again`, `Go Home` (`error.tsx`)
- Trip not-found `Trip Not Found`, `Plan Your Own Trip`, `Explore Destinations` (`trip/[id]/not-found.tsx`)
- PWA prompt `Install Tara App`

Sweep the routes people actually land on: `/`, `/trip/new`, `/dashboard`, error/404 pages, the PWA prompt, and the auth pages.

**Contrast — need to check, not guess.** The build plan flags three suspects:
- Light teal headline text over the teal-blue gradient hero
- Teal price text over dark photo scrims (only relevant once photo hero ships)
- Muted/secondary text (`text-gray-500`, `text-gray-400`) in both modes

Use an actual checker (Chrome DevTools contrast picker, or webaim.org/resources/contrastchecker). Anything under 4.5:1 for body text or 3:1 for large text goes on a follow-up list.

## Fixes, in order

### 1. Light as hard default

`src/app/layout.tsx` inline script — drop the `(!theme && systemDark)` fallback so an unset preference resolves to light regardless of OS. New shape:

```js
var isDark = theme === 'dark' || (theme === 'system' && systemDark);
```

`ThemeContext.tsx:17` — change `useState<Theme>('system')` to `useState<Theme>('light')` so the React state matches the DOM class the script wrote.

Verify: incognito with system in dark mode → still see light on first paint. Toggle to dark → persists across reload. Toggle back to light → persists.

Do not remove the toggle. Dark is still an option, just not the default.

### 2. Teal discipline sweep

Audit-driven, not blanket replace. For each surface below, replace the teal with the target treatment:

- **Prices** — grep `text-teal.*₱` and adjacent. Swap `text-teal-*` to `text-gray-900 dark:text-white font-semibold` (medium weight, primary text color).
- **Active nav state in Sidebar** — currently `bg-teal-50 dark:bg-teal-900/30 text-teal-600 dark:text-teal-400`. Change to `bg-gray-100 dark:bg-gray-800 text-gray-900 dark:text-white`. Same treatment in MobileNav's active state (`text-teal-600 dark:text-teal-400` → neutral).
- **Header search submit button** (`Header.tsx:79-82`) — currently `bg-teal-500 hover:bg-teal-600`. Options: (a) neutral gray button, (b) drop the button and rely on Enter-to-submit, (c) fold the search icon into the input's right padding. Recommend (c) — matches the search-as-input pattern most travel apps use.
- **Empty-state / retry buttons** — audit each. `Clear filters` and `Try again` in HomeClient are primary actions → **keep teal**. Decorative teal icons (like the empty-state illustration accents) → demote to neutral.
- **Uppercase "Explore" / "Your Trips" section labels in the sidebar** — currently `text-gray-400`, no teal. No change.

Do not touch: primary CTAs, brand logo/mark, teal in illustrations that are themselves the destination photography stand-ins.

### 3. Sentence case sweep

For the surfaces listed above under Observations. Rewrites:
- `Start Your Trip` → `Start your lakad`
- `Building Trip` → `Building lakad`
- `Plan Your Next Philippine Adventure` → `Plan your next Philippine adventure`
- `Continue Building Your Dream Trip` → `Continue building your dream lakad`
- `Create New Trip` → `Create new lakad`
- `Something went wrong` → keep, already sentence case
- `Try Again` → `Try again`
- `Go Home` → `Go home`
- `Trip Not Found` → `Lakad not found`
- `Plan Your Own Trip` → `Plan your own lakad`
- `Explore Destinations` → `Explore destinations`
- `Install Tara App` → `Install Tara`

Note two things while sweeping:
- Where the copy has `{t.trip}` and the surface is anonymous / prominent, replace with the hardcoded `lakad` word. Don't touch deep secondary strings — those wait for the full vocabulary branch.
- Don't rename buttons that would break existing muscle memory (e.g., "Sign in" stays sentence-case; "Log in" would be a semantic change, skip).

### 4. Contrast spot-check

Open `/` in Chrome DevTools with the a11y contrast checker on. Check each:

- Hero H1 (`text-white` over teal-500-to-blue-600 gradient)
- Hero subhead (`text-teal-100`) — this one is likely failing
- Price text after the fix in step 2
- Muted secondary text: `text-gray-500` and `text-gray-400` on white and black backgrounds

Anything under 4.5:1 body / 3:1 large: log it in a follow-up list, don't attempt to fix inside this task — the fix might interact with the photo-hero work.

## Acceptance

- [ ] First-time visitor in incognito, system in dark mode: initial paint is **light**, and `document.documentElement` has `class="light"`
- [ ] After toggling to dark and reloading: initial paint is dark, `class="dark"`, and this persists across further reloads
- [ ] After toggling back to light and reloading: light persists
- [ ] Prices in template cards, place cards, and any other surface no longer render in teal — they render as primary text
- [ ] Active nav state in sidebar and mobile nav uses a subtle background fill, not teal text
- [ ] Header search has no teal accent
- [ ] `Clear filters`, `Try again`, hero primary CTA still use teal — teal still has one job
- [ ] Sentence case on every heading and button listed in fix #3
- [ ] View-source at `/` shows updated copy
- [ ] Typecheck and lint clean

## Report back

1. The teal usages that were left alone because they're primary actions — list each with a one-line reason
2. Any contrast failures found in fix #4, as input to the photo-hero task
3. Any surfaces where sentence case would create a semantic conflict (rare, but worth surfacing before commit)
