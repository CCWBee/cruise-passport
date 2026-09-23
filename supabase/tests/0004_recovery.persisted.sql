-- Read-only: after the 0004 dry run, none of its objects or test rows may exist on the live project.
select
  to_regclass('public.recovery')::text as recovery_table,
  to_regprocedure('public.set_recovery(text)')::text as set_recovery,
  to_regprocedure('public.claim_recovery(text)')::text as claim_recovery,
  (select pg_get_functiondef('public.delete_my_data()'::regprocedure) like '%recovery%') as erase_mentions_recovery,
  (select count(*) from auth.users) as auth_users,
  (select count(*) from public.profiles where code like 'QA%-AAAA' or code like 'QA%-BBBB' or code like 'QA%-CCCC') as test_profiles,
  (select count(*) from public.groups where cruise_id like 'qa-dryrun-%') as test_groups;
