# CLAUDE.md

Project context for Claude Code. Keep this file short — it loads on every request.

## Product

**Tara Let's Go** — trip planning for Filipino travelers, Philippines only.
Staging: tara-letsgo.vercel.app · Solo founder/dev.

**Status: pre-launch.** No real users. All current itinerary/user counts are seed data. No custom domain yet. Breaking changes are cheap right now — take advantage of that before launch.

**Seed data policy:** seeded *templates* are real curated content and stay. Seeded *social proof* (user counts, avatars, "500+ created") is false and must not ship. Never display a metric that isn't true.

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

**Region:** Supabase is currently `us-east-1` (N. Virginia). Users are in the Philippines — this is wrong and should be migrated to `ap-southeast-1` (Singapore) **before launch**, while there is no production data to move.

Until that migration happens, Vercel's default `iad1` is co-located with the DB — **do not pin to `sin1`**, that would split functions from the database. After migrating to Singapore, pin functions to `sin1` to match.

## Two architectural laws

### 1. Public never waits on private

Anonymous, server-rendered, indexable: Discover feed, templates, shared lakad pages.
Auth-dependent UI (saved state, owner controls, notifications) layers on **after** and never gates the public content.

Violating this caused a production outage: the homepage Discover feed was gated behind an auth call that never resolved (root cause: paused free-tier Supabase project), and every logged-out visitor saw infinite skeletons indefinitely. The lesson is not "unpause the DB" — it's that no public surface may block on an auth call, and no async call may run unbounded.

### 2. Monetise intent, not interest

Booking CTAs belong where a trip is real: day view, shared lakad, pre-departure checklist, template cards.
**No booking CTAs on the bucket list.** Saving is not buying.

## Hard rules

**Supabase client** — one module-scope singleton for the browser client. Never call `createClient()` inside a component body or hook. The singleton also injects the `x-anon-id` header on every request.

**Auth calls** — never call `supabase.auth.getUser()` / `getSession()` directly. Always use `getUserSafe()` / `getSessionSafe()`, which wrap a 3s `Promise.race` and resolve to logged-out on timeout. Applied at 32 call sites; do not add a 33rd bare call.

**Deterministic rendering** — server and client must produce identical markup. Never use `Math.random()`, `Date.now()`, or unsorted query results in render. Use the `seededInt` helper. Every Supabase query whose order affects render needs an explicit tiebreaker (`.order('id')`) — tied rows otherwise return in arbitrary order and cause hydration mismatches.

**Async surfaces need four states** — loading (skeleton, max 5s), error (cause + retry control), empty (invitation to act), loaded. Never ship a surface with only a skeleton.

**Affiliate links** — never raw partner URLs in HTML. Always route through `/go/[productId]`. Affiliate IDs live in env vars. All outbound links get `rel="sponsored nofollow"` and `target="_blank"`.

**Anonymous-first** — browsing, saving to bucket list, and building a lakad all work logged out. Auth prompt only at save/share. Anonymous state keyed by a localStorage UUID (`anon_id`), merged into `user_id` on signup.

**Mobile-first** — Philippine traffic is overwhelmingly mobile. Budget: LCP under 2.5s on 4G, mid-range Android. Tap targets ≥44px. Test at 375px before desktop.

**Page shell** — every route mounts through `AppShell` (Sidebar + MobileNav). New pages use it; do not hand-roll navigation.

**Analytics** — user-facing features ship with their events wired in the same PR. A feature merged without instrumentation is a feature you can't evaluate.

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

## Key modules

| Path | Purpose |
|---|---|
| `src/lib/anonId.ts` | Mints/persists browser UUID (`tara-anon-id`) |
| `src/lib/countdown.ts` | `daysUntil`, `tripPhase`, `tripPhaseCopy` |
| `AppShell` | Sidebar + MobileNav wrapper for all routes |
| `/api/health` | Keep-alive endpoint |

## Reference

Full plan: `docs/build-plan.md`
Active tasks: `docs/tasks/`
