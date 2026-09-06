# Tara Let's Go — Build Plan v2

**Architecture + UX, organised by funnel stage**
Supersedes v1. Updated for the bucket-list → dated-lakad model.

---

## The funnel this is built around

```
Discover        SEO traffic, anonymous, indexable
   ↓
Bucket list     Low intent. Capture, don't monetise.
   ↓
DATED LAKAD     ← the critical conversion. Someday becomes September 12.
   ↓
Build           High intent. Itinerary takes shape.
   ↓
Book            Revenue. Timed to the trip date.
   ↓
Share           Barkada books too. Free multiplier.
```

**Two rules that follow from this shape:**

1. **Public never waits on private.** Discover, templates, and shared lakad pages are anonymous, server-rendered, indexable. Auth-dependent UI layers on after and never blocks.
2. **Monetise intent, not interest.** No booking CTAs on bucket list. Booking pressure starts only once dates exist.

---

# PART 1 — ARCHITECTURE

## 1.1 Data model

```sql
-- Anonymous-capable saving
-- Shipped as `bucket_list` (not `bucket_items`); schema in
-- supabase/migrations/20251221010000_create_bucket_list.sql, anonymous
-- support in 20260824010000_bucket_list_anonymous.sql. Actual columns:
-- place_id | external_place_id (for non-Tara sources), place_name,
-- place_location, place_category, place_image_url, place_estimated_cost,
-- notes, is_visited, visited_at, referred_by_creator_id,
-- referred_from_video_id. No `source` column — the fk pair distinguishes.
create table bucket_list (
  id          uuid primary key default gen_random_uuid(),
  user_id     uuid references auth.users(id),  -- nullable until claimed
  anon_id     text,                             -- localStorage UUID
  place_id    uuid references places(id),
  external_place_id text,
  -- ...denormalized place fields for cross-source support...
  created_at  timestamptz default now()
);
create index on bucket_list (user_id);
create index on bucket_list (anon_id);

-- Dates are the state machine
alter table lakad
  add column start_date  date,
  add column end_date    date,
  add column status      text default 'draft';
  -- draft → dated → active → completed

-- Affiliate inventory (from the architecture pass)
create table partner_products (
  id            uuid primary key default gen_random_uuid(),
  place_id      uuid references places(id),
  partner       text not null,        -- 'klook' | 'agoda' | '12go' | 'airalo'
  product_type  text not null,        -- 'activity' | 'stay' | 'transfer' | 'addon'
  deeplink      text not null,
  price_from    numeric,
  currency      text default 'PHP',
  priority      int default 0,
  active        boolean default true,
  verified_at   timestamptz
);

-- Attribution
create table booking_clicks (
  id          uuid primary key default gen_random_uuid(),
  product_id  uuid references partner_products(id),
  lakad_id    uuid references lakad(id),
  surface     text,                   -- 'template' | 'day_view' | 'shared' | 'checklist'
  viewer_role text,                   -- 'owner' | 'guest'  ← barkada attribution
  user_id     uuid,
  anon_id     text,
  created_at  timestamptz default now()
);
```

### Why `anon_id` matters

Requiring signup to save kills top-of-funnel capture. Generate a UUID in localStorage on first visit, write bucket items against it, and merge into `user_id` on signup. One `update ... where anon_id = $1` at claim time.

RLS: allow anonymous insert/select scoped to a matching `anon_id`. Do not expose cross-anon reads.

## 1.2 The date conversion — instrument it as a first-class event

This is the most important transition in the product. Track it explicitly:

```
bucket_dated  { itemCount, daysUntilTrip, source }
```

If this number is low, nothing downstream matters. It's the metric to optimise before optimising booking conversion.

## 1.3 Template matching (bucket list → recommendation)

**Shipped** as Task 11 with a small twist. The SQL sketch below assumes
`templates` and `template_places` DB tables; we don't have those —
templates live in `src/features/planner/data/tripTemplates.ts` as a
static TS constant. So the overlap runs in JS, not SQL:

- Match template.destination against bucket_list.place_location
  (case-insensitive substring, either direction)
- Match template.highlights[] against bucket_list.place_name (same rule)
- Rank by overlap count, tiebreak duration desc, then slug asc

