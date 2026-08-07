-- Itemised invoices
--
-- Until now a booking carried a single `total` (a text column, parsed with
-- parseAmount). That cannot express "2 hours coverage at $X plus an album at
-- $Y", so invoices could not be broken down for the client.
--
-- This adds real line items plus the few invoice-level fields the old model
-- lacked. New money columns are `numeric(12,2)` rather than text so the
-- itemised arithmetic is exact; the legacy `bookings.total` text column is left
-- untouched for backwards compatibility.
--
-- Totals are derived at read time:
--   line items present -> subtotal = sum(quantity * unit_price), total = subtotal - discount
--   no line items      -> fall back to the legacy `bookings.total`
-- so existing bookings keep working exactly as before until they are itemised.
--
-- Deny-by-default RLS: read and written only by server code via the
-- service-role client, matching payments / booking_events.

create table if not exists public.invoice_line_items (
  id          uuid           primary key default gen_random_uuid(),
  booking_id  uuid           not null references public.bookings(id) on delete cascade,
  description text           not null,
  quantity    numeric(12, 2) not null default 1,
  unit_price  numeric(12, 2) not null default 0,
  -- display order within the invoice; ties break on created_at
  sort_order  int            not null default 0,
  created_at  timestamptz    not null default now()
);

create index if not exists invoice_line_items_booking_idx
  on public.invoice_line_items (booking_id, sort_order, created_at);

alter table public.invoice_line_items enable row level security;

create policy "Deny all non-service-role access"
  on public.invoice_line_items for all using (false) with check (false);

-- Invoice-level fields the single-total model had nowhere to put.
alter table public.bookings
  -- flat amount off the subtotal, not a percentage
  add column if not exists invoice_discount  numeric(12, 2),
  add column if not exists invoice_due_date  date,
  add column if not exists invoice_po_number text,
  -- notes / terms printed at the foot of the invoice
  add column if not exists invoice_notes     text;
