# Task 20 — `/places/[slug]` and `/destinations/[slug]`

**Branch:** `feat/places-destinations-pages`
**Spec:** `docs/places-spec.md` §3
**Depends on:** Task 15 (schema), Track B1 (El Nido populated so there's something to render).

## Why

The SEO layer. Target queries:
- `/destinations/[slug]`: "things to do in El Nido", "El Nido itinerary", "is El Nido worth it".
- `/places/[slug]`: "Sugba Lagoon entrance fee", "Kawasan Falls how to get there".

These compound slowly. Shipping thin pages drags down the whole domain.

## Scope

### `/destinations/[slug]`

Order: hero + summary · how to get there from Manila/Cebu · how many days (reads `typical_days` + `min_viable_days`) · budget bands · places grid grouped by `part_of_tour` · tips · matching templates · "Last verified <date>" trust block.

Public, server-rendered, indexable. No auth gate.

### `/places/[slug]`

Order: photo + summary · **fee, duration, booking — above the fold** · getting there · tips · pairs well with (resolves `pairs_with` uuids) · part of <tour> link · nearby · sources + verification date.

Public, server-rendered, indexable.

### Trust block (both pages)

> Last verified 11 October 2026 · Sources: [list]
> Fees and schedules change. Tell us if something's wrong.

### Thin-page guard

- `status = 'draft'` → 404 in production (or 200 with `noindex` on preview deployments).
- `status = 'published'` but missing 3+ tips or fee info or `getting_there` → treated as draft. Belt and braces; admin should already prevent this.
- Exclude drafts from sitemap and internal links (Task 21).

### Analytics

- `destination_page_view { slug, placeCount, hasOverlap }` (overlap = saved bucket places in this destination).
- `place_page_view { slug, destinationSlug, hasBooking }` where `hasBooking` reflects any active `partner_products` row.

## Steps

1. `/destinations/[slug]` — fetch destination + published places, group by `part_of_tour`, render.
2. `/places/[slug]` — fetch place + resolve `pairs_with` + `part_of_tour` siblings, render.
3. Trust block component shared across both.
4. Thin-page guard.
5. "Plan a trip here" CTA on destination pages routing through `/trip/new?destination=<slug>` (Task 19 behaviour).
6. OG images per page (reuse the pattern established in Task 13 for `/trip/[id]`).
7. Analytics.
8. 375px verification. Lighthouse pass — LCP target ≤2.5s on 4G.
9. Typecheck + lint.

## Done when

El Nido and its ~15 populated places render as public pages with trust blocks, published-only, grouped by `part_of_tour`, performant on mobile.

## Not in scope

Sitemap wiring (Task 21).
