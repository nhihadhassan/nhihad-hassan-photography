-- Phase 3E — password-protected galleries.
--
-- Schema note: galleries.password_hash already exists (migration 0001). No new
-- columns. This migration only locks down the *public* anon read paths so that
-- photos for password-protected galleries cannot leak via RPC or direct
-- SELECT, even though the gallery metadata (cover image, title, date) stays
-- visible for the teaser/cover page.
--
-- For password-protected galleries, the Node app uses a service-role Supabase
-- client AFTER verifying the visitor's signed access cookie. That code path
-- bypasses RLS by design — never reach it without verifying the cookie first.

-- 1. Photos RLS: exclude password-protected galleries from anon SELECT.
drop policy if exists "Public can read visible photos for published galleries" on public.photos;
create policy "Public can read visible photos for published unprotected galleries"
  on public.photos for select
  using (
    is_hidden = false
    and exists (
      select 1 from public.galleries
      where galleries.id = photos.gallery_id
        and galleries.is_published = true
        and galleries.is_archived = false
        and galleries.password_hash is null
        and (galleries.expires_at is null or galleries.expires_at > now())
    )
  );

-- 2. Public photos RPC: same exclusion. SECURITY DEFINER bypasses RLS, so the
--    function body must enforce the rule itself.
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
    and g.password_hash is null
    and (g.expires_at is null or g.expires_at > now())
    and p.is_hidden = false
  order by p.sort_order asc, p.created_at asc;
$$;

-- 3. Gallery cover/metadata RPC: keep returning published, unarchived,
--    unexpired galleries regardless of password_hash. The cover image, title,
--    and date are intentionally public (they're the teaser on the gate page).
--    Add an explicit has_password column so the cover page can render the
--    password gate without a second round-trip.
--    Postgres requires DROP FUNCTION when the return type changes (we're
--    adding has_password).
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
grant execute on function public.get_public_gallery_photos(text) to anon, authenticated;
