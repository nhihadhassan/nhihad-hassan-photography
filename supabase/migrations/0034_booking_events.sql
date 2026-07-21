-- Booking activity feed. A thin append-only event log that the booking
-- workspace timeline spine reads. Existing mutations (contract sent/signed,
-- payment recorded, gallery published, stage changed, note added) write here in
-- addition to their own tables, so the timeline is one merged source going
-- forward. Historical events from before this table are derived in code from
-- existing timestamp columns and merged at read time.
--
-- Deny-by-default RLS: read and written only by server code via the
-- service-role client, matching payments / reminder_log.

create table if not exists public.booking_events (
  id uuid primary key default gen_random_uuid(),
  booking_id uuid not null references public.bookings(id) on delete cascade,
  -- event type drives the spine glyph: inquiry | email | contract | payment |
  -- invoice | gallery | stage | note
  type text not null,
  -- short human summary shown on the node, e.g. "Deposit recorded, $400"
  summary text not null,
  -- who caused it: 'admin' | 'client' | 'system'
  actor text not null default 'admin',
  -- structured extras (amount, stage from/to, link token, email id)
  payload jsonb not null default '{}'::jsonb,
  created_at timestamptz not null default now()
);

create index if not exists booking_events_booking_idx
  on public.booking_events(booking_id, created_at desc);

alter table public.booking_events enable row level security;

create policy "Deny all non-service-role access"
  on public.booking_events for all using (false) with check (false);
