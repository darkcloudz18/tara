# Smart build — from "I want to travel" to an editable lakad

## The problem being solved

The user this is for: wants to travel, watches travel content, hasn't gone. Not blocked by money or leave in the abstract — blocked by **not knowing what a trip costs or how long it really takes**, so it stays vague, and vague feels impossible.

Every travel site starts with a destination. This starts with what you have.

> "I have ₱20,000, 3 days, leaving from Manila, in November — where can I actually go?"

Nobody answers that. Tara can.

---

## The full flow

```
Browse places (no intent)
      ↓  save what appeals
Bucket list                      ← personal input, never required
      ↓  "I'm ready to go"
Smart build — 4 questions
      ↓
Draft lakad, pre-filled          ← EDITABLE, not fixed
      ↓  user adjusts, adds, removes
Their lakad
      ↓
Share · book · go
```

**The smart build writes into the existing builder.** It is a generator, not a separate product. Nothing about the current editing experience changes — it just no longer starts blank.

---

## The questions

Four. Asked once, answers remembered.

| Question | Why it's needed |
|---|---|
| **How many days?** | Decides which destinations are even possible |
| **Budget per person?** | Decides tier of stay/activities, and filters destinations |
| **Where are you starting from?** | Travel time is measured from somewhere. Manila ≠ Cebu ≠ Davao. |
| **When? (month, or exact dates)** | Seasonality, and exact dates convert straight to a dated lakad |

Do **not** ask for a destination. That is the question the user can't answer — it's the whole reason they're here.

Keep it to one screen on mobile. Tappable ranges, not free text, except dates.

The existing `/trip/new` wizard retains the destination path for users who already know where they're going. Smart build adds "Not sure yet — help me pick" alongside the popular-destination pills (Task 14) and routes those users into this flow.

---

## Works with an empty bucket list

Critical: plenty of users arrive already wanting to go. Someone who searched "Boracay itinerary" won't browse first.

- **Bucket list empty** → build from the questions alone. Still good, just not personal.
- **Bucket list has saved places** → prioritise destinations containing them, and say so: *"You saved Sugba Lagoon — here's Siargao in 4 days."*

Saved places make it feel personal. They are never a prerequisite.

---

## Matching logic

Rank destinations by:

1. **Feasibility** — `min_viable_days <= days_available`. Hard filter, not a preference.
2. **Travel time** — `travel_time_from(origin)`. On a 2-day trip, 6 hours door-to-door kills it.
3. **Budget fit** — destination's budget band vs. what they said.
4. **Bucket list overlap** — count of saved places in that destination.
5. **Seasonality** — `best_months` includes their month.

Then fill days from the destination's places, grouped by `part_of_tour`, respecting `not_same_day_as`.

### Required destination fields

```sql
alter table destinations
  add column min_viable_days int,              -- below this, don't suggest it
  add column travel_times    jsonb;            -- {"manila": 240, "cebu": 90} minutes, door to door
```

`min_viable_days` is the field that makes short-trip suggestions honest. El Nido is 4+. Boracay is 2. Baguio is 1.

`travel_times` is door-to-door and realistic — flight plus transfer plus the wait, not flight duration.

---

## Honest refusals — this is the product

When the answers don't fit, **say so**. This is the single most valuable behaviour in the whole feature.

> "El Nido needs 4+ days — the transfer from Puerto Princesa eats most of two of them. With 3 days from Manila, Boracay or Bohol work well. El Nido stays in your bucket list for when you have longer."

What this does:
- Stops someone booking a trip that goes wrong
- Proves the tool knows something real
- Keeps the saved place alive instead of deleting the dream

A tool that cheerfully builds an impossible itinerary is the tool that ruins someone's holiday. Never do it.

Same pattern for budget: if the number genuinely can't cover a destination, say what it *can* cover rather than silently degrading the suggestion.

---

## Output: a draft, not a verdict

The result opens in the existing builder, fully editable.

- Every suggested item is removable
- Days can be reordered, activities swapped
- Empty slots invite additions rather than looking broken
- Shows a running cost estimate as they edit
- Saved places that made the cut are marked as such

**Why editable matters:** a trip someone shaped themselves is one they're far more likely to actually take. The draft removes the blank page; the editing creates ownership.

---

## Where money appears

Nowhere in the questions. Nowhere in the results list.

Booking CTAs appear **inside the draft lakad**, beside the activities and stays already in it — and only once the lakad has dates. That's the moment someone has decided and needs to act.

The running cost estimate is a utility, not a sales device. It should be honest even when the honest number is discouraging.

---

## Build order

| # | Work | Task |
|---|---|---|
| 1 | `min_viable_days` + `travel_times` on destinations; populate for existing four | Task 16 |
| 2 | Question flow — 4 steps, mobile-first, one screen | Task 14 |
| 3 | Matching query (plain SQL ranking, no ML) | Task 17 |
| 4 | Draft generation into the existing lakad structure | Task 18 |
| 5 | Refusal messaging when nothing fits | Task 17 |
| 6 | Bucket list integration — prioritise, explain, never require | Task 17 |
| 7 | Running cost estimate | Task 18 |

Step 1 is research, not code, and it gates everything. Four destinations × two fields — an hour's work (Track B2) that makes the whole feature possible.

---

## What this doesn't change

The builder, the bucket list, places data, sharing, the T-minus lifecycle. All unchanged. This is a front door onto what exists.

---

## The test

Would this have gotten *you* to book a trip?

If the answer is "it told me Bohol is 3 days, roughly ₱18k, and I'd fly to Tagbilaran" — yes. If it returns a browse experience with prices on cards, no, and that's what exists today.
