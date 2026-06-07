-- Money tracking: a payments ledger (income recorded against bookings) and an
-- expenses log. Reporting only; no payment processing. Deny-by-default RLS, read
-- and written only by server code via the service-role client.

create table if not exists public.payments (
  id uuid primary key default gen_random_uuid(),
  booking_id uuid references public.bookings(id) on delete set null,
  client_name text,
  client_email text,
  amount numeric(12,2) not null,
  kind text not null default 'other' check (kind in ('deposit', 'balance', 'other')),
  paid_on date not null default current_date,
  method text default 'interac',
  note text,
  created_at timestamptz not null default now()
);

create index if not exists payments_booking_idx on public.payments(booking_id);
create index if not exists payments_paid_on_idx on public.payments(paid_on desc);

create table if not exists public.expenses (
  id uuid primary key default gen_random_uuid(),
  expense_date date not null default current_date,
  category text,
  vendor text,
  amount numeric(12,2) not null,
  note text,
  created_at timestamptz not null default now()
);

create index if not exists expenses_date_idx on public.expenses(expense_date desc);

alter table public.payments enable row level security;
alter table public.expenses enable row level security;

create policy "Deny all non-service-role access"
  on public.payments for all using (false) with check (false);

create policy "Deny all non-service-role access"
  on public.expenses for all using (false) with check (false);