If templates ever move to Supabase, the SQL below is the target shape.

```sql
select t.id, t.title, count(*) as overlap
from templates t
join template_places tp on tp.template_id = t.id
where tp.place_id in (select place_id from bucket_list where user_id = $1)
group by t.id, t.title
order by overlap desc
limit 3;
```

Do not build embeddings, do not add a vector column, do not reach for a
recommendation service. Revisit only if overlap scoring visibly fails at
real volume.

## 1.4 Trip lifecycle jobs — this is the retention engine

A single daily cron reading `lakad` where `status = 'dated'`:

| Trigger | Surface | Products |
|---|---|---|
| T-60 | email + in-app | Accommodation (Agoda) — books earliest, largest basket |
| T-30 | email + in-app | Activities (Klook) |
| T-14 | email + in-app | Transfers, ferries (12Go) |
| T-7 | pre-departure checklist | eSIM, insurance |
| T+3 | email | "How was it?" → review → next bucket list |

Four monetisation touchpoints and a re-entry loop, from one trip. This is what makes low trip frequency survivable — you are not waiting eight months for a return visit, you are scheduling five.

Implementation: Supabase scheduled function or Vercel cron. One job, one query, one send. Do not build a notification service.

## 1.5 Shared lakad pages

Inherit the Discover rule exactly:

- Public route, **server-rendered**, no auth gate, indexable
- Owner-only controls hydrate client-side after
- Every `<BookableSlot>` passes `viewer_role: 'guest'` when the viewer is not the owner
- OG image generated per lakad — this is the share surface, it must look good in Messenger

Messenger is the dominant sharing channel in the Philippines. Test the OG card there specifically.

## 1.6 Redirect service (unchanged, still correct)

```
/go/[productId]?lakad=<id>&surface=<s>&role=<owner|guest>
```

Edge function: log click → resolve current deeplink → append affiliate + sub-ID → 302.

Never put raw partner URLs in HTML. Nightly cron HEAD-checks every active deeplink, stamps `verified_at`, deactivates on repeated failure. Dead links are worse than no links.

## 1.6b Region — Singapore (shipped)

**Done** Aug 30. Supabase moved from `us-east-1` to `ap-southeast-1` via
fresh project + schema replay + place seed copy. Vercel functions pinned
to `sin1` via `vercel.json`. Migration ran with only seed data, so no
real user data was moved.

Old `us-east-1` project (`cpvsxxwqpmbbdckqvbtm`) kept as rollback
insurance — fully orphaned (all Vercel env vars swapped, CLI link
cleared), no code paths point at it, no cost on free tier. Delete
whenever.

Edge caching layered on top — see the Task 13 entry below for `/`,
`/trip/[id]`, and OG image ISR windows.

## 1.7 Still not building

No microservices. No queue. No vector DB. No custom admin. No separate booking service. Solo founder — every service is a 2am page.

---

# PART 2 — UI/UX

## Phase 0 — Live defects (shipped)

All three shipped. Kept as record:

- **PWA prompt** — gated behind second visit or one lakad created; never on error routes
- **Four states everywhere** — loading skeleton, error with cause + Try again, empty with invitation, loaded
- **Discover grid** — 1 / 2 / 3 / 4 responsive with `max-w-7xl` container

## Phase 1 — IA and copy

**Remove the duplicate search.** Keep the contextual one beside the filter pills; drop the sidebar item.

**CTA hierarchy for logged-out visitors:**
1. Use a Template — primary
2. Create Your Lakad — secondary
3. Sign In — tertiary text link, not a solid button

Browsing, saving, and building all work logged out. Auth prompt only at save/share.

**Define lakad on first use:**
> Build your **lakad** — a day-by-day Philippine itinerary you can share with your barkada.

**Replace J/M/A/K placeholder avatars** with real lakad cover thumbnails, or drop them. A bare number beats fake faces. Fix the "500+ users" vs "500+ lakad" inconsistency everywhere.

## Phase 1.5 — Homepage clarity

### Rejected: a three-button landing page

Considered and rejected: a door page offering only *Make your lakad / Browse your lakad / Account profile*.

Reasons, for the record so this doesn't get revisited:

