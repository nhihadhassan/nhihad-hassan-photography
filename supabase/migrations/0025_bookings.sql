-- Per-client booking record powering the booking confirmation hub
-- (/booking/[token]) and the shoot calendar invite (.ics). A booking can link
-- to a gallery (for deposit status and the delivered gallery) and to an
-- agreement request (for contract/signing status).

create table if not exists public.bookings (
  id uuid primary key default gen_random_uuid(),
  token text not null,
  gallery_id uuid references public.galleries(id) on delete set null,
  agreement_request_id uuid references public.agreement_requests(id) on delete set null,
  client_name text,
  client_email text,
  shoot_type text,
  start_at timestamptz,
  end_at timestamptz,
  location text,
  total text,
  deposit text,
  balance text,
  notes text,
  internal_note text,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);

create unique index if not exists bookings_token_idx on public.bookings(token);
create index if not exists bookings_gallery_id_idx on public.bookings(gallery_id);
create index if not exists bookings_start_at_idx on public.bookings(start_at);

alter table public.bookings enable row level security;

-- All access is via the service-role client from server code (admin actions and
-- the tokenized public hub, which validates the token before reading).
create policy "Deny all non-service-role access"
  on public.bookings
  for all using (false) with check (false);
