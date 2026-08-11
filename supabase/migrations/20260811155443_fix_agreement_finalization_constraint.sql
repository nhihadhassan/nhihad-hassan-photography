-- The public signing flow now treats the photographer's standing signature
-- image, dated to agreement_requests.sent_at, as the photographer signature.
-- There is no longer a separate countersignature action, so finalized_at must
-- not depend on photographer_signed_at being populated.
--
-- Preserve the useful ordering guarantees for both the current single-stage
-- flow and historical countersigned agreements:
--   client submitted -> agreement finalized -> signed_at compatibility flag.

alter table public.agreement_requests
  drop constraint if exists agreement_requests_staged_signing_order;

alter table public.agreement_requests
  add constraint agreement_requests_staged_signing_order check (
    (photographer_signed_at is null or client_submitted_at is not null)
    and (finalized_at is null or client_submitted_at is not null)
    and (signed_at is null or finalized_at is not null)
  );