- For a first-time visitor, two of three options are dead ends — no lakad, no account
- A menu of three is still a decision. Showing real destinations requires none
- **No indexable content.** SEO is the primary acquisition channel; a content-less homepage forfeits it
- Contradicts anonymous-first — two of three options require auth

The underlying instinct is right: the homepage is cluttered and nothing dominates. The fix is hierarchy, not a gate.

### Instead: one unmistakable primary action

Currently competing: Create Your Lakad, Use a Template, Sign In, sidebar Search, section Search.

Resolve to:
1. **Use a template** — visually dominant. One clear primary.
2. **Create your lakad** — secondary, quieter styling.
3. Everything else — navigation weight, not CTA weight.

Remove the duplicate search. Demote Sign In to a text link.

### Those three options become navigation

Create / My lakad / Profile is a good tab bar, not a good front door. Persistent bottom tabs on mobile: **Discover · Create · My lakad · Profile**. Always one tap, never blocking content.

### State-aware homepage

Same route, content varies by user state. This is the part of the three-option idea that genuinely works.

| State | Homepage leads with |
|---|---|
| New / anonymous | Destinations. Real content, indexable, zero decisions. |
| Returning, no dated lakad | Their bucket list + the date prompt |
| Returning, dated lakad | **Their trip.** Countdown, what to book next. |

A user with Palawan 40 days out should land on that trip, not a generic feed. Implement as a server-rendered default (anonymous view) with the personalised variant swapped in after auth resolves — never blocking the anonymous render.

## Phase 1.6 — Visual design

Verify exact values against the codebase before changing — the notes below come from reviewing the live site at desktop width, not from reading the theme config.

### Switch the default to light mode

Currently dark-first with a Light Mode toggle in the sidebar. Flip it: **light is the default, dark is the option.**

Reasons:
- Travel is sold on photography. Dark UI mutes beaches, lagoons, and sunsets — the product itself.
- Every comparable product (Airbnb, Klook, Agoda, Booking) is light-first.
- Users are on mobile, outdoors, in Philippine daylight. Dark mode has worse sunlight legibility.

Dark-first is a developer aesthetic — it's what feels right building at night in VSCode. Keep the toggle, change the default. Verify photography, scrims, and price text all still read correctly in light mode.

### One job for teal

Teal currently carries: logo, active nav state, Sign In button, search button, and price text. When one colour means brand *and* primary action *and* data *and* selected state, it emphasises nothing.

**Rule: teal = primary action. Nothing else.**

| Element | Now | Change to |
|---|---|---|
| Primary CTA | teal | **keep teal** — this is its job |
| Price ("from ₱15k") | teal | primary text, medium weight. Price is information, not an action. |
| Active nav state | teal text | subtle background fill, neutral text |
| Sign In | solid teal button | text link (also per Phase 1 hierarchy) |
| Search button | teal | neutral, or fold into the input |
| Brand mark | teal | keep — not competing |

This matters more once booking CTAs ship. If teal already means five things, `Book on Klook` has no colour left to claim.

### Replace the gradient hero with photography

The teal-to-blue gradient with dot pattern is generic SaaS template — it could be a fintech landing page. Meanwhile the template cards twenty pixels below have real photographs of El Nido and Siargao that are far more evocative.

Use a full-bleed destination photograph with a dark scrim and the headline over it. This also fixes the three-zone whiplash of bright gradient hero → dark feed → dark sidebar.

Requirements: `next/image` with priority, AVIF/WebP, explicit dimensions to avoid layout shift, scrim strong enough for text contrast on any image.

### Typography

One family is currently doing every job. That's defensible — restraint beats a bad pairing. If adding character, use a display face **only** for destination names and hero headlines, existing sans for everything else. Do not introduce a third face.

### Copy case

Hero is Title Case ("Plan Your Next Philippine Adventure"). Switch to sentence case throughout — headings, buttons, labels, nav. Sentence case reads more human and matches the conversational register already established elsewhere.

### Contrast audit

Run an actual checker, don't eyeball:
- Light teal headline text on the teal-blue gradient hero — likely failing 4.5:1
- Teal price text over dark photo scrims
- All muted/secondary text in both light and dark modes

### If only two changes ship

Light mode default, and teal restricted to primary actions. Those two do more for how the product feels than any amount of font work.

