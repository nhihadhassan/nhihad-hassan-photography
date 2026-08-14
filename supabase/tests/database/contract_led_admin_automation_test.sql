begin;

create extension if not exists pgtap with schema extensions;
set local search_path = public, extensions;

select plan(22);

create temporary table contract_automation_test_context (
  agreement_id uuid not null,
  calendar_agreement_id uuid not null,
  first_booking_id uuid,
  booking_id uuid,
  payment_id uuid,
  receipt_id uuid,
  replacement_id uuid
) on commit drop;

with contract_request as (
  insert into public.agreement_requests (
    token,
    client_name,
    client_email,
    details,
    sent_at
  ) values (
    'contract-test-' || gen_random_uuid()::text,
    'Integration Primary',
    'codex-contract-primary@example.invalid',
    '{}'::jsonb,
    now()
  )
  returning id
), calendar_request as (
  insert into public.agreement_requests (
    token,
    client_name,
    client_email,
    details,
    calendar_event_id
  ) values (
    'calendar-test-' || gen_random_uuid()::text,
    'Calendar Prefill Only',
    'codex-calendar-prefill@example.invalid',
    '{}'::jsonb,
    'calendar-prefill-without-job'
  )
  returning id
)
insert into contract_automation_test_context (agreement_id, calendar_agreement_id)
select contract_request.id, calendar_request.id
from contract_request cross join calendar_request;

select is(
  (
    select count(*)::bigint
    from public.bookings
    where agreement_request_id = (
      select calendar_agreement_id from contract_automation_test_context
    )
  ),
  0::bigint,
  'calendar prefill alone creates no booking'
);

update contract_automation_test_context
set first_booking_id = public.materialize_contract_workflow(
  agreement_id,
  'Integration Primary',
  'codex-contract-primary@example.invalid',
  '416-555-0100',
  '1 Test Street, Toronto, ON',
  'Integration Secondary',
  'codex-contract-secondary@example.invalid',
  '416-555-0101',
  'Wedding coverage',
  '2026-08-22 14:00:00-04'::timestamptz,
  '2026-08-22 18:00:00-04'::timestamptz,
  'Toronto Test Venue',
  350::numeric,
  '2026-08-22'::date,
  '2026-09-18'::date,
  'booked',
  'calendar-contract-test',
  'booking-test-' || agreement_id::text
);

update contract_automation_test_context
set booking_id = public.materialize_contract_workflow(
  agreement_id,
  'Integration Primary',
  'codex-contract-primary@example.invalid',
  '416-555-0100',
  '1 Test Street, Toronto, ON',
  'Integration Secondary',
  'codex-contract-secondary@example.invalid',
  '416-555-0101',
  'Wedding coverage',
  '2026-08-22 14:00:00-04'::timestamptz,
  '2026-08-22 18:00:00-04'::timestamptz,
  'Toronto Test Venue',
  350::numeric,
  '2026-08-22'::date,
  '2026-09-18'::date,
  'booked',
  'calendar-contract-test',
  'unused-token-on-resend-' || agreement_id::text
);

select is(
  (select booking_id from contract_automation_test_context),
  (select first_booking_id from contract_automation_test_context),
  'resending returns the existing booking'
);

select is(
  (
    select count(*)::bigint
    from public.bookings
    where agreement_request_id = (
      select agreement_id from contract_automation_test_context
    )
  ),
  1::bigint,
  'double materialization creates exactly one booking'
);

select is(
  (
    select count(*)::bigint from public.clients
    where lower(email) = 'codex-contract-primary@example.invalid'
  ),
  1::bigint,
  'double materialization creates one primary client'
);

select is(
  (
    select count(*)::bigint from public.clients
    where lower(email) = 'codex-contract-secondary@example.invalid'
  ),
  1::bigint,
  'double materialization creates one secondary client'
);

select is(
  (
    select count(*)::bigint from public.agreement_clients
    where agreement_request_id = (
      select agreement_id from contract_automation_test_context
    )
  ),
  2::bigint,
  'agreement keeps one primary and one secondary client link'
);

select is(
  (
    select count(*)::bigint from public.booking_clients
    where booking_id = (
      select booking_id from contract_automation_test_context
    )
  ),
  2::bigint,
  'booking keeps one primary and one secondary client link'
);

select is(
  (
    select count(*)::bigint from public.invoice_line_items
    where booking_id = (
      select booking_id from contract_automation_test_context
    )
  ),
  1::bigint,
  'resending creates exactly one invoice line item'
);

select is(
  (
    select unit_price from public.invoice_line_items
    where booking_id = (
      select booking_id from contract_automation_test_context
    )
  ),
  350::numeric,
  'the invoice draft covers the full contracted total'
);

select is(
  (
    select invoice_due_date from public.bookings
    where id = (select booking_id from contract_automation_test_context)
  ),
  '2026-08-22'::date,
  'the invoice draft uses the contract balance date'
);

