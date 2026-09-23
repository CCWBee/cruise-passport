-- Dry run of 0004_recovery.sql against the live project, leaving nothing behind. Build and run it
-- with `node supabase/tests/dryrun.mjs 0004`, which puts the migration's text where the marker line
-- is and hands the result to `npx supabase db query --linked`. Everything happens inside one DO
-- block that ends by raising, so the migration, the three throwaway users and every row they made
-- roll back together; the raised message is the result ("DRYRUN 0004 OK ..." or the first failed
-- assertion). Uids are printed as eight characters at most.
--
-- The story: A is the old phone, holding the code. B is a fresh phone (its own profile, passport,
-- backup, recovery row, a friend edge and a group of its own). C is A's friend and a member of A's
-- group. B claims A's code; everything of A's must end up under B, A's auth user must be gone, B's
-- own rows must be gone, and C must still see the passport under A's friend code.
do $test$
declare
  v_a uuid := gen_random_uuid();
  v_b uuid := gen_random_uuid();
  v_c uuid := gen_random_uuid();
  v_tag text := upper(substr(md5(random()::text), 1, 4));
  v_code_a text; v_code_b text; v_code_c text;
  v_cruise text := 'qa-dryrun-0004';
  v_group_a uuid; v_group_b uuid;
  -- sha256 of K7QM3XPA9RTCW2HD6N10, the same vector src/state/recovery.test.ts checks the phone's hash
  -- against, so a pass here means the phone and the server agree on the hash.
  v_hash text := 'b1bfc1efe66b9ea3d0a35289fe68ca2f3961a4dc94ae1dc9f61156ea03a76735';
  v_out jsonb;
  v_n int;
  v_ok boolean;
  v_note text;
