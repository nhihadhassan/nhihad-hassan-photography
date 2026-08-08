-- Reusable, independently-editable contract templates. Distinct from the
-- single-row booking_agreement override this replaces as the primary path:
-- multiple named templates (Photography, Wedding, and whatever the admin
-- adds), each with its own intro and sections.
--
-- Sections use the exact same {heading, clauses[]} shape already consumed by
-- AgreementDocument (src/components/agreement-document.tsx), so the template
-- editor, the client agreement page, the admin preview, and print/PDF all
-- render through the same component. No parallel renderer.
--
-- Deliberately NOT versioned/frozen at the schema level: an agreement's
-- wording is already frozen independently, in signed_agreements.agreement_snapshot,
-- the moment the first signature lands (see src/lib/agreements.ts). Editing a
-- template after that point cannot retroactively change a signed agreement,
-- so a second freeze mechanism here would be redundant.

create table public.contract_templates (
  id                     uuid primary key default gen_random_uuid(),
  slug                   text not null unique,
  name                   text not null,
  description            text not null default '',
  agreement_title        text not null default 'Photography Services Agreement',
  intro                  text not null default '',
  sections               jsonb not null default '[]'::jsonb,
  supports_second_signer boolean not null default false,
  archived_at            timestamptz,
  created_at             timestamptz not null default now(),
  updated_at             timestamptz not null default now()
);

create index contract_templates_active_idx
  on public.contract_templates (updated_at desc)
  where archived_at is null;

alter table public.contract_templates enable row level security;

-- Public (anon) may read active templates: the public /agreement/[token]
-- page renders live template content for any request not yet signed,
-- exactly like booking_agreement today.
create policy "Public can read active contract templates"
  on public.contract_templates
  for select
  using (archived_at is null);

-- All writes go through the service-role client from admin server actions.
create policy "Service role manages contract templates"
  on public.contract_templates
  for all
  using (false)
  with check (false);
