# Task 04 — Phase 1.5 state-aware homepage

**Status:** planned work from `docs/build-plan.md` Phase 1.5.
**Scope:** the homepage lead varies by user state instead of showing every visitor the same hero + Discover feed. Server-rendered anonymous view remains the default; personalized variant swaps in after auth resolves and never blocks the anonymous render.

**Explicitly not** in scope:

- Persistent mobile bottom tabs (build-plan Step 5, own branch, `feat/mobile-nav`).
- Bucket list surface. The plan's "returning, no dated lakad" state leads with the user's bucket list — that data model doesn't exist yet. Wait for Phase 2 (`feat/bucket-list`).
- The `start_date` nullability change that would let us distinguish draft from dated lakad at the type level. Currently every `Itinerary` has a non-null `start_date`. Change comes with Phase 2's data-model migration.
- "What to book next" recommendations. Belongs to Phase 3+ once affiliate infrastructure is in place.
- Trip lifecycle jobs (T-60 email, etc.) — Phase 3.

## Observations

Ground truth as of `main @ 9be8de7`.

**The homepage doesn't lead with the user's trip.** `src/features/home/components/HeroSection.tsx:15-34` fetches `recentTrips` (up to 3) when the user is logged in and shows a list of them at the top of the hero. But the visual weight of that list is the same as the anonymous CTA row — it's a small block sandwiched between the hero heading and the featured templates. A returning user with an active Palawan trip lands on the same "Plan your next Philippine adventure" hero as a first-time visitor.

**State detection is already there, just underused.** The `user && recentTrips.length > 0` branch at `HeroSection.tsx:90` already forks the render. The fork could carry a lot more weight.

**Countdown data is available.** `Itinerary.start_date` is a non-null `string` (`src/types/database.ts:110`). Every trip has a date, which for now means we can always compute `daysUntil`. Once Phase 2 introduces draft-vs-dated, this becomes conditional — write the check so it degrades gracefully when `start_date` is null.

**Anonymous render is already server-side and cached.** Task 01 shipped this. `page.tsx` fetches feed data server-side with `revalidate = 300`, and `HomeClient` renders anonymously until auth resolves. The personalization work in this task must not undo that: the auth-dependent hero variant needs to hydrate on top of the anonymous one, never block it.

## The three states

Pragmatic simplification of the build plan's three-state table, given what the data supports today:

| State | How we detect | Homepage leads with |
|---|---|---|
| Anonymous or unresolved auth | `user === null` or the 3s `getUserSafe` timeout fires | Current anonymous hero: heading, lakad definition, Use a template / Create your lakad / Sign in |
| Logged in, no itineraries | `user && recentTrips.length === 0` | Same as anonymous (still needs a template or blank canvas to start) but with the "Sign in" tertiary link removed |
| Logged in, has itinerary | `user && recentTrips.length > 0` | **Their most recent trip.** Title, countdown to `start_date`, big Continue-building CTA. Discover feed still below for adding places. |

Once Phase 2 adds `bucket_items` and nullable `start_date`, split the third state into "has bucket list, no dates" vs "has dated lakad" per the build plan. Not now.

## Fixes, in order

### 1. Hoist state detection into `HomeClient`, keep server render anonymous

`src/app/page.tsx` stays a server component. It fetches feed + passes to `HomeClient`. `HomeClient` continues to run `getUserSafe()` on mount and `useItineraries` after that resolves. **No auth work moves into the server render.**

Add a derived `homepageState` in `HomeClient`:

```tsx
type HomepageState = 'anonymous' | 'no-trips' | 'has-trip'

const homepageState: HomepageState =
  !user ? 'anonymous'
  : userTrips.length === 0 ? 'no-trips'
  : 'has-trip'
```

`userTrips` state already exists (`HomeClient.tsx:49-73` fetches them). Use that.

### 2. Split the hero into three variants

`HeroSection.tsx` today has one anonymous branch plus a "user with recent trips" branch. Replace with three explicit branches driven by `homepageState`.

- **Anonymous:** unchanged. What's there now — hero, lakad definition, Template + Create + Sign-in CTAs.
- **No-trips:** same as anonymous except drop the "Sign in" tertiary link. They're already signed in.
- **Has-trip:** a dedicated returning-user card. Design:
  - Small greeting: `Welcome back, {first name or username}`
  - Trip title as H1 weight
  - Countdown: `Palawan is 47 days away` if `daysUntil > 0`, `Palawan starts today` if 0, `Palawan is happening now` if in trip window, `How was Palawan?` if in the past (nudge toward the T+3 review from the plan's lifecycle table)
  - Primary CTA: `Continue building` linking to `/trip/{id}/edit`
  - Secondary CTA: `Start another lakad` linking to `/trip/new`
  - Discover feed still renders below, still useful for adding places

`HeroSection` currently takes only `user`. Add `initialTrips?: Itinerary[]` (server-hydrated later) or lift the trips fetch to `HomeClient` so both the hero and the sidebar can share it — the sidebar already does its own separate fetch (`Sidebar.tsx:49-83`) which is redundant. Fixing the duplicate query is a small win but out of strict scope; either leave the duplicate for now or fix it — call it out in the commit either way.

### 3. Countdown helper

Extract into `src/lib/countdown.ts`:

```ts
export function daysUntil(startDate: string, now = new Date()): number {
  const start = new Date(startDate)
  return Math.ceil((start.getTime() - now.getTime()) / (1000 * 60 * 60 * 24))
}

export function tripPhaseCopy(startDate: string, endDate: string | null, destination: string): string {
  // returns the countdown / "starts today" / "happening now" / "how was" string
}
```

Pure functions — trivial to unit-test if you add tests later. Server-safe (no `Date.now()` at module scope, take `now` as arg so SSR and hydration produce the same value at the same request time).

**Care:** don't put `new Date()` at module scope inside `HomeClient` — that produces a different value on server render vs client hydration and re-introduces the same hydration bug class we killed in Task 01. Compute inside `useMemo` on the client, or pass a stable server-computed value down as a prop.

### 4. No-regression on the anonymous SSR

After the split, hit the running dev server three times in a row and compare byte-length. If personalization leaked into the anonymous render, the size will vary. If SSR is still anonymous-only, sizes match.

## Acceptance

- [ ] Logged out, hard refresh: same hero as before (Use a template primary, lakad definition, Sign in tertiary)
- [ ] Logged in with **zero** itineraries: same hero minus the Sign in link
- [ ] Logged in with **one or more** itineraries: hero leads with the most recent trip title + countdown + Continue building CTA; Discover feed still below
- [ ] Countdown copy is correct for a trip 30 days out, today, mid-trip, and past
- [ ] Three consecutive `curl /` requests logged out return byte-identical HTML (personalization must not leak into the SSR)
- [ ] No hydration warnings in the console
- [ ] 375px: has-trip card is one column, primary CTA is full-width, tap target ≥44px
- [ ] Sentence case on new copy
- [ ] Typecheck clean

## Report back

1. Whether the sidebar-vs-hero duplicate trips fetch was fixed or left for a follow-up
2. Any spots where `start_date` needed a null-safe guard even though the type says it's non-null — those are early evidence for the Phase 2 nullability change
3. The countdown copy variants shipped, so Task 05 (bucket list) can reuse them consistently
