# Versioned Contract Templates

Status: local uncommitted prototype, not applied to production  
Last reviewed: 2026-08-06

## Release warning

This system is not the live contract source of truth. Production currently uses the existing `agreement_requests` and `signed_agreements` workflow on `origin/main`. The files documented here were created on an older, divergent branch and must be reconciled with that workflow before release.

The draft migration `supabase/migrations/20260805120000_contract_templates.sql` was absent from linked Supabase migration history on 2026-08-06. Do not apply it casually and do not run a broad database push from this checkout.

The agreement text also requires review by an Ontario lawyer before first client use.

## Staged signing extension

`supabase/migrations/20260806184856_staged_contract_signing.sql` extends the existing
`agreement_requests` and `signed_agreements` tables for the requested two-stage flow. It is also
local-only and must not be applied until the linked migration history and production schema are
reconciled.

The staged lifecycle is:

1. The photographer fills the general or wedding contract in the document editor and sends it.
2. The client uses the private token route to add their address, phone number, optional backup
   contact, legal name, and signature.
3. The request moves to `client_submitted_at` and the photographer is notified.
4. The photographer reviews the client details and countersigns.
5. `photographer_signed_at`, `finalized_at`, and the legacy `signed_at` marker are recorded together;
   only then does the booking advance and the client receive the finalized-copy email.

Sensitive client fields remain on deny-by-default RLS tables and are accessed only through
server-side service-role code after the high-entropy capability token is validated. The public UI
does not use a browser Supabase client for contract records.

## Files

| File | Responsibility |
|---|---|
| `src/lib/contracts/schema.ts` | Merge-field registry, defaults, validation, and field metadata |
| `src/lib/contracts/derive.ts` | Derived balance, percentages, end time, and delivery dates |
| `src/lib/contracts/render.ts` | Conditional Markdown renderer with strict and preview modes |
| `src/components/rendered-contract-document.tsx` | Client rendering for frozen contract text |
| `templates/services-agreement-v1.md` | Draft photography services agreement |
| `scripts/test-contract-render.ts` | Read-only end-to-end render test |
| `supabase/migrations/20260805120000_contract_templates.sql` | Draft tables, policies, triggers, and signing RPCs |
| `supabase/migrations/20260806184856_staged_contract_signing.sql` | Draft staged client and photographer signing fields |

## Core invariant

A client must sign exactly the text they reviewed. Issued and signed terms cannot be reconstructed later from a changed booking, pricing tier, business setting, or template.

The intended lifecycle is:

1. Draft: field values are editable and no frozen body exists.
2. Issue: validate fields, derive computed values, render in strict mode, and save the complete rendered body.
3. Deliver: create a separate hashed token for each signer and send the correct client link.
4. View: record the first view without changing the frozen body.
5. Sign: record signer identity, timestamp, and audit metadata; complete the contract only when required signatures exist.
6. Amend: void the old contract and issue a new version. Never mutate the issued text.

Template versions follow the same rule. Once referenced by an issued contract, a version must be frozen and future edits create a new version.

## Template language

The renderer supports registered fields, formatting pipes, conditionals, and client loops.

```md
{{fee.total | money_cad}}
{{shoot.date | date_full}}
{{#if licence.is_commercial}}...{{else}}...{{/if}}
{{#unless business.has_insurance}}...{{/unless}}
{{#each clients}}{{name}}, {{email}}{{/each}}
```

Inside `each`, item fields and loop metadata such as `index`, `is_first`, and `is_last` are available.

Preview mode may identify missing values. Issue mode must be strict and fail on an unknown or missing required key rather than silently removing legal text.

## Field model

`FIELDS` in `src/lib/contracts/schema.ts` is the source of truth.

- `business`: studio identity and policy context
- `booking`: client, service, date, location, deliverables, and financial inputs
- `policy`: adjustable contract defaults
- `derived`: computed fields that are never typed manually

The admin form should display only fields actually referenced by the selected template. Derived values should appear in preview but not as editable inputs.

## Validation

Release validation must include at least:

- required business, client, service, date, time, location, deliverable, and money fields
- one complete identity per required signer
- retainer not greater than total
- promised minimum images not greater than expected images
- HST number when HST registration is enabled
- overtime rate when overtime billing is enabled
- derived balance, annual interest, end time, and delivery date
- strict render with no unknown or missing keys
- reviewed snapshot or semantic diff of the full rendered agreement

## Security review required

The draft migration creates exposed-schema tables and `SECURITY DEFINER` signing functions. Before release:

- confirm every table has RLS and no unintended `anon` or `authenticated` table grant
- keep admin policies constrained by `public.is_admin()`
- revoke function execution from `PUBLIC` before granting the minimum roles
- keep a fixed `search_path`
- validate a hashed, high-entropy, expiring token on every client RPC
- ensure a signer can read and update only their own signature state
- avoid storing raw tokens
- decide whether IP addresses are required; if retained, document retention and privacy handling
- confirm trigger ordering and immutability under concurrent signatures
- run Supabase security and performance advisors

Do not add `SECURITY DEFINER` merely to bypass a permission error. Its use here must be narrowly justified by the token signing model.

## Integration decisions still open

- Replace the live agreement workflow or layer versioned templates beneath it
- Reuse existing agreement delivery tracking and routes from `origin/main`
- Preserve current signed snapshots while introducing new tables
- Map live booking/package fields into the new registry
- Choose the final client route; current production uses `/agreement/[token]`
- Define void, decline, expiry, resend, and multi-signer admin behavior
- Generate and retain a PDF or rely on frozen Markdown plus audit records
- Migrate existing agreements, leave them in place, or support both systems read-only

## Verification commands

```bash
npm run test:contracts
npm run lint
npm run build
```

The contract test must not write client data or generated agreements into the repository. Before release, add a reviewed rendered snapshot so wording changes appear as an intentional diff.

## Safe release gate

- [ ] Reconciled with latest `origin/main`
- [ ] Architecture decision made against existing agreement tables
- [ ] Ontario legal review complete
- [ ] Migration reviewed against the actual production schema
- [ ] RLS, grants, functions, and triggers security-reviewed
- [ ] Full renderer and snapshot tests pass
- [ ] Admin preview exactly matches the client page and stored body
- [ ] Multi-signer and expired-token behavior tested
- [ ] Exact migration applied and verified
- [ ] Supabase advisors pass
- [ ] GitHub SHA, Vercel deployment, and canonical client flow verified
