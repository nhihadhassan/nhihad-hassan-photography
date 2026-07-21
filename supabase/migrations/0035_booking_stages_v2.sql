-- Widen the booking pipeline from 5 stages to the 8 the admin overhaul uses.
-- Old set: inquiry, booked, shot, delivered, reviewed.
-- New set: inquiry, proposal_sent, contract_out, booked, shot, editing,
--          delivered, archived.
--
-- The only legacy value without a direct match is `reviewed`; it maps onto
-- `delivered`. Drop the old check constraint, backfill, then add the new one.

alter table public.bookings
  drop constraint if exists bookings_stage_check;

update public.bookings
  set stage = 'delivered'
  where stage = 'reviewed';

alter table public.bookings
  add constraint bookings_stage_check
  check (stage in (
    'inquiry',
    'proposal_sent',
    'contract_out',
    'booked',
    'shot',
    'editing',
    'delivered',
    'archived'
  ));
