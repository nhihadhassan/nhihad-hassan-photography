-- Sequential invoice numbers. Each booking gets a stable number the first time
-- its invoice is generated, drawn from a shared sequence (INV-0001, INV-0002...).

create sequence if not exists public.booking_invoice_seq start 1;

alter table public.bookings add column if not exists invoice_no integer;

-- Idempotently assign and return a booking's invoice number. SECURITY DEFINER so
-- it can run under the deny-by-default RLS; called only from server code.
create or replace function public.assign_invoice_no(b_id uuid)
returns integer
language plpgsql
security definer
set search_path = public
as $$
declare
  n integer;
begin
  update public.bookings
    set invoice_no = coalesce(invoice_no, nextval('public.booking_invoice_seq')),
        updated_at = now()
  where id = b_id
  returning invoice_no into n;
  return n;
end;
$$;
