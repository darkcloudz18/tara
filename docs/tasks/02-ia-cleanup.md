# Task 02 — Phase 1 IA and copy cleanup

**Status:** planned work from `docs/build-plan.md` Phase 1.
**Scope:** homepage IA and anonymous-visitor copy. Explicitly **not** in scope:

- Wholesale `trip` → `lakad` rename across routes/components (roughly 90 files). That's its own branch.
- Light-mode default and teal-discipline (Phase 1.6).
- Mobile bottom tabs (Phase 1 build-plan item 5).
- Any Discover-feed data or SSR work — that shipped in Task 01.

## Observations

Ground truth as of `main @ a9c6956`.

**Sidebar has a Search item.** `src/components/layout/Sidebar.tsx:107` — `{ icon: Search, label: 'Search', href: '/search' }`. Whether a contextual search sits beside the filter pills is unverified — the `Header` component is where it would live. Verify before removing the sidebar item; if the contextual one is missing, either add it or don't drop the sidebar entry.

**Sign In is a solid teal button** in the sidebar bottom (`Sidebar.tsx:316-322`). Build plan wants it demoted to a text link since it's tertiary in the logged-out CTA hierarchy.

**Hero CTA hierarchy is inverted.** `src/features/home/components/HeroSection.tsx:118-132`. Anonymous visitors see:
- `Create Your Trip` — white background, bold, shadow, hover-lift. **Visually dominant.**
- `Use a Template` — white/10 background, subtle. **Visually secondary.**

Build plan wants the reverse: Template first, Create second. Templates are the real conversion — a new visitor with no destination in mind has nothing to fill a blank itinerary with.

**No "lakad" definition anywhere.** `useLocalizedTrip` hook returns `"Trip"` in English (only the Filipino strings contain "lakad"). The word never appears on the anonymous homepage. Build plan wants, on first use:

> Build your **lakad** — a day-by-day Philippine itinerary you can share with your barkada.

**Placeholder avatars.** `HeroSection.tsx:140-147` renders four hardcoded initials `J M A K` inside gradient circles. Fake social proof — no real users behind them.

**"500+" copy** at `HeroSection.tsx:149` reads `500+ {t.trips.toLowerCase()} created & shared`, which renders as `500+ trips created & shared` in English. Build plan flags an existing "500+ users" vs "500+ lakad" inconsistency to fix "everywhere". Grep across the repo before landing this change — the string appears in more than one surface.

**Anonymous-first is unverified.** The sidebar's `New {t.trip}` link routes anonymous visitors to `/login` via the `requiresAuth` flag (`Sidebar.tsx:110-113`, `NavLink.tsx:123`). Build plan is explicit that browsing, saving, and building all work logged out — auth prompt only at save/share. Fixing this properly needs bucket-list infrastructure (Phase 2), so this task only verifies the current gate points and lists them; the actual anonymous-build flow lands later.

## Fixes, in order

### 1. Verify contextual search, then drop the sidebar Search item

Confirm `Header.tsx` renders a search input beside the category pills. If it does, remove `{ icon: Search, label: 'Search', href: '/search' }` from `mainNavItems` in `Sidebar.tsx`. If not, either add one to `Header.tsx` or defer the sidebar removal — do not leave the site with zero search.

Same drop from `MobileNav.tsx:43` (`Search` entry) after confirming the header search is reachable at mobile widths.

### 2. Reverse the hero CTA hierarchy

In `HeroSection.tsx:118-132`:

- Swap the visual weights: `Use a Template` gets the white-background, shadow, hover-lift styling; `Create your lakad` gets the subtle white/10 secondary styling.
- Reorder so `Use a Template` renders first (visual + DOM).
- Update the label from `Create Your {t.trip}` to `Create your lakad` (sentence case, hardcoded word — task file 02 doesn't touch the localization hook globally, but this one string is user-facing and load-bearing).
- Add a tertiary `Sign in` text link below the two buttons, not a button. Points at `/login`.

Also demote the sidebar `Sign In` button (`Sidebar.tsx:316-322`) to a text link, matching the same tertiary treatment.

### 3. Define "lakad" on the anonymous hero

Add the definition sentence to the anonymous hero copy. One reasonable placement:

- Replace the current subheading at `HeroSection.tsx:80` — `Create beautiful day-by-day itineraries. Browse places and build your perfect {t.trip.toLowerCase()}.` — with:
  > Build your **lakad** — a day-by-day Philippine itinerary you can share with your barkada.

Word "lakad" is emphasized (semantic `<em>` or `<strong>`, not just bold Tailwind) so screen readers pick it up as the term being defined. Keep the sentence short — one line at 375px if possible.

### 4. Drop the fake avatars, fix the "500+" copy

- Remove the `[1,2,3,4].map` avatar block at `HeroSection.tsx:139-148`. A bare number is fine; fake initials are not.
- Grep the repo for `500\+` and pick one canonical noun. Recommended: `500+ lakad shared` (past tense, no "created &" pileup). Update every occurrence.
- If you find fewer than 500 real lakad in the DB, either drop the number entirely or move it to real data. Don't ship an invented number the DB contradicts.

### 5. Anonymous-first: audit only, don't fix yet

Grep the app for `requiresAuth: true` and `if (!user) router.push('/login')`. Produce a list of surfaces that currently gate at the entry point. Do **not** rewrite the flows in this task — bucket-list capture and the anon-id flow (Phase 2) are the actual fix. This step is just so the next task file has a starting inventory.

## Acceptance

- [ ] Anonymous view of `/` at 375px shows: real destination photography, a hero heading, the lakad-definition sentence, `Use a template` primary, `Create your lakad` secondary, `Sign in` as a text link
- [ ] No `J M A K` placeholder initials in view-source
- [ ] Every `500+` string across the repo uses the same noun
- [ ] Sidebar has no Search item, or has one plus a working contextual search in the header — never zero search
- [ ] Sidebar Sign In is a text link, not a solid button
- [ ] Sentence case throughout new copy (`Use a template`, `Create your lakad`, `Sign in`)
- [ ] Typecheck and lint clean
- [ ] Auth-required routes still redirect correctly (regression check for the `requiresAuth` audit)

## Report back

1. Where the contextual search lives (or that it doesn't exist), and whether the sidebar entry can be dropped safely
2. The full list of `500+` occurrences and the canonical noun chosen
3. The `requiresAuth: true` / `router.push('/login')` inventory, as raw data for Task 03 (bucket list) to plan against
