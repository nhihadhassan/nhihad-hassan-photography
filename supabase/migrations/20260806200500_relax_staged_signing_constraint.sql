-- The staged-signing columns were applied to the live project before the code
-- that sets them was merged.
--
-- The original constraint in 20260806195234_staged_contract_signing.sql required
-- finalized_at whenever signed_at was set. The single-stage signAgreement that
-- is currently deployed sets signed_at on its own, so that clause would have
-- rejected every real signature until the staged-signing code ships.
--
-- Enforce only the staged ordering itself. That holds for both the deployed
-- single-stage path (all staged columns null) and the new staged path, so the
-- migration and the code can land independently.

alter table public.agreement_requests
  drop constraint if exists agreement_requests_staged_signing_order;

alter table public.agreement_requests
  add constraint agreement_requests_staged_signing_order check (
    (photographer_signed_at is null or client_submitted_at is not null)
    and (finalized_at is null or photographer_signed_at is not null)
  );
