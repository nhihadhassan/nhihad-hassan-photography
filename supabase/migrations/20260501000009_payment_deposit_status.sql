-- Phase 3L: manual payment tracking (Interac e-Transfer)
--
-- Adds two admin-only columns to galleries:
--   deposit_status — tracks where the booking payment is in the workflow
--   payment_notes  — freeform notes (e.g. "sent $300 request May 20")
--
-- No payment data is ever stored; this is purely a status tracker
-- and a scratchpad for the photographer.

alter table public.galleries
  add column if not exists deposit_status text not null default 'not_requested'
    check (deposit_status in ('not_requested', 'requested', 'received', 'balance_due', 'paid')),
  add column if not exists payment_notes text;

comment on column public.galleries.deposit_status is
  'Interac e-Transfer deposit workflow state. '
  'Values: not_requested, requested, received, balance_due, paid.';

comment on column public.galleries.payment_notes is
  'Admin-only freeform notes about this booking''s payment (never exposed publicly).';
