# Launch plan — who does what

Three tracks, run in parallel. Track B (data) is the long pole and the one that gets postponed — start it in week 1.

**The product in one line:** for people who want to travel but don't know where to start, Tara turns "I have X budget and Y days" into an editable itinerary with real numbers.

---

# TRACK A — Claude Code

Each task gets a file in `docs/tasks/`, its own branch, one step at a time, commit per step.

## A1 — Destination becomes optional (**the blocking change**)

`/trip/new` currently gates Continue on "Where are you going?" That's the one question the target user can't answer.

- Add **"Not sure yet — help me pick"** beside the popular-destination pills
- Taking that path skips destination; Continue enables on the other answers
- Existing path (destination known) unchanged — do not break it
- Audit steps 2 and 3: confirm **days**, **budget per person per day**, and **month/dates** are all collected. Add whatever's missing.
- Origin field already exists — keep it, remember the answer

**Done when:** a user with no destination in mind can complete the wizard.

Task file: `docs/tasks/14-destination-optional.md`

## A2 — Destination matching data

```sql
alter table destinations
  add column min_viable_days int,
  add column travel_times jsonb;   -- {"manila": 240, "cebu": 90} door-to-door minutes
```

Admin fields for both. Values come from Track B.

Task file: `docs/tasks/16-destination-matching-data.md`

## A3 — Suggestion engine

Plain SQL ranking, no ML:

1. Hard filter: `min_viable_days <= days_available`
2. Travel time from origin (kills far destinations on short trips)
3. Budget band fit
4. Bucket-list overlap count
5. `best_months` includes their month

Returns a ranked shortlist with per-destination cost estimate and travel time.

**Honest refusals are part of this task, not a follow-up.** When a saved place doesn't fit:

> "El Nido needs 4+ days — the transfer from Puerto Princesa eats most of two. With 3 days from Manila, Boracay or Bohol work. El Nido stays in your bucket list."

Task file: `docs/tasks/17-suggestion-engine.md`

## A4 — Draft generation

Picking a suggestion creates a **fully editable lakad**, not a fixed plan. Fills days from that destination's places, grouped by `part_of_tour`, respecting `not_same_day_as`. Every item removable, days reorderable, running cost estimate as they edit.

Writes into the existing lakad structure. The builder itself doesn't change.

Task file: `docs/tasks/18-draft-generation.md`

## A5 — Discover → action

Place cards currently only save. Add a second action: **"Plan a trip here"** → wizard pre-filled with that destination.

Also: **remove likes and comments from feed cards.** Social mechanics that don't feed the funnel, and the counts look like seed data — same fake-metrics problem as the old "500+". Save stays as the only engagement action.

Audit for any remaining invented numbers (ratings, review counts) and either make them real or remove them.

Task file: `docs/tasks/19-discover-action.md`

## A6 — Places schema + admin

Per `docs/places-spec.md`. Needed before Track B can start at volume — **do this early**, it blocks the hire.

Include the partner-products repeater and the editor role gate.

Task file: `docs/tasks/15-places-schema-admin.md`

## A7 — Place + destination pages

`/places/[slug]`, `/destinations/[slug]`. Thin-page guard enforced: no publish without 3+ tips, fee info, getting-there. Drafts excluded from sitemap.

Task file: `docs/tasks/20-place-destination-pages.md`

## A8 — Housekeeping

Sitemap (static + published places) · Supabase auth redirect URLs → taralakad.com · analytics events for the new flow.

~~AppShell retrofit~~ — shipped (`8766db4`).
~~`NEXT_PUBLIC_APP_URL` → taralakad.com~~ — shipped with the domain cutover.

Task file: `docs/tasks/21-housekeeping.md`

**Order:** A1 → A6 → A2 → A3 → A4 → A5 → A7 → A8

A1 first because it's the product-defining change. A6 early because it unblocks the hire.

---

# TRACK B — Data (the long pole)

## B1 — You, this week, by hand

**Fill El Nido completely — ~15 places, to standard.** Do not delegate this.