select is(
  (
    select stage from public.bookings
    where id = (select booking_id from contract_automation_test_context)
  ),
  'booked'::text,
  'materialization stores the derived operational stage'
);

update public.bookings
set
  invoice_sent_at = now(),
  invoice_snapshot = '{"total": 350, "status": "sent"}'::jsonb
where id = (select booking_id from contract_automation_test_context);

update contract_automation_test_context
set booking_id = public.materialize_contract_workflow(
  agreement_id,
  'Integration Primary',
  'codex-contract-primary@example.invalid',
  '416-555-0100',
  '1 Test Street, Toronto, ON',
  'Integration Secondary',
  'codex-contract-secondary@example.invalid',
  '416-555-0101',
  'Changed after invoice send',
  '2026-08-22 14:00:00-04'::timestamptz,
  '2026-08-22 18:00:00-04'::timestamptz,
  'Toronto Test Venue',
  999::numeric,
  '2026-08-30'::date,
  '2026-09-18'::date,
  'booked',
  'calendar-contract-test',
  'unused-token-after-invoice-send-' || agreement_id::text
);

select is(
  (
    select unit_price from public.invoice_line_items
    where booking_id = (
      select booking_id from contract_automation_test_context
    )
  ),
  350::numeric,
  'contract resend does not rewrite a sent invoice line item'
);

select is(
  (
    select invoice_due_date from public.bookings
    where id = (select booking_id from contract_automation_test_context)
  ),
  '2026-08-22'::date,
  'contract resend does not rewrite a sent invoice due date'
);

select is(
  (
    select invoice_snapshot from public.bookings
    where id = (select booking_id from contract_automation_test_context)
  ),
  '{"total": 350, "status": "sent"}'::jsonb,
  'contract resend preserves the frozen invoice snapshot'
);

with inserted_payment as (
  insert into public.payments (
    booking_id,
    client_name,
    client_email,
    amount,
    kind,
    paid_on,
    method,
    automation_key
  )
  select
    booking_id,
    'Integration Primary',
    'codex-contract-primary@example.invalid',
    350,
    'balance',
    '2026-08-22',
    'interac',
    'contract-integration-payment-' || agreement_id::text
  from contract_automation_test_context
  returning id
)
update contract_automation_test_context
set payment_id = inserted_payment.id
from inserted_payment;

with inserted_receipt as (
  insert into public.receipts (
    token,
    booking_id,
    payment_id,
    amount,
    paid_on,
    method,
    snapshot,
    sent_at
  )
  select
    'receipt-test-' || gen_random_uuid()::text,
    booking_id,
    payment_id,
    350,
    '2026-08-22',
    'interac',
    '{"amount": 350, "clientName": "Integration Primary"}'::jsonb,
    now()
  from contract_automation_test_context
  returning id
)
update contract_automation_test_context
set receipt_id = inserted_receipt.id
from inserted_receipt;

select throws_like(
  format(
    'update public.receipts set amount = 999 where id = %L::uuid',
    (select receipt_id from contract_automation_test_context)
  ),
  '%Sent receipts are immutable%',
  'a sent receipt rejects content changes'
);

select lives_ok(
  format(
    'update public.receipts set viewed_at = now() where id = %L::uuid',
    (select receipt_id from contract_automation_test_context)
  ),
  'a sent receipt still permits view tracking'
);

update contract_automation_test_context
set replacement_id = (
  public.void_and_replace_receipt(
    receipt_id,
    'receipt-replacement-test-' || gen_random_uuid()::text
  )
).id;

select ok(
  (
    select voided_at is not null from public.receipts
    where id = (select receipt_id from contract_automation_test_context)
  ),
  'void and replace retains and voids the original receipt'
);

select isnt(
  (
    select receipt_no from public.receipts
    where id = (select receipt_id from contract_automation_test_context)
  ),
  (
    select receipt_no from public.receipts
    where id = (select replacement_id from contract_automation_test_context)
  ),
  'the replacement receives a new immutable receipt number'
);

select is(
  (
    select replaces_receipt_id from public.receipts
    where id = (select replacement_id from contract_automation_test_context)
  ),
  (select receipt_id from contract_automation_test_context),
  'the replacement links back to the void receipt'
);

select is(
  (
    select count(*)::bigint from public.receipts
    where payment_id = (select payment_id from contract_automation_test_context)
      and voided_at is null
  ),
  1::bigint,
  'a payment has exactly one active receipt after replacement'
);

select is(
  (
    select snapshot from public.receipts
    where id = (select receipt_id from contract_automation_test_context)
  ),
  '{"amount": 350, "clientName": "Integration Primary"}'::jsonb,
  'the void receipt retains its sent snapshot'
);

select ok(
  (
    select sent_at is null and snapshot is null
    from public.receipts
    where id = (select replacement_id from contract_automation_test_context)
  ),
  'the replacement remains an unsent draft for review'
);

select * from finish();

rollback;
