-- Per-gallery saved invite draft
--
-- Lets the admin customise the gallery invite email (subject + message) and
-- have those edits persist so a resend keeps the same wording. Both columns are
-- admin-only: the public RPC never selects them, and the service-role client
-- used by admin routes bypasses RLS. null = use the built-in defaults.

alter table public.galleries
  add column if not exists invite_subject text,
  add column if not exists invite_message text;
