-- Persist an explicit photo order in one statement instead of one UPDATE per
-- moved photo. Fronting a photo in a large gallery previously rewrote every
-- row between the old and new position, one round trip each.
--
-- `with ordinality` is 1-based while photos.sort_order is 0-based, hence the
-- position - 1. The `is distinct from` guard skips rows already in place, so
-- a single nudge touches two rows rather than the whole gallery.
--
-- Security invoker (the default): the caller's RLS policies on public.photos
-- still apply, exactly as they did for the previous per-row updates.

create or replace function public.set_photo_order(p_gallery_id uuid, p_photo_ids uuid[])
returns void
language sql
set search_path = public
as $$
  update public.photos as p
  set sort_order = ordered.position - 1
  from unnest(p_photo_ids) with ordinality as ordered(id, position)
  where p.id = ordered.id
    and p.gallery_id = p_gallery_id
    and p.sort_order is distinct from (ordered.position - 1);
$$;

grant execute on function public.set_photo_order(uuid, uuid[]) to authenticated, service_role;
