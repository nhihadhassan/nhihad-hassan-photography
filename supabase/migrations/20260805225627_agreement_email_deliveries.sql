-- Auditable contract email delivery.
--
-- One row is created for every explicit send attempt. Resend webhook events
-- update that row so the admin can distinguish accepted, delivered, opened,
-- clicked, delayed, and failed messages.

create table public.agreement_deliveries (
  id uuid primary key default gen_random_uuid(),
  agreement_request_id uuid not null references public.agreement_requests(id) on delete cascade,
  sent_to text not null,
  subject text not null,
  status text not null default 'pending'
    check (status in (
      'pending',
      'sent',
      'delivered',
      'opened',
      'clicked',
      'delivery_delayed',
      'bounced',
      'failed',
      'suppressed',
      'complained'
    )),
  resend_message_id text unique,
  failure_reason text,
  sent_at timestamptz,
  delivered_at timestamptz,
  opened_at timestamptz,
  clicked_at timestamptz,
  failed_at timestamptz,
  last_event_at timestamptz,
  created_at timestamptz not null default now()
);

create index agreement_deliveries_request_created_idx
  on public.agreement_deliveries(agreement_request_id, created_at desc);

create table public.agreement_delivery_events (
  id text primary key,
  delivery_id uuid not null references public.agreement_deliveries(id) on delete cascade,
  resend_message_id text not null,
  event_type text not null,
  occurred_at timestamptz not null,
  created_at timestamptz not null default now()
);

create index agreement_delivery_events_delivery_occurred_idx
  on public.agreement_delivery_events(delivery_id, occurred_at desc);

alter table public.agreement_deliveries enable row level security;
alter table public.agreement_delivery_events enable row level security;

create policy "Deny all non-service-role access"
  on public.agreement_deliveries for all using (false) with check (false);

create policy "Deny all non-service-role access"
  on public.agreement_delivery_events for all using (false) with check (false);

revoke all on table public.agreement_deliveries from anon, authenticated;
revoke all on table public.agreement_delivery_events from anon, authenticated;
grant all on table public.agreement_deliveries to service_role;
grant all on table public.agreement_delivery_events to service_role;
