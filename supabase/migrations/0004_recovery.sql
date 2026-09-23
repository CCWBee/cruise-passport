-- 0004: the recovery code. Run after 0003 (Supabase SQL editor, or `db query --linked -f`).
-- Idempotent: re-running it replaces the functions and leaves the table and its rows alone.
--
-- Every guest is anonymous, and until now only a Google sign-in could read a backup back, so a lost
-- phone, a Safari wipe or a move to the home-screen app lost the passport for good. A recovery code
-- needs no account: 20 characters of Crockford base32 (100 bits) made on the phone, shown to the
-- guest, and stored here only as its SHA-256. See docs/specs/2026-09-23-recovery-and-hardening.md.
--
--   * `recovery` holds one hash per user. RLS on and no policies: it is reached only through the two
--     functions below, so nobody can list hashes or ask whether one exists.
--   * `set_recovery(hash)` upserts the caller's own row. The phone sends the hex SHA-256 of the
--     normalised secret (upper case, no dashes), so the secret itself never travels to register.
--   * `claim_recovery(secret)` is the only lookup. No match is null. A match that is the caller hands
--     back the caller's own passport. Otherwise the whole identity moves to the caller in this one
--     transaction: the caller's own rows go (it is a fresh phone), every row of the owner is
--     re-pointed at the caller, and the owner's auth user is deleted, so the copy it was claimed from
--     finds its session gone and stops rather than fighting over the friend code. The friend code
--     moves with the profile, so every friend's edge (`friends.friend_code`) and every group keeps
--     working. 100 bits needs no rate limit.
--   * `delete_my_data` takes the recovery row with the rest.
--
-- Gating as 0001 to 0003: SECURITY DEFINER, pinned search_path, auth.uid() read inside, execute for
-- `authenticated` only. digest() is pgcrypto's, which Supabase installs in the `extensions` schema,
-- so it is called by its full name rather than widening the search path.

create extension if not exists pgcrypto with schema extensions;

create table if not exists public.recovery (
  user_id    uuid primary key references auth.users on delete cascade,
  hash       text unique not null,
  created_at timestamptz not null default now()
);

alter table public.recovery enable row level security;
-- No policies on purpose: the functions below are the only way in.

-- Register (or replace) the caller's recovery hash. Idempotent: the phone calls it until it has
-- seen it succeed once.
create or replace function public.set_recovery(p_hash text)
returns void
language plpgsql security definer set search_path = public as $$
declare v_me uuid := auth.uid();
begin
  if v_me is null then raise exception 'not authenticated'; end if;
  if p_hash is null or p_hash !~ '^[0-9a-f]{64}$' then raise exception 'not a recovery hash'; end if;
  insert into public.recovery (user_id, hash) values (v_me, p_hash)
    on conflict (user_id) do update set hash = excluded.hash, created_at = now();
end;
$$;

-- Bring a passport back by its secret. Returns null when nothing matches, else
-- { profile: {code, name, colour} | null, backups: [{cruise_id, state, updated_at}] }, newest first.
-- The profile rides in the same answer as the backups so the phone takes its friend code from the
-- row that moved, in the same transaction, and never publishes its old code over it.
-- The secret is normalised as the phone normalises it: upper case, anything but a letter or a digit
-- dropped, and the three look-alikes Crockford reads as digits (O as 0, I and L as 1) folded.
create or replace function public.claim_recovery(p_secret text)
returns jsonb
language plpgsql security definer set search_path = public as $$
declare
  v_me    uuid := auth.uid();
  v_owner uuid;
  v_hash  text;
  v_old   text;
begin
  if v_me is null then raise exception 'not authenticated'; end if;
  v_hash := encode(extensions.digest(
    translate(upper(regexp_replace(coalesce(p_secret, ''), '[^0-9A-Za-z]', '', 'g')), 'OIL', '011'),
    'sha256'), 'hex');
  -- Locked, so two claims of the same code take turns rather than moving one identity twice at
  -- once. A second phone waiting on the lock then finds the first as the owner and moves the
  -- identity on from it: the code is the passport, and the last phone to use it holds it.
  select user_id into v_owner from public.recovery where hash = v_hash for update;
  if v_owner is null then return null; end if;

  if v_owner <> v_me then
    -- The caller's own rows first: it is a fresh phone, and every table below is keyed on the user,
    -- so its rows would collide with the ones about to move. Owned groups go as delete_my_data
    -- takes them, so no group is left with an owner who is not in it. Any edge pointing at the
    -- caller's own code goes too, whoever holds it: that code dies here, and an edge to it (someone
    -- the fresh phone had already added, or the owner's own edge to it, about to move) would sit in
    -- friends pointing at nobody.
    select code into v_old from public.profiles where user_id = v_me;
    delete from public.memberships where user_id = v_me;
    delete from public.groups      where owner   = v_me;
    delete from public.friends     where user_id = v_me;
    delete from public.backups     where user_id = v_me;
    delete from public.passports   where user_id = v_me;
    delete from public.profiles    where user_id = v_me;
    delete from public.recovery    where user_id = v_me;
    if v_old is not null then delete from public.friends where friend_code = v_old; end if;

    -- Then every row of the owner, re-pointed. groups.owner is `on delete set null`, so it moves
    -- before the auth user goes, or the owner's groups would be left with nobody.
    update public.profiles    set user_id = v_me where user_id = v_owner;
    update public.passports   set user_id = v_me where user_id = v_owner;
    update public.backups     set user_id = v_me where user_id = v_owner;
    update public.friends     set user_id = v_me where user_id = v_owner;
    update public.memberships set user_id = v_me where user_id = v_owner;
    update public.groups      set owner   = v_me where owner   = v_owner;
    update public.recovery    set user_id = v_me where user_id = v_owner;

    -- The old identity ends here. Its sessions and refresh tokens cascade, so the phone it was
    -- claimed from gets a definite "not found" on its next refresh and stops syncing.
    delete from auth.users where id = v_owner;
  end if;

  return jsonb_build_object(
    'profile', (select jsonb_build_object('code', p.code, 'name', p.name, 'colour', p.colour)
                from public.profiles p where p.user_id = v_me),
    'backups', coalesce((
      select jsonb_agg(jsonb_build_object('cruise_id', b.cruise_id, 'state', b.state, 'updated_at', b.updated_at)
                       order by b.updated_at desc)
      from public.backups b where b.user_id = v_me), '[]'::jsonb)
  );
end;
$$;

-- GDPR erasure, as 0001 wrote it, with the recovery row added: a code that could still be claimed
-- would bring back an identity the guest asked to be forgotten.
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
  delete from public.recovery    where user_id = v_me;
end;
$$;

revoke all on function public.set_recovery(text), public.claim_recovery(text), public.delete_my_data()
  from public, anon;
grant execute on function public.set_recovery(text), public.claim_recovery(text), public.delete_my_data()
  to authenticated;
