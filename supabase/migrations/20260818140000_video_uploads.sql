-- Video uploads on photos
--
-- Adds a small number of columns so the existing `photos` table (and its
-- gallery/download/select machinery) can carry short video clips alongside
-- images, instead of a parallel table.
--
--   media_type        'image' | 'video'. Existing rows default to 'image'.
--   duration_seconds  Video length, extracted client-side at upload time.
--                      Null for images and for videos where extraction
--                      failed (e.g. an unplayable .mov in the uploading
--                      browser) — never blocks the upload.
--
-- For a video row: original_key is the video file itself, web_key stays
-- null (uploads are not transcoded — MP4/H.264 is required so the browser
-- plays the original directly), and thumbnail_key holds a poster JPEG
-- extracted client-side, or null if extraction failed.

alter table public.photos
  add column if not exists media_type text not null default 'image',
  add column if not exists duration_seconds numeric;

alter table public.photos
  drop constraint if exists photos_media_type_check;

alter table public.photos
  add constraint photos_media_type_check
  check (media_type in ('image', 'video'));

-- get_public_gallery_photos returns a fixed TABLE(...) shape, so adding
-- columns requires DROP + CREATE (CREATE OR REPLACE cannot change a
-- function's return type). The grant is reapplied in the same migration —
-- dropping a function clears its ACL, and this RPC is what public gallery
-- pages use to list photos for anonymous visitors.
drop function if exists public.get_public_gallery_photos(text);

create function public.get_public_gallery_photos(requested_slug text)
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
  created_at timestamptz,
  media_type text,
  duration_seconds numeric
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
    p.created_at,
    p.media_type,
    p.duration_seconds
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
