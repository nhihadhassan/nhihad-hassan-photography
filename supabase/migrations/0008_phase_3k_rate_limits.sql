-- Phase 3K — rate limiting for favorites submissions.
--
-- Adds a dedicated submission log so we can rate-limit ALL submit attempts
-- (including those that fail validation, e.g. spam emails), not just the
-- ones that result in a favorite_set row. Mirrors gallery_access_logs and
-- gallery_download_logs.
--
-- Downloads already use gallery_download_logs (Phase 3J) for rate limiting;
-- no new table needed there.

create table if not exists public.favorite_submission_logs (
  id uuid primary key default gen_random_uuid(),
  gallery_id uuid references public.galleries(id) on delete cascade,
  ip_hash text,
  user_agent text,
  success boolean not null default false,
  reason text,
  accessed_at timestamptz not null default now()
);

alter table public.favorite_submission_logs enable row level security;

create policy "Admins read favorite submission logs"
  on public.favorite_submission_logs for select
  using (public.is_admin());

-- No anon insert policy by design — server writes via service-role only.

create index if not exists favorite_submission_logs_rate_limit_idx
  on public.favorite_submission_logs (gallery_id, ip_hash, accessed_at desc);

create index if not exists favorite_submission_logs_recent_idx
  on public.favorite_submission_logs (accessed_at desc);
