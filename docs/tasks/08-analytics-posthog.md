# Task 08 — PostHog analytics install

**Branch:** `feat/analytics-posthog`
**Blocks:** Task 07 (dated conversion) — the runbook is explicit that `bucket_dated` is the funnel's key metric and Task 07 cannot ship uninstrumented.

## Why now

The build plan's Analytics rule (CLAUDE.md hard rules) states: *"user-facing features ship with their events wired in the same PR. A feature merged without instrumentation is a feature you can't evaluate."* Task 06 shipped without event wiring — this task backfills the primitives so Task 07 can ship compliant.

The funnel that will be judged from PostHog:

```
place_saved  →  bucket_dated  →  booking_cta_clicked
```

Without `place_saved` firing today, the `bucket_dated` conversion rate Task 07 emits will have no denominator.

## Scope

- Install `posthog-js`
- Guard init on `NEXT_PUBLIC_POSTHOG_KEY` env var so a missing DSN is a silent no-op (same pattern as Sentry)
- Init in `Providers` at mount
- Identify the user on `SIGNED_IN` events (alongside `claimAnonBucket`) so the anonymous distinct_id merges into the user's identity — otherwise cross-boundary events look like two different people
- Reset on `SIGNED_OUT`
- Wire the first three events:
  - `place_saved` from `bucketListService.addToBucketList` (fires on both anon and auth saves)
  - `place_removed` from `bucketListService.removeFromBucketList`
  - `date_prompt_shown` from `/bucket` mount (still a placeholder today; Task 07 turns the prompt real and adds `date_prompt_started` / `bucket_dated`)

## Explicitly not in scope

- `bucket_dated`, `date_prompt_started`, `date_prompt_abandoned` — these belong to Task 07 which owns the real conversion flow
- `template_applied` — Template matching task (currently Task 08 in build-plan numbering, will slot after this)
- `booking_cta_shown`, `booking_cta_clicked`, `outbound_redirect` — Phase 4 booking work
- Session replay, feature flags, surveys, A/B testing — available on PostHog free tier; adopt when a use case appears, not upfront
- Custom user properties beyond `id` and `email` — later, when a segment actually needs them
- Analytics for admin surfaces — internal traffic doesn't need to be measured

## Observations

Ground truth as of `main @ 6c4df4d`.

**No analytics library is installed.** `package.json` has no `posthog-js` or equivalent. Grep for `.capture(` or `.track(` returns nothing outside of `errorService.captureException` (Sentry).

**Two places already know when to fire events**, they just don't:

- `bucketListService.ts:32-90` — `addToBucketList` returns after a successful insert. Fire `place_saved` here so both PlaceCard's bookmark path and any future save entrypoint (search results, template preview) get instrumentation for free.
- `bucketListService.ts:98-108` — `removeFromBucketList`. Fire `place_removed`.

**The anonymous identity is already stable.** `src/lib/anonId.ts` returns a persistent UUID from localStorage. Pass it as PostHog's `distinct_id` on init so anonymous events attribute to the same visitor across a session, and so `identify()` on sign-in merges cleanly.

**Providers already handles `SIGNED_IN`** to run `claimAnonBucket`. Add `posthog.identify()` alongside — one auth listener, both concerns.

## Env vars needed

Set on Vercel (Production + Preview):

- `NEXT_PUBLIC_POSTHOG_KEY` — the project's API key from PostHog dashboard → Settings → Project
- `NEXT_PUBLIC_POSTHOG_HOST` — `https://us.i.posthog.com` (US) or `https://eu.i.posthog.com` (EU). Pick the region closest to Manila (US is the default and fine)

Missing key → all `posthog.capture` calls no-op silently. Safe to ship the code before the account is set up.

## Fixes, in order

### 1. Install and env-guarded init

```bash
npm install posthog-js
```

New `src/lib/analytics.ts`:

