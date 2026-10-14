# Task 19 — Discover → action

**Branch:** `feat/discover-plan-here`
**Spec:** `docs/launch-plan.md` A5

## Why

Place cards currently only save. Save is low-intent capture. The user who taps a card wanting to go needs a route to the builder — one tap.

Also: feed cards show likes and comments. Social counts look like seed data (same fake-metrics problem as the old "500+") and the mechanics don't feed the funnel. Remove them.

## Scope

### Add

- Second action on every place card (Discover feed, search, destination pages): **"Plan a trip here"** → opens `/trip/new?destination=<slug>` with that destination pre-selected. Should sit next to the existing bucket-save control and read as secondary — save stays primary.
- Analytics: `plan_from_card_clicked { placeId, destinationSlug, surface }`.

### Remove

- Likes count + heart control on feed cards.
- Comments count + comment control on feed cards.
- Any ratings / review-count displays that aren't backed by real data — list them in the PR description. If a real number exists, keep it. If not, remove the slot.
- Any corresponding DB fields can stay — this is a UI pass, not a schema change. If RLS/API endpoints become unused, note them but don't delete in this task.

### Audit

Grep the Discover and template surfaces for invented numbers. Common culprits: fake avatars, "x people saved this", "x itineraries created". Everything either becomes a real number or disappears.

## Steps

1. Add "Plan a trip here" control to the shared place card component. Keep save primary.
2. Wizard pre-fill: `/trip/new?destination=<slug>` resolves the destination and skips the "not sure" branch (Task 14 handles both modes).
3. Remove likes / comments / counts from feed cards and card component.
4. Audit sweep: list every number on Discover and templates; triage keep / replace / remove.
5. Analytics.
6. Verify at 375px, logged-out and logged-in. Typecheck + lint.

## Done when

Every place card has Save + "Plan a trip here" as its only engagement actions. The feed has no invented metrics. Tapping "Plan a trip here" from a Boracay card lands on `/trip/new` with Boracay pre-selected and the wizard primed to continue.

## Not in scope

Backend cleanup of now-unused like/comment tables. Keep them — pre-launch isn't the moment to drop columns that another branch might read.
