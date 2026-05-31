-- Limited page-section builder. Ordered, typed blocks rendered in a managed
-- region (homepage only for now). Additive: an empty set renders nothing, so
-- the existing hand-tuned sections are untouched.

create table if not exists public.page_blocks (
  id uuid primary key default gen_random_uuid(),
  page_slug text not null default 'home',
  block_type text not null
    check (block_type in ('text', 'image', 'cta', 'gallery_strip')),
  content jsonb not null default '{}'::jsonb,
  sort_order integer not null default 0,
  is_hidden boolean not null default false,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);

alter table public.page_blocks enable row level security;

create policy "Public can read visible page blocks"
  on public.page_blocks for select
  using (is_hidden = false);

create policy "Admins manage page blocks"
  on public.page_blocks for all
  using (public.is_admin())
  with check (public.is_admin());

create index if not exists page_blocks_page_idx on public.page_blocks(page_slug, sort_order);