```ts
import posthog from 'posthog-js'
import { getAnonId } from './anonId'

let initialized = false

export function initAnalytics(): void {
  if (initialized || typeof window === 'undefined') return
  const key = process.env.NEXT_PUBLIC_POSTHOG_KEY
  if (!key) return

  posthog.init(key, {
    api_host: process.env.NEXT_PUBLIC_POSTHOG_HOST || 'https://us.i.posthog.com',
    person_profiles: 'identified_only', // only create profiles when identify() runs
    bootstrap: { distinctID: getAnonId() },
    capture_pageview: true,
    capture_pageleave: true,
  })
  initialized = true
}

export function identifyUser(userId: string, email?: string): void {
  if (!initialized) return
  posthog.identify(userId, email ? { email } : undefined)
}

export function resetAnalytics(): void {
  if (!initialized) return
  posthog.reset()
}

export function capture(event: string, props?: Record<string, unknown>): void {
  if (!initialized) return
  posthog.capture(event, props)
}
```

Design notes:
- `person_profiles: 'identified_only'` — anonymous events attach to a distinct_id but don't create a full profile until `identify()` runs. Keeps profile count (billed metric) tied to real users.
- `bootstrap` sets `distinctID` to our `anon_id` at init. Anonymous events share the same visitor identity across the tab. `identify()` merges into the user's UID on sign-in.
- The `initAnalytics` idempotency guard survives React StrictMode's dev-time double-mount.

### 2. Wire into Providers

Extend `src/components/Providers.tsx`:

```tsx
import { initAnalytics, identifyUser, resetAnalytics } from '@/lib/analytics'

// inside Providers:
useEffect(() => {
  initAnalytics()

  const { data: { subscription } } = getSupabase().auth.onAuthStateChange(
    (event, session) => {
      if (event === 'SIGNED_IN' && session?.user) {
        identifyUser(session.user.id, session.user.email ?? undefined)
      } else if (event === 'SIGNED_OUT') {
        resetAnalytics()
      }
    }
  )
  return () => subscription.unsubscribe()
}, [])
```

Consolidate with the existing `claimAnonBucket` listener — one subscription, both handlers. Two listeners would work but duplicate the event stream.

### 3. First three events

**`place_saved`** — fires from `bucketListService.addToBucketList` on successful insert. Include the fields the funnel will filter by:

```ts
capture('place_saved', {
  placeId: place.source === 'tara' ? place.sourceId : place.id,
  source: 'discover', // TODO: pass from caller once search/template save exists
  category: place.category,
  isAnon: !user,
})
```

**`place_removed`** — fires from `removeFromBucketList`:

```ts
capture('place_removed', { itemId })
```

**`date_prompt_shown`** — fires from `/bucket` mount, once per pageload:

```ts
useEffect(() => {
  capture('date_prompt_shown', { itemCount: items.length })
}, []) // intentionally not on items change — the "shown" event is a single event, not a stream
```

### 4. Verify events land

1. Deploy to Vercel with env vars set
2. Open incognito → save a place → PostHog dashboard → **Live events** → expect `place_saved` within ~5s
3. Sign in → expect an `identify` call; refresh dashboard → expect the person to appear under **Persons**
4. Save another place after sign-in → same person, second `place_saved` with `isAnon: false`
5. Sign out → `posthog.reset()` runs, next event uses a fresh anonymous distinct_id

## Acceptance

- [ ] `posthog-js` installed and pinned in `package.json`
- [ ] `NEXT_PUBLIC_POSTHOG_KEY` and `NEXT_PUBLIC_POSTHOG_HOST` set on Vercel Production and Preview
- [ ] Missing key → app boots normally, all `capture` calls no-op, no console errors
- [ ] Anonymous `place_saved` event visible in PostHog with `isAnon: true`, `distinct_id` matching localStorage `tara-anon-id`
- [ ] After sign-in, `place_saved` fires with `isAnon: false` and same person id, no duplicate person profile
- [ ] `place_removed` visible on unsave
- [ ] `date_prompt_shown` visible on `/bucket` mount, once per page load
- [ ] Typecheck clean
- [ ] SSR of `/` still byte-stable (analytics init is client-side only)

## Report back

1. Confirmed PostHog region chosen (US vs EU) and why
2. Whether cross-device sign-in merges the anon identity as expected — same edge case Task 36 tracks for bucket rows; verify PostHog behaves the same way
3. Any events fired more than once per real user action — sets the noise ceiling for the funnel
