# Task 17 — Smart Build suggestion engine

**Branch:** `feat/smart-build-suggestions`
**Spec:** `docs/smart-build-spec.md`
**Depends on:** Task 14 (wizard "not sure" branch), Task 16 (`min_viable_days` + `travel_times`).
**Blocks:** Task 18 (draft generation consumes the picked suggestion).

## Why

The whole product shift. "I have ₱20k, 3 days, leaving from Manila, in November — where can I actually go?" Nobody answers that. Tara should.

## Scope

### Ranking

Plain SQL, no ML. In order:

1. **Hard filter:** `min_viable_days <= days_available`. Fails → not in the list.
2. **Travel time:** `travel_times->>origin` ≤ some fraction of total trip minutes.
3. **Budget band fit:** destination's `budget_low`/`mid`/`high` vs user's per-person-per-day.
4. **Bucket-list overlap:** count of saved places (via `bucket_list`) whose `destination_id` matches.
5. **Seasonality:** `best_months` includes their month.

Result: ranked shortlist with cost estimate (`days * chosen band`) and door-to-door travel time.

### Honest refusals

**Part of this task, not a follow-up.** When nothing fits, or when a saved bucket-list place belongs to a destination that fails the hard filter:

> "El Nido needs 4+ days — the transfer from Puerto Princesa eats most of two. With 3 days from Manila, Boracay or Bohol work. El Nido stays in your bucket list."

Also for budget: say what the number *can* cover, don't silently degrade a suggestion.

### Bucket-list integration

- Empty bucket list → rank from the questions alone.
- Non-empty → prioritise destinations containing saved places and name them in the result: *"You saved Sugba Lagoon — here's Siargao in 4 days."*
- Never required.

### Analytics

- `smart_build_submitted { days, budget, origin, month, bucketCount }`
- `smart_build_results_shown { resultCount, hasOverlap, refusedCount }`
- `smart_build_refusal_shown { reason: 'min_days' | 'budget' | 'no_match', destinationSlugs }`
- `smart_build_result_clicked { destinationSlug, rank, hadOverlap }`

## Steps

1. Ranking SQL (or Postgres function). Return destinations with score + cost estimate + travel minutes.
2. Server action that takes wizard inputs, runs ranking, returns `{ matches, refusals }`.
3. Results UI — ranked cards, overlap chips, honest-refusal block when present.
4. Wire into the Task 14 "not sure" branch of `/trip/new`.
5. Analytics.
6. Logged-out + logged-in verification. 375px verification. Typecheck + lint.

## Done when

A user coming through the Task 14 "not sure" branch with 3 days / ₱20k / Manila / November gets a ranked shortlist with real numbers, and gets an honest refusal line when a saved El-Nido place can't fit the trip.

## Not in scope

Opening the draft in the builder — that's Task 18.
