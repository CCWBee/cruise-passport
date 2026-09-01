-- Social v2: one crew, two routes in. Run after 0001_init.sql (Supabase SQL editor, or `db push`).
-- Idempotent and complete on its own: re-running it is a no-op beyond replacing the functions.
--
-- What changes, and why (see docs/RATIONALISATION.md):
--   * Removing a friend must really revoke, so `unfriend` cuts BOTH edges. Leaving one in place let
--     the removed person come straight back on the next pull.
--   * Membership is now leavable: `leave_group` for members, `delete_group` for the owner (the
--     memberships cascade). An owner leaving would orphan the group, so the RPC refuses.
--   * `group_members` exposes a roster, gated on the caller holding a membership in that group.
--   * Both feeds LEFT JOIN passports, so someone who has joined but not yet synced still appears
--     (the client renders them as pending) instead of being invisible until their first sync.
--   * `group_feed` also returns the groups I share with each person, one row per person, so the
--     client can tag them and can drop them the moment we stop sharing a group.
--
-- Gating is unchanged and deliberate: every function is SECURITY DEFINER with a pinned search_path,
-- reads auth.uid() for itself (never a caller-supplied identity), and is granted to `authenticated`
-- only. Table RLS stays own-row, so there is still no raw code -> payload path.

-- ─────────────────────────────────────────────────────────────────────────────
-- Friendship: cut both edges
-- ─────────────────────────────────────────────────────────────────────────────

-- Remove a friend, both directions. Their edge is keyed by MY code, so look that up rather than
-- trusting anything the caller passed.
create or replace function public.unfriend(p_code text)
returns void
language plpgsql security definer set search_path = public as $$
declare
  v_me   uuid := auth.uid();
  v_mine text;
  v_them uuid;
begin
  if v_me is null then raise exception 'not authenticated'; end if;
  select code    into v_mine from public.profiles where user_id = v_me;
  select user_id into v_them from public.profiles where code = p_code;
  delete from public.friends where user_id = v_me and friend_code = p_code;
  if v_them is not null and v_mine is not null then
    delete from public.friends where user_id = v_them and friend_code = v_mine;
  end if;
end;
$$;

-- ─────────────────────────────────────────────────────────────────────────────
-- Groups: leave, delete, roster
-- ─────────────────────────────────────────────────────────────────────────────

-- Give up my own membership. The owner cannot: an ownerless group would strand its members, so they
-- delete it instead.
create or replace function public.leave_group(p_group uuid)
returns void
language plpgsql security definer set search_path = public as $$
declare
  v_me   uuid := auth.uid();
  v_role text;
begin
  if v_me is null then raise exception 'not authenticated'; end if;
  select role into v_role from public.memberships where group_id = p_group and user_id = v_me;
  if v_role is null then return; end if; -- not a member: nothing to give up
  if v_role = 'owner' then raise exception 'the owner deletes the group instead'; end if;
  delete from public.memberships where group_id = p_group and user_id = v_me;
end;
$$;

-- Delete a group I own. Memberships cascade from the groups foreign key.
create or replace function public.delete_group(p_group uuid)
returns void
language plpgsql security definer set search_path = public as $$
declare v_me uuid := auth.uid();
begin
  if v_me is null then raise exception 'not authenticated'; end if;
  delete from public.groups where id = p_group and owner = v_me;
end;
$$;

-- The roster of a group, but only for someone who is in it. A non-member gets an empty result, not
-- an error, so the client can fall back quietly.
create or replace function public.group_members(p_group uuid)
returns table (code text, name text, colour text, role text, joined_at timestamptz)
language sql security definer set search_path = public as $$
  select p.code, p.name, p.colour, m.role, m.joined_at
  from public.memberships m
  join public.profiles p on p.user_id = m.user_id
  where m.group_id = p_group
    and exists (
      select 1 from public.memberships mine
      where mine.group_id = p_group and mine.user_id = auth.uid()
    )
  order by m.joined_at;
$$;

-- ─────────────────────────────────────────────────────────────────────────────
-- Feeds. Postgres will not change a function's return type in place, so both are dropped first.
-- ─────────────────────────────────────────────────────────────────────────────

drop function if exists public.friend_feed(text);
drop function if exists public.group_feed(text);

-- Everyone I have a live friend edge to. LEFT JOIN: payload is null until their first sync.
create or replace function public.friend_feed(p_cruise text)
returns table (code text, name text, colour text, payload jsonb, updated_at timestamptz)
language sql security definer set search_path = public as $$
  select p.code, p.name, p.colour, pa.payload, pa.updated_at
  from public.friends f
  join public.profiles p on p.code = f.friend_code
  left join public.passports pa on pa.user_id = p.user_id and pa.cruise_id = p_cruise
  where f.user_id = auth.uid();
$$;

-- Every co-member across my groups on this cruise, one row per person, carrying the ids of the
-- groups we actually share. The client replaces its whole group-only roster from this, so a
-- departure on either side drops the person with no purge step.
create or replace function public.group_feed(p_cruise text)
returns table (code text, name text, colour text, payload jsonb, updated_at timestamptz, group_ids uuid[])
language sql security definer set search_path = public as $$
  select p.code, p.name, p.colour, pa.payload, pa.updated_at, array_agg(distinct g.id)
  from public.memberships mine
  join public.groups g          on g.id = mine.group_id and g.cruise_id = p_cruise
  join public.memberships other on other.group_id = mine.group_id and other.user_id <> mine.user_id
  join public.profiles p        on p.user_id = other.user_id
  left join public.passports pa on pa.user_id = other.user_id and pa.cruise_id = p_cruise
  where mine.user_id = auth.uid()
  -- passports is one row per (person, cruise), so grouping on it still yields one row per person.
  group by p.code, p.name, p.colour, pa.payload, pa.updated_at;
$$;

-- ─────────────────────────────────────────────────────────────────────────────
-- Grants. The new functions, plus the two feeds whose grants went with the drop above.
-- ─────────────────────────────────────────────────────────────────────────────

revoke all on function public.unfriend(text), public.leave_group(uuid), public.delete_group(uuid),
  public.group_members(uuid), public.friend_feed(text), public.group_feed(text) from public, anon;
grant execute on function public.unfriend(text), public.leave_group(uuid), public.delete_group(uuid),
  public.group_members(uuid), public.friend_feed(text), public.group_feed(text) to authenticated;
