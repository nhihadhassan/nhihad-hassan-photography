-- Editable pricing content. Single row holding the ordered categories and their
-- tiers as jsonb. The app falls back to the static defaults in src/data/pricing.ts
-- when no row exists.

create table if not exists public.pricing_content (
  id uuid primary key default gen_random_uuid(),
  categories jsonb not null default '[]',
  updated_at timestamptz not null default now()
);

alter table public.pricing_content enable row level security;

create policy "Public can read pricing"
  on public.pricing_content
  for select
  using (true);

create policy "Service role manages pricing"
  on public.pricing_content
  for all
  using (false)
  with check (false);
