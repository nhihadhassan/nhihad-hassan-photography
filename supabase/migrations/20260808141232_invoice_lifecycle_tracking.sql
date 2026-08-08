-- Invoice lifecycle tracking for the redesigned /admin/invoices system.
--
-- Invoices stay anchored on `bookings` (the existing itemised-invoice model:
-- invoice_line_items + invoice_discount/due_date/po_number/notes already
-- there) rather than a new top-level table -- this adds only what's missing:
-- explicit sent/viewed/cancelled timestamps (status is still derived, not
-- stored, to avoid a second source of truth alongside payments/due date),
-- a frozen content snapshot captured on first send (mirrors
-- signed_agreements.agreement_snapshot: later edits must not change what a
-- client already received), tax, and per-invoice payment instructions.

alter table public.bookings
  add column if not exists invoice_sent_at timestamptz,
  add column if not exists invoice_viewed_at timestamptz,
  add column if not exists invoice_cancelled_at timestamptz,
  add column if not exists invoice_snapshot jsonb,
  add column if not exists invoice_tax_rate numeric(5,2),
  add column if not exists invoice_payment_instructions text;

-- Backfill invoice_sent_at from delivery history so existing sent invoices
-- keep an accurate "first sent" timestamp instead of reading as drafts.
update public.bookings b
set invoice_sent_at = d.first_sent_at
from (
  select booking_id, min(sent_at) as first_sent_at
  from public.invoice_deliveries
  where status not in ('pending', 'failed')
    and sent_at is not null
  group by booking_id
) d
where d.booking_id = b.id
  and b.invoice_sent_at is null;
