# Task 14 — Destination becomes optional in `/trip/new`

**Branch:** `feat/destination-optional`
**Spec:** `docs/launch-plan.md` A1 · `docs/smart-build-spec.md`
**Blocks:** Task 17 (suggestion engine needs the "not sure" branch to route into).

## Why

`/trip/new` currently gates Continue on "Where are you going?" That's the one question the target user — someone who wants to travel but doesn't know where — can't answer. Fixing this is the product-defining change in the launch plan.

## Scope

- Add **"Not sure yet — help me pick"** alongside the popular-destination pills on step 1.
- Taking that path skips destination; Continue enables on the other answers.
- Existing destination-known path unchanged — do not break it. Both routes feed the same wizard.
- Audit steps 2 and 3: confirm **days**, **budget per person per day**, **month/exact dates**, and **origin** are all collected. Add whatever's missing. Origin field already exists — keep it, remember the answer.
- Remember all answers for the Smart Build suggestion step.

## Steps (one commit each)

1. UI: add "Not sure yet — help me pick" option next to the destination pills. Mobile-first at 375px.
2. Wizard state: carry a `destinationKnown: boolean` through the flow. Continue enables regardless of destination when false.
3. Audit steps 2–3 for days / budget / origin / month-or-dates. Fill gaps.
4. Analytics: `wizard_destination_mode_selected { mode: 'known' | 'not_sure' }` on step 1, `wizard_step_completed { step, destinationKnown }` on each step.
5. Logged-out + logged-in verification. 375px verification. Typecheck + lint.

## Done when

A user with no destination in mind can complete the wizard end-to-end without touching the destination field. The existing destination-known path still works. Analytics fire on both branches.

## Not in scope

The suggestion step itself (Task 17). This task leaves the "not sure" branch landing on a placeholder "Smart Build coming next" screen or the existing results view — Task 17 wires in the real engine.
