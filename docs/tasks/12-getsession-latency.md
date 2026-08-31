# Task 12 — Investigate Supabase `getSession()` ~7.7s cold-load latency

**Branch:** `investigation/supabase-getsession-latency`
**Blocks:** cleaning up the sidebar workarounds in Task #29 follow-up (currently reserving a 164px min-height and running a retry-on-SIGNED_IN dance to paper over the slow SDK path)

## Why

The Sidebar audit at commit `<recent>` measured `supabase.auth.getSession()` blocking for ~7.7s on cold loads before resolving. That single delay is the upstream cause of everything else we've patched around it:

- The account row's `getSessionSafe` 3s timeout was firing before the real session arrived (flashed "Sign in" for ~4s).
- The trip fetch was racing that same slow auth and coming back empty for users who really do have trips, latching the sidebar into a wrong "Start your lakad" state.
- The hero card would land 8–12s in, moving the nav ~116px and scoring 0.20 CLS on desktop, 0.50 CLS on mobile-narrow.

Downstream fixes shipped so far:

- UserContext reads the persisted session synchronously from `localStorage` (`sb-<ref>-auth-token`) so the account row resolves in <90ms.
- Sidebar's trip fetch keys on `user?.id`, not the full user object, so Supabase's fresh-reference `SIGNED_IN` re-fire doesn't restart it.
- Sidebar re-fetches on `INITIAL_SESSION` / `SIGNED_IN` and only latches `tripsResolved` once one of those events arrives, so an auth-raced empty result doesn't stick.
- Sidebar hero slot has a 164px reservation so late-arriving cards don't shift the nav.

All of the above are workarounds. The real defect is why `getSession()` blocks for 7s in the first place.

## Hypothesis

Supabase JS v2 serialises auth operations through a Web Locks acquisition on `lock:sb-<ref>-auth-token`. `getSession()` acquires that lock; if the SDK's initial `_recoverAndRefresh` is already holding it (or if a second `SupabaseClient` instance on the same origin is racing for it), the caller waits.

Consistent with this: an earlier probe in this session found that a same-origin iframe's Supabase client never resolved a session while the top-level client was signed in — classic contention behaviour on the `navigator.locks` API.

**Where to start looking:**

1. **Stray second `SupabaseClient` instance.** Grep for anywhere the singleton is bypassed:
   ```sh
   rg "createClient\(" src
   ```
   The only intended path is `src/lib/supabase.ts:getSupabase()`. If any component reaches into `@supabase/supabase-js` directly, that's a second instance and it will contend for the same lock.

2. **Storage-key / lock-key config.** Confirm the default `storageKey` (`sb-<ref>-auth-token`) is what the SDK is using, and that no explicit `auth: { storageKey: ... }` override is fragmenting behaviour between server/client bundles.

3. **iframes or embeds.** `Providers`, `AppShell`, `HomeClient`, `TripActions`, and any social/embed component. If any renders an iframe on `taraletsgo.vercel.app` (e.g., a preview widget), that iframe is running Supabase JS a second time.

4. **Service worker / next-pwa.** The PWA layer might be spawning a background Supabase client. Check `next.config.js` runtimeCaching for supabase auth URLs and confirm nothing's replaying auth requests off-schedule.

5. **`autoRefreshToken` timing.** SDK default is `true`. If the cached token is close to its 60s expiry margin, `getSession()` triggers a synchronous refresh network call. Should be <1s though, not 7s.

## Explicitly not in scope

- Ripping out `@supabase/supabase-js` — the SDK is correct, we're using it wrong somewhere.
- Adding retry loops or timeouts as more workarounds — the sidebar has enough of those already.
- Migrating to a cookie-based session — bigger project, only worth doing if the underlying lock issue can't be resolved.

## Fixes, in order

1. **Instrument first.** Add a one-liner around `getSupabase().auth.getSession()` in `UserContext` (dev-only, gated on `process.env.NODE_ENV !== 'production'`) that logs `[auth] getSession took Xms` with a `console.time`. Land it, cold-load a few times, confirm the ~7s number in prod-parity conditions.

2. **Grep for stray `createClient` calls** — most likely single-line fix if found.

3. **Check for iframes and embeds** — same treatment.

4. **If neither reveals the culprit**, run the SDK with `debug: true`:
   ```ts
   createClient(url, key, { auth: { debug: true } })
   ```
   And bisect from there — the SDK will log its internal lock acquisitions.

## Acceptance

- [ ] `[auth] getSession took Xms` measurement lands under 500ms on cold load (matches localStorage read + one round-trip if refresh is needed)
- [ ] Sidebar's 164px min-height reservation can be removed without regressing CLS
- [ ] Sidebar's retry-on-SIGNED_IN dance can be simplified back to a single fetch
- [ ] No visible regression in sign-in / sign-out flows

## Report back

1. Which of the four hypotheses was it — stray client, storage config, iframe, or SDK internal
2. Was the fix a config change, a code removal, or an SDK-side upstream issue we're now waiting on
3. Cold-load `getSession()` time before / after
