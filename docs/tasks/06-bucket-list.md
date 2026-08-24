# Task 06 — Bucket list (Phase 2a)

**Status:** planned work from `docs/build-plan.md` Phase 2 (Step 6 in the build order).
**Scope:** anonymous-first bucket list. A visitor saves places from Discover without signing up, the site remembers via a localStorage UUID, the saved places show on a dedicated `/bucket` page with a date prompt at the top, and once the visitor signs up their anonymous items merge into their account.

**Explicitly not** in scope:

- **The bucket → dated lakad conversion.** The date prompt at the top of `/bucket` and the flow that turns saved places into a new dated itinerary live in **Task 07** (`feat/bucket-to-dated`). This task ships the date prompt only as a **disabled placeholder**, so the visual position is claimed and users see it as coming soon. The itineraries schema change (`nullable start_date`, `status` column) also moves to Task 07.
- **Template matching** ("3 of your saved places are in this Palawan lakad"). Its own follow-up task. Query is trivial; the recommendation UI is not.
- **Save affordance on search and template views.** Start with Discover. Extend after the pattern's proven.
- **Analytics wiring** (`place_saved`, `bucket_dated`). Depends on an analytics library we haven't picked. Instrument once the primitive lands.
- **Booking CTAs on the bucket page.** Build-plan is explicit: "No booking CTAs on this screen. Saving is not buying."
- **Trip lifecycle cron** (T-60 emails, etc). Step 10.

## Observations

Ground truth as of `main @ aabcfe5`.

**Table, service, and hook scaffolding already exist.** `src/features/planner/services/bucketListService.ts` implements `getBucketList / addToBucketList / removeFromBucketList / markAsVisited / getBucketListByLocation` against a Supabase table called `bucket_list` (not the plan's `bucket_items` — same idea, different name; stick with `bucket_list` since it's already the source of truth). `src/features/planner/hooks/useBucketList.ts` wraps it.

Every service method calls `getUserSafe` and requires a real `user_id`, so **the current bucket list only works logged in**. The plan-critical "save without signup" flow doesn't exist.

**Existing schema (inferred from `BucketListItem`):**

```
bucket_list (
  id,
  user_id,           -- NOT NULL today
  place_id,          -- nullable, references places
  external_place_id, -- for non-DB places (Google, partner)
  place_name, place_location, place_category, place_image_url,
  place_estimated_cost,
  notes,
  is_visited, visited_at,
  created_at, updated_at
)
```

Migration needed:
- `alter table bucket_list alter column user_id drop not null`
- `alter table bucket_list add column anon_id text`
- `create index on bucket_list (anon_id)`
- Update RLS: allow anonymous select and insert where `anon_id = current_setting('request.header.x-anon-id')` (or similar) — see fix #2 for the exact shape.

**No `/bucket` route in `src/app/`.** The hook and service have no UI mount. First user-visible surface for this feature is fix #3.

**No save affordance on `PlaceCard`.** The card has "Add to trip" (opens the trip picker modal), no "Save to bucket." Discover's dominant call to action today assumes the visitor already has a lakad — the plan flips this: save first, decide dates second.

**No `anon_id` lib.** Nothing writes to localStorage under that key. Fix #1 introduces it.

**Sign-up merge doesn't exist.** No code translates `anon_id → user_id` on auth. Fix #6 adds it.

## Data model changes (one migration file)

Create `supabase/migrations/<timestamp>_bucket_list_anonymous.sql`:

```sql
-- Allow anonymous saves
alter table bucket_list alter column user_id drop not null;
alter table bucket_list add column if not exists anon_id text;
create index if not exists bucket_list_anon_id_idx on bucket_list (anon_id);

-- RLS: existing owner policies remain. Add anon read/write scoped to
-- a per-visitor anon_id passed via request header.
-- (Supabase reads custom headers into request.headers.<name>.)
create policy "anon can insert own bucket item"
  on bucket_list for insert
  with check (
    user_id is null
    and anon_id is not null
    and anon_id = current_setting('request.headers', true)::json->>'x-anon-id'
  );

create policy "anon can select own bucket items"
  on bucket_list for select
  using (
    user_id is null
    and anon_id is not null
    and anon_id = current_setting('request.headers', true)::json->>'x-anon-id'
  );

create policy "anon can delete own bucket items"
  on bucket_list for delete
  using (
    user_id is null
    and anon_id is not null
    and anon_id = current_setting('request.headers', true)::json->>'x-anon-id'
  );
```

**Verify the header-based RLS pattern works** before committing to it. Alternative if it doesn't: sign the anon_id server-side into a short-lived JWT the browser sends as `Authorization`, and read `auth.jwt() ->> 'anon_id'` in the policy. More moving parts; try headers first.

The `itineraries` schema change (nullable dates, `status` column) belongs to Task 07 and doesn't ship here.

## Fixes, in order

### 1. `anon_id` lib

`src/lib/anonId.ts`:

```ts
const KEY = 'tara-anon-id'

export function getAnonId(): string {
  if (typeof window === 'undefined') return ''
  const existing = localStorage.getItem(KEY)
  if (existing) return existing
  const fresh = crypto.randomUUID()
  localStorage.setItem(KEY, fresh)
  return fresh
}
```

