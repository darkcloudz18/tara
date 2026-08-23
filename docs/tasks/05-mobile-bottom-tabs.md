# Task 05 — Mobile bottom tabs

**Status:** planned work from `docs/build-plan.md` Phase 1 Step 5.
**Scope:** the persistent mobile bottom-tab bar: `Discover · Create · My lakad · Profile`. Rendered on every real app screen at mobile widths, always one tap away, tap targets ≥44px per CLAUDE.md mobile budget.

**Explicitly not** in scope:

- Redesigning the desktop sidebar (Phase 1.5 has already sized it up).
- Rewriting `/dashboard` — the "My lakad" tab points there as it is.
- Notifications page or notification UX. This task only decides where the entry point lives on mobile.
- Admin and auth routes — they keep their own shells.

## Observations

Ground truth as of `main @ 945c473`.

**Current mobile bar isn't the plan's shape.** `src/components/layout/MobileNav.tsx:41-46` after the Task 02 search-drop:

```ts
const navItems = [
  { icon: Compass,    label: 'Discover',   href: '/',            badge: 0 },
  { icon: PlusCircle, label: t.planTrip,   href: user ? '/trip/new' : '/login', badge: 0 },
  { icon: Bell,       label: 'Alerts',     href: user ? '/notifications' : '/login', badge: unreadCount },
  { icon: User,       label: 'Profile',    href: user ? '/profile' : '/login', badge: 0 },
]
```

Deltas to the plan's `Discover · Create · My lakad · Profile`:

1. `Plan trip` → `Create` label change (href unchanged, still `/trip/new`).
2. Add a `My lakad` tab pointing at `/dashboard` (the itineraries list).
3. `Alerts` drops out of the bar — the tab count stays at four. Notification entry moves off the primary bar.

**MobileNav is not persistent.** Grep for `MobileNav` returns only three mount sites: `HomeClient.tsx`, `trip/new/page.tsx`, `profile/[username]/page.tsx`. Everywhere else — `/dashboard`, `/notifications`, `/profile`, `/trip/[id]`, `/trip/[id]/edit`, `/search`, `/templates`, `/ai-planner`, `/offline`, and every route the app group covers — has **no** mobile bottom nav at mobile widths. Build plan is explicit about "Always one tap" — needs to render on every real app screen.

**No app-shell layout to hang persistence on.** The app uses route groups (`(auth)`, `(main)`) but no shared client layout wraps them in a way that could host `<MobileNav>`. Root `layout.tsx` is server-side and can't own `user` state.

**Approach:** a new `<AppShell>` client wrapper that mounts `<Sidebar>` (desktop) and `<MobileNav>` (mobile), and each app page wraps its JSX return with it. Explicit, grep-verifiable, no route restructuring. ~10 pages get a small refactor.

Route-group layouts and Providers-level injection were considered and rejected: the first would force route restructuring since `/`, `/trip/*`, `/search` don't share a group; the second would make `Providers.tsx` router-aware and forces conditional-hide logic for auth and admin routes.

**Alerts placement once they're off the bottom bar:** a Bell icon in `Header.tsx` at mobile widths for logged-in users, mirroring what the sidebar shows on desktop. Header already has real estate on the right, keeps notifications one tap away, and doesn't need a new route. Requires threading `user` into `Header`.

**Tap targets are already close to 44px.** Current MobileNav uses `min-w-[64px] min-h-[56px]` on each tab. Passes.

**Active state on `/`.** `MobileNav.tsx:36-39` treats `/` specially (`isActive('/')` requires exact match). The three tabs pointing to `user ? realHref : '/login'` all match `/login` at once when logged out — Task 02 already fixed the collision key on this, but the visual "all three active on /login" behavior is still there. Worth a look during the tab overhaul.

## Fixes, in order

### 1. Rewrite the tab set

`MobileNav.tsx`:
- `Discover` → `/` (Compass icon) — unchanged
- `Create` → `/trip/new` for logged-in, `/login?redirect=/trip/new` for anon (PlusCircle icon). Rename `t.planTrip` on this surface to hardcoded `Create` for now; the localization hook still returns something like "Plan trip" and we want the shorter word here.
- `My lakad` → `/dashboard` for logged-in, `/login?redirect=/dashboard` for anon (Map icon). Sentence case — the icon and label together mean "your saved trips list".
- `Profile` → `/profile` for logged-in, `/login?redirect=/profile` for anon (User icon).

