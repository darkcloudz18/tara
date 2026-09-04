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
create table bucket_items (
  id          uuid primary key default gen_random_uuid(),
  user_id     uuid references auth.users(id),  -- nullable until claimed
  anon_id     text,                             -- localStorage UUID
  place_id    uuid references places(id) not null,
  source      text,                             -- 'discover' | 'template' | 'search'
  created_at  timestamptz default now()
);
create index on bucket_items (user_id);
create index on bucket_items (anon_id);

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

Do this in Postgres. It's an overlap count, not a recommender system.

```sql
select t.id, t.title, count(*) as overlap
from templates t
join template_places tp on tp.template_id = t.id
where tp.place_id in (select place_id from bucket_items where user_id = $1)
group by t.id, t.title
order by overlap desc
limit 3;
```

Ship this. Do not build embeddings, do not add a vector column, do not reach for a recommendation service. Revisit only if overlap scoring visibly fails at real volume.

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

## 1.6b Region — migrate now, before launch

Supabase is in `us-east-1` (N. Virginia); users are in the Philippines. That's ~230ms client→DB round trip versus ~40–60ms from `ap-southeast-1` (Singapore).

**Earlier guidance said defer this. That was based on assuming production data. It's reversed:** pre-launch, with only seed data, this is a fresh project and a schema push — not a migration project. The window closes the moment you have real users.

Sequence:
1. New Supabase project in `ap-southeast-1`
2. Push schema, RLS policies, and seed data
3. Swap env vars in Vercel
4. **Then** pin Vercel functions to `sin1` in `vercel.json` to match
5. Delete the old project once verified

Do this before the domain goes live. Edge caching of anonymous surfaces still matters afterward, but co-locating removes the underlying penalty rather than papering over it.

## 1.7 Still not building

No microservices. No queue. No vector DB. No custom admin. No separate booking service. Solo founder — every service is a 2am page.

---

# PART 2 — UI/UX

## Phase 0 — Live defects (ship today)

**PWA prompt:** currently fires on first load, including on 404, and covers content. Gate behind second visit OR one lakad created. Never on error routes.

**Four states everywhere:** loading (skeleton, max 5s), error (cause + retry), empty (invitation to act), loaded. Discover currently has one.

- Error: *"Couldn't load destinations. Check your connection and try again."* + **Try again**
- Empty filtered: *"No beaches match these filters."* + **Clear filters**

**Discover grid:** currently one narrow centred column with dead space both sides. Make it 1 / 2 / 3–4 responsive with a max-width container.

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

```
place_saved         { placeId, source, isAnon }
bucket_dated        { itemCount, daysUntilTrip }   ← the key metric
template_applied    { templateId, fromBucket }
booking_cta_shown   { productId, surface, viewerRole }
booking_cta_clicked { productId, surface, viewerRole }
outbound_redirect   { productId, partner, lakadId }
```

`shown` vs `clicked` is what gives you a real conversion rate. Without it the Boracay test produces an uninterpretable number.

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

Also shipped: Sentry (client/server/edge), PWA prompt gating, `/api/health` + keep-alive cron, `.gitignore` cleanup for next-pwa artifacts, Supabase migration to `ap-southeast-1` (Singapore) with Vercel functions pinned to `sin1`, custom `BucketPin` icon replacing the generic Bookmark across nav + place cards, PlaceCard UX cleanup (removed dominant "+ Add to Trip" overlay, promoted bucket save to primary affordance), `?redirect=` support on `/register` for the bucket→dated auth handoff, `next/image` remote hosts configured for Unsplash / Wikimedia / Supabase Storage / Google avatars, Suspense wrap on `/register` so `useSearchParams` doesn't bail out of static export.

**Correction on record:** Task 01's root cause was a paused free-tier Supabase project, not the LockManager theory in the original task file. The fixes were still correct — they make any future stall degrade gracefully rather than white-screen — but the diagnosis was wrong.

### Do this week

1. **Supabase Pro (~$25/mo)** — the keep-alive cron is a workaround that makes GitHub Actions load-bearing for uptime. Pay for the tier before a real domain points here.
2. **Verify the funnel end-to-end in prod PostHog** — with Task 07 shipped, `bucket_dated` should now fire against real traffic. Confirm it lands, confirm `wasAnonymous` splits the two paths correctly, then set up the `place_saved → bucket_dated` funnel view in PostHog.
3. **Content** — 15–20 destination guides. Starts now, runs in parallel with everything below.

### Then

| # | Work |
|---|---|
| #29 | AppShell retrofit: trip/new, trip/[id], edit, search, templates, ai-planner |
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
| 12 | Investigate Supabase `getSession()` ~7.7s cold-load latency — upstream cause of remaining sidebar workarounds (retry-on-SIGNED_IN, 164px height reservation). See `docs/tasks/12-getsession-latency.md`. |
| 13 | Vercel edge caching for public routes — add `revalidate` on `/`, `/templates`, `/trip/[id]`, and `Cache-Control` on `/api/health`. See `docs/tasks/13-edge-caching.md`. |
| ~~—~~ | ~~`itineraries.updated_at` trigger on child-row mutations~~ — **done, Postgres AFTER-ROW trigger on `itinerary_days` and `itinerary_activities` (all three verbs) bumps the parent's `updated_at` via `SECURITY DEFINER` functions. Verified end-to-end on the Singapore project.** |
| ~~—~~ | ~~Live `activeTrip` reorder on mutation~~ — **done, mutation paths (update itinerary/day/activity, delete day/activity/itinerary, add-from-bucket, create-from-wizard, create-from-date-prompt) now call `useTrips().refetch()` after the write. Sidebar and page hero reorder live, no reload needed.** |
| — | Delete the old `us-east-1` Supabase project (currently held as rollback insurance — remove after ~1 week of Singapore stability) |

### Content — starts now, runs in parallel

15–20 destination guides, written by you. No code dependency. One per day alongside whatever is being built.

This is the only work that generates traffic, the slowest to compound, and the only piece that cannot be delegated. Two weeks of engineering with zero content written is the drift pattern — engineering always supplies more legitimate-looking urgent work.

### Launch gate

Supabase Pro · AppShell on all routes · no false metrics · Sentry DSN set · domain pointed

(Struck from the launch gate since shipped: migration applied · duplicate Vercel project removed · region migrated · analytics live.)

### Post-launch

Boracay booking test (`partner_products`, `/go`, two slots) — needs traffic to be measurable. Then trip lifecycle cron, only if the booking test converts. The lifecycle cron will read the `itineraries.status + start_date` index Task 07 added.

### Why this order

Domain before content, or SEO authority accrues to a URL you're abandoning. Booking test after traffic, or the result is noise. Task 10 (builder suggests bucket) before Task 11 (template matching), so the builder's suggestion surface exists before templates layer on top of it.
