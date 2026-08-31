# Task 13 — Vercel edge caching for public routes

**Branch:** `perf/edge-caching`
**Blocked by:** none — pure perf work, no user-visible surface changes
**Depends on downstream:** Supabase Pro (or careful `s-maxage` tuning), since we may want longer cache TTLs than the free tier's connection pool likes

## Why

Every request to `/` currently round-trips to Vercel origin and then to Supabase Singapore before rendering. Response headers on production right now:

```
cache-control: public, max-age=0, must-revalidate
age: 0
```

That's the Next.js default — CDN can't serve a stored copy without asking origin. For public, indexable, high-traffic routes (Discover, templates, shared trip pages) this is money left on the table: the same visitor from Manila triggers the same Supabase query the next visitor from Manila does, seconds later.

Traffic today is us. That's exactly the moment to add caching — before real users show up, before content decisions get baked into non-cacheable patterns, and before we're debugging performance regressions with users watching.

## Scope

- Add `export const revalidate = <seconds>` to genuinely public routes so Vercel's edge stores a rendered response and re-generates on a schedule instead of on every request
- Add `Cache-Control: s-maxage=X, stale-while-revalidate=Y` on public API routes (`/api/health` at minimum) so the CDN answers them
- Confirm the dynamic auth-scoped routes stay dynamic — nothing to cache there
- Instrument enough to see whether the cache is actually hitting

## Explicitly not in scope

- `unstable_cache()` around Supabase reads inside dynamic routes — that's a different lever, adds coordination complexity, and can go in a follow-up if the ISR pass isn't enough
- CDN cache purge automation on content updates — templates are static in code, `places` seed data changes rarely enough to accept the stale window
- Redis / KV — Vercel edge cache is free and adequate for our volume
- Cache warming crons — cold-cache visitors already work today; the goal is to make warm-cache visitors faster, not to eliminate cold hits

## What to cache and for how long

### `/` (Discover feed)

Public, SSR'd from `places` + `curated_videos`. `revalidate = 60`. One minute stale is invisible for content that changes maybe once per week today, and it means a single Manila visitor "warms" the edge cache for everyone downstream of that PoP.

### `/templates`

Templates live in `TRIP_TEMPLATES` (static TS constant). No DB. Can be fully static — no revalidate needed unless we start driving templates from Supabase later. Confirm the route is already `○ (Static)` in the build output and add a `Cache-Control: public, s-maxage=31536000, immutable` header via `next.config.js` headers config if we want to eliminate the revalidate round-trip too.

### `/trip/[id]` (public share view)

Already `ƒ (Dynamic)`. Add `revalidate = 300` and it becomes ISR — the shared link URL will serve from cache for 5 minutes at a time. Owner edits invalidate via `revalidatePath` on the mutation path. Anonymous share visitors get near-instant responses.

### `/api/health`

Called by the keep-alive cron every ~5 minutes. Add `Cache-Control: public, s-maxage=30, stale-while-revalidate=60` so the edge answers within any 30-second window without touching origin.

### Everything else

- `/bucket`, `/profile/*`, `/dashboard`, `/trip/[id]/edit`, auth pages — session-scoped, never cache
- `/opengraph-image` — already generated per-trip, add `revalidate = 3600` matching typical share-preview cache expectations

## Fixes, in order

### 1. Measure baseline

Before touching anything, capture the current numbers so we know the fix worked:

- `curl -sI https://tara-letsgo.vercel.app/` — record TTFB from Manila / from another region
- Vercel dashboard → Analytics → response time p50/p95 for `/`
- Supabase dashboard → Database → query count over the last hour

### 2. Add `revalidate` to the four routes above

One-liner per route file:

```ts
// src/app/page.tsx
export const revalidate = 60
```

Deploy. Confirm build output still shows `/` as `○ (Static)` (with the revalidate window it becomes ISR-static). Curl the URL, look for `age: <n>` on the second hit — that's the CDN answering from cache.

### 3. Add `Cache-Control` on `/api/health`

```ts
// src/app/api/health/route.ts
export async function GET() {
  return new Response(JSON.stringify({ ok: true }), {
    headers: {
      'Content-Type': 'application/json',
      'Cache-Control': 'public, s-maxage=30, stale-while-revalidate=60',
    },
  })
}
```

### 4. Verify the dynamic routes stay dynamic

`/bucket`, `/dashboard`, `/profile`, `/trip/[id]/edit` should not have `revalidate` set. Check the build output after step 2 — they should still show as `ƒ (Dynamic)`. If any accidentally flipped to static, revert.

### 5. Wire invalidation on the mutation paths

Any server action that changes shared/public content needs a `revalidatePath` call. Today that's:

- Trip visibility toggle (`is_public` → true) — call `revalidatePath('/trip/[id]', 'page')`
- Nothing else meaningful yet; add hooks as new mutations land

## Acceptance

- [ ] `curl -sI https://tara-letsgo.vercel.app/` on a second request shows `age: > 0` and `x-vercel-cache: HIT`
- [ ] Supabase query count during a typical browse session drops meaningfully (target: 80% reduction on `/` since we're not hitting DB per request)
- [ ] Signed-in visitors still see fresh data — no stale personalization sneaks in via a cached response
- [ ] Making a public share of a private trip invalidates `/trip/[id]` and the next fetch reflects the new visibility
- [ ] Vercel Analytics p50 response time on `/` drops (specific target: under 200ms from any region with a warm cache)
- [ ] Typecheck, lint, and build all clean

## Report back

1. Baseline vs post-change p50/p95 response times on `/` from Vercel Analytics
2. Supabase query count delta over an equivalent traffic window
3. Any route that we thought was static and turned out to be dynamic once we looked (or vice versa) — worth documenting the actual boundary
