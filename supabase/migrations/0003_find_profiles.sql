-- 0003: find people by name or code, so adding a friend is server-first.
--
-- The add flow led with a link or a QR because there was no way to find a person on the server
-- without already holding their code. This adds one: a prefix search over named profiles, returning
-- the same three fields lookup() does (never a payload). Anonymous guests are `authenticated`, so
-- everyone in the app can find everyone who has set a name: acceptable for one cruise's guests,
-- and the only data exposed is what they already print at the top of their own Crew page.
-- Whole-word prefixes only ("isa" finds Isabel; "abel" does not), at least two characters, eight
-- results, and never the caller. A full code, with or without its hyphen, matches exactly.

create or replace function public.find_profiles(p_q text)
returns table (code text, name text, colour text)
language sql security definer set search_path = public as $$
  with q as (select trim(p_q) as t)
  select p.code, p.name, p.colour
  from public.profiles p, q
  where p.user_id <> auth.uid()
    and length(q.t) >= 2
    and coalesce(p.name, '') <> ''
    and (
      p.name ilike q.t || '%'
      or p.name ilike '% ' || q.t || '%'
      or upper(replace(p.code, '-', '')) = upper(replace(q.t, '-', ''))
    )
  order by p.name
  limit 8;
$$;

revoke all on function public.find_profiles(text) from public, anon;
grant execute on function public.find_profiles(text) to authenticated;
