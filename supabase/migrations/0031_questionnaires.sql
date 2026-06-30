-- Pre-shoot questionnaires. The photographer creates a per-client link; the
-- client fills it before the shoot. Deny-by-default RLS; all access via the
-- service-role client (admin actions and the tokenized public form).

create table if not exists public.questionnaires (
  id uuid primary key default gen_random_uuid(),
  token text not null,
  booking_id uuid references public.bookings(id) on delete set null,
  gallery_id uuid references public.galleries(id) on delete set null,
  client_name text,
  client_email text,
  responses jsonb not null default '{}',
  sent_at timestamptz,
  viewed_at timestamptz,
  submitted_at timestamptz,
  revoked_at timestamptz,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);

create unique index if not exists questionnaires_token_idx on public.questionnaires(token);
create index if not exists questionnaires_booking_idx on public.questionnaires(booking_id);
create index if not exists questionnaires_created_idx on public.questionnaires(created_at desc);

alter table public.questionnaires enable row level security;

create policy "Deny all non-service-role access"
  on public.questionnaires for all using (false) with check (false);