## Phase 2 — Bucket list (new)

**Save affordance:** a save control on every place card in Discover, search, and template views. Works logged out. First anonymous save shows a one-time toast: *"Saved. Sign in anytime to keep your list."* Once only — do not nag.

**Bucket list view, in order:**

1. **The date prompt — highest-leverage element in the product.**
   *"Planning this trip? When are you going?"* → date range picker → converts to a dated lakad.
   Persistent at the top. This is the conversion the whole funnel depends on.
2. **Matching templates:** *"3 of your saved places are in this 5-day Palawan lakad"* → **Use this template**
3. The saved places grid

**No booking CTAs on this screen.** Saving is not buying. Monetising here trains users to distrust the surface.

## Phase 3 — Dated lakad

Dates change the UI's job from inspiration to logistics.

- **Countdown**: *"Palawan — 47 days away"*
- **What to book next**, driven by the T-minus schedule, one item at a time — not a wall of CTAs
- Pre-departure checklist unlocks at T-7
- Weather and seasonality warnings where you have them (habagat, amihan, typhoon season) — this is moat content

## Phase 4 — Booking components

`<BookableSlot placeId type surface viewerRole />`

- No active product → renders nothing. Never a dead button.
- **Secondary** button styling. If the itinerary reads as an ad unit, trust is gone and so is the business.
- One CTA per activity, maximum. Never modal, never interstitial, never fake urgency.
- Copy: **Book on Klook** / **Check rooms on Agoda** / **See ferry times**. Always "from ₱X".
- `rel="sponsored nofollow"`, `target="_blank"`

**Disclosure**, plain and visible on every surface with booking links:
*"We earn a commission on some bookings. It costs you nothing extra."*

## Phase 5 — Local knowledge (the visible moat)

Distinct, consistent treatment for proprietary Philippine logistics insight:

- *"Big Lagoon needs a separate paddleboat permit — these sell out."*
- *"Fly to Caticlan (MPH), not Kalibo — Kalibo adds ~2hrs by van."*
- *"Visit the Corella sanctuary — it's the conservation-run one."*

This is why someone uses Tara instead of asking ChatGPT. Make it look like it. Used sparingly enough that it still reads as signal, not decoration.

---

## Quality floor

Responsive to 375px · visible keyboard focus · `prefers-reduced-motion` · contrast ≥4.5:1 (check the teal-on-teal hero) · meaningful alt text · no layout shift on async load · **LCP under 2.5s on 4G**, mid-range Android.

---

## Analytics

Actually shipped (via PostHog, Task 08):

```
place_saved                       { placeId, category, source, isAnon }
place_removed                     { itemId }
date_prompt_shown                 { itemCount }
date_prompt_started               { itemCount }
date_prompt_abandoned             { stage }
bucket_dated                      { itemCount, daysUntilTrip,
                                    durationDays, wasAnonymous }
discover_personalized_shown       { destination, source, itemCount }
discover_personalized_click       { destination, placeId }
templates_matched_shown           { templateSlug, overlapCount,
                                    matchedPlaces }
template_matched_click            { templateSlug, overlapCount }
builder_bucket_suggestion_shown   { lakadId, destination,
                                    matchingCount, totalBucketCount }
builder_bucket_suggestion_added   { lakadId, placeId,
                                    wasDestinationMatch }
anon_bucket_claim_ran             { rowsClaimed, hadAnonId }
anon_bucket_claim_failed          { message }
```

Not shipped (future):

```
booking_cta_shown     { productId, surface, viewerRole }
booking_cta_clicked   { productId, surface, viewerRole }
outbound_redirect     { productId, partner, lakadId }
template_applied      { templateSlug }   ← distinct from *matched_click*
                                            (fires on wizard confirm, not link tap)
```

`shown` vs `clicked` is what gives a real conversion rate. Without it the Boracay booking test produces an uninterpretable number.

---

## Status — updated after tasks 01–11

### Shipped

