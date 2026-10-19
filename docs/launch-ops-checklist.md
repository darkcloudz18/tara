# Launch ops checklist

Manual steps for launch that aren't code. Pair with the automated bits
Task 21 shipped (sitemap, published-only filter).

## Supabase auth URL config

**Done** (verified 2026-10-19 against prod). Site URL set to `https://taralakad.com`, redirect allow-list includes `https://taralakad.com/**` and `https://taralakad.com/auth/callback`. End-to-end verified: `/forgot-password` → reset email → link routes through `supabase.co/auth/v1/verify?...&redirect_to=https://taralakad.com/reset-password` and lands on taralakad.com.

Previously:

In the Singapore prod project (`zgbidqgvnvjoinlgrbvh`):

1. **Project settings → Authentication → URL configuration**
2. **Site URL:** `https://taralakad.com`
3. **Redirect URLs** (allow-list):
   - `https://taralakad.com/**`
   - `https://taralakad.com/auth/callback`
   - `https://*.vercel.app/**` *(preview branches — remove once launched if you don't want preview auth)*

Without this, password reset + magic links land on the Vercel subdomain and 404 the user.

## PostHog event audit

Every event the Smart Build + Discover flow fires. Each has a line in the codebase (grep audit done in Task 21 PR body).

| Event | Source | Trigger |
|---|---|---|
| `wizard_destination_mode_selected` | `TripWizard.tsx` | Step-1 commit (Continue clicked) |
| `wizard_step_completed` | `TripWizard.tsx` | Every Continue click |
| `smart_build_submitted` | `trip/new/page.tsx` | 'Not sure' path reaches handleWizardComplete |
| `smart_build_results_shown` | `trip/new/page.tsx` | Ranker returns |
| `smart_build_refusal_shown` | `trip/new/page.tsx` | Per refusal in the results |
| `smart_build_result_clicked` | `trip/new/page.tsx` | 'Pick this' button |
| `smart_build_draft_created` | `trip/new/page.tsx` | Draft insert succeeds |
| `plan_from_card_clicked` | `PlaceCard` / `FeedPlaceCard` / `SearchResultRow` | 'Plan a trip here' link |
| `destination_page_view` | `destinations/[slug]/page.tsx` via `PageViewTracker` | First paint |
| `place_page_view` | `places/[slug]/page.tsx` via `PageViewTracker` | First paint |

Walk the full flow once in dev with the Network tab filtered to `posthog`:

- [ ] Open `/trip/new`, pick 'Not sure yet' → `wizard_destination_mode_selected` with `mode: 'not_sure'` fires on step-1 Continue.
- [ ] Finish wizard → `smart_build_submitted` + `smart_build_results_shown` fire.
- [ ] If a saved bucket place belongs to an unfit destination → `smart_build_refusal_shown` fires per refusal.
- [ ] 'Pick this' → `smart_build_result_clicked` fires, then `smart_build_draft_created` after the write.
- [ ] From `/discover` → 'Plan a trip here' on a card → `plan_from_card_clicked` fires with the right `surface`.
- [ ] `/destinations/<slug>` → `destination_page_view` on load.
- [ ] `/places/<slug>` → `place_page_view` on load.

## PostHog funnel

Create one new funnel in PostHog: **Smart Build conversion**.

Steps:
1. `wizard_destination_mode_selected` where `mode = 'not_sure'`
2. `smart_build_results_shown`
3. `smart_build_result_clicked`
4. `smart_build_draft_created`

Window: 1 hour between steps.

If any step drops a cliff, you know what to iterate on. If step 2 → 3 is flat, people see results but don't pick — likely the UI is unconvincing or the suggestions are off. If step 3 → 4 is flat, the draft generator is breaking somewhere (anon users bouncing to login?).

## Pre-launch walk-through

Per CLAUDE.md 'Before finishing any task':

- [ ] Logged out, on a phone, on mobile data: hit `/`, Discover, 'Plan a trip here' on a card, Smart Build from `/trip/new` 'Not sure yet', pick a result, draft opens in builder. (Only possible once destinations are populated via Task 16's admin.)
- [ ] Logged in: same flow.
- [ ] `/destinations/<slug>` on a live phone — hero loads, places grid readable at 375px, trust block visible.
- [ ] `/places/<slug>` on a phone — fee/duration/booking above the fold, OG image renders in a Messenger send-to-self test.
- [ ] `/forgot-password` → reset email → reset flow completes on `taralakad.com`.

## Not covered here

These live in `docs/launch-plan.md` Track C and aren't code-releasable:

- Supabase Pro upgrade
- Sentry DSN set on Vercel
- Facebook / TikTok / Instagram page claims
- Walking 10 real users through the flow (C3)
