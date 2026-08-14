-- Contract-led admin automation.
--
-- Canonical clients replace the previous derived-only identity model. Historical
-- names/emails remain on their source rows and in signed snapshots. Join tables
-- connect multiple people to one agreement/booking without rewriting history.
-- Receipts are separate immutable payment documents; their content is frozen
-- on first send in the same spirit as invoice/agreement snapshots.

create table if not exists public.clients (
  id uuid primary key default gen_random_uuid(),
  name text not null check (length(btrim(name)) > 0),
  email text,
  phone text,
  address text,
  notes text,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);

create unique index if not exists clients_email_unique_idx
  on public.clients (lower(email))
  where email is not null and btrim(email) <> '';
create index if not exists clients_updated_idx on public.clients (updated_at desc);

create table if not exists public.agreement_clients (
  agreement_request_id uuid not null references public.agreement_requests(id) on delete cascade,
  client_id uuid not null references public.clients(id) on delete cascade,
  role text not null default 'primary' check (role in ('primary', 'secondary')),
  created_at timestamptz not null default now(),
  primary key (agreement_request_id, client_id)
);

create unique index if not exists agreement_clients_one_role_idx
  on public.agreement_clients (agreement_request_id, role);
create index if not exists agreement_clients_client_idx
  on public.agreement_clients (client_id, agreement_request_id);

create table if not exists public.booking_clients (
  booking_id uuid not null references public.bookings(id) on delete cascade,
  client_id uuid not null references public.clients(id) on delete cascade,
  role text not null default 'primary' check (role in ('primary', 'secondary')),
  created_at timestamptz not null default now(),
  primary key (booking_id, client_id)
);

create unique index if not exists booking_clients_one_role_idx
  on public.booking_clients (booking_id, role);
create index if not exists booking_clients_client_idx
  on public.booking_clients (client_id, booking_id);

alter table public.agreement_requests
  add column if not exists calendar_event_id text;

alter table public.bookings
  add column if not exists delivery_due_date date,
  add column if not exists calendar_event_id text,
  add column if not exists stage_override boolean not null default false;

alter table public.payments
  add column if not exists automation_key text;

create unique index if not exists bookings_agreement_request_unique_idx
  on public.bookings (agreement_request_id)
  where agreement_request_id is not null;
create index if not exists bookings_delivery_due_idx
  on public.bookings (delivery_due_date)
  where delivery_due_date is not null and stage not in ('delivered', 'archived');
create unique index if not exists payments_automation_key_unique_idx
  on public.payments (automation_key)
  where automation_key is not null;

create table if not exists public.receipts (
  id uuid primary key default gen_random_uuid(),
  receipt_no bigint generated always as identity unique,
  token text not null unique,
  booking_id uuid not null references public.bookings(id) on delete cascade,
  payment_id uuid not null references public.payments(id) on delete restrict,
  replaces_receipt_id uuid references public.receipts(id) on delete restrict,
  amount numeric(12, 2) not null check (amount > 0),
  paid_on date not null,
  method text,
  snapshot jsonb,
  sent_at timestamptz,
  viewed_at timestamptz,
  voided_at timestamptz,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now(),
  check (sent_at is null or snapshot is not null)
);

create index if not exists receipts_booking_created_idx
  on public.receipts (booking_id, created_at desc);
create unique index if not exists receipts_one_active_per_payment_idx
  on public.receipts (payment_id)
  where voided_at is null;
create index if not exists receipts_replacement_idx
  on public.receipts (replaces_receipt_id)
  where replaces_receipt_id is not null;
create index if not exists receipts_unsent_idx
  on public.receipts (created_at desc)
  where sent_at is null and voided_at is null;

create table if not exists public.receipt_deliveries (
  id uuid primary key default gen_random_uuid(),
  receipt_id uuid not null references public.receipts(id) on delete cascade,
  sent_to text not null,
  subject text not null,
  status text not null default 'pending'
    check (status in ('pending', 'sent', 'failed')),
  resend_message_id text,
  failure_reason text,
  sent_at timestamptz,
  created_at timestamptz not null default now()
);

create index if not exists receipt_deliveries_receipt_created_idx
  on public.receipt_deliveries (receipt_id, created_at desc);

create or replace function public.void_and_replace_receipt(p_receipt_id uuid, p_token text)
returns public.receipts
language plpgsql
security definer
set search_path = public
as $$
declare
  original public.receipts;
  replacement public.receipts;
begin
  select * into original
  from public.receipts
  where id = p_receipt_id
  for update;

  if original.id is null then
    raise exception 'Receipt not found.';
  end if;
  if original.voided_at is not null then
    raise exception 'This receipt is already void.';
  end if;

  update public.receipts
  set voided_at = now(), updated_at = now()
  where id = original.id;

  insert into public.receipts (
    token, booking_id, payment_id, replaces_receipt_id, amount, paid_on, method
  ) values (
    p_token, original.booking_id, original.payment_id, original.id,
    original.amount, original.paid_on, original.method
  )
  returning * into replacement;

  return replacement;
