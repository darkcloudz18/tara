# Task 09 — Discover personalization strip

**Branch:** `feat/discover-personalization`
**Blocked by:** Task 06 (bucket list) shipped, Task 08 (analytics) shipped
**Related:** Task 10 (itinerary suggests bucket) is the sister surface

## Why

Right now `/` shows the same Discover feed to every visitor. Once someone has *any* signal of intent — a dated lakad's destination, or a cluster of saves in one location — the generic feed underserves them. A visitor with five El Nido saves shouldn't have to scroll past Baguio, Batanes, and Vigan to find more El Nido.

At the same time, this cannot break the anonymous / SSR / indexable base feed. Architectural law #1: public never waits on private. The personalization is a **layered strip on top**, not a replacement.

## Two principles that shape the scope

1. **No signal → today's feed, unchanged.** First-time visitors, cold-start users, and anyone without a lakad or clustered saves see exactly what ships today. Save-to-bucket still works with no lakad in mind.
2. **The strip is additive.** It renders above the current feed grid, with its own header. If it fails to load, or the signal is weak, it silently does not render — the base feed carries the page.

## Scope

- Detect a *primary destination signal* from the visitor (works logged out via `anon_id`, logged in via `user_id`)
- Render a personalized strip above the base Discover grid when signal exists
- Strip is a horizontal-scroll row of matching places, capped at ~8 items
- Header copy names the destination: *"More around El Nido"*, *"For your Palawan trip"*
- All four async states (loading, error, empty→don't render, loaded)
- Instrument: `discover_personalized_shown`, `discover_personalized_click`

## Explicitly not in scope

- The itinerary builder pre-populating bucket items — that's Task 10
- ML / embeddings / recommender — hard rule says no vector DB. This is a SQL location match, nothing more
- Multi-destination personalization (two strips if someone has Palawan *and* Batanes saves) — pick the strongest signal, show one strip. Multi-strip is a future refinement
- Ranking / paid placement — everything ordered by base curation score, filtered by location
- Reordering the base feed itself — the strip is additive, the base grid is untouched

## Signal detection

In priority order — first hit wins:

1. **Active dated lakad** — `lakad` row with `status = 'dated'` and `start_date >= today`. Use its destination.
2. **Bucket list cluster** — group `bucket_list` rows by `place_location`, take the location with the most saves if it has ≥ 3 items. This works for both anon (`anon_id`) and auth (`user_id`) visitors.
3. **No signal** → don't render the strip.

Signal detection runs client-side on the homepage after mount, so SSR of `/` stays byte-stable and indexable. The strip mounts in as a client component — the base feed is already SSR'd by the time the strip decides whether to render.

## Data query

Base places already have `location` on them. The personalized strip is a single query:

```sql
select * from places
where location ilike '%' || :destination || '%'
  and id not in (:already_saved_ids)  -- don't show what they already saved
order by curation_score desc nulls last, id
limit 8;
```

`id` tiebreaker per hard rule (deterministic ordering).

## Placement

Above the base Discover grid, below any hero / greeting section. Structure:

```
[Hero / state-aware greeting]
[Personalized strip]  ← new, conditional
[Base Discover grid]  ← unchanged
```

Strip is horizontal-scroll on mobile, grid-like row on desktop. Match the mobile-first budget: no layout shift when it mounts, skeleton placeholder while the query runs.

## Fixes, in order

### 1. Signal detection service

New `src/features/discover/services/personalizationService.ts`:

```ts
export type PersonalizationSignal = {
  destination: string
  source: 'dated_lakad' | 'bucket_cluster'
  savedIds: string[]  // to exclude from strip
} | null

export async function detectSignal(): Promise<PersonalizationSignal>
```

Rules:
- Query `lakad` first (auth only — anons don't have lakads yet). If a dated future lakad exists, return its destination.
- Otherwise query `bucket_list` (RLS scopes to user or anon_id). Group in JS, return top location if ≥ 3 saves.
- Return `null` fast for cold-start visitors — the strip should not delay page interactivity.

### 2. Fetch the personalized places

New `getPersonalizedPlaces(signal)` in `discoverFeedService.ts` (or a sibling service). Location `ilike` match, exclude already-saved IDs, order by curation + id.

### 3. Strip component

New `src/features/discover/components/PersonalizedStrip.tsx`. Client component. Four states:
- **Loading** — skeleton row of 4 cards, ≤ 500ms then don't block interactivity
- **Error** — silent, don't render (don't break the base feed with an error toast)
- **Empty** — the location match returned nothing, don't render
- **Loaded** — header + horizontal row of `FeedPlaceCard`

### 4. Wire into DiscoverFeed

Render `<PersonalizedStrip />` above the existing grid in `DiscoverFeed.tsx`. Strip decides for itself whether to render.

### 5. Events

- `discover_personalized_shown` with `{destination, source, itemCount}` — fires once per mount if the strip actually renders
- `discover_personalized_click` with `{destination, placeId}` — fires on card tap

## Acceptance

- [ ] Logged-out visitor with no bucket saves → home page unchanged, no strip
- [ ] Logged-out visitor with 3+ El Nido saves → strip renders "More around El Nido"
- [ ] Logged-in user with a dated future Palawan lakad → strip renders "For your Palawan trip", takes priority over cluster signal
- [ ] Signal detection failure → strip silently doesn't render, base feed intact
- [ ] SSR of `/` byte-stable — strip is client-only, doesn't affect server markup
- [ ] `discover_personalized_shown` visible in PostHog once per real mount
- [ ] No layout shift when strip mounts on 4G / mid-range Android at 375px
- [ ] Typecheck + lint clean

## Report back

1. Cold-start rate — % of homepage loads where no signal exists. Sets expectation for how often the strip actually shows
2. Whether the bucket cluster threshold (≥ 3 saves in one location) is the right cutoff or if 2 is enough
3. If the strip and Task 10's suggestions surface duplicate copy — both may name the same destination, which is a UX consistency question rather than a bug
