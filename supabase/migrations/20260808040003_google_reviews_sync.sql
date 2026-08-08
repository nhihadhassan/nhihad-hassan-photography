-- Real Google Business Profile sync: OAuth token storage plus the columns
-- needed to round-trip synced reviews and owner replies. The manual-import
-- columns added in 20260605214228_reviews.sql (google_review_id,
-- google_create_time, google_update_time) are reused as-is; a sync now
-- writes those same columns instead of them staying purely aspirational.

create table if not exists public.google_business_connection (
  id uuid primary key default gen_random_uuid(),
  account_name text,
  location_name text,
  location_title text,
  connected_email text,
  access_token text,
  refresh_token text,
  token_expires_at timestamptz,
  connected_at timestamptz,
  last_synced_at timestamptz,
  last_sync_error text,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);

alter table public.google_business_connection enable row level security;

create policy "Deny all non-service-role access"
  on public.google_business_connection
  for all using (false) with check (false);

-- Lets a sync upsert idempotently by Google's review id instead of
-- duplicating rows on every run. Not partial: PostgREST's upsert ON
-- CONFLICT target can't infer a partial index, and a plain unique index
-- already allows unlimited NULLs (manually imported reviews with no
-- google_review_id), so no predicate is needed.
create unique index if not exists client_reviews_google_review_id_idx
  on public.client_reviews(google_review_id);

alter table public.client_reviews
  add column if not exists owner_reply_text text,
  add column if not exists owner_reply_time timestamptz;
