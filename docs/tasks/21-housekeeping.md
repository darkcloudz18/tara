# Task 21 — Housekeeping before launch

**Branch:** `chore/launch-housekeeping`
**Spec:** `docs/launch-plan.md` A8

## Why

The last-mile items that aren't large enough to be their own task but will all break at launch if forgotten.

## Scope

### Sitemap

- Include static routes + published destinations + published places. Drafts excluded.
- `lastmod` from `verified_at` for places/destinations, `updated_at` for everything else.
- `robots.txt` already points to `/sitemap.xml` from the taralakad.com cutover — verify.

### Supabase auth URL config

In the Supabase dashboard for the Singapore prod project:

- Site URL → `https://taralakad.com`
- Redirect allow-list → `https://taralakad.com/**` (and whichever Vercel preview wildcard the team uses). Add explicit `/auth/callback` entry.

Without this, password reset and OAuth land on the Vercel subdomain and break.

### Analytics for the Smart Build + Discover flow

Confirm every new event from Tasks 14, 17, 18, 19, 20 is wired and visible in PostHog:

- `wizard_destination_mode_selected`
- `smart_build_submitted` / `smart_build_results_shown` / `smart_build_refusal_shown` / `smart_build_result_clicked`
- `smart_build_draft_created`
- `plan_from_card_clicked`
- `destination_page_view` / `place_page_view`

Create one PostHog funnel: `wizard_destination_mode_selected (mode='not_sure') → smart_build_results_shown → smart_build_result_clicked → smart_build_draft_created`.

### Also already-shipped — leave struck in `build-plan.md`

- ~~AppShell retrofit~~ (shipped `8766db4`).
- ~~`NEXT_PUBLIC_APP_URL` → taralakad.com~~ (shipped with the domain cutover).

## Steps

1. Sitemap updates — static + published only. Verify in staging.
2. Supabase auth URL config — update in dashboard, test password reset end-to-end.
3. PostHog event audit — fire each event once in dev, confirm it lands.
4. PostHog funnel configured.
5. Walk the whole flow once, logged out, on a phone, on mobile data (per CLAUDE.md "Before finishing any task").

## Done when

Published-only sitemap live, Supabase auth URL config matches `taralakad.com`, every new analytics event visible in PostHog, the Smart Build funnel view exists.

## Not in scope

Supabase Pro signup, custom domain changes, Sentry — tracked in `docs/launch-plan.md` Track C.