end;
$$;

create or replace function public.materialize_contract_workflow(
  p_agreement_id uuid,
  p_primary_name text,
  p_primary_email text,
  p_primary_phone text,
  p_primary_address text,
  p_secondary_name text,
  p_secondary_email text,
  p_secondary_phone text,
  p_shoot_type text,
  p_start_at timestamptz,
  p_end_at timestamptz,
  p_location text,
  p_total numeric,
  p_invoice_due_date date,
  p_delivery_due_date date,
  p_stage text,
  p_calendar_event_id text,
  p_booking_token text
)
returns uuid
language plpgsql
security definer
set search_path = public
as $$
declare
  agreement_row public.agreement_requests;
  primary_client_id uuid;
  secondary_client_id uuid;
  booking_row public.bookings;
begin
  perform pg_advisory_xact_lock(hashtextextended(p_agreement_id::text, 0));
  select * into agreement_row from public.agreement_requests where id = p_agreement_id for update;
  if agreement_row.id is null then raise exception 'Agreement request not found.'; end if;
  if agreement_row.sent_at is null then raise exception 'The agreement must be sent before materialization.'; end if;
  if p_stage not in ('contract_out', 'booked', 'editing') then raise exception 'Invalid automated stage.'; end if;

  select id into primary_client_id from public.clients
  where (p_primary_email is not null and lower(email) = lower(p_primary_email))
     or (p_primary_email is null and lower(name) = lower(p_primary_name))
  order by case when p_primary_email is not null and lower(email) = lower(p_primary_email) then 0 else 1 end
  limit 1 for update;
  if primary_client_id is null then
    insert into public.clients (name, email, phone, address)
    values (p_primary_name, nullif(btrim(p_primary_email), ''), p_primary_phone, p_primary_address)
    on conflict do nothing
    returning id into primary_client_id;
    if primary_client_id is null and p_primary_email is not null then
      select id into primary_client_id from public.clients where lower(email) = lower(p_primary_email) limit 1;
    end if;
  else
    update public.clients set
      name = p_primary_name,
      email = coalesce(nullif(btrim(p_primary_email), ''), email),
      phone = coalesce(nullif(btrim(p_primary_phone), ''), phone),
      address = coalesce(nullif(btrim(p_primary_address), ''), address),
      updated_at = now()
    where id = primary_client_id;
  end if;
  if primary_client_id is null then raise exception 'Could not create the primary client.'; end if;

  if nullif(btrim(p_secondary_name), '') is not null then
    select id into secondary_client_id from public.clients
    where (p_secondary_email is not null and lower(email) = lower(p_secondary_email))
       or (p_secondary_email is null and lower(name) = lower(p_secondary_name))
    limit 1 for update;
    if secondary_client_id is null then
      insert into public.clients (name, email, phone)
      values (p_secondary_name, nullif(btrim(p_secondary_email), ''), p_secondary_phone)
      on conflict do nothing
      returning id into secondary_client_id;
      if secondary_client_id is null and p_secondary_email is not null then
        select id into secondary_client_id from public.clients where lower(email) = lower(p_secondary_email) limit 1;
      end if;
    else
      update public.clients set
        name = p_secondary_name,
        email = coalesce(nullif(btrim(p_secondary_email), ''), email),
        phone = coalesce(nullif(btrim(p_secondary_phone), ''), phone),
        updated_at = now()
      where id = secondary_client_id;
    end if;
    if secondary_client_id is null then raise exception 'Could not create the secondary client.'; end if;
  end if;

  delete from public.agreement_clients where agreement_request_id = p_agreement_id and role = 'primary';
  insert into public.agreement_clients (agreement_request_id, client_id, role)
  values (p_agreement_id, primary_client_id, 'primary');
  delete from public.agreement_clients where agreement_request_id = p_agreement_id and role = 'secondary';
  if secondary_client_id is not null then
    insert into public.agreement_clients (agreement_request_id, client_id, role)
    values (p_agreement_id, secondary_client_id, 'secondary');
  end if;

  select * into booking_row from public.bookings where agreement_request_id = p_agreement_id for update;
  if booking_row.id is null then
    insert into public.bookings (
      token, agreement_request_id, client_name, client_email, shoot_type,
      start_at, end_at, location, total, balance, delivery_due_date,
      calendar_event_id, stage, stage_override, invoice_due_date, invoice_tax_rate
    ) values (
      p_booking_token, p_agreement_id,
      case when secondary_client_id is null then p_primary_name else p_primary_name || ' & ' || p_secondary_name end,
      nullif(btrim(p_primary_email), ''), p_shoot_type, p_start_at, p_end_at,
      p_location, p_total::text, p_total::text, p_delivery_due_date,
      p_calendar_event_id, p_stage, false, p_invoice_due_date, 0
    ) returning * into booking_row;
  else
    update public.bookings set
      client_name = case when secondary_client_id is null then p_primary_name else p_primary_name || ' & ' || p_secondary_name end,
      client_email = nullif(btrim(p_primary_email), ''),
      shoot_type = p_shoot_type,
      start_at = p_start_at,
      end_at = p_end_at,
      location = p_location,
      total = p_total::text,
      balance = p_total::text,
      delivery_due_date = p_delivery_due_date,
      calendar_event_id = p_calendar_event_id,
      stage = p_stage,
      stage_override = false,
      updated_at = now()
    where id = booking_row.id
    returning * into booking_row;
  end if;

  delete from public.booking_clients where booking_id = booking_row.id and role = 'primary';
  insert into public.booking_clients (booking_id, client_id, role) values (booking_row.id, primary_client_id, 'primary');
  delete from public.booking_clients where booking_id = booking_row.id and role = 'secondary';
  if secondary_client_id is not null then
    insert into public.booking_clients (booking_id, client_id, role) values (booking_row.id, secondary_client_id, 'secondary');
  end if;

  if booking_row.invoice_sent_at is null then
    delete from public.invoice_line_items where booking_id = booking_row.id;
    insert into public.invoice_line_items (booking_id, description, quantity, unit_price, sort_order)
    values (booking_row.id, p_shoot_type, 1, p_total, 0);
    update public.bookings set
      invoice_due_date = p_invoice_due_date,
      invoice_discount = null,
      invoice_tax_rate = 0,
      updated_at = now()
    where id = booking_row.id;
  end if;

  return booking_row.id;
