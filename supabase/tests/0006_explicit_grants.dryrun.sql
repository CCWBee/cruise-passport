-- Dry run of 0006_explicit_grants.sql against the live project, leaving nothing behind. Build and
-- run it with `node supabase/tests/dryrun.mjs 0006`. One DO block that ends by raising, so the grants
-- roll back whatever they did. The migration only restates grants, so it passes when every public
-- table's ACL is the same after it as before; a changed ACL names the table, before and after.
do $test$
declare
  v_before jsonb;
  v_after jsonb;
  v_diff text;
begin
  select jsonb_object_agg(c.relname, coalesce(c.relacl::text, '')) into v_before
    from pg_class c join pg_namespace n on n.oid = c.relnamespace
    where n.nspname = 'public' and c.relkind in ('r', 'v', 'p');

-- @migration

  select jsonb_object_agg(c.relname, coalesce(c.relacl::text, '')) into v_after
    from pg_class c join pg_namespace n on n.oid = c.relnamespace
    where n.nspname = 'public' and c.relkind in ('r', 'v', 'p');

  select string_agg(k || ' before ' || coalesce(v_before ->> k, '(none)') || ' after ' || coalesce(v_after ->> k, '(none)'), '; ')
    into v_diff
    from jsonb_object_keys(v_before || v_after) as k
    where (v_before ->> k) is distinct from (v_after ->> k);

  if v_diff is not null then
    raise exception 'FAIL 0006 changed an ACL: %', v_diff;
  end if;
  raise exception 'DRYRUN 0006 OK: % public tables, every ACL unchanged', (select count(*) from jsonb_object_keys(v_after));
end
$test$;
