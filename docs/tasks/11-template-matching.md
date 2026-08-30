# Task 11 — Template matching (overlap)

**Branch:** `feat/template-matching`
**Blocked by:** Task 06 (bucket list), Task 07 (dated conversion) — both shipped
**Related:** Tasks 09 + 10 — same funnel, opposite direction (this brings templates back into the bucket surface)

## Why

The build plan's Section 1.3 spells this out: *"3 of your saved places are in this 5-day Palawan lakad → Use this template."* It's the shortest possible path from "I've saved a few places" to a working, dated itinerary — the fastest way to convert a bucket into a `bucket_dated` event without asking the user to think about days, activities, or ordering.

Templates already exist (`src/features/planner/data/tripTemplates.ts`), and `/trip/new?template=<slug>` already accepts them. What's missing is the *matching* — showing the user which template best overlaps with their saves.

**Not a recommender system.** Do not build embeddings, do not add a vector column, do not reach for a scoring model. Overlap count is enough until real data proves otherwise.

## Scope

- Compute overlap between each template and the visitor's bucket list
- Surface the top match on `/bucket` above the date prompt when at least one bucket item overlaps
- Copy: *"3 of your saved places are in [Template Name]"* → **Use this template**
- Tap → `/trip/new?template=<slug>` (route already exists)
- All four async states (loading, error → don't render, no-signal → don't render, loaded)
- Instrument: `templates_matched_shown`, `template_matched_click`

## Explicitly not in scope

- A `templates` + `template_places` DB table — templates live in the TS file until we have thousands of them
- Multi-template ranking / carousel — one primary match, one alternate max
- Personalized ranking beyond overlap count (e.g., "similar to trips your barkada booked")
- Editing the template before applying — that's the trip builder's job
- Undo / bookmark templates — later, if usage data proves it needed
- Template matching inside the trip builder — the builder is bucket-only per Task 10; templates come *before* the builder, not inside it

## Two principles that shape the scope

1. **Overlap is the whole signal.** Don't weigh by anything else. Ranking is `count of matching places`, tiebreaker is `duration desc` (longer trips tend to include more of what a saver wants), then `slug asc` for determinism.
2. **One primary suggestion.** Showing three matched templates dilutes the CTA. Show one, with a subtle "See other templates" link that routes to `/templates`.

## Where this hooks in

`/bucket` is the natural home:

```
[Matching template]  ← new, conditional, above date prompt
[Date prompt]        ← Task 07
[Saved places grid]  ← Task 06
```

Placement above the date prompt is intentional. The date prompt is a manual path; the template is a one-tap shortcut. Users who see both should read the template first.

## Fixes, in order

### 1. Matching service

New `src/features/planner/services/templateMatchingService.ts`:

```ts
export interface TemplateMatch {
  template: TripTemplate
  overlapCount: number
  matchedPlaces: string[]  // place_name values from bucket that hit
}

export async function findTopTemplateMatch(): Promise<TemplateMatch | null>
```

Overlap rule — a bucket item counts as matching a template if **either**:

- The template's `destination` is a case-insensitive substring match against the item's `place_location` (or vice versa)
- The template's `highlights[]` include any string that case-insensitively matches the item's `place_name`

Both directions of `ilike` on destination catch cases where a saver stored "El Nido" but the template is "Palawan Island Paradise" (destination "Palawan"). Names are compared without punctuation trimming — good enough for MVP; can add a normaliser if hit rates surprise us.

Rank matches by `overlapCount desc`, then `duration desc`, then `slug asc`. Return the top match if `overlapCount >= 1`, else null.

### 2. Component

New `src/features/planner/components/MatchingTemplateCard.tsx`. Client component, four states:

- **Loading** — thin skeleton row, ≤ 500ms
- **Error** — silent, no render
- **No match** — no render
- **Match** — card with template image, name, day count, matched place chips, **Use this template** primary CTA

Copy pattern: *"3 of your saved places are in Palawan Island Paradise"*. If overlap is 1, singular *"1 of your saved places is in…"*.

### 3. Wire into `/bucket`

Insert `<MatchingTemplateCard />` above `<DatePromptCard />` in `BucketClient.tsx`. Mirror the same "only render when bucket has ≥1 item" gate.

### 4. Events

- `templates_matched_shown` with `{templateSlug, overlapCount, bucketSize}` — fires once per mount if a match renders
- `template_matched_click` with `{templateSlug, overlapCount}` — fires on CTA tap

Together these give a matched-CTR: `template_matched_click / templates_matched_shown`. That number decides whether template matching is worth expanding (more templates, better matching, in-flow injection).

## Acceptance

- [ ] Bucket with 3 El Nido saves → "3 of your saved places are in Palawan Island Paradise" card renders above the date prompt
- [ ] Bucket with 1 Boracay save → "1 of your saved places is in Boracay Beach Bliss" (or whichever template hits)
- [ ] Bucket with saves that don't match any template → no card renders, date prompt is the top surface
- [ ] Empty bucket → no card renders, empty state carries the page
- [ ] Tap **Use this template** → lands on `/trip/new?template=<slug>` with the template loaded
- [ ] `templates_matched_shown` fires once per real mount, not on re-renders
- [ ] Typecheck + lint clean

## Report back

1. Matched-CTR (`template_matched_click / templates_matched_shown`) — sets whether the surface is earning its space or wasting it
2. Distribution of `overlapCount` — if most matches are `overlapCount === 1`, the threshold should probably rise to 2
3. Whether users who tap actually complete `/trip/new?template=` (there's already a funnel step in the builder — if the drop-off is here, that's a builder problem, not a matching one)