end;
$$;

create or replace function public.protect_sent_receipt()
returns trigger
language plpgsql
set search_path = public
as $$
begin
  if tg_op = 'DELETE' then
    if old.sent_at is not null then
      raise exception 'Sent receipts are immutable. Void and replace the receipt instead.';
    end if;
    return old;
  end if;
  if old.sent_at is not null and (
    new.receipt_no is distinct from old.receipt_no or
    new.token is distinct from old.token or
    new.booking_id is distinct from old.booking_id or
    new.payment_id is distinct from old.payment_id or
    new.replaces_receipt_id is distinct from old.replaces_receipt_id or
    new.amount is distinct from old.amount or
    new.paid_on is distinct from old.paid_on or
    new.method is distinct from old.method or
    new.snapshot is distinct from old.snapshot or
    new.sent_at is distinct from old.sent_at or
    new.created_at is distinct from old.created_at
  ) then
    raise exception 'Sent receipts are immutable. Void and replace the receipt instead.';
  end if;
  return new;
end;
$$;

drop trigger if exists protect_sent_receipt_trigger on public.receipts;
create trigger protect_sent_receipt_trigger
before update or delete on public.receipts
for each row execute function public.protect_sent_receipt();

alter table public.clients enable row level security;
alter table public.agreement_clients enable row level security;
alter table public.booking_clients enable row level security;
alter table public.receipts enable row level security;
alter table public.receipt_deliveries enable row level security;

create policy "Deny all non-service-role access"
  on public.clients for all using (false) with check (false);
create policy "Deny all non-service-role access"
  on public.agreement_clients for all using (false) with check (false);
create policy "Deny all non-service-role access"
  on public.booking_clients for all using (false) with check (false);
create policy "Deny all non-service-role access"
  on public.receipts for all using (false) with check (false);
create policy "Deny all non-service-role access"
  on public.receipt_deliveries for all using (false) with check (false);

revoke all on table public.clients from anon, authenticated;
revoke all on table public.agreement_clients from anon, authenticated;
revoke all on table public.booking_clients from anon, authenticated;
revoke all on table public.receipts from anon, authenticated;
revoke all on table public.receipt_deliveries from anon, authenticated;

grant all on table public.clients to service_role;
grant all on table public.agreement_clients to service_role;
grant all on table public.booking_clients to service_role;
grant all on table public.receipts to service_role;
grant all on table public.receipt_deliveries to service_role;
grant usage, select on sequence public.receipts_receipt_no_seq to service_role;
revoke all on function public.void_and_replace_receipt(uuid, text) from public, anon, authenticated;
grant execute on function public.void_and_replace_receipt(uuid, text) to service_role;
revoke all on function public.materialize_contract_workflow(uuid, text, text, text, text, text, text, text, text, timestamptz, timestamptz, text, numeric, date, date, text, text, text) from public, anon, authenticated;
grant execute on function public.materialize_contract_workflow(uuid, text, text, text, text, text, text, text, text, timestamptz, timestamptz, text, numeric, date, date, text, text, text) to service_role;
revoke all on function public.protect_sent_receipt() from public, anon, authenticated;
grant execute on function public.protect_sent_receipt() to service_role;
