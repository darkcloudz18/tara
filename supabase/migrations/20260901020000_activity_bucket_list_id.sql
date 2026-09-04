-- Track which bucket_list row (if any) an activity was seeded from.
--
-- Task 10's BucketSuggestions component currently detects "already
-- added" state by matching activity.title + activity.location against
-- the bucket item. That's fragile: rename the activity in the builder
-- and it detaches from its source. A real fk removes the ambiguity and
-- lets future features attribute placements to their bucket save
-- (e.g. surface "these places came from your bucket" in the day view).
--
-- Nullable — activities can also be entered manually with no bucket
-- origin, and we don't want to require callers to backfill.
--
-- ON DELETE SET NULL rather than CASCADE — a user cleaning up their
-- bucket list shouldn't lose activities they've already scheduled on
-- a trip. The reference just becomes null.

alter table public.itinerary_activities
  add column if not exists bucket_list_id uuid
    references public.bucket_list(id) on delete set null;

create index if not exists idx_itinerary_activities_bucket_list_id
  on public.itinerary_activities (bucket_list_id)
  where bucket_list_id is not null;
