# Task 07 — Bucket → dated lakad conversion

**Branch:** `feat/dated-conversion`
**Blocked by:** bucket_list migration applied · analytics library wired

This is the highest-leverage conversion in the product. A bucket list is a saving behaviour; a dated lakad is a buying behaviour. Everything downstream — booking recommendations, the T-minus lifecycle, affiliate revenue — depends on this transition happening.

**Do not ship this uninstrumented.** `bucket_dated` is the metric the whole funnel is judged on.

## Prerequisites

- [ ] `20260824010000_bucket_list_anonymous.sql` applied and anonymous saves verified working logged out
- [ ] Analytics library installed, `place_saved` firing correctly

## Scope

Replace the disabled "Coming soon" date prompt on `/bucket` with a working conversion flow.

### 1. Schema

```sql
alter table lakad
  add column if not exists start_date date,
  add column if not exists end_date   date,
  add column if not exists status     text default 'draft';
-- draft → dated → active → completed
```

Index on `(status, start_date)` — the lifecycle cron will query it later.

### 2. Date prompt

Persistent at the top of `/bucket`, above the saved-places grid. This is the primary action on the page, not a secondary affordance.

- Copy: *"Planning this trip? When are you going?"*
- Date range picker, mobile-friendly at 375px
- Submit → creates a lakad with `status = 'dated'`, seeded with the saved places
- Requires auth. Prompt at submit, not before — anonymous users fill the dates first, then sign in, and the pending selection survives the round trip.

**Do not add booking CTAs to this page.** Saving is not buying.

### 3. Anonymous path

An anonymous user must be able to complete the date selection. On submit:
1. Persist the pending date range locally
2. Prompt sign-in
3. On `SIGNED_IN`, `claimAnonBucket` runs (already built), then create the lakad from the pending selection
4. Clear pending state

Losing the date selection across the auth boundary defeats the whole point.

### 4. Post-conversion

Redirect to the new lakad. The state-aware homepage from Task 04 already handles `has-trip` — verify the countdown appears and `tripPhase` resolves correctly for a trip created today.

### 5. Analytics — required, not optional

```
bucket_dated {
  itemCount,        // places carried over
  daysUntilTrip,    // start_date − today
  wasAnonymous,     // did this cross an auth boundary
  durationDays
}

date_prompt_shown    { itemCount }
date_prompt_started  { }                    // picker opened
date_prompt_abandoned{ stage }              // opened, no submit
```

`shown` → `started` → `dated` gives a real funnel. Without `shown`, the conversion rate is uninterpretable. `wasAnonymous` tells you whether the auth boundary is where people drop.

## Acceptance

- [ ] Logged in with saved places: date range → lakad created with correct dates and places
- [ ] Logged out: dates entered, sign-in prompted, **selection survives**, lakad created after auth
- [ ] Empty bucket: prompt hidden or disabled with a sensible message
- [ ] End date before start date: rejected inline, no server round trip
- [ ] Trip starting today: `tripPhase` resolves, no off-by-one on countdown
- [ ] 375px: picker usable, no horizontal scroll
- [ ] All four analytics events fire with correct payloads
- [ ] Homepage `has-trip` variant renders the new lakad
- [ ] No booking CTAs anywhere on `/bucket`

## Watch out

- **Timezone.** Users are in PHT (UTC+8), the DB is in `us-east-1`. Store dates as `date`, not `timestamptz`. A trip starting "today" in Manila must not read as yesterday.
- **Hydration.** Any countdown rendered server-side will drift from the client. Compute on the client after mount, or pass a server timestamp — never `Date.now()` in render.
- **Determinism.** Seeded places carried into the lakad need a stable `.order('id')` tiebreaker.
