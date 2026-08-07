-- Gallery cover typography: one stored font choice per gallery.
-- The public cover keeps the title text exactly as entered and applies this
-- choice to the title treatment.

alter table public.galleries
  add column if not exists cover_font text not null default 'montserrat';

alter table public.galleries
  drop constraint if exists galleries_cover_font_check;
alter table public.galleries
  add constraint galleries_cover_font_check
  check (
    cover_font in (
      'montserrat',
      'cormorant',
      'bodoni',
      'playfair',
      'dm-serif',
      'libre-baskerville',
      'lora',
      'newsreader',
      'oswald',
      'space-grotesk',
      'plus-jakarta',
      'abril-fatface'
    )
  );

-- Recreate the public read RPC so the browser-facing gallery can receive the
-- selected font without broad direct access to the galleries table.
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
  cover_font text,
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
    galleries.cover_font,
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
