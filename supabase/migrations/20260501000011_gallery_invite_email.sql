-- Phase 4B: gallery invite emails
--
-- 1. Add password_plain column to galleries so invite emails can include
--    the gallery access password. This column is admin-only — the existing
--    curated RPC (get_public_gallery_by_slug) never returns it, and the
--    service-role client used by all admin routes bypasses RLS.
--
-- 2. Create gallery_invite_log to track when invite emails were sent.
--    Rows are used only by the admin UI ("last sent" display). Service role
--    reads/writes bypass RLS; the deny-all policy blocks anon + authenticated
--    direct access.

alter table public.galleries
  add column if not exists password_plain text;

create table if not exists public.gallery_invite_log (
  id               uuid        primary key default gen_random_uuid(),
  gallery_id       uuid        not null references public.galleries(id) on delete cascade,
  sent_to          text        not null,
  sent_at          timestamptz not null default now(),
  resend_message_id text
);

alter table public.gallery_invite_log enable row level security;

-- Service role bypasses RLS automatically; block all other roles.
create policy "Deny all non-service-role access"
  on public.gallery_invite_log
  for all
  using (false)
  with check (false);
