-- 0006: the Data API grants on 0001's tables, written down.
--
-- 0001 created profiles, passports, backups, friends, groups and memberships without a grant, and the
-- platform granted each one to anon, authenticated and service_role by itself. From 30 October 2026
-- Supabase stops doing that for new tables, a rebuild included (a new project, a preview branch, a
-- restore, `supabase db reset`), so a setup built from these files after that date would come up with
-- every table refusing supabase-js. This file restates what the live project holds, as read from
-- information_schema.role_table_grants on 23 September 2026, and changes nothing there: the dry run
-- compares every public table's ACL before and after.
--
-- It restates the live grants rather than narrowing them. anon never reaches a row (every policy is
-- on auth.uid(), and every guest signs in anonymously, which is the authenticated role); narrowing it
-- is a separate change with its own test. friends and memberships are given as they stand after 0005,
-- which took INSERT and UPDATE away from anon and authenticated: every write goes through the
-- SECURITY DEFINER functions. The privileges are listed rather than written as ALL, because on
-- Postgres 17 ALL also carries MAINTAIN, which the live tables were never given.

grant select, insert, update, delete, truncate, references, trigger
  on public.profiles, public.passports, public.backups, public.groups
  to anon, authenticated, service_role;

grant select, delete, truncate, references, trigger
  on public.friends, public.memberships
  to anon, authenticated;

grant select, insert, update, delete, truncate, references, trigger
  on public.friends, public.memberships
  to service_role;
