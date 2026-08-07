-- Portfolio items moved from static src/data/photography.ts into the database
-- so they can be managed from /admin. Modeled on public.photos (same R2 key
-- columns) so the existing upload/process/signing pipeline can be reused.

create table if not exists public.portfolio_items (
  id uuid primary key default gen_random_uuid(),
  -- R2 object keys (same shape as photos)
  original_key text not null,
  web_key text,
  thumbnail_key text,
  -- editorial metadata (replaces PortfolioItem fields)
  title text not null,
  category text not null
    check (category in ('events', 'nightlife', 'portraits', 'lifestyle', 'weddings-couples')),
  caption text,
  alt text,
  event_date date,
  location text,
  featured boolean not null default false,
  orientation text not null default 'portrait'
    check (orientation in ('portrait', 'landscape', 'square')),
  -- bookkeeping (same as photos)
  width integer,
  height integer,
  size_bytes bigint,
  mime_type text,
  blur_data_url text,
  sort_order integer not null default 0,
  is_hidden boolean not null default false,
  -- temporary: maps a row back to its old /public/portfolio file for verification
  legacy_public_path text,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);

alter table public.portfolio_items enable row level security;

-- Anyone may read visible items; hidden rows are never exposed to anon.
create policy "Public can read visible portfolio items"
  on public.portfolio_items for select
  using (is_hidden = false);

-- Admins can do everything (and see hidden rows — policies combine with OR).
create policy "Admins manage portfolio items"
  on public.portfolio_items for all
  using (public.is_admin())
  with check (public.is_admin());

create index if not exists portfolio_items_category_idx on public.portfolio_items(category);
create index if not exists portfolio_items_sort_idx on public.portfolio_items(sort_order);
create index if not exists portfolio_items_featured_idx on public.portfolio_items(featured);