| # | Task | Branch |
|---|---|---|
| 01 | Discover feed resilience | `fix/discover-feed` |
| 02 | IA + copy cleanup | `chore/ia-cleanup` |
| 03 | Light default + teal discipline | `style/light-mode` |
| 04 | State-aware homepage | `feat/state-aware-homepage` |
| 05 | Mobile bottom tabs (core routes) | `feat/mobile-nav` |
| 06 | Bucket list, anonymous capture | `feat/bucket-list` |
| 08 | PostHog analytics install | `feat/analytics-posthog` |
| 07 | Bucket → dated lakad conversion | `feat/dated-conversion` |
| 09 | Discover personalization strip | `feat/discover-personalization` |
| 10 | Builder suggests bucket list first | `feat/itinerary-suggests-bucket` |
| 11 | Template matching on /bucket | `feat/template-matching` |

Also shipped: Sentry (client/server/edge), PWA prompt gating, `/api/health` + keep-alive cron, `.gitignore` cleanup for next-pwa artifacts, Supabase migration to `ap-southeast-1` (Singapore) with Vercel functions pinned to `sin1`, custom `BucketPin` icon replacing the generic Bookmark across nav + place cards, PlaceCard UX cleanup (removed dominant "+ Add to Trip" overlay, promoted bucket save to primary affordance), `?redirect=` support on `/register` for the bucket→dated auth handoff, `next/image` remote hosts configured for Unsplash / Wikimedia / Supabase Storage / Google avatars, Suspense wrap on `/register` so `useSearchParams` doesn't bail out of static export, `TripsContext` consolidating the itineraries fetch across Sidebar / HomeClient / Dashboard (single fetch, localStorage-first seed, refetch on mutation), Postgres AFTER-ROW trigger bumping `itineraries.updated_at` on child-row writes so the sidebar's "most recent" reordering reflects real activity, `bucket_list_id` fk on `itinerary_activities` for durable Task-10 identity matching, service-worker fix for the ~7.7s cold-load auth latency (`next.config.js` runtimeCaching now excludes `/auth/v1/*`), Sidebar sign-out button, vocab drift killed (removed the English/Filipino locale swap on `useLocalizedTrip` — "Lakad" is brand everywhere), ISR + on-mutation invalidation for `/trip/[id]` and its OG image (Task 13).

**Correction on record:** Task 01's root cause was a paused free-tier Supabase project, not the LockManager theory in the original task file. The fixes were still correct — they make any future stall degrade gracefully rather than white-screen — but the diagnosis was wrong.

### Not-code work you still owe

1. **Supabase Pro (~$25/mo)** — the keep-alive cron is a workaround that makes GitHub Actions load-bearing for uptime. Pay for the tier before a real domain points here.
2. **Custom domain** — currently on `tara-letsgo.vercel.app`. Point a real domain before SEO authority accrues to the Vercel subdomain.
3. **Set up PostHog funnel view** — `place_saved → bucket_dated → template_matched_click` (or `booking_cta_clicked` once that ships). All events already fire; just needs the view configured in the PostHog dashboard.
4. **Content** — 15–20 destination guides. See "Content" section below.

### Then