You cannot write a brief for work you haven't done, and you won't know if a place takes 10 minutes or 40. One evening, and it de-risks the whole approach.

Then write down: minutes per place, which fields were hard to source, where you gave up.

## B2 — You, this week, one hour

For all four destinations plus Manila-area land trips:

| Field | What it means |
|---|---|
| `min_viable_days` | Below this, don't suggest it. El Nido 4, Boracay 2, Bohol 2, Siargao 3, Baguio 1. |
| `travel_times` | **Door to door**, from Manila and Cebu. Flight + transfer + waiting, not flight duration. |
| budget bands | What ₱5k/day vs ₱10k/day actually buys |

**This one hour unblocks A3.** Without it the suggestion engine has nothing to rank on. Verify current flight times and transfer durations — don't guess.

## B3 — Hire, after B1

**Only after you've done El Nido yourself.**

Role: data researcher, part-time. Philippine VA, remote. Task: fill places to the spec.

Brief them with:
- `docs/places-spec.md` research workflow
- Your El Nido work as the worked example
- The hard rules: **if it can't be sourced it doesn't go in**, **null beats wrong**, **never copy partner text**, **3 tips minimum**

Pay per completed place, not hourly — quality is checkable, hours aren't. Review the first ten yourself before letting them run.

Start with Boracay (shortest), then Bohol, then Siargao.

## B4 — Land trips (new category, worth it)

Baguio, La Union, Zambales, Batangas, Bataan, Rizal, Tagaytay.

These are the trips working people with kids actually take — no flight, leave Friday night, 1–2 days. Completely unserved by Philippine travel sites, which all assume you're flying. Also the category you can verify most easily.

Add after the four island destinations are done.

---

# TRACK C — You

## C1 — Now

- [x] ~~Confirm `20260824010000_bucket_list_anonymous.sql` is applied in the Singapore prod project~~ — verified via Supabase MCP: `user_id` nullable, `anon_id` column present, three `anon can ...` RLS policies live (SELECT/INSERT/DELETE).
- [ ] Supabase Pro (~$25/mo) — retire GitHub Actions as an uptime dependency
- [x] ~~Disconnect the dormant `tara` Vercel project~~ — no such project exists. `vercel projects ls` and the dashboard both show only `tara-letsgo` (live on taralakad.com), `lms-app`, `lms-app-6mox` under `darkcloudz18s-projects`. The TODO was stale.
- [ ] Search Console — retry verification (TXT is in, Google needed time)

## C2 — Before launch

- [ ] Supabase auth: Site URL + redirect URLs → taralakad.com
- [ ] Facebook Page, TikTok (`@taralakadph` — `taralakad` is taken), Instagram (`taralakad` free)
- [ ] Sentry DSN set on Vercel
- [ ] Walk the whole flow logged out, on a phone, on mobile data

## C3 — The real milestone

**Ten people planning a real trip, using Tara, watched.**

Friends, officemates, your sister's circle. Ask directly, screen-share, say nothing while they use it. Note every hesitation — that list is the backlog.

Success is not signups. It's **one person plans a trip with Tara and takes it.**

This is immune to every block you have: no travel experience needed, no Facebook ads, no SEO, no guides.

---

# Sequence

| Week | Track A | Track B | Track C |
|---|---|---|---|
| 1 | A1, A6 | **B2 (1 hr)**, B1 (El Nido) | C1 |
| 2 | A2, A3 | Brief + hire | — |
| 3 | A4, A5 | Boracay, Bohol | C2 |
| 4 | A7, A8 | Siargao | **C3 — 10 users** |

Don't wait for a finished product to start C3. Someone could use Tara this week and teach you something real.

---

# Launch gate

Tool is useful enough that a stranger could plan a real trip with it.

Wizard works without a destination · suggestions return real numbers · one destination fully populated · mobile verified · no invented metrics anywhere · Supabase Pro · Sentry live

Guides, SEO scale, and booking links come **after** this, not before.
