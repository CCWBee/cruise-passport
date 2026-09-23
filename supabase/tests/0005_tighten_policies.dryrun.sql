-- Dry run of 0005_tighten_policies.sql against the live project, leaving nothing behind. Build and
-- run it with `node supabase/tests/dryrun.mjs 0005`; one DO block that ends by raising, so the
-- policy change and the two throwaway users roll back together. Uids are printed as eight
-- characters at most.
--
-- X is a guest; Y owns a group. As X, in the `authenticated` role with X's claims (what PostgREST
-- does for a signed-in request): first the control, showing the hole 0005 closes (a direct insert
-- into friends and into memberships is accepted today); then the migration; then the same inserts
-- must be refused, while befriend, join_group, reading one's own rows, deleting one's own edge and
-- leave_group all still work.
do $test$
declare
  v_x uuid := gen_random_uuid();
  v_y uuid := gen_random_uuid();
  v_tag text := upper(substr(md5(random()::text), 1, 4));
  v_code_x text; v_code_y text; v_invite text;
  v_cruise text := 'qa-dryrun-0005';
  v_group uuid;
  v_n int;
  v_refused boolean;
  v_control text;
begin
  v_code_x := 'QA' || v_tag || '-XXXX';
  v_code_y := 'QA' || v_tag || '-YYYY';
  v_invite := 'QA' || v_tag || 'GY';

  insert into auth.users (id, aud, role, is_anonymous, created_at, updated_at) values
    (v_x, 'authenticated', 'authenticated', true, now(), now()),
    (v_y, 'authenticated', 'authenticated', true, now(), now());
  insert into public.profiles (user_id, code, name, colour) values
    (v_x, v_code_x, 'QA guest', 'aqua'), (v_y, v_code_y, 'QA host', 'melon');
  insert into public.passports (user_id, cruise_id, payload) values (v_y, v_cruise, '{"owner":"y"}');
  insert into public.groups (name, owner, invite_code, cruise_id)
    values ('QA group Y', v_y, v_invite, v_cruise) returning id into v_group;
  insert into public.memberships (group_id, user_id, role) values (v_group, v_y, 'owner');

  -- The control, before the migration: X can write both rows directly.
  perform set_config('request.jwt.claims', json_build_object('sub', v_x, 'role', 'authenticated')::text, true);
  set local role authenticated;
  v_control := '';
  begin
    insert into public.friends (user_id, friend_code) values (v_x, v_code_y);
    v_control := v_control || 'friends insert accepted';
  exception when insufficient_privilege then v_control := v_control || 'friends insert already refused';
  end;
  begin
    insert into public.memberships (group_id, user_id, role) values (v_group, v_x, 'member');
    v_control := v_control || ', memberships insert accepted';
  exception when insufficient_privilege then v_control := v_control || ', memberships insert already refused';
  end;
  reset role;
  delete from public.friends where user_id = v_x;
  delete from public.memberships where user_id = v_x;

  -- @migration

  -- After: the same two inserts, as X, are refused.
  perform set_config('request.jwt.claims', json_build_object('sub', v_x, 'role', 'authenticated')::text, true);
  set local role authenticated;
  v_refused := false;
  begin
    insert into public.friends (user_id, friend_code) values (v_x, v_code_y);
  exception when insufficient_privilege then v_refused := true;
  end;
  if not v_refused then reset role; raise exception 'FAIL a direct insert into friends was accepted'; end if;
  v_refused := false;
  begin
    insert into public.memberships (group_id, user_id, role) values (v_group, v_x, 'member');
  exception when insufficient_privilege then v_refused := true;
  end;
  if not v_refused then reset role; raise exception 'FAIL a direct insert into memberships was accepted'; end if;
  v_refused := false;
  begin
    update public.friends set friend_code = v_code_y where user_id = v_x;
  exception when insufficient_privilege then v_refused := true;
  end;
  if not v_refused then reset role; raise exception 'FAIL an update on friends was accepted'; end if;

  -- The functions still write, as X.
  perform public.befriend(v_code_y);
  select count(*) into v_n from public.friends; -- X's own rows only, through the SELECT policy
  if v_n <> 1 then reset role; raise exception 'FAIL after befriend X reads % own edges, not 1', v_n; end if;
  select count(*) into v_n from public.friend_feed(v_cruise) f where f.code = v_code_y and f.payload->>'owner' = 'y';
  if v_n <> 1 then reset role; raise exception 'FAIL friend_feed after befriend answered % rows', v_n; end if;
  select count(*) into v_n from public.join_group(v_invite);
  if v_n <> 1 then reset role; raise exception 'FAIL join_group answered % rows', v_n; end if;
  select count(*) into v_n from public.memberships;
  if v_n <> 1 then reset role; raise exception 'FAIL after join_group X reads % own memberships, not 1', v_n; end if;
  select count(*) into v_n from public.my_groups(v_cruise);
  if v_n <> 1 then reset role; raise exception 'FAIL my_groups answered % rows', v_n; end if;

  -- Deleting one's own edge directly still works, and so does leave_group.
  delete from public.friends where user_id = v_x and friend_code = v_code_y;
  get diagnostics v_n = row_count;
  if v_n <> 1 then reset role; raise exception 'FAIL X could not delete its own edge (% rows)', v_n; end if;
  perform public.leave_group(v_group);
  reset role;

  if exists (select 1 from public.memberships where user_id = v_x) then raise exception 'FAIL leave_group left the membership'; end if;
  if not exists (select 1 from public.friends where user_id = v_y and friend_code = v_code_x)
  then raise exception 'FAIL befriend did not write the reverse edge'; end if;
  select count(*) into v_n from pg_policies where schemaname = 'public' and tablename in ('friends', 'memberships') and cmd in ('ALL', 'INSERT', 'UPDATE');
  if v_n <> 0 then raise exception 'FAIL % write policies remain on friends and memberships', v_n; end if;
  if has_table_privilege('authenticated', 'public.friends', 'insert') or has_table_privilege('authenticated', 'public.memberships', 'insert')
     or has_table_privilege('anon', 'public.friends', 'insert') or has_table_privilege('anon', 'public.memberships', 'insert')
  then raise exception 'FAIL an insert grant remains'; end if;

  raise exception 'DRYRUN 0005 OK: control before the migration (%); after it, direct insert into friends and memberships and an update on friends refused for authenticated; befriend, friend_feed, join_group, my_groups, own-row reads, deleting an own edge and leave_group all work; no write policy or insert grant left. Rolled back. X=% Y=%',
    v_control, left(v_x::text, 8), left(v_y::text, 8);
end
$test$;
