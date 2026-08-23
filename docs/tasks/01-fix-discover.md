# Task 01 — Fix Discover feed resilience (P0)

**Status:** live defect resolved (see diagnosis), fixes still required as prevention.
**Scope:** homepage `/` only. Do not start the affiliate work.

## Diagnosis

Original symptom (reproduced on production, logged out, 16+ seconds):

```
OPTIONS https://<project>.supabase.co/auth/v1/token?grant_type=refresh_token
statusCode: pending          ← never resolves
```

That was the **only** network request in the entire page lifetime. No request to `/rest/v1/` at all — the Discover query never fires.

**Actual root cause:** Supabase free-tier projects are paused after 7 days of inactivity. Auth calls to a paused project hang indefinitely because the auth service cannot reach the underlying database. The Discover feed's data fetch was awaiting an auth session that could not resolve, and the `finally` that clears the loading flag never ran. Skeletons forever.

Not a code bug in isolation — a resilience gap. The app has no graceful handling for an unreachable Supabase, so every time the free-tier project sleeps (or Supabase has an incident), logged-out visitors see infinite skeletons.

The prior hypothesis — multiple `createClient()` instances causing a Navigator LockManager deadlock — turned out to be wrong. `src/lib/supabase.ts` already exposes a module-scope singleton via `getSupabase()`. Diagnosis step 1 below is still worth running as a spot check.

Hero and template cards render fine because they are static/server-rendered. Only the auth-gated client component hangs.

Note: `/discover` returns 404. The Discover feed is at `/`.

## Fixes, in order

### 1. Supabase client singleton (spot check)

Confirm every `createClient()` call for the browser client resolves to the same module-scope singleton. If any is inside a component body, hook, or render path, that would mint a new client per render — the classic trigger for a Navigator LockManager deadlock where auth calls hang with no error.

Report what you find.

### 2. Decouple the feed from auth

Move the Discover feed to a server component that queries with the anon key at request time, with `revalidate`. No `getSession()` anywhere in its path.

Auth-dependent UI (saved state, "add to my lakad") becomes a separate client component that mounts after and never blocks the feed.

Side benefit: server-rendered feed content becomes indexable, which matters for the SEO strategy.

### 3. Timeout every auth call

```ts
Promise.race([
  supabase.auth.getSession(),
  new Promise(r => setTimeout(() => r({ data: { session: null } }), 3000))
])
```

On timeout, treat as logged out and render. Never leave an auth call unbounded. This is the fix that would have turned yesterday's outage into a "loading failed, try again" instead of infinite skeletons.

### 4. Four states

Loading (skeleton, **max 5s** then error), error (cause + **Try again**), empty (invitation), loaded.

- Error: *"Couldn't load destinations. Check your connection and try again."*
- Empty with filters: *"No beaches match these filters."* + **Clear filters**

### 5. Grid layout

Cards currently render as one narrow centred column with large dead space both sides. Make it responsive: 1 col mobile / 2 tablet / 3–4 desktop, inside a max-width container.

### 6. Caching — not a region change

**Do not pin a Vercel region.** Supabase is in `us-east-1`; Vercel's default `iad1` already matches. Changing it would split functions from the database.

Instead, since users are in the Philippines and the data is in Virginia, lean on caching so most visitors never hit origin:

- `export const revalidate = 300` on the Discover feed (tune later)
- Verify `cache-control` headers on the deployed route
- Confirm cache HITs from a Manila-region check after deploy

The feed is identical for all anonymous visitors — it should be served from the edge, not regenerated per request. Bonus: cached HTML keeps serving while the DB is paused.

### 7. Sentry

Install and wire up. This ran broken in production undetected — that is the actual root cause of how long it lasted. A pinged alert when a paused DB started hanging auth calls would have caught this in minutes, not weeks.

## Also fix while here

**PWA install prompt** fires on first load within seconds, including on the 404 page, and overlaps content. Gate behind: second visit OR one lakad created. Never on error routes. Dismissal persists 30 days.

## Acceptance

- [ ] Logged out, hard refresh: destinations render within 3s
- [ ] Logged out with a stale/invalid token in localStorage: still renders
- [ ] Logged in: renders, saved state appears after
- [ ] Network throttled to Slow 3G: skeleton → content or error, never infinite
- [ ] Supabase unreachable (block the domain in devtools): error state with retry, not a hang
- [ ] 375px: single column, no horizontal scroll
- [ ] View source: destination names present in initial HTML
- [ ] PWA prompt does not appear on first visit or on 404

## Report back

1. Where `createClient()` was being called, and whether the singleton is genuinely enforced
2. Whether the Discover data path still touches auth after the server-component move
3. Any auth call in the app still lacking a timeout wrapper
