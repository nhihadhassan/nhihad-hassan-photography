-- Phase 3F — gallery access logging + rate limiting.
--
-- Reuses public.gallery_access_logs (exists from migration 0001).
-- Adds the columns we need to log unlock outcomes and to support per-IP
-- rate limiting on password-protected galleries.

alter table public.gallery_access_logs
  add column if not exists user_agent text,
  add column if not exists success boolean,
  add column if not exists reason text;

-- Tighten RLS: the existing "Public can create gallery access logs" anon
-- insert policy was permissive. All inserts are now done from the server
-- via the service-role client (inside the unlockGallery action), so anon
-- writes are no longer needed and we remove that surface.
drop policy if exists "Public can create gallery access logs" on public.gallery_access_logs;

-- Admin SELECT policy from migration 0001 is preserved ("Admins read access logs").

-- Index supporting the rate-limit query (gallery_id + ip_hash + recent failed).
create index if not exists gallery_access_logs_rate_limit_idx
  on public.gallery_access_logs (gallery_id, ip_hash, accessed_at desc)
  where success = false;

-- Index supporting the admin listing (recent first, optionally filtered by gallery).
create index if not exists gallery_access_logs_recent_idx
  on public.gallery_access_logs (accessed_at desc);

create index if not exists gallery_access_logs_gallery_recent_idx
  on public.gallery_access_logs (gallery_id, accessed_at desc);
