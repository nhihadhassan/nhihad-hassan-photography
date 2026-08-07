-- Phase 3B — photo storage and public photo access.
--
-- 1. Fix RLS: photos and gallery_sections were only visible when the parent
--    gallery had is_public = true. For private-link galleries (the common case)
--    the cover page already loads via get_public_gallery_by_slug, but photos
--    would not. Visibility for a link-accessible gallery should depend on
--    is_published / not archived / not expired only.
--
-- 2. Add get_public_gallery_photos(text) RPC so anonymous visitors can fetch
--    photos for a published gallery without needing direct table policy
--    visibility expanded further than necessary.

drop policy if exists "Public can read visible photos for public galleries" on public.photos;

create policy "Public can read visible photos for published galleries"
  on public.photos for select
  using (
    is_hidden = false
    and exists (
      select 1 from public.galleries
      where galleries.id = photos.gallery_id
        and galleries.is_published = true
        and galleries.is_archived = false
        and (galleries.expires_at is null or galleries.expires_at > now())
    )
  );

drop policy if exists "Public can read sections for public galleries" on public.gallery_sections;

create policy "Public can read sections for published galleries"
  on public.gallery_sections for select
  using (
    exists (
      select 1 from public.galleries
      where galleries.id = gallery_sections.gallery_id
        and galleries.is_published = true
        and galleries.is_archived = false
        and (galleries.expires_at is null or galleries.expires_at > now())
    )
  );

create or replace function public.get_public_gallery_photos(requested_slug text)
returns table (
  id uuid,
  gallery_id uuid,
  section_id uuid,
  original_key text,
  web_key text,
  thumbnail_key text,
  filename text,
  width integer,
  height integer,
  size_bytes bigint,
  mime_type text,
  blur_data_url text,
  sort_order integer,
  created_at timestamptz
)
language sql
stable
security definer
set search_path = public
as $$
  select
    p.id,
    p.gallery_id,
    p.section_id,
    p.original_key,
    p.web_key,
    p.thumbnail_key,
    p.filename,
    p.width,
    p.height,
    p.size_bytes,
    p.mime_type,
    p.blur_data_url,
    p.sort_order,
    p.created_at
  from public.photos p
  join public.galleries g on g.id = p.gallery_id
  where g.slug = requested_slug
    and g.is_published = true
    and g.is_archived = false
    and (g.expires_at is null or g.expires_at > now())
    and p.is_hidden = false
  order by p.sort_order asc, p.created_at asc;
$$;

grant execute on function public.get_public_gallery_photos(text) to anon, authenticated;

create index if not exists photos_gallery_sort_idx on public.photos(gallery_id, sort_order, created_at);
