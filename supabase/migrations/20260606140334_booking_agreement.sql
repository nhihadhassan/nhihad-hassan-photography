-- Editable booking-agreement content. Single row; admin edits the intro,
-- disclaimer, and the ordered list of clause sections. The app falls back to
-- the static defaults in src/data/booking-agreement.ts when no row exists.

create table if not exists public.booking_agreement (
  id uuid primary key default gen_random_uuid(),
  intro text,
  disclaimer text,
  sections jsonb not null default '[]',
  updated_at timestamptz not null default now()
);

alter table public.booking_agreement enable row level security;

-- Public (anon) may read the single agreement row to render /booking-agreement.
create policy "Public can read booking agreement"
  on public.booking_agreement
  for select
  using (true);

-- All writes go through the service-role client from admin server actions.
create policy "Service role manages booking agreement"
  on public.booking_agreement
  for all
  using (false)
  with check (false);