begin
  -- @migration

  v_code_a := 'QA' || v_tag || '-AAAA';
  v_code_b := 'QA' || v_tag || '-BBBB';
  v_code_c := 'QA' || v_tag || '-CCCC';

  insert into auth.users (id, aud, role, is_anonymous, created_at, updated_at) values
    (v_a, 'authenticated', 'authenticated', true, now(), now()),
    (v_b, 'authenticated', 'authenticated', true, now(), now()),
    (v_c, 'authenticated', 'authenticated', true, now(), now());

  insert into public.profiles (user_id, code, name, colour) values
    (v_a, v_code_a, 'QA owner', 'melon'),
    (v_b, v_code_b, 'QA fresh', 'aqua'),
    (v_c, v_code_c, 'QA friend', 'lime');
  insert into public.passports (user_id, cruise_id, payload) values
    (v_a, v_cruise, '{"owner":"a"}'),
    (v_b, v_cruise, '{"owner":"b"}'),
    (v_c, v_cruise, '{"owner":"c"}');
  insert into public.backups (user_id, cruise_id, state, updated_at) values
    (v_a, v_cruise, '{"owner":"a"}', now() - interval '1 hour'),
    (v_a, v_cruise || '-b', '{"owner":"a","second":true}', now()),
    (v_b, v_cruise, '{"owner":"b"}', now());
  insert into public.friends (user_id, friend_code) values
    (v_a, v_code_c), (v_c, v_code_a),
    (v_b, v_code_c), (v_c, v_code_b);
  insert into public.groups (name, owner, invite_code, cruise_id)
    values ('QA group A', v_a, 'QA' || v_tag || 'GA', v_cruise) returning id into v_group_a;
  insert into public.groups (name, owner, invite_code, cruise_id)
    values ('QA group B', v_b, 'QA' || v_tag || 'GB', v_cruise) returning id into v_group_b;
  insert into public.memberships (group_id, user_id, role) values
    (v_group_a, v_a, 'owner'), (v_group_a, v_c, 'member'),
    (v_group_b, v_b, 'owner'), (v_group_b, v_c, 'member');

  -- Grants: the functions answer an authenticated caller and nobody else.
  if has_function_privilege('anon', 'public.claim_recovery(text)', 'execute')
     or has_function_privilege('anon', 'public.set_recovery(text)', 'execute')
     or not has_function_privilege('authenticated', 'public.claim_recovery(text)', 'execute')
     or not has_function_privilege('authenticated', 'public.set_recovery(text)', 'execute')
  then raise exception 'FAIL grants on the recovery functions'; end if;
  if exists (select 1 from pg_policies where schemaname = 'public' and tablename = 'recovery')
  then raise exception 'FAIL recovery has a policy'; end if;

  -- A registers the vector's hash; B registers one of its own.
  perform set_config('request.jwt.claims', json_build_object('sub', v_a, 'role', 'authenticated')::text, true);
  perform public.set_recovery(v_hash);
  perform public.set_recovery(v_hash); -- idempotent
  v_ok := false;
  begin perform public.set_recovery('not-a-hash'); exception when others then v_ok := true; end;
  if not v_ok then raise exception 'FAIL set_recovery accepted a malformed hash'; end if;
  perform set_config('request.jwt.claims', json_build_object('sub', v_b, 'role', 'authenticated')::text, true);
  perform public.set_recovery(repeat('ab', 32));
  select count(*) into v_n from public.recovery where user_id in (v_a, v_b);
  if v_n <> 2 then raise exception 'FAIL expected 2 recovery rows, found %', v_n; end if;

  -- A wrong code is null and changes nothing.
  v_out := public.claim_recovery('ZZZZ-ZZZZ-ZZZZ-ZZZZ-ZZZZ');
  if v_out is not null then raise exception 'FAIL a wrong code answered %', v_out; end if;
  if not exists (select 1 from auth.users where id = v_a) then raise exception 'FAIL a wrong code moved something'; end if;

  -- The owner claiming its own code gets its own passport back and nothing moves.
  perform set_config('request.jwt.claims', json_build_object('sub', v_a, 'role', 'authenticated')::text, true);
  v_out := public.claim_recovery('k7qm-3xpa-9rtc-w2hd-6nlo');
  if v_out is null or jsonb_array_length(v_out->'backups') <> 2 or v_out->'profile'->>'code' <> v_code_a
  then raise exception 'FAIL own claim answered %', v_out; end if;
  select count(*) into v_n from public.profiles where user_id = v_b;
  if v_n <> 1 then raise exception 'FAIL own claim touched B'; end if;

  -- B claims A's code, typed in lower case, with dashes, and with L and O for 1 and 0.
  perform set_config('request.jwt.claims', json_build_object('sub', v_b, 'role', 'authenticated')::text, true);
  v_out := public.claim_recovery('k7qm-3xpa-9rtc-w2hd-6nlo');
  if v_out is null then raise exception 'FAIL the claim found no owner'; end if;
  if v_out->'profile'->>'code' <> v_code_a or v_out->'profile'->>'name' <> 'QA owner' or v_out->'profile'->>'colour' <> 'melon'
  then raise exception 'FAIL the claim answered the wrong profile %', v_out->'profile'; end if;
  if jsonb_array_length(v_out->'backups') <> 2
     or (v_out->'backups'->0->'state'->>'second') is distinct from 'true'
     or exists (select 1 from jsonb_array_elements(v_out->'backups') e where e->'state'->>'owner' <> 'a')
  then raise exception 'FAIL the claim answered the wrong backups %', v_out->'backups'; end if;

  -- The old identity is gone, whole.
  if exists (select 1 from auth.users where id = v_a) then raise exception 'FAIL the old auth user survived'; end if;
  select (select count(*) from public.profiles where user_id = v_a)
       + (select count(*) from public.passports where user_id = v_a)
       + (select count(*) from public.backups where user_id = v_a)
       + (select count(*) from public.friends where user_id = v_a)
       + (select count(*) from public.memberships where user_id = v_a)
       + (select count(*) from public.groups where owner = v_a)
       + (select count(*) from public.recovery where user_id = v_a)
    into v_n;
  if v_n <> 0 then raise exception 'FAIL % rows still belong to the old user', v_n; end if;

  -- Every table moved to B.
  if (select code from public.profiles where user_id = v_b) is distinct from v_code_a
  then raise exception 'FAIL profiles did not move'; end if;
  if exists (select 1 from public.profiles where code = v_code_b) then raise exception 'FAIL B''s own profile survived'; end if;
  if (select payload->>'owner' from public.passports where user_id = v_b and cruise_id = v_cruise) is distinct from 'a'
  then raise exception 'FAIL passports did not move'; end if;
  select count(*) into v_n from public.backups where user_id = v_b and state->>'owner' = 'a';
  if v_n <> 2 or exists (select 1 from public.backups where user_id = v_b and state->>'owner' = 'b')
  then raise exception 'FAIL backups did not move (% of 2)', v_n; end if;
  select count(*) into v_n from public.friends where user_id = v_b;
  if v_n <> 1 or not exists (select 1 from public.friends where user_id = v_b and friend_code = v_code_c)
  then raise exception 'FAIL friends did not move (% rows)', v_n; end if;
  if (select owner from public.groups where id = v_group_a) is distinct from v_b then raise exception 'FAIL groups.owner did not move'; end if;
  if (select role from public.memberships where group_id = v_group_a and user_id = v_b) is distinct from 'owner'
  then raise exception 'FAIL memberships did not move'; end if;
  if exists (select 1 from public.groups where id = v_group_b) then raise exception 'FAIL B''s own group survived'; end if;
  if (select hash from public.recovery where user_id = v_b) is distinct from v_hash
  then raise exception 'FAIL recovery did not move'; end if;
  if exists (select 1 from public.recovery where hash = repeat('ab', 32)) then raise exception 'FAIL B''s own recovery row survived'; end if;
  select count(*) into v_n from public.my_groups(v_cruise);
  if v_n <> 1 then raise exception 'FAIL my_groups for B answered % groups', v_n; end if;

  -- The friend code survived: C's edge still points at it and C still reads the passport.
  if not exists (select 1 from public.friends where user_id = v_c and friend_code = v_code_a)
  then raise exception 'FAIL C lost the edge to the friend code'; end if;
  perform set_config('request.jwt.claims', json_build_object('sub', v_c, 'role', 'authenticated')::text, true);
  if not exists (select 1 from public.friend_feed(v_cruise) f where f.code = v_code_a and f.payload->>'owner' = 'a')
  then raise exception 'FAIL C''s friend_feed lost the passport'; end if;
  if not exists (select 1 from public.group_feed(v_cruise) f where f.code = v_code_a)
  then raise exception 'FAIL C''s group_feed lost the owner'; end if;

  -- Claiming again from B is the owner's own claim now: the same answer, nothing moves.
  perform set_config('request.jwt.claims', json_build_object('sub', v_b, 'role', 'authenticated')::text, true);
  v_out := public.claim_recovery('K7QM3XPA9RTCW2HD6N10');
  if v_out is null or jsonb_array_length(v_out->'backups') <> 2 then raise exception 'FAIL the second claim answered %', v_out; end if;

  -- delete_my_data takes the recovery row with the rest.
  perform public.delete_my_data();
  if exists (select 1 from public.recovery where user_id = v_b) then raise exception 'FAIL delete_my_data left the recovery row'; end if;
  if exists (select 1 from public.profiles where user_id = v_b) then raise exception 'FAIL delete_my_data left the profile'; end if;

  v_note := format('A=%s B=%s C=%s code=%s', left(v_a::text, 8), left(v_b::text, 8), left(v_c::text, 8), v_code_a);
  raise exception 'DRYRUN 0004 OK: 3 users made; wrong code null; own claim moved nothing; B claimed A (profile, passport, 2 backups, friend edge, group owner, membership, recovery moved; A''s auth user deleted; B''s own profile, passport, backup, edge, group and recovery gone); C kept the edge and still reads the passport through friend_feed and group_feed; delete_my_data took the recovery row. Rolled back. %', v_note;
end
$test$;
