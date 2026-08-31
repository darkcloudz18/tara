-- Bump `itineraries.updated_at` whenever a child row (day or activity)
-- changes. Without this, adding a place to a trip doesn't move the
-- parent's timestamp, so `order by updated_at desc` — which
-- TripsContext uses to pick the sidebar's "most recent" hero — stays
-- pointed at whichever trip was last saved through the itinerary form.
--
-- Two trigger functions rather than one shared: itinerary_days holds
-- itinerary_id directly, itinerary_activities has to join through
-- itinerary_days to reach the parent. Splitting keeps each function
-- readable.
--
-- SECURITY DEFINER so the update slips past the "Users can manage own
-- itineraries" RLS policy on itineraries — the trigger is invoked as
-- a side-effect of a legal write on the child table (which is already
-- policy-checked), so we don't want the parent update to fail on a
-- separate policy pass.

create or replace function public.bump_itinerary_from_day()
returns trigger
language plpgsql
security definer
set search_path = public
as $$
begin
  update public.itineraries
     set updated_at = now()
   where id = coalesce(new.itinerary_id, old.itinerary_id);
  return coalesce(new, old);
end;
$$;

create or replace function public.bump_itinerary_from_activity()
returns trigger
language plpgsql
security definer
set search_path = public
as $$
declare
  target_itinerary_id uuid;
begin
  select day.itinerary_id
    into target_itinerary_id
    from public.itinerary_days day
   where day.id = coalesce(new.day_id, old.day_id);

  if target_itinerary_id is not null then
    update public.itineraries
       set updated_at = now()
     where id = target_itinerary_id;
  end if;

  return coalesce(new, old);
end;
$$;

drop trigger if exists trg_bump_itinerary_from_day on public.itinerary_days;
create trigger trg_bump_itinerary_from_day
after insert or update or delete
on public.itinerary_days
for each row
execute function public.bump_itinerary_from_day();

drop trigger if exists trg_bump_itinerary_from_activity on public.itinerary_activities;
create trigger trg_bump_itinerary_from_activity
after insert or update or delete
on public.itinerary_activities
for each row
execute function public.bump_itinerary_from_activity();
