# Places: schema, pages, and admin

**Strategy shift:** the SEO layer is now curated place and destination data, not hand-written guides. Positioning is *accurate, current, Philippine-specific* — not *we've been there*.

**Therefore: provenance is the product.** Every substantive fact carries a source and a date, and the page shows it. That is what makes "accurate" a claim rather than an assertion.

---

## 1. Place schema

```sql
alter table places
  -- identity
  add column slug              text unique not null,
  add column destination_id    uuid references destinations(id),
  add column category          text,        -- beach | lagoon | waterfall | viewpoint
                                            -- | heritage | food | activity | stay
  -- the fields people actually search for
  add column summary           text,        -- 1 sentence, used in cards + meta description
  add column description       text,        -- 2–3 paragraphs
  add column entrance_fee      numeric,     -- PHP, null = free, 0 = explicitly free
  add column fee_notes         text,        -- "plus ₱200 paddleboat permit, paid on site, cash"
  add column duration_minutes  int,         -- typical visit
  add column getting_there     text,        -- from nearest_hub, concrete
  add column nearest_hub       text,        -- "El Nido town"
  add column best_time_of_day  text,
  add column best_months       int[],       -- [11,12,1,2,3,4]
  add column booking_required  boolean default false,
  add column booking_notes     text,        -- "permits capped daily, sells out in peak season"

  -- sequencing: the part Google Maps and Klook do not do
  add column part_of_tour      text,        -- "El Nido Tour A" — groups stops into one trip
  add column pairs_with        uuid[],      -- sensible same-day combinations
  add column not_same_day_as   uuid[],      -- too far apart, opposite ends

  -- the differentiator
  add column tips              text[],      -- non-obvious, saves money/time/regret

  -- trust layer — not optional
  add column source_urls       text[],      -- where each fact came from
  add column verified_at       timestamptz,
  add column verified_by       text,
  add column status            text default 'draft';  -- draft | published | needs_review
```

### Field notes

**`tips`** is the moat, one array element per fact. Bar: would a first-timer not know this, and does it save money, time, or regret?

- *"Big Lagoon needs a separate paddleboat permit — capped daily, sells out in peak season."*
- *"Fly Caticlan (MPH), not Kalibo — Kalibo adds ~2 hrs by van."*
- *"The Corella sanctuary is the conservation-run one; roadside tarsier stops are not."*

Three or more per place. Fewer than three usually means the research isn't done.

**`not_same_day_as`** is the single most valuable field here and the one no competitor has. It encodes what actually ruins trips. Google Maps will happily show you two places four hours apart as if they're both "in Siargao."

**`part_of_tour`** collapses what look like separate destinations into the one boat trip they actually are. Four El Nido lagoons are not four outings.

**`verified_at`** drives a staleness queue. Fees and schedules in the Philippines change often; a confidently wrong fee is worse than a missing one.

---

## 1b. Partner products — capture during research, not later

Affiliate inventory is collected in the same research pass as the facts. Marginal extra time per place; avoids a second sweep over 253 places when traffic arrives.

```sql
create table partner_products (
  id            uuid primary key default gen_random_uuid(),
  place_id      uuid references places(id),
  destination_id uuid references destinations(id),   -- for stays/transfers with no single place
  partner       text not null,        -- 'klook' | 'agoda' | '12go' | 'airalo'
  product_name  text,                 -- as listed by the partner
  product_type  text not null,        -- 'activity' | 'stay' | 'transfer' | 'addon'
  price_from    numeric,
  includes      text,                 -- "transport + lunch + guide"
  deeplink      text not null,
  priority      int default 0,
  active        boolean default true,
  verified_at   timestamptz
);
```

> The current repo already has an earlier `partner_products` migration without `product_name`, `includes`, or the nullable `destination_id` fk. This spec supersedes it — the Task 15 migration will add the missing columns rather than drop and recreate.

### The rule that protects the positioning

**A partner is authoritative for its own product. It is never a source for a fact about the place.**

