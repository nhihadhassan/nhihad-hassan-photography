-- Preserve the optional time selected in the finance entry UI. Dates remain
-- separate so existing reports and indexes continue to work unchanged.
alter table public.payments
  add column if not exists paid_time time without time zone;

alter table public.expenses
  add column if not exists expense_time time without time zone;
