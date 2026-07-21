-- Editable reminder rules. Replaces the hardcoded timing constants in the
-- reminder engine with rows the owner can tune in plain language. The daily
-- cron still runs and still dedupes through reminder_log; these rows only
-- control whether each kind is on and its timing (offset, cadence, cap).
--
-- Deny-by-default RLS: read and written only by server code via the
-- service-role client.

create table if not exists public.reminder_rules (
  kind text primary key,
  enabled boolean not null default true,
  -- days after the rule's trigger date before the first send
  offset_days int not null default 0,
  -- days between repeat sends
  cadence_days int not null default 7,
  -- maximum number of sends per entity for this kind
  max_sends int not null default 1,
  updated_at timestamptz not null default now()
);

alter table public.reminder_rules enable row level security;

create policy "Deny all non-service-role access"
  on public.reminder_rules for all using (false) with check (false);

-- Seed the four existing kinds with timing that matches today's behaviour.
insert into public.reminder_rules (kind, enabled, offset_days, cadence_days, max_sends)
values
  ('deposit_due', true, 0, 7, 3),
  ('balance_due', true, 4, 7, 1),
  ('gallery_expiring', true, 7, 7, 1),
  ('review_request', true, 7, 7, 1)
on conflict (kind) do nothing;

-- Per-booking mute: suppress a given reminder kind for one booking.
create table if not exists public.reminder_mutes (
  booking_id uuid not null references public.bookings(id) on delete cascade,
  kind text not null,
  created_at timestamptz not null default now(),
  primary key (booking_id, kind)
);

alter table public.reminder_mutes enable row level security;

create policy "Deny all non-service-role access"
  on public.reminder_mutes for all using (false) with check (false);