Klook's price is a packaged tour price — transport, guide, lunch — not the gate fee. Using it as `entrance_fee` makes the page wrong about the exact thing the site claims to get right.

| Field | Source |
|---|---|
| `entrance_fee`, `fee_notes` | Official site, LGU page, or operator. **Never a partner listing.** |
| `duration_minutes`, `getting_there`, hours | Official source, cross-checked |
| `tips` | Reviews, forums, operators |
| `partner_products.*` | The partner listing itself |

The page then states both honestly:

> Entrance ₱50 at the gate. Klook sells a guided tour with transport from ₱1,200.

Two real options, clearly distinguished. That comparison is itself useful — nobody else shows it.

### Coverage is uneven, and that's fine

Klook is strong on El Nido tours, Boracay transfers, Cebu canyoneering. Thin or absent on museums, churches, viewpoints, public beaches.

**Places drive the list; partner products attach where they exist.** Most places will have none — correct, not a gap. "Baguio museum entrance fee" is a searchable query whether or not anyone sells a ticket for it, and those long-tail queries are the SEO advantage.

**Never let commercial availability shape coverage or wording.** The moment "has a Klook product" influences which places get pages or how they're described, this becomes an affiliate catalogue and the trust goes with it.

### Admin

A "Partner products" repeater on the place form: partner, product name, price, includes, deeplink, verified. Same completeness and staleness treatment as everything else — affiliate links rot silently, and a dead link is worse than no link.

Affiliate IDs are **not** stored here. `deeplink` is the clean partner URL; IDs are appended at redirect time from env vars (see `/go/[productId]` in the build plan).

---

## 2. Destination schema

```sql
create table destinations (
  id            uuid primary key default gen_random_uuid(),
  slug          text unique not null,       -- "el-nido"
  name          text not null,
  region        text,                       -- "Palawan"
  summary       text,
  description   text,
  getting_there text,                       -- from Manila/Cebu
  best_months   int[],
  typical_days  int,                        -- "most people spend 3–4 days"
  budget_low    numeric,                    -- PHP/day
  budget_mid    numeric,
  budget_high   numeric,
  tips          text[],
  source_urls   text[],
  verified_at   timestamptz,
  status        text default 'draft'
);
```

Smart Build also needs `min_viable_days int` and `travel_times jsonb` on this table — added in Task 16 so Smart Build (Task 17) has something to rank on.

---

## 3. Public pages

### `/destinations/[slug]` — the ranking page

Targets "things to do in El Nido", "El Nido itinerary", "is El Nido worth it".

Order: hero + summary · **how to get there from Manila/Cebu** · how many days · budget bands · places grid, grouped by `part_of_tour` · tips · matching templates · **"Last verified <date>"**

Grouping by tour is the visible payoff of the schema — a reader immediately sees that four lagoons are one boat day.

### `/places/[slug]` — the long tail

Targets "Sugba Lagoon entrance fee", "Kawasan Falls how to get there".

Order: photo + summary · **fee, duration, booking — answered above the fold** · getting there · tips · pairs well with · part of <tour> · nearby · **sources and verification date**

**Thin-page guard:** do not publish a place with fewer than 3 tips, no fee information, and no `getting_there`. Hundreds of thin pages drag down the whole domain. `status` stays `draft` and it is excluded from sitemap and internal links until it clears the bar.

### Trust block

Every place and destination page ends with:

> Last verified 11 October 2026 · Sources: [list]
> Fees and schedules change. Tell us if something's wrong.

This is the honest version of the positioning, and it is also a genuine differentiator — nobody else dates their travel data.

---

## 4. Admin UI

Reverses the earlier "no custom admin" rule. Justified now: data entry is the core work, it is high-volume, and a VA will do it without database access.

Scope it narrowly — a data-entry tool, not a CMS.

### `/admin/places` — queue

