-- Separate individual-photo downloads from ZIP downloads for rate limiting.
-- Existing rows remain valid: old single-photo requests were logged as
-- "selects" and will naturally age out of the stricter ZIP bucket.

alter table public.gallery_download_logs
  drop constraint if exists gallery_download_logs_scope_check;

alter table public.gallery_download_logs
  add constraint gallery_download_logs_scope_check
  check (scope in ('all', 'selects', 'single'));

create index if not exists gallery_download_logs_rate_limit_idx
  on public.gallery_download_logs (gallery_id, scope, ip_hash, accessed_at desc);
