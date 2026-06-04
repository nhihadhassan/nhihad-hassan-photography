-- Journal posts moved from static src/data/journal.ts into the database so they
-- can be created and edited from /admin with a block-based body and uploaded
-- images. The body is an ordered JSONB array of typed blocks (heading,
-- paragraph, quote, image, image_row, divider).

create table if not exists public.journal_posts (
  id uuid primary key default gen_random_uuid(),
  slug text not null unique,
  title text not null,
  excerpt text,
  tag text,
  post_date date not null default current_date,
  -- cover: either an R2 key (uploaded) or a direct URL (migrated / external)
  cover_key text,
  cover_url text,
  cover_alt text,
  -- ordered block array; each block is a typed object
  content jsonb not null default '[]'::jsonb,
  -- curated per-post styling (Phase C)
  accent_hex text,
  body_font text,
  published boolean not null default false,
  sort_order integer not null default 0,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);

alter table public.journal_posts enable row level security;

create policy "Public can read published journal posts"
  on public.journal_posts for select
  using (published = true);

create policy "Admins manage journal posts"
  on public.journal_posts for all
  using (public.is_admin())
  with check (public.is_admin());

create index if not exists journal_posts_published_idx
  on public.journal_posts(published, post_date desc);
