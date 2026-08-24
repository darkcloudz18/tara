# Task 07 — Bucket → dated lakad conversion

**Status:** split off from Task 06 during scoping. Depends on Task 06 shipping first (anon_id, `/bucket` view, save flow all live).
**Scope:** the date prompt on `/bucket` becomes real. The visitor picks a date range, we create a new dated lakad, seed day-1 with their saved places, and redirect them into edit. Also lands the itineraries-side schema change to distinguish drafts from dated lakad per the build plan's data model.

This is the **key conversion** per the build plan. Every downstream monetisation surface — pre-departure checklist, T-minus lifecycle emails, day-view booking CTAs — depends on a lakad having a real start_date. Without this flow, saving to bucket never becomes booking.

**Explicitly not** in scope:

- **Template matching** on `/bucket`. Task 06 already stubbed the section; the recommender is its own follow-up.
- **Trip lifecycle cron** (T-60 email, etc.). Step 10 in the build plan. This task creates the dated lakad; the cron reads it later.
- **`active` and `completed` state transitions.** The `status` column supports them, but automatic transitions (starts today → active; end + 1d → completed) belong with the cron.
- **Editing dates after creation.** Existing edit flow on `/trip/{id}/edit` handles start/end date updates. This task's date prompt is one-shot.

## Observations

Ground truth once Task 06 has landed (**do not start this task before then**).

**The disabled date prompt on `/bucket` is already in the DOM,** just not wired. Task 06 leaves it in a "coming soon" state so the layout doesn't shift when this task turns it on. Look at `BucketClient.tsx` — the placeholder is where the real picker replaces.

**Itineraries schema currently forbids draft lakad.** `src/types/database.ts` declares `start_date: string` (non-null) and `end_date: string` (non-null). Every existing row has real dates. The plan differentiates:

- **draft** — no dates, exists as a placeholder someone might one day fill in
- **dated** — real start_date, real end_date, ready for lifecycle jobs
- **active** — the trip is currently underway
- **completed** — after end_date

A `status text default 'draft'` column with a check constraint enforces the four values.

**Seeding day-1 activities from bucket items** is a new pattern. There's no existing "create a lakad and populate its first day" helper. `useItineraries.createItinerary` calls `itineraryService.create` then `dayService.bulkCreate` for the day rows; it does not touch `itinerary_activities`. This task decides what "seed with bucket items" means in terms of activities, and sets the precedent that a future template-matching task will reuse when populating a lakad from a template.

**Existing `itinerary_activities` shape** — check `src/types/database.ts` before designing the seed. Whatever fields are required (title, place ref, day_id, position within day, etc.) constrain how bucket items map onto activities.

## Data model change

Create `supabase/migrations/<timestamp>_itineraries_draft_status.sql`:

```sql
-- Allow draft lakad without dates
alter table itineraries alter column start_date drop not null;
alter table itineraries alter column end_date drop not null;

-- Formalise the state machine
alter table itineraries add column if not exists status text default 'draft'
  check (status in ('draft', 'dated', 'active', 'completed'));

-- Backfill: everything with dates today is 'dated'
update itineraries set status = 'dated' where start_date is not null and status = 'draft';
```

**Backfill first, then add the constraint** if you want to be paranoid about existing bad data. In one migration is fine for a small table.

