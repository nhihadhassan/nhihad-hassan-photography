-- Google-first review requests and verified public review showcase.
-- V1 uses manual Google review import. API-sync columns are reserved for a
-- later Google Business Profile integration.

alter table public.site_settings
  add column if not exists google_review_url text;

create table if not exists public.review_requests (
  id uuid primary key default gen_random_uuid(),
  gallery_id uuid references public.galleries(id) on delete set null,
  token text not null,
  client_name text,
  client_email text,
  message text,
  sent_at timestamptz,
  viewed_at timestamptz,
  google_clicked_at timestamptz,
  revoked_at timestamptz,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);

create unique index if not exists review_requests_token_idx
  on public.review_requests(token);

create index if not exists review_requests_gallery_id_idx
  on public.review_requests(gallery_id);

create index if not exists review_requests_created_at_idx
  on public.review_requests(created_at desc);

create table if not exists public.client_reviews (
  id uuid primary key default gen_random_uuid(),
  gallery_id uuid references public.galleries(id) on delete set null,
  review_request_id uuid references public.review_requests(id) on delete set null,
  source text not null default 'google' check (source in ('google')),
  reviewer_name text not null,
  rating integer not null check (rating between 1 and 5),
  review_text text not null,
  review_date date not null,
  source_url text,
  approved boolean not null default false,
  google_review_id text,
  google_create_time timestamptz,
  google_update_time timestamptz,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);

create index if not exists client_reviews_approved_recent_idx
  on public.client_reviews(approved, review_date desc);

create index if not exists client_reviews_gallery_id_idx
  on public.client_reviews(gallery_id);

alter table public.review_requests enable row level security;
alter table public.client_reviews enable row level security;

create policy "Deny all non-service-role access"
  on public.review_requests
  for all using (false) with check (false);

create policy "Deny all non-service-role access"
  on public.client_reviews
  for all using (false) with check (false);
