-- 0005: friends and memberships are read and removed directly, never written. Run after 0004, and
-- only on Charles's go (docs/specs/2026-09-23-recovery-and-hardening.md, section 9).
-- Idempotent: the drops are guarded and the creates follow them.
--
-- 0001 gave both tables a FOR ALL own-row policy, so any session, anonymous included, could insert a
-- row of its own directly through PostgREST. On `friends` that is (me, anyone's code), which opens
-- that person's shared passport through friend_feed with no reverse edge they could see or cut; on
-- `memberships` it is a seat in any group whose id is known, past join_group's invite and slot
-- check. Every legitimate write already goes through the SECURITY DEFINER functions (befriend,
-- unfriend, create_group, join_group, leave_group, delete_group, delete_my_data, claim_recovery),
-- which run as the table owner and are not bound by these policies. So each table keeps SELECT and
-- DELETE on the caller's own rows and loses INSERT and UPDATE, both as a policy and as a grant.

drop policy if exists "own friends"          on public.friends;
drop policy if exists "own friends read"     on public.friends;
drop policy if exists "own friends delete"   on public.friends;
drop policy if exists "own membership"        on public.memberships;
drop policy if exists "own membership read"   on public.memberships;
drop policy if exists "own membership delete" on public.memberships;

create policy "own friends read"      on public.friends     for select using (auth.uid() = user_id);
create policy "own friends delete"    on public.friends     for delete using (auth.uid() = user_id);
create policy "own membership read"   on public.memberships for select using (auth.uid() = user_id);
create policy "own membership delete" on public.memberships for delete using (auth.uid() = user_id);

revoke insert, update on public.friends, public.memberships from anon, authenticated;
