-- Phase 3G — favorites / client selects hardening.
--
-- The existing public "Public can create favorite sets" and "Public can create
-- favorite photos" insert policies allow any anon client to write arbitrary
-- rows. Phase 3G moves all writes behind a server action that uses the
-- service-role client, after validating: gallery exists, is published, not
-- archived, not expired, password (if any) is unlocked via the access cookie,
-- and the selected photo IDs all belong to the gallery and are not hidden.
--
-- Reuses public.favorite_sets and public.favorite_photos as-is (no column
-- changes required). The unique constraint on (favorite_set_id, photo_id)
-- from migration 0001 protects against duplicate selections within one set.

drop policy if exists "Public can create favorite sets" on public.favorite_sets;
drop policy if exists "Public can create favorite photos" on public.favorite_photos;

-- Admin "manage" policies from migration 0001 are preserved.

-- Indexes for the admin listing (per-gallery, recent first) and detail views.
create index if not exists favorite_sets_gallery_recent_idx
  on public.favorite_sets (gallery_id, created_at desc);

create index if not exists favorite_photos_photo_idx
  on public.favorite_photos (photo_id);
