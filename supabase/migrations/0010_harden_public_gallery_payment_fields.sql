-- Phase 3L hardening — keep payment fields admin-only.
--
-- Migration 0009 added deposit_status and payment_notes to public.galleries.
-- Older RLS allowed anonymous direct SELECT of published public gallery rows,
-- which would also expose any future columns added to the table. Public gallery
-- reads should go through curated RPCs instead.

drop policy if exists "Public can read published public galleries" on public.galleries;

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