| # | Work |
|---|---|
| ~~#29~~ | ~~AppShell retrofit: trip/new, trip/[id], edit, search, templates, ai-planner~~ — **done in `8766db4`** |
| ~~—~~ | ~~Save affordance on search~~ — **done, bucket-save bookmark on each `/search` result via `SearchResultRow`** |
| — | ~~Save affordance on templates~~ — **skipped by design; template activities aren't linked to places, and MatchingTemplateCard on /bucket handles the reverse direction. Revisit only if user data shows a real "save this whole trip idea" need** |
| ~~—~~ | ~~Un-save from PlaceCard~~ — **done via `removeFromBucketByPlace(placeId, source)` which resolves the row via RLS-scoped select + delete. Also applied to `SearchResultRow`.** |
| ~~—~~ | ~~Sidebar duplicate itineraries fetch~~ — **done, both Sidebar and HomeClient now consume `useTrips()` from `TripsContext`; one fetch per user change, one localStorage-first seed, one `refetch()` for future mutations** |
| ~~—~~ | ~~Add `bucket_list_id` fk on `itinerary_activities`~~ — **done, nullable fk with ON DELETE SET NULL. BucketSuggestions matches by fk first, falls back to (title, location) for legacy rows. Renames and location edits in the builder no longer detach an activity from its bucket source.** |
| ~~—~~ | ~~Unify template entry points~~ — **done, both `/templates` and `/bucket` now route through `/trip/new?template=<slug>`** |
| ~~—~~ | ~~Sidebar auth-state flash~~ — **done, sidebar auth-dependent sections gate on `authLoading` + `tripsResolved`; account row shows a same-height skeleton during auth resolve** |
| ~~—~~ | ~~Page hero CLS~~ — **done, localStorage-first trip cache renders the correct hero variant on first paint; measured 0.0008–0.0014 total CLS on deployed build across widths. Re-verify after the token ages past a refresh cycle.** |
| ~~—~~ | ~~Sidebar polish~~ — **done, ACCOUNT label now fades softly at the scroll edge; Bohol image fixed to a valid tropical placeholder** |
| ~~—~~ | ~~Template photo audit~~ — **done, all 8 templates now use real Wikimedia Commons photos of their actual destinations via `Special:FilePath` (durable URLs, no ID rot)** |
| ~~—~~ | ~~Wire up Sidebar Dark Mode toggle~~ — **not a bug on deployed build; all 5 checkpoints pass (class, localStorage, meta color, label, second click). Local-only regression, consistent with the localhost:3000 staleness pattern in this session.** |
| ~~12~~ | ~~Investigate Supabase `getSession()` ~7.7s cold-load latency~~ — **done, root cause was next-pwa service worker's runtimeCaching pattern matching `/auth/v1/*` with a 10s NetworkFirst timeout. Fix: restrict pattern to `(rest\|storage\|functions)/`. Cold-load auth now sub-500ms. 164px hero reservation removed; SIGNED_IN retry dance kept as belt-and-braces.** |
| ~~13~~ | ~~Vercel edge caching for public routes~~ — **done, `/trip/[id]` (300s) and `/trip/[id]/opengraph-image` (3600s) added, on-mutation invalidation wired via server action for visibility toggle + metadata edit. `/` already at 300s. `/api/health` intentionally left dynamic (keep-alive probe). `/templates` already ○ (Static).** |
| ~~—~~ | ~~`itineraries.updated_at` trigger on child-row mutations~~ — **done, Postgres AFTER-ROW trigger on `itinerary_days` and `itinerary_activities` (all three verbs) bumps the parent's `updated_at` via `SECURITY DEFINER` functions. Verified end-to-end on the Singapore project.** |
| ~~—~~ | ~~Live `activeTrip` reorder on mutation~~ — **done, mutation paths (update itinerary/day/activity, delete day/activity/itinerary, add-from-bucket, create-from-wizard, create-from-date-prompt) now call `useTrips().refetch()` after the write. Sidebar and page hero reorder live, no reload needed.** |
| — | Delete the old `us-east-1` Supabase project — decided to keep for now. Stale references cleaned up (13 Vercel env vars, `supabase/.temp/` link), so the project is fully orphaned in prod and safe to delete whenever. No cost on free tier, no code path points at it. |
| — | Full cross-device bucket reconciliation (email-anchor link) — MVP shipped instrumentation + info UX + auto-claim-on-sign-in. If `anon_bucket_claim_ran` events show a high rate of `rowsClaimed: 0` on signup, build `anon_email_links(anon_id, email)` populated at first save via a skippable email prompt, then reconcile server-side at signup |

### Content — starts now, runs in parallel

15–20 destination guides, written by you. No code dependency. One per day alongside whatever is being built.

This is the only work that generates traffic, the slowest to compound, and the only piece that cannot be delegated. Two weeks of engineering with zero content written is the drift pattern — engineering always supplies more legitimate-looking urgent work.

### Launch gate

Supabase Pro · no false metrics · Sentry DSN set · domain pointed

(Struck from the launch gate since shipped: migration applied · duplicate Vercel project removed · region migrated · analytics live · AppShell on all routes.)

### Post-launch

Boracay booking test (`partner_products`, `/go`, two slots) — needs traffic to be measurable. Then trip lifecycle cron, only if the booking test converts. The lifecycle cron will read the `itineraries.status + start_date` index Task 07 added.

### Why this order

Domain before content, or SEO authority accrues to a URL you're abandoning. Booking test after traffic, or the result is noise.