Drop `Alerts` from the array entirely. Drop the `notificationService.subscribeToNotifications` block in the mount effect since the badge lives elsewhere now.

Use `?redirect=` params so post-login lands the user where they were headed. `TripActions.tsx` already uses this pattern.

### 2. Move Alerts to the header (mobile)

`Header.tsx`:
- Accept a `user?: User | null` prop (or read via `getUserSafe` inside — Header is a client component; either works).
- When mobile and logged in, render a Bell icon with the unread count, opening `/notifications`. Reuse the coral-500 badge styling from the old MobileNav Alerts item so it looks familiar.
- Desktop keeps the sidebar's Bell entry — no change.

If `user` isn't already threaded through `Header`, that's the source of one extra prop drill from `HomeClient` and each other page that renders Header. Small change.

### 3. Persistent mount via an `AppShell` client component

Create `src/components/layout/AppShell.tsx`:

```tsx
'use client'
export default function AppShell({ children, user }: { children: React.ReactNode; user: any }) {
  return (
    <>
      <Sidebar user={user} />
      <div className="lg:ml-[260px] pb-16 lg:pb-0">{children}</div>
      <MobileNav user={user} />
    </>
  )
}
```

`pb-16` gives content room to breathe above the bottom bar so nothing gets covered — MobileNav is ~64px tall.

Wrap the JSX return of each app screen with `<AppShell user={user}>...</AppShell>`. Do **not** wrap: `/login`, `/register`, `/forgot-password`, `/reset-password`, `/admin/*` (already has its own layout), `/offline`, and the error/not-found boundaries.

Pages that need to be wrapped:
- `/` (HomeClient — already renders Sidebar + MobileNav, refactor to use AppShell)
- `/dashboard`
- `/notifications`
- `/profile`
- `/profile/[username]`
- `/search`
- `/templates`
- `/ai-planner`
- `/trip/new` (already renders both, refactor)
- `/trip/[id]`
- `/trip/[id]/edit`
- `/help`

Each one's JSX changes from something like:

```tsx
return <div><Sidebar /> ...content... <MobileNav /></div>
```

to:

```tsx
return <AppShell user={user}><...content...></AppShell>
```

`useEffect`-driven `user` state already exists on each — no new fetches.

### 4. Active-state polish

While rewriting `MobileNav`, tighten the "everything highlights on /login" behavior. Simplest fix: `isActive` checks the tab's real target rather than its rewritten `/login` href.

```ts
const isActive = (item: { realHref: string }) => {
  if (item.realHref === '/') return pathname === '/'
  return pathname.startsWith(item.realHref)
}
```

Where `realHref` is `/trip/new`, `/dashboard`, `/profile` etc regardless of auth state.

## Acceptance

- [ ] At 375px on `/`, the bottom bar shows exactly four tabs: Discover · Create · My lakad · Profile
- [ ] Tapping each while logged in navigates to `/`, `/trip/new`, `/dashboard`, `/profile`
- [ ] Tapping each while logged out routes to `/login?redirect=...` and the login page respects the redirect
- [ ] Bell icon appears in the header at mobile widths for logged-in users with an unread count badge; desktop unchanged
- [ ] Bottom bar renders on every one of the pages listed under fix #3
- [ ] Bottom bar does **not** render on `/login`, `/register`, `/forgot-password`, `/reset-password`, `/admin/*`, `/offline`
- [ ] No content is covered by the bar — `pb-16` (or equivalent) on the content wrapper at mobile
- [ ] Active state highlights only the current tab, not three-at-once on `/login`
- [ ] Tap targets remain ≥44px
- [ ] Typecheck clean
- [ ] Anonymous SSR of `/` remains byte-stable (nav injection shouldn't break Task 04's guarantee)

## Report back

1. The list of pages that needed `<AppShell>` retrofit vs the list where it wasn't needed
2. Whether Header now owns `user` state locally (via `getUserSafe`) or receives it via prop
3. Any remaining "3-active tabs on /login" ghosts you spot
4. Whether the sidebar duplicate itineraries fetch (Task 04 report-back item) was resolved as a side effect of AppShell hoisting user state, or if it still stands as its own follow-up