Update the TypeScript type in `src/types/database.ts` to match — `start_date: string | null`, `end_date: string | null`, add `status`. Grep for every consumer of `.start_date` and `.end_date` (there are several in edit UI and countdown code) — they need null-safe handling or an early-return path for drafts. The countdown helper in `src/lib/countdown.ts` should already be shape-safe (fix #3 of Task 04 flagged this), but the callers assume a non-null value.

## Fixes, in order

### 1. Migration + type update

Ship the SQL above, regenerate types if you use `supabase gen types`, or hand-edit `database.ts`. Grep for `start_date` and `end_date`:

- `HeroSection.tsx` — countdown consumers, already inside a `has-trip` guard
- `Sidebar.tsx` — active-trip widget, formats the date
- `useCountdown` callers in the has-trip hero
- `src/app/trip/[id]/*` — edit UI

Each site gets either a null guard or an early return when the trip is a draft. This is the mechanical part.

### 2. Real date-range picker on `/bucket`

Replace the disabled placeholder from Task 06. Small, focused picker component — dates only, no time. Pick from `date-fns` for formatting since it's already in the codebase. Validate: end ≥ start, both within a reasonable window (today onwards, at most 30 days out, matching the current wizard cap in `useItineraries.createItinerary`).

Copy per the plan: *"Planning this trip? When are you going?"*

Submit is enabled only when both dates are valid.

### 3. Create-and-seed flow

New helper `createDatedLakadFromBucket({ startDate, endDate, bucketItems }): Promise<{ itineraryId: string }>`:

1. Compute day count from `differenceInDays(endDate, startDate) + 1`.
2. Create the itinerary with `status = 'dated'`. Title default: derive from the first bucket item's destination, e.g. *"Palawan trip"*. User will rename in edit.
3. Bulk-create day rows via `dayService.bulkCreate` (existing pattern from `useItineraries.createItinerary`).
4. **Seed day 1 with the bucket items** as `itinerary_activities`. For each bucket item, one activity row on day 1 with:
   - `title` from bucket item's `place_name`
   - `place_id` if present, else `external_place_id`
   - `position` sequential (0, 1, 2, …)
   - Sensible defaults for other required fields (`start_time` null, `notes` from bucket's `notes` if set)
5. **Do not delete the bucket items.** The user may still want the bucket as a "planning list" for future trips. Instead, mark the items as `is_visited = false, itinerary_id = <new id>` if we want the link, or leave them untouched. Recommend leaving them for now — the coupling introduces edit-time confusion (does removing from bucket also remove from lakad?). Report back on this decision.
6. Return the new itinerary id.

Uses the same anon_id pattern from Task 06. Anonymous users creating a dated lakad from their bucket: the new `itineraries` row inherits `anon_id` on insert (requires the same RLS-header pattern applied to `itineraries` too — flag if this migration wasn't already covered).

### 4. Wire the picker's submit

On submit:

- Show a brief loading state ("Creating your lakad…")
- Call `createDatedLakadFromBucket(...)`
- On success: `router.push(`/trip/${itineraryId}/edit`)`
- On error: show the four-states error pattern, retry available

Do not `await` inside a form's default submit — use `onSubmit={(e) => { e.preventDefault(); handleSubmit() }}` to keep the current-page stable if the request hangs (revalidate cache stays warm).

### 5. Update the has-trip homepage hero for drafts

Task 04's `homepageState === 'has-trip'` branch reads the first trip's `start_date` and formats a countdown. Now that drafts exist, the hero has three possibilities for a logged-in user:

- No trips → `no-trips` state (unchanged)
- Has only drafts (start_date null) → new **`has-draft`** state, leads with "Finish planning your lakad" and links to `/trip/{id}/edit` — no countdown, no destination
- Has at least one dated lakad → `has-trip` (unchanged, uses countdown)

Extend the state derivation and the hero variants. Small change, but this is where the schema shift becomes user-visible on the homepage.

## Acceptance

- [ ] Migration applied; every existing itinerary has `status = 'dated'`; new rows default to `'draft'`
- [ ] Type update propagates — `start_date` and `end_date` are `string | null` on the `Itinerary` type, `status` is present
- [ ] Every existing consumer of `.start_date` / `.end_date` still typechecks and either guards on null or narrows via `status`
- [ ] `/bucket` date prompt: submit is disabled until valid start ≤ end; both dates within [today, today + 30d]
- [ ] Submitting the date prompt with N bucket items creates a new itinerary with `status = 'dated'`, N activities on day 1 in order, and redirects to `/trip/{id}/edit`
- [ ] Anonymous user: the newly created itinerary is owned by their anon_id (RLS lets them read it back); on signup, both the itinerary and any remaining bucket items merge to their user_id
- [ ] Homepage `has-draft` state renders for a user with only draft lakad and reads "Finish planning your lakad"
- [ ] Homepage `has-trip` state still renders with countdown for users with dated lakad
- [ ] Typecheck clean; SSR of `/` still byte-stable
- [ ] No hydration warnings

## Report back

1. Whether bucket items are left untouched or linked to the created itinerary — set the precedent for the "does removing from bucket remove from lakad" question a future edit-flow change may raise
2. Whether the anon-id RLS pattern also covers `itineraries` (Task 06 established it for `bucket_list`; if `itineraries` needs a parallel policy, note whether that migration shipped here or was already in place)
3. Any consumer of `.start_date` / `.end_date` that couldn't be null-safe without a bigger refactor — those become the follow-up list for the draft state to feel complete
