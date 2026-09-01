-- Cocktail Passport backend schema.
-- Run this in the Supabase SQL editor (or `supabase db push`) on a NEW project, separate from Bobble.
--
-- Design (see docs/PRODUCTIONISATION.md):
--   * The person is the atom: a stable public `code` (the XXXX-XXXX handle the client generates).
--   * Two social layers: capability friends (edges) and groups (rosters). Payment attaches to a
--     membership slot, never the person (all free today).
--   * READ AUTHORITY = "codes bootstrap, edges authorise": there is no raw code->payload endpoint.
--     Every cross-person read goes through a SECURITY DEFINER RPC gated on a live edge or shared
--     membership, so "Remove friend" truly revokes. Table RLS is own-row only (no self-referential
--     policies -> no RLS recursion). This is the safe, boring pattern; keep it.
--   * Two payloads: the lossy social SPP (`passports`, friend-readable via RPC) and the full,
--     owner-only account backup (`backups`).
--   * Cruise-scoped from day one: passports/backups/groups/feeds carry cruise_id; friendships do not
--     (people are cruise-agnostic; their shared payload for a given sailing is what's per-cruise).

-- ─────────────────────────────────────────────────────────────────────────────
-- Tables
-- ─────────────────────────────────────────────────────────────────────────────

create table if not exists public.profiles (
  user_id    uuid primary key references auth.users on delete cascade,
  code       text unique not null,
  name       text,
  colour     text,
  updated_at timestamptz not null default now()
);

create table if not exists public.passports (
  user_id    uuid not null references auth.users on delete cascade,
  cruise_id  text not null,
  payload    jsonb not null,
  updated_at timestamptz not null default now(),
  primary key (user_id, cruise_id)
);

create table if not exists public.backups (
  user_id    uuid not null references auth.users on delete cascade,
  cruise_id  text not null,
  state      jsonb not null,
  updated_at timestamptz not null default now(),
  primary key (user_id, cruise_id)
);

create table if not exists public.friends (
  user_id     uuid not null references auth.users on delete cascade,
  friend_code text not null,
  created_at  timestamptz not null default now(),
  primary key (user_id, friend_code)
);

create table if not exists public.groups (
  id          uuid primary key default gen_random_uuid(),
  name        text not null,
  owner       uuid references auth.users on delete set null,
  plan        text not null default 'free',   -- 'free' | 'paid' (paid unused today)
  slots       int  not null default 50,       -- capacity; only bites once paid is real
  invite_code text unique not null,
  cruise_id   text not null,
  created_at  timestamptz not null default now()
);

create table if not exists public.memberships (
  group_id     uuid not null references public.groups(id) on delete cascade,
  user_id      uuid not null references auth.users on delete cascade,
  role         text not null default 'member', -- 'owner' | 'member'
  sponsored_by text,                            -- who paid for this slot (unset today)
  joined_at    timestamptz not null default now(),
  primary key (group_id, user_id)
);

-- ─────────────────────────────────────────────────────────────────────────────
-- Row-level security: own-row only for direct access. Everything cross-person is via the RPCs below.
-- ─────────────────────────────────────────────────────────────────────────────

alter table public.profiles    enable row level security;
alter table public.passports   enable row level security;
alter table public.backups     enable row level security;
alter table public.friends     enable row level security;
alter table public.groups      enable row level security;
alter table public.memberships enable row level security;

create policy "own profile"    on public.profiles    for all using (auth.uid() = user_id) with check (auth.uid() = user_id);
create policy "own passport"   on public.passports   for all using (auth.uid() = user_id) with check (auth.uid() = user_id);
create policy "own backup"     on public.backups     for all using (auth.uid() = user_id) with check (auth.uid() = user_id);
create policy "own friends"    on public.friends     for all using (auth.uid() = user_id) with check (auth.uid() = user_id);
-- Groups: the owner manages the row directly; members read it through my_groups()/join_group().
create policy "own groups"     on public.groups      for all using (auth.uid() = owner)   with check (auth.uid() = owner);
-- Memberships: you see and drop only your own; joining is via join_group() (definer).
create policy "own membership" on public.memberships for all using (auth.uid() = user_id) with check (auth.uid() = user_id);

-- ─────────────────────────────────────────────────────────────────────────────
-- RPCs. SECURITY DEFINER so they can enforce capacity and write the reverse friend edge; each pins
-- search_path and is gated on the caller's identity. Grant to authenticated only.
-- ─────────────────────────────────────────────────────────────────────────────

-- Preview a code before adding: name/colour only, never a payload.
create or replace function public.lookup(p_code text)
returns table (code text, name text, colour text)
language sql security definer set search_path = public as $$
  select code, name, colour from public.profiles where code = p_code;
$$;

-- Add a friend by code, both directions, so a one-sided add becomes mutual with no accept flow.
create or replace function public.befriend(p_code text)
returns void
language plpgsql security definer set search_path = public as $$
declare
  v_me   uuid := auth.uid();
  v_mine text;
  v_them uuid;
begin
  if v_me is null then raise exception 'not authenticated'; end if;
  select code             into v_mine from public.profiles where user_id = v_me;
  select user_id          into v_them from public.profiles where code = p_code;
  if v_them is null or v_them = v_me or v_mine is null then return; end if;
  insert into public.friends (user_id, friend_code) values (v_me, p_code)   on conflict do nothing;
  insert into public.friends (user_id, friend_code) values (v_them, v_mine) on conflict do nothing;
end;
$$;

-- Payloads, for this cruise, of everyone I have a live friend edge to.
create or replace function public.friend_feed(p_cruise text)
returns table (code text, name text, colour text, payload jsonb, updated_at timestamptz)
language sql security definer set search_path = public as $$
  select p.code, p.name, p.colour, pa.payload, pa.updated_at
  from public.friends f
  join public.profiles p  on p.code = f.friend_code
  join public.passports pa on pa.user_id = p.user_id and pa.cruise_id = p_cruise
  where f.user_id = auth.uid();
$$;

-- The groups I belong to, on a cruise, with my role.
create or replace function public.my_groups(p_cruise text)
returns table (id uuid, name text, plan text, slots int, invite_code text, role text, members int)
language sql security definer set search_path = public as $$
  select g.id, g.name, g.plan, g.slots, g.invite_code, m.role,
         (select count(*)::int from public.memberships mm where mm.group_id = g.id)
  from public.memberships m
  join public.groups g on g.id = m.group_id
  where m.user_id = auth.uid() and g.cruise_id = p_cruise;
$$;

-- Create a group and become its owner. Returns the new group id + invite code.
create or replace function public.create_group(p_name text, p_cruise text)
returns table (id uuid, invite_code text)
language plpgsql security definer set search_path = public as $$
declare
  v_me     uuid := auth.uid();
  v_id     uuid;
  v_invite text;
begin
  if v_me is null then raise exception 'not authenticated'; end if;
  v_invite := upper(substr(replace(gen_random_uuid()::text, '-', ''), 1, 8));
  insert into public.groups (name, owner, invite_code, cruise_id)
    values (coalesce(nullif(trim(p_name), ''), 'Our group'), v_me, v_invite, p_cruise)
    returning groups.id into v_id;
  insert into public.memberships (group_id, user_id, role) values (v_id, v_me, 'owner');
  return query select v_id, v_invite;
end;
$$;

-- Join a group by its invite code, if a slot is free. Idempotent.
create or replace function public.join_group(p_invite text)
returns table (id uuid, name text)
language plpgsql security definer set search_path = public as $$
declare
  v_me    uuid := auth.uid();
  v_group public.groups%rowtype;
  v_count int;
begin
  if v_me is null then raise exception 'not authenticated'; end if;
  select * into v_group from public.groups where invite_code = upper(p_invite);
  if v_group.id is null then raise exception 'no such group'; end if;
  select count(*) into v_count from public.memberships where group_id = v_group.id;
  if v_count >= v_group.slots
     and not exists (select 1 from public.memberships where group_id = v_group.id and user_id = v_me)
  then raise exception 'group is full'; end if;
  insert into public.memberships (group_id, user_id, role)
    values (v_group.id, v_me, 'member') on conflict do nothing;
  return query select v_group.id, v_group.name;
end;
$$;

-- Payloads of every co-member across my groups on this cruise (deduplicated by person).
create or replace function public.group_feed(p_cruise text)
returns table (code text, name text, colour text, payload jsonb, updated_at timestamptz)
language sql security definer set search_path = public as $$
  select distinct on (p.code) p.code, p.name, p.colour, pa.payload, pa.updated_at
  from public.memberships mine
  join public.groups g       on g.id = mine.group_id and g.cruise_id = p_cruise
  join public.memberships other on other.group_id = mine.group_id and other.user_id <> mine.user_id
  join public.profiles p     on p.user_id = other.user_id
  join public.passports pa   on pa.user_id = other.user_id and pa.cruise_id = p_cruise
  where mine.user_id = auth.uid();
$$;

-- GDPR erasure: delete all of my content. (Removing the auth account itself is a separate admin
-- step / edge function; this removes every row of personal data the app stores.)
create or replace function public.delete_my_data()
returns void
language plpgsql security definer set search_path = public as $$
declare v_me uuid := auth.uid();
begin
  if v_me is null then return; end if;
  delete from public.memberships where user_id = v_me;
  delete from public.groups      where owner   = v_me;
  delete from public.friends     where user_id = v_me;
  delete from public.backups     where user_id = v_me;
  delete from public.passports   where user_id = v_me;
  delete from public.profiles    where user_id = v_me;
end;
$$;

revoke all on function public.lookup(text), public.befriend(text), public.friend_feed(text),
  public.my_groups(text), public.create_group(text, text), public.join_group(text),
  public.group_feed(text), public.delete_my_data() from public, anon;
grant execute on function public.lookup(text), public.befriend(text), public.friend_feed(text),
  public.my_groups(text), public.create_group(text, text), public.join_group(text),
  public.group_feed(text), public.delete_my_data() to authenticated;
