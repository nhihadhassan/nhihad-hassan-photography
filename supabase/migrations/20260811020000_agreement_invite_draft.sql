-- Per-contract saved invite draft
--
-- Mirrors 20260630224407_gallery_invite_draft.sql: lets the admin customise
-- the contract email (subject + message) before sending and have those
-- edits persist so a resend keeps the same wording. Both columns are
-- admin-only: the service-role client used by admin routes bypasses RLS,
-- and the public /agreement/[token] page never selects them.
-- null = use the built-in defaults.

alter table public.agreement_requests
  add column if not exists invite_subject text,
  add column if not exists invite_message text;
