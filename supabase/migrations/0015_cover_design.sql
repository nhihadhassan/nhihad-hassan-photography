-- Cover design: per-gallery focal point + layout template.
--
-- cover_focal_x / cover_focal_y: 0-100 percentages used as the cover image's
--   object-position so the subject stays clear of the title.
-- cover_layout: which cover template the public page renders.

alter table public.galleries
  add column if not exists cover_focal_x smallint not null default 50,
  add column if not exists cover_focal_y smallint not null default 50,
  add column if not exists cover_layout text not null default 'center';

alter table public.galleries
  drop constraint if exists galleries_cover_layout_check;
alter table public.galleries
  add constraint galleries_cover_layout_check
  check (cover_layout in ('center', 'left', 'bottom', 'split'));

alter table public.galleries
  drop constraint if exists galleries_cover_focal_x_check;
alter table public.galleries
  add constraint galleries_cover_focal_x_check
  check (cover_focal_x between 0 and 100);

alter table public.galleries
  drop constraint if exists galleries_cover_focal_y_check;
alter table public.galleries
  add constraint galleries_cover_focal_y_check
  check (cover_focal_y between 0 and 100);

-- Recreate the public read RPC to expose the new cover columns.
drop function if exists public.get_public_gallery_by_slug(text);

create or replace function public.get_public_gallery_by_slug(requested_slug text)
returns table (
  id uuid,
  title text,
  slug text,
  client_name text,
  event_date date,
  description text,
  location text,
  cover_image_url text,
  cover_image_alt text,
  cover_photo_id uuid,
  cover_focal_x smallint,
  cover_focal_y smallint,
  cover_layout text,
  is_public boolean,
  download_enabled boolean,
  download_quality text,
  expires_at timestamptz,
  created_at timestamptz,
  updated_at timestamptz,
  has_password boolean
)
language sql
stable
security definer
set search_path = public
as $$
  select
    galleries.id,
    galleries.title,
    galleries.slug,
    galleries.client_name,
    galleries.event_date,
    galleries.description,
    galleries.location,
    galleries.cover_image_url,
    galleries.cover_image_alt,
    galleries.cover_photo_id,
    galleries.cover_focal_x,
    galleries.cover_focal_y,
    galleries.cover_layout,
    galleries.is_public,
    galleries.download_enabled,
    galleries.download_quality,
    galleries.expires_at,
    galleries.created_at,
    galleries.updated_at,
    (galleries.password_hash is not null) as has_password
  from public.galleries
  where galleries.slug = requested_slug
    and galleries.is_published = true
    and galleries.is_archived = false
    and (galleries.expires_at is null or galleries.expires_at > now())
  limit 1;
$$;

grant execute on function public.get_public_gallery_by_slug(text) to anon, authenticated;
