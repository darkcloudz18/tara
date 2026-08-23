# CLAUDE.md

Project context for Claude Code. Keep this file short — it loads on every request.

## Product

**Tara Let's Go** — trip planning for Filipino travelers, Philippines only.
Live: tara-letsgo.vercel.app · Solo founder/dev.

**Business model: affiliate/transaction, not subscription.** The planner is free. Revenue comes from bookings made through itineraries (Klook activities, Agoda stays, 12Go transport). Do not build subscription, paywall, or usage-limit features unless explicitly asked.

## Vocabulary

Use these terms in code and UI. They are brand, not decoration.

| Term | Meaning |
|---|---|
| **lakad** | An itinerary. Primary entity. Never rename to "trip" or "plan" in UI copy. |
| **barkada** | Friend group. The people a lakad is shared with. |
| **template** | Pre-made lakad for a destination (Palawan 5D, Boracay 3D, etc.) |
| **bucket list** | Saved places, no dates yet. Low intent. |
| **dated lakad** | A lakad with `start_date`. High intent. The key conversion. |

## Stack

Next.js (App Router) · Supabase (Postgres + Auth + Storage) · Tailwind · Vercel · PWA

Supabase project region: Singapore. Vercel functions **must** be pinned to `sin1` in `vercel.json` — default `iad1` adds a Pacific round trip to every server render.

## Two architectural laws

### 1. Public never waits on private

Anonymous, server-rendered, indexable: Discover feed, templates, shared lakad pages.
Auth-dependent UI (saved state, owner controls, notifications) layers on **after** and never gates the public content.

Violating this caused a production outage: the homepage Discover feed was gated behind `supabase.auth.getSession()`, the auth refresh hung on CORS preflight, and every logged-out visitor saw infinite skeletons. Do not reintroduce this pattern.

### 2. Monetise intent, not interest

Booking CTAs belong where a trip is real: day view, shared lakad, pre-departure checklist, template cards.
**No booking CTAs on the bucket list.** Saving is not buying.

## Hard rules

**Supabase client** — one module-scope singleton for the browser client. Never call `createClient()` inside a component body or hook. Multiple instances cause a Navigator LockManager deadlock where auth calls hang forever with no error.

**Auth calls** — never unbounded. Wrap in `Promise.race` with a 3s timeout; on timeout treat as logged out and render anyway. A degraded logged-out view beats an infinite skeleton.

**Async surfaces need four states** — loading (skeleton, max 5s), error (cause + retry control), empty (invitation to act), loaded. Never ship a surface with only a skeleton.

**Affiliate links** — never raw partner URLs in HTML. Always route through `/go/[productId]`. Affiliate IDs live in env vars. All outbound links get `rel="sponsored nofollow"` and `target="_blank"`.

**Anonymous-first** — browsing, saving to bucket list, and building a lakad all work logged out. Auth prompt only at save/share. Anonymous state keyed by a localStorage UUID (`anon_id`), merged into `user_id` on signup.

**Mobile-first** — Philippine traffic is overwhelmingly mobile. Budget: LCP under 2.5s on 4G, mid-range Android. Tap targets ≥44px. Test at 375px before desktop.

## Visual rules

**Light mode is the default.** Dark is the option. Travel is sold on photography and users are outdoors in daylight.

**Teal = primary action only.** Not price, not active nav, not brand emphasis, not search. Price is primary text, not an accent colour. Active nav is a subtle background fill. If teal means five things, the booking CTA has no colour left to claim.

**Sentence case everywhere** — headings, buttons, labels, nav.

**Photography over gradients.** Destination imagery is the product; decorative gradients are not.

**Contrast ≥4.5:1**, verified with a checker, in both modes.

## Copy conventions

Sentence case. Active voice. Buttons name what happens ("Book on Klook", not "Submit").
Errors state cause and fix, and do not apologise: *"Couldn't load destinations. Check your connection and try again."*
Empty states are invitations, not dead ends.
Affiliate disclosure is plain and visible: *"We earn a commission on some bookings. It costs you nothing extra."*

## Do not build

Microservices · queues · vector DB / embeddings · custom admin UI · notification service · separate booking service · paid-placement ranking.

Solo founder. Every service is a 2am page. Template matching is a SQL overlap count, not a recommender.

## Before finishing any task

- Verify logged out **and** logged in
- Verify at 375px
- Keyboard focus visible on new interactive elements
- No layout shift when async content loads
- Run typecheck and lint

## Reference

Full plan: `docs/build-plan.md`
Active tasks: `docs/tasks/`
