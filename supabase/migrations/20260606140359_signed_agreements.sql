-- Online signing of the booking agreement. The photographer creates a per-client
-- agreement request (with prefilled shoot details), the client opens the tokenized
-- link, reviews the terms, and signs. The signed record stores a snapshot of the
-- exact terms and details at signing time for an audit trail.

create table if not exists public.agreement_requests (
  id uuid primary key default gen_random_uuid(),
  gallery_id uuid references public.galleries(id) on delete set null,
  token text not null,
  client_name text,
  client_email text,
  details jsonb not null default '{}',
  message text,
  sent_at timestamptz,
  viewed_at timestamptz,
  signed_at timestamptz,
  revoked_at timestamptz,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);

create unique index if not exists agreement_requests_token_idx
  on public.agreement_requests(token);
create index if not exists agreement_requests_gallery_id_idx
  on public.agreement_requests(gallery_id);
create index if not exists agreement_requests_created_at_idx
  on public.agreement_requests(created_at desc);

create table if not exists public.signed_agreements (
  id uuid primary key default gen_random_uuid(),
  agreement_request_id uuid references public.agreement_requests(id) on delete set null,
  gallery_id uuid references public.galleries(id) on delete set null,
  signer_name text not null,
  signer_email text,
  signature_data_url text,
  agreement_snapshot jsonb not null default '{}',
  signed_ip text,
  user_agent text,
  signed_at timestamptz not null default now(),
  created_at timestamptz not null default now()
);

create index if not exists signed_agreements_request_idx
  on public.signed_agreements(agreement_request_id);
create index if not exists signed_agreements_gallery_idx
  on public.signed_agreements(gallery_id);
create index if not exists signed_agreements_signed_at_idx
  on public.signed_agreements(signed_at desc);

alter table public.agreement_requests enable row level security;
alter table public.signed_agreements enable row level security;

create policy "Deny all non-service-role access"
  on public.agreement_requests
  for all using (false) with check (false);

create policy "Deny all non-service-role access"
  on public.signed_agreements
  for all using (false) with check (false);
