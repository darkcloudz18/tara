# Task 16 — Destination matching data

**Branch:** `feat/destination-matching-data`
**Spec:** `docs/smart-build-spec.md`
**Depends on:** Task 15 (destinations table exists).
**Blocks:** Task 17 (suggestion engine needs these fields to rank on).

## Why

Smart Build ranks destinations by feasibility, travel time, budget, bucket-list overlap, and seasonality. Without `min_viable_days` and `travel_times` the engine has nothing honest to rank on.

## Scope

- Already covered by the Task 15 migration if bundled. If split, add:
  ```sql
  alter table destinations
    add column min_viable_days int,
    add column travel_times jsonb;
  ```
- Admin: both fields editable from `/admin/destinations/[id]`. `travel_times` as a key-value repeater (hub → minutes).
- Data: populate the four existing destinations from Track B2 (El Nido 4, Boracay 2, Bohol 2, Siargao 3) with real door-to-door minutes from Manila and Cebu. Include Baguio at 1 if Track B4 land trips start.

## Steps

1. Migration (if not bundled).
2. Admin fields.
3. Seed/populate the four from Track B2 values.
4. Verify in dev that queries filtering on `min_viable_days` and reading `travel_times->>'manila'` return expected rows.

## Done when

The four existing destinations have `min_viable_days` and `travel_times` set to real values, and Task 17 can `SELECT ... WHERE min_viable_days <= $days` against live data.

## Not in scope

The ranking SQL itself (Task 17).
