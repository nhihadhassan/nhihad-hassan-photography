-- Phase 3J — gallery download logging.
--
-- Mirrors the gallery_access_logs design (Phase 3F): records every bulk
-- download attempt (whole-gallery and selects), keeping only an HMAC-ed
-- IP hash, never raw IPs. All writes happen from the server route via
-- service-role; anon clients cannot write.

create table if not exists public.gallery_download_logs (
  id uuid primary key default gen_random_uuid(),
  gallery_id uuid not null references public.galleries(id) on delete cascade,
  scope text not null check (scope in ('all', 'selects')),
  photo_count integer not null default 0,
  ip_hash text,
  user_agent text,
  success boolean not null default false,
  reason text,
  accessed_at timestamptz not null default now()
);

alter table public.gallery_download_logs enable row level security;

create policy "Admins read download logs"
  on public.gallery_download_logs for select
  using (public.is_admin());

-- No anon insert policy by design — server writes via service-role only.

create index if not exists gallery_download_logs_recent_idx
  on public.gallery_download_logs (accessed_at desc);

create index if not exists gallery_download_logs_gallery_recent_idx
  on public.gallery_download_logs (gallery_id, accessed_at desc);
