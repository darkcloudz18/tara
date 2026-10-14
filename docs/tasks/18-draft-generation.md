# Task 18 — Draft lakad generation from Smart Build pick

**Branch:** `feat/smart-build-draft`
**Spec:** `docs/smart-build-spec.md`
**Depends on:** Task 17 (ranked suggestions).

## Why

The draft turns a suggestion into something editable. A trip someone shaped themselves is one they're far more likely to actually take.

## Scope

- Picking a result creates a lakad in the **existing** `itineraries` structure. Builder itself does not change.
- Fill days from the destination's places, grouped by `part_of_tour`, respecting `not_same_day_as`.
- Every suggested item removable, days reorderable, empty slots invite additions.
- Running cost estimate updates as the user edits (sum of place `entrance_fee` + partner_products `price_from` for anything linked, plus a per-day lodging/food allowance from the chosen budget band).
- Saved bucket-list places that made the cut are marked as such in the builder.
- If the wizard captured exact dates, the lakad is created `dated` immediately (fires `bucket_dated` analogue — reuse the existing event with `source: 'smart_build'`). If only a month, stays `draft`.

### Analytics

- `smart_build_draft_created { lakadId, destinationSlug, isDated, placeCount, hadBucketOverlap }`
- Reuse `builder_bucket_suggestion_added` for bucket places added via this path.
- Running cost: no event needed — it's a UI utility, not a decision point.

## Steps

1. Server action: `createLakadFromSmartBuild({ destinationId, days, start_date?, budgetBand, originKey, savedPlaceIds })`. Writes `itineraries` + `itinerary_days` + `itinerary_activities`.
2. Day-filling logic — respect `part_of_tour` grouping and `not_same_day_as` constraints.
3. Running cost estimate component in the builder header. Reads from current itinerary activities + per-day band.
4. Mark bucket-origin activities with the existing `bucket_list_id` fk (Task 10 shipped this).
5. Redirect flow: result-pick → create → open `/trip/[id]` in edit mode.
6. Analytics.
7. Verify at 375px, logged-out and logged-in. Typecheck + lint.

## Done when

Picking an El Nido 4-day suggestion with 2 saved bucket places opens a draft lakad with those places pre-added, days grouped by tour, and a running cost estimate visible at the top. User can delete, reorder, and add without the draft fighting back.

## Not in scope

Booking CTAs inside the draft — only appear once the lakad has dates, per the existing architecture rules (Phase 4 in `docs/build-plan.md`).