Table: name · destination · **completeness %** · status · verified_at (red if >6 months)
Filters: destination, status, incomplete, stale
Sort by completeness ascending — worst first.

### `/admin/places/[id]` — the form

Grouped: Basics · Practical (fee, duration, booking) · Getting there · Sequencing · Tips · Sources.

Must-haves:
- **Completeness meter** that names what's missing: *"Needs: fee, 2 more tips"*
- **Tips as a repeater**, minimum 3 enforced before publish
- **Source URL per field group**, not one global list
- **"Mark verified"** stamps `verified_at` + `verified_by`
- **Cannot set `published`** until the thin-page bar is met
- `pairs_with` / `not_same_day_as` as searchable place pickers

### `/admin/review` — staleness

Anything `verified_at` older than 6 months, oldest first. One click to re-verify.

### Access

`role` on profiles: `admin` | `editor`. Editors edit places and destinations only — no users, no itineraries, no settings. RLS-enforced, not UI-hidden.

> The `profiles.role` column already exists via `20260208030000_admin_roles.sql`. Task 15 extends it with the `editor` value and the RLS policies — it does not recreate the column.

### Not building

Rich text (markdown textarea is fine) · media library (URL field) · workflow/approvals · audit log beyond `verified_by` · analytics in admin.

---

## 5. Research workflow

Per place, roughly 25–35 minutes. **Order matters** — facts before commerce, so partner pricing never contaminates the fact fields.

**Facts first**

1. **Official site / LGU page / operator** → `entrance_fee`, `fee_notes`, hours, `booking_required`. This is the only acceptable source for fees.
2. **Google Maps** → coordinates, `nearest_hub`, rough `duration_minutes`
3. **Cross-check** the fee against one independent source — a recent blog or forum post. Disagreement means dig further or leave it null. A missing fee is fine; a wrong fee is not.

**Tips**

4. **3-star reviews on Klook/Agoda/TripAdvisor** → the tips live here. Five-star says "amazing." Three-star says "the boat left at 8:30 not 9:00 and we nearly missed it."
5. **Facebook group search** → recurring questions are tips in disguise. If people ask it repeatedly, it belongs on the page.
6. **Sequencing** → from tour operator route pages: `part_of_tour`, `pairs_with`, `not_same_day_as`

**Commerce last**

7. **Search Klook, Agoda, 12Go** for this place → add any `partner_products` with product name, price, what's included, clean deeplink
8. Record **every** URL in `source_urls`, stamp `verified_at`

### Rules

- **If it can't be sourced, it doesn't go in.** No inferred fees, no guessed durations, no "probably around ₱200".
- **Null beats wrong.** An empty fee field is honest; a wrong one destroys the positioning.
- **Never copy partner prose.** Write the summary and description yourself — copying is both a copyright problem and produces the generic text this whole strategy exists to avoid.
- Three tips minimum, or it stays draft.

---

## 6. Sequencing

| # | Work |
|---|---|
| 1 | Schema migration: places columns + destinations table (Task 15) |
| 2 | Admin: queue, form, completeness meter, role gate (Task 15) |
| 3 | **Fill El Nido by hand** — ~15 places, to standard. Time it. (Track B, B1) |
| 4 | Build `/destinations/[slug]` and `/places/[slug]` from that data (Task 20) |
| 5 | Check the pages look worth ranking. Adjust schema if fields are missing. |
| 6 | Sitemap: published only (Task 21) |
| 7 | Then scale: Boracay, Siargao, Bohol — VA-assisted (Track B, B3) |

**Do step 3 yourself before hiring anyone.** You cannot write a brief for work you have not done, and you will not know whether 10 minutes or 40 is realistic. Fifteen places is one evening and it de-risks the whole approach.

---

## 7. What this changes about guides

Guides are no longer the launch requirement. They come later, built on interviews (operators, travellers, boatmen) and sitting on top of the data rather than replacing it.

The site never claims first-hand travel. It claims current, sourced, sequenced information — which is true, checkable, and genuinely rare.
