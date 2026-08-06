-- Per-contract expiry and signature reminders.
--
-- Expiry is enforced by the signing flow and also materialized by the daily
-- reminder job for admin reporting. Reminder settings are opt-in per request;
-- existing contracts remain unchanged.

alter table public.agreement_requests
  add column if not exists expires_at timestamptz,
  add column if not exists expired_at timestamptz,
  add column if not exists reminders_enabled boolean not null default false,
  add column if not exists reminder_interval_days integer not null default 3,
  add column if not exists reminder_max_sends integer not null default 3,
  add column if not exists reminder_count integer not null default 0,
  add column if not exists last_reminder_at timestamptz,
  add column if not exists last_reminder_attempt_at timestamptz,
  add column if not exists last_reminder_error text,
  add column if not exists last_reminder_message_id text;

alter table public.agreement_requests
  drop constraint if exists agreement_requests_reminder_interval_days_check,
  add constraint agreement_requests_reminder_interval_days_check
    check (reminder_interval_days between 1 and 30),
  drop constraint if exists agreement_requests_reminder_max_sends_check,
  add constraint agreement_requests_reminder_max_sends_check
    check (reminder_max_sends between 1 and 10),
  drop constraint if exists agreement_requests_reminder_count_check,
  add constraint agreement_requests_reminder_count_check
    check (reminder_count >= 0),
  drop constraint if exists agreement_requests_expiry_order_check,
  add constraint agreement_requests_expiry_order_check
    check (expired_at is null or expires_at is not null);

create index if not exists agreement_requests_expiry_due_idx
  on public.agreement_requests(expires_at)
  where signed_at is null and revoked_at is null and expired_at is null and expires_at is not null;

create index if not exists agreement_requests_reminders_due_idx
  on public.agreement_requests(reminders_enabled, sent_at)
  where signed_at is null and revoked_at is null and expired_at is null;

comment on column public.agreement_requests.expires_at is
  'Optional signing deadline. Unsigned requests become unavailable after this instant.';
comment on column public.agreement_requests.expired_at is
  'When the unsigned request was automatically marked expired.';
comment on column public.agreement_requests.reminders_enabled is
  'Whether the daily scheduler may remind this signer while the request is active.';
