# Task 10 — Itinerary builder suggests bucket list first

**Branch:** `feat/itinerary-suggests-bucket`
**Blocked by:** Task 07 (dated conversion) — the itinerary builder is the surface this task modifies
**Related:** Task 09 (Discover personalization) is the sister surface — same *bucket → lakad* funnel, opposite direction

## Why

The funnel the whole product is built on:

```
place_saved  →  bucket_dated  →  booking_cta_clicked
```

When someone decides to actually build the itinerary, the single strongest signal we have about what they want to do on that trip is *the places they've already saved*. Making them re-discover those places inside the builder is a UX failure and a conversion leak.

The rule: **when a lakad is being built, saved places come first.** Templates and generic Discover picks fill in around them.

## Scope

- Inside the itinerary builder / day view, surface a "From your bucket list" section as the first source of suggestions
- Show items filtered to the lakad's destination when possible, but don't hide items that don't match (a saved place is still an intent signal even if it's the wrong city)
- One-tap add-to-day from the suggestion into the itinerary
- Instrument: `builder_bucket_suggestion_shown`, `builder_bucket_suggestion_added`

## Explicitly not in scope

- Auto-generating a complete itinerary from the bucket list (that's a much bigger feature — day allocation, travel-time constraints, opening hours)
- Booking CTAs inside the builder — those belong on the dated lakad surface, not during the "still planning" state
- Template matching (Task 08b in build-plan numbering) — separate surface, separate task
- Reordering / trip-optimization / route-planning
- Multi-user collaborative editing of suggestions

## Two principles that shape the scope

1. **Bucket-first, not bucket-only.** Saved places are the first suggestion source. Below them: template picks that match the destination, then generic Discover. The builder is not a bucket-list-only surface.
2. **Empty bucket is not an empty builder.** Users with no bucket saves still get a working builder with template + Discover suggestions. The bucket section just doesn't render.

## Where this hooks in

Task 07 defines the dated-lakad creation flow: from `/bucket`, user picks dates → lakad is created seeded with saved places → they land in the builder. This task governs what the builder shows *after* landing, not the seeding itself.

Two possible surfaces to hook into, depending on how Task 07 lands:

- `/trip/new` — if the builder is a fresh page for the newly-dated lakad
- `/trip/[id]/edit` — if editing the newly-created lakad is the entry point

Task 07 will settle this; Task 10 targets whichever surface is the actual "building" experience.

## Fixes, in order

### 1. Suggestions service

New `src/features/planner/services/suggestionService.ts` or extend the existing planner service. One function:

```ts
export async function getLakadSuggestions(lakadId: string): Promise<{
  fromBucket: BucketListItem[]
  fromTemplates: Place[]
  fromDiscover: Place[]
}>
```

Rules:
- `fromBucket` — pull `bucket_list` where owner matches (user_id or anon_id via RLS). Sort: destination-matching items first, then the rest. Exclude items already added to this lakad.
- `fromTemplates` — templates whose location overlaps the lakad's destination
- `fromDiscover` — generic destination-matched places, excluding items already saved or already in the lakad

### 2. Builder UI section

New component `BucketSuggestions` in `src/features/planner/components/`. Renders as the first collapsible section in the "Add to day" sheet / sidebar:

- Section header: *"From your bucket list"* with a subtle count badge
- Card list: same visual pattern as `FeedPlaceCard` but with an inline "Add to day" primary action
- Optional filter chip: *"Only show places in [destination]"* — on by default, tappable to reveal the rest
- Four states — loading, error (retry), empty (don't render section header at all), loaded

### 3. Add-to-day flow

- Tap "Add" → append the place to the currently-selected day
- Optimistic update in the UI, real write via existing itinerary service
- Once added, the item disappears from the suggestion list (already exists in the lakad)
- No auto-removal from bucket list — a place stays saved even after it's on the itinerary. The bucket list is a wishlist, not a checklist.

### 4. Empty-state coordination

Three tiers of empty:

- **No bucket items at all** → don't render the "From your bucket list" section header. Builder falls through to templates + Discover.
- **Bucket items exist but none match destination** → render the section, show the off-destination items with a small note: *"Not in [destination], but you've saved these"*
- **Bucket items exist, all already added to lakad** → don't render section (nothing left to suggest)

### 5. Events

- `builder_bucket_suggestion_shown` with `{lakadId, destination, matchingCount, totalBucketCount}` — fires once per builder mount if the section renders
- `builder_bucket_suggestion_added` with `{lakadId, placeId, wasDestinationMatch}` — fires on tap

`wasDestinationMatch: false` events tell us how often the off-destination affordance actually gets used, which decides whether to keep it.

## Acceptance

- [ ] Fresh dated lakad with 5 bucket saves in the same destination → builder shows all 5 in "From your bucket list"
- [ ] Dated lakad in destination A, bucket has 3 items in destination B → section renders with the off-destination note
- [ ] User with no bucket saves → builder works normally, section header does not render
- [ ] Adding a suggestion → it disappears from the list, appears on the selected day
- [ ] Bucket item is not deleted after being added to lakad (still visible on `/bucket`)
- [ ] `builder_bucket_suggestion_shown` fires once per real mount, not on re-renders
- [ ] Works at 375px, tap targets ≥ 44px
- [ ] Typecheck + lint clean

## Report back

1. Rate of `builder_bucket_suggestion_added` vs `builder_bucket_suggestion_shown` — the "was this suggestion useful" ratio
2. Distribution of `matchingCount` vs `totalBucketCount` — how often the destination filter actually narrows things
3. Whether the off-destination affordance gets any traction — if `wasDestinationMatch: false` never fires, drop it
