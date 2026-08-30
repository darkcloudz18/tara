-- Task 07 — Bucket → dated lakad conversion
--
-- Adds a status column to itineraries so the lifecycle cron (later) can
-- query dated but not yet completed trips. Values: draft → dated →
-- active → completed. Anything created through the /bucket date prompt
-- lands as 'dated'.
--
-- start_date and end_date already exist on itineraries; only status is
-- new. Index on (status, start_date) is what the future lifecycle job
-- will read.

alter table public.itineraries
  add column if not exists status text not null default 'draft';

create index if not exists idx_itineraries_status_start_date
  on public.itineraries (status, start_date);
