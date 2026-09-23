-- Read-only: after the 0005 dry run, the policies must be 0001's and no test row may exist.
select
  (select string_agg(policyname || ':' || cmd, ', ' order by policyname) from pg_policies
     where schemaname = 'public' and tablename in ('friends', 'memberships')) as policies,
  has_table_privilege('authenticated', 'public.friends', 'insert') as friends_insert_grant,
  has_table_privilege('authenticated', 'public.memberships', 'insert') as memberships_insert_grant,
  (select count(*) from auth.users) as auth_users,
  (select count(*) from public.profiles where code like 'QA%-XXXX' or code like 'QA%-YYYY') as test_profiles,
  (select count(*) from public.groups where cruise_id like 'qa-dryrun-%') as test_groups;
