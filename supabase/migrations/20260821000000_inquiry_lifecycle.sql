-- Inquiry lifecycle: let a lead be tracked and converted into a booking
-- without re-typing what the client already told us.
--
-- Additive only. No column is dropped, no existing row is rewritten, and no
-- existing policy is relaxed. Every new column is nullable or defaulted, so
-- application code that predates this migration keeps working unchanged.

alter table public.inquiries
  add column if not exists status text not null default 'new',
  add column if not exists booking_id uuid references public.bookings(id) on delete set null,
  add column if not exists converted_at timestamptz,
  add column if not exists internal_note text,
  add column if not exists status_changed_at timestamptz;

-- Leads are never deleted, only moved to a terminal state, so the history of
-- what did and did not convert stays intact.
do $$
begin
  if not exists (
    select 1 from pg_constraint where conname = 'inquiries_status_check'
  ) then
    alter table public.inquiries
      add constraint inquiries_status_check
      check (status in ('new', 'contacted', 'considering', 'converted', 'lost'));
  end if;
end $$;

-- The admin lists leads newest-first and filters out terminal ones.
create index if not exists inquiries_status_idx
  on public.inquiries (status, created_at desc);

create index if not exists inquiries_booking_id_idx
  on public.inquiries (booking_id)
  where booking_id is not null;

comment on column public.inquiries.status is
  'Lead lifecycle: new -> contacted -> considering -> converted, or terminal lost. Never delete a lead; move it to lost.';
comment on column public.inquiries.booking_id is
  'Set when this inquiry was converted into a booking. Kept so the lead history survives and a second conversion can be refused.';
