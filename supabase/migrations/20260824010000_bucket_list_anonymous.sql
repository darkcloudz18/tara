-- Allow anonymous visitors to save bucket-list items scoped to a
-- browser-generated UUID (localStorage tara-anon-id, sent as the
-- x-anon-id request header). On signup, a separate migration/RPC
-- reassigns anon rows to the new user_id.

alter table bucket_list alter column user_id drop not null;
alter table bucket_list add column if not exists anon_id text;
create index if not exists bucket_list_anon_id_idx on bucket_list (anon_id);

-- Anonymous read access scoped to matching x-anon-id header.
create policy "anon can select own bucket items"
  on bucket_list for select
  using (
    user_id is null
    and anon_id is not null
    and anon_id = current_setting('request.headers', true)::json->>'x-anon-id'
  );

-- Anonymous insert. Row must have no user_id and an anon_id matching the header.
create policy "anon can insert own bucket item"
  on bucket_list for insert
  with check (
    user_id is null
    and anon_id is not null
    and anon_id = current_setting('request.headers', true)::json->>'x-anon-id'
  );

-- Anonymous delete for the same visitor.
create policy "anon can delete own bucket items"
  on bucket_list for delete
  using (
    user_id is null
    and anon_id is not null
    and anon_id = current_setting('request.headers', true)::json->>'x-anon-id'
  );

-- Verify header-based RLS works against your project before shipping to
-- prod. If Supabase forwards the x-anon-id header but current_setting
-- returns null, fall back to the JWT approach: sign the anon_id
-- server-side into a short-lived JWT and read auth.jwt() ->> 'anon_id'.
