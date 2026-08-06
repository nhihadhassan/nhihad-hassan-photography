-- Staged contract completion for the existing agreement workflow.
--
-- Photographer-entered terms are frozen in agreement_requests.details when the
-- request is sent. The client supplies their contact details and signs first,
-- which returns the contract for review. Only the photographer's
-- countersignature finalizes the agreement and releases the completed copy.
--
-- Expiry and reminder columns are intentionally NOT added here. They already
-- exist from 20260806055705_contract_expiry_reminders.sql (expires_at,
-- reminders_enabled, reminder_interval_days, ...) and that scheme stays
-- authoritative.
--
-- Applied to the live project on 2026-08-06 and recorded under this version.

alter table public.agreement_requests
  add column if not exists client_details jsonb not null default '{}'::jsonb,
  add column if not exists client_submitted_at timestamptz,
  add column if not exists photographer_signed_at timestamptz,
  add column if not exists finalized_at timestamptz;

alter table public.signed_agreements
  add column if not exists client_details jsonb not null default '{}'::jsonb,
  add column if not exists photographer_signer_name text,
  add column if not exists photographer_signature_data_url text,
  add column if not exists photographer_signed_at timestamptz;

-- Backfill agreements that were fully executed under the old single-stage flow.
-- Without this, the staged-order constraint below would reject every existing
-- signed row, since those have signed_at set but no staged timestamps.
update public.agreement_requests
set
  client_submitted_at = coalesce(client_submitted_at, signed_at),
  photographer_signed_at = coalesce(photographer_signed_at, signed_at),
  finalized_at = coalesce(finalized_at, signed_at)
where signed_at is not null;

create index if not exists agreement_requests_client_submitted_idx
  on public.agreement_requests (client_submitted_at desc)
  where client_submitted_at is not null and finalized_at is null;

alter table public.agreement_requests
  drop constraint if exists agreement_requests_staged_signing_order;

alter table public.agreement_requests
  add constraint agreement_requests_staged_signing_order check (
    (photographer_signed_at is null or client_submitted_at is not null)
    and (finalized_at is null or photographer_signed_at is not null)
    and (signed_at is null or finalized_at is not null)
  );

-- Both tables already deny every non-service-role operation through RLS. Keep
-- that boundary explicit for sensitive addresses, phone numbers and signatures.
alter table public.agreement_requests force row level security;
alter table public.signed_agreements force row level security;

comment on column public.agreement_requests.client_details is
  'Client-supplied contact details. Read and written only by server-side service-role code after capability-token validation.';
comment on column public.agreement_requests.client_submitted_at is
  'Client completed their fields and electronic signature; awaits photographer countersignature.';
comment on column public.agreement_requests.photographer_signed_at is
  'When the photographer countersigned the client-submitted agreement.';
comment on column public.agreement_requests.finalized_at is
  'Both parties have signed and the frozen agreement is final.';
