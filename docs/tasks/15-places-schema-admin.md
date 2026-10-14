# Task 15 — Places + destinations schema and `/admin/places`

**Branch:** `feat/places-schema-admin`
**Spec:** `docs/places-spec.md`
**Blocks:** Track B hire (B3) and Task 20 (public pages).

## Why

Content strategy pivoted from hand-written guides to curated place and destination data with mandatory provenance. The schema and admin are the hire-blocker — a VA can't fill 100 places without a form that prevents thin pages.

## Scope

### Migration

- `places`: add `slug` (unique), `destination_id` fk, `category`, `summary`, `description`, `entrance_fee`, `fee_notes`, `duration_minutes`, `getting_there`, `nearest_hub`, `best_time_of_day`, `best_months int[]`, `booking_required`, `booking_notes`, `part_of_tour`, `pairs_with uuid[]`, `not_same_day_as uuid[]`, `tips text[]`, `source_urls text[]`, `verified_at`, `verified_by`, `status` (`draft`|`published`|`needs_review`).
- `destinations`: new table per spec §2. Include the `min_viable_days` + `travel_times` columns from Task 16 as a single migration — no need to split.
- `partner_products`: additive migration — add `product_name`, `includes`, and nullable `destination_id` fk. Do not drop or recreate; existing columns stay.
- `profiles.role`: extend to accept `'editor'` alongside `'admin'`. RLS: editors can `select`/`insert`/`update` places + destinations + partner_products only, no other tables.

### Admin UI

- `/admin/places` — queue table: name, destination, completeness %, status, verified_at (red if >6 months). Filters: destination, status, incomplete, stale. Default sort: completeness ascending.
- `/admin/places/[id]` — form grouped as Basics · Practical · Getting there · Sequencing · Tips · Sources. Must-haves:
  - Completeness meter that names what's missing.
  - Tips as a repeater, minimum 3 enforced before publish.
  - Source URL per field group, not one global list.
  - "Mark verified" stamps `verified_at` + `verified_by`.
  - Cannot set `published` until the thin-page bar is met (3+ tips, fee info or explicit `fee_notes = 'free'`, `getting_there`).
  - `pairs_with` / `not_same_day_as` as searchable place pickers.
  - Partner products repeater (partner, product_name, product_type, price_from, includes, deeplink, verified).
- `/admin/review` — staleness queue: `verified_at` older than 6 months, oldest first.

### Access

- Role check server-side (RLS + route guard). Not UI-hidden.
- No rich text, no media library (URL field for images), no workflow/approvals, no audit log beyond `verified_by`, no analytics in admin.

## Steps

1. Migration: schema changes above. Apply locally, verify RLS.
2. Admin role extension + route guard.
3. `/admin/places` queue.
4. `/admin/places/[id]` form, grouped. Completeness meter.
5. Thin-page guard on publish.
6. Partner products repeater.
7. `/admin/review` staleness queue.
8. Smoke test: create one draft El Nido place by hand through the UI, publish it, re-verify it.

## Done when

A VA can fill a place to spec through `/admin/places/[id]` without SQL access, cannot publish a thin page, and `/admin/review` surfaces anything older than 6 months.

## Not in scope

Public-facing `/places/[slug]` and `/destinations/[slug]` — that's Task 20.