Never touch anon_id server-side — it's browser state.

`src/lib/supabase.ts`: on client, inject `x-anon-id` header into every Supabase call via the singleton's `global.headers`. Consider `createClient(url, key, { global: { headers: { 'x-anon-id': getAnonId() } } })` at singleton init — the value's stable for the tab's lifetime.

**Care:** don't compute `getAnonId()` at module scope on the server. The singleton init happens in `getSupabase()` which is called lazily; make sure the header injection only happens in the browser branch.

### 2. Migration + RLS

Write the SQL above. Run against your Supabase dev project first. Test:

- Insert without user_id but with anon_id header → succeeds
- Select where anon_id header matches → returns rows
- Select where anon_id header doesn't match → returns empty
- Insert with user_id → owner policy applies (unchanged)
- Anonymous with no header → returns empty (policy denies)

### 3. Service and hook updates

`bucketListService.ts`:
- `addToBucketList`: if `getUserSafe()` returns null, insert with `anon_id = getAnonId()` and null `user_id`
- `getBucketList`: no branch needed — RLS handles both cases. Query is the same.
- `removeFromBucketList`: same — RLS filters
- Keep `markAsVisited` auth-only (visited state is a low-priority feature; anonymous users can revisit)

`useBucketList.ts`: no changes needed if the service is transparent.

### 4. Save affordance on `PlaceCard`

Add a heart or bookmark icon to `src/features/discover/components/PlaceCard.tsx` — top-right of the image or in the action row, tap target ≥44px. On tap:

- Call `addToBucketList(place)`.
- On the visitor's first anonymous save ever (check `localStorage.getItem('tara-first-save-toast-shown')`), show a one-time toast: *"Saved. Sign in anytime to keep your list."* Mark shown; never repeat.
- Visual state: filled/unfilled toggle. Optimistic update; revert on error.

Do **not** open the "Add to trip" modal from this button. That's a separate CTA with different semantics (add to a dated itinerary). Both can live on the card.

### 5. `/bucket` view

New route at `src/app/bucket/page.tsx` (server component) + `BucketClient.tsx` (client). Order top to bottom, per the build plan:

1. **Date prompt — placeholder for now.** Sticky at top: "Planning this trip? When are you going?" with a **disabled** date range picker and a small "Coming soon" pill. The full conversion flow lands in Task 07; keep the visual position claimed so we don't have to reshuffle the layout later. Do not wire submit — the disabled state is load-bearing.
2. **Matching templates:** placeholder `<section>` element with a `TODO: template matching`. Don't build the recommender in this task.
3. **Saved places grid.** Reuse the responsive grid pattern from Task 01 fix #5 (`grid-cols-1 md:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-4`). Each card shows the place image, name, location, and a remove-from-bucket button. Tap on the card body links to the place's detail page (if we have one) or nothing.

No booking CTA anywhere on this page. If you see teal creeping in beyond the (still-disabled) date-prompt submit button, question it.

Wrap in `<AppShell user={user}>`.

### 6. Merge on signup

When a user signs up (or logs in with an existing account for the first time in this browser session), take any `anon_id` in localStorage and:

```sql
update bucket_list set user_id = $userId, anon_id = null where anon_id = $anonId
```

Do this via an authenticated RPC or the standard client — the row is now owned by the user, so it clears the anon-header policy and falls under the owner policy.

Hook point: `src/lib/supabase.ts` `onAuthStateChange` handler, or a dedicated `claimAnonBucket()` called from the register/login flows on `SIGNED_IN` events. Prefer the dedicated helper — auth listener adds cross-cutting behavior.

After merge, clear `tara-anon-id` from localStorage. Future saves route via `user_id`.

## Acceptance

- [ ] Fresh incognito tab, `localStorage` clean: opening `/` sets `tara-anon-id` to a UUID; the value persists across reloads in the same tab
- [ ] Anonymous save from Discover appears in `/bucket` on the same tab, disappears on remove
- [ ] Anonymous save in one incognito window is **not** visible in a different browser (RLS scoped correctly)
- [ ] First anonymous save shows the "Saved. Sign in anytime to keep your list." toast; subsequent saves don't
- [ ] `/bucket` route renders logged-out with the disabled date prompt, empty state ("No places saved yet"), and the grid layout — no booking CTAs anywhere
- [ ] `/bucket` route renders logged-in with the same shape and the user's items
- [ ] Signing up while an anon list exists moves those items to the new user's account; the anon_id is cleared from localStorage
- [ ] Date prompt is visibly disabled with a "Coming soon" affordance; no submit handler is wired
- [ ] `/bucket` uses `AppShell` (persistent bottom nav on mobile)
- [ ] Typecheck clean
- [ ] SSR of `/` stays byte-stable — the anon_id write happens client-side only

## Report back

1. Whether the header-based RLS worked or we had to fall back to the JWT approach — sets the pattern Task 07 will reuse when it inserts dated `itineraries`
2. Whether the migration was applied cleanly on prod or is only on dev (list environments)
3. Any surfaces that ask for the "Save" affordance and should get it in a small follow-up (search results page, template preview modal, place detail pages)
