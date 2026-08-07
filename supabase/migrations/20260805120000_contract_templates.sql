-- Contract templates and issued contracts for Nhihad Hassan Photography
-- Assumes an existing public.is_admin() helper. If your project instead uses
-- profiles.role or a JWT claim, swap the body of is_admin() and leave the
-- policies below unchanged.

create type public.contract_status as enum (
  'draft',
  'sent',
  'viewed',
  'signed',
  'declined',
  'void',
  'expired'
);

create type public.shoot_type as enum (
  'wedding',
  'event',
  'nightlife',
  'portrait',
  'lifestyle',
  'other'
);

-- ---------------------------------------------------------------------------
-- Templates
-- ---------------------------------------------------------------------------

create table public.contract_templates (
  id            uuid primary key default gen_random_uuid(),
  slug          text not null,
  version       integer not null default 1,
  name          text not null,
  shoot_type    public.shoot_type not null,
  body          text not null,
  -- Field keys this template actually references, extracted at save time.
  -- Used to drive the admin form and to validate before issuing.
  field_keys    text[] not null default '{}',
  is_active     boolean not null default false,
  created_at    timestamptz not null default now(),
  updated_at    timestamptz not null default now(),
  constraint contract_templates_slug_version_key unique (slug, version)
);

-- Only one active version per slug.
create unique index contract_templates_one_active_per_slug
  on public.contract_templates (slug)
  where is_active;

-- A template version that has been used by any contract is frozen.
create or replace function public.prevent_used_template_edit()
returns trigger
language plpgsql
security definer
set search_path = public
as $$
begin
  if exists (select 1 from public.contracts c where c.template_id = old.id) then
    if new.body is distinct from old.body
       or new.field_keys is distinct from old.field_keys then
      raise exception
        'Template % v% is referenced by issued contracts. Create a new version instead.',
        old.slug, old.version;
    end if;
  end if;
  new.updated_at := now();
  return new;
end;
$$;

create trigger contract_templates_freeze_used
  before update on public.contract_templates
  for each row execute function public.prevent_used_template_edit();

revoke all on function public.prevent_used_template_edit() from public;

-- ---------------------------------------------------------------------------
-- Issued contracts
-- ---------------------------------------------------------------------------

create table public.contracts (
  id                uuid primary key default gen_random_uuid(),
  booking_id        uuid not null references public.bookings (id) on delete restrict,
  template_id       uuid not null references public.contract_templates (id) on delete restrict,
  template_slug     text not null,
  template_version  integer not null,

  -- The merge values used to render. Snapshotted, never re-read from bookings.
  field_values      jsonb not null default '{}'::jsonb,

  -- Frozen output. Null while draft, populated on transition to 'sent'.
  rendered_body     text,
  rendered_at       timestamptz,

  status            public.contract_status not null default 'draft',
  sent_at           timestamptz,
  viewed_at         timestamptz,
  signed_at         timestamptz,
  voided_at         timestamptz,
  expires_at        timestamptz,

  pdf_r2_key        text,
  created_at        timestamptz not null default now(),
  updated_at        timestamptz not null default now(),

  constraint contracts_sent_requires_render
    check (status = 'draft' or (rendered_body is not null and rendered_at is not null))
);

create index contracts_booking_id_idx on public.contracts (booking_id);
create index contracts_template_id_idx on public.contracts (template_id);
create index contracts_status_idx on public.contracts (status);

-- Once sent, the rendered text and the values behind it are immutable.
-- Status, timestamps, and the PDF key may still advance.
create or replace function public.protect_issued_contract()
returns trigger
language plpgsql
as $$
begin
  if old.status <> 'draft' then
    if new.rendered_body is distinct from old.rendered_body
       or new.field_values  is distinct from old.field_values
       or new.template_id   is distinct from old.template_id
       or new.template_slug is distinct from old.template_slug
       or new.template_version is distinct from old.template_version
       or new.rendered_at   is distinct from old.rendered_at
       or new.booking_id    is distinct from old.booking_id then
      raise exception
        'Contract % has status %. Its terms are immutable. Void it and issue a new one.',
        old.id, old.status;
    end if;
  end if;

  if old.status = 'signed' and new.status not in ('signed', 'void') then
    raise exception 'A signed contract cannot return to status %.', new.status;
  end if;

  new.updated_at := now();
  return new;
end;
$$;

create trigger contracts_protect_issued
  before update on public.contracts
  for each row execute function public.protect_issued_contract();

revoke all on function public.protect_issued_contract() from public;

-- ---------------------------------------------------------------------------
-- Signatures
-- ---------------------------------------------------------------------------

create table public.contract_signatures (
  id            uuid primary key default gen_random_uuid(),
  contract_id   uuid not null references public.contracts (id) on delete cascade,
  signer_name   text not null,
  signer_email  text not null,
  signer_role   text not null default 'client',
  signed_at     timestamptz,
  ip_address    inet,
  user_agent    text,
  -- Typed name or base64 drawn signature, whichever your signing UI captures.
  signature_data text,
  -- Per signer link, hashed. Never store the raw token.
  token_hash    text not null,
  token_expires_at timestamptz not null,
  created_at    timestamptz not null default now(),
  constraint contract_signatures_token_hash_key unique (token_hash)
);

create index contract_signatures_contract_id_idx
  on public.contract_signatures (contract_id);

-- A contract is signed only when every required signer has signed.
create or replace function public.sync_contract_signed_state()
returns trigger
language plpgsql
security definer
set search_path = public
as $$
declare
  outstanding integer;
begin
  select count(*) into outstanding
  from public.contract_signatures s
  where s.contract_id = new.contract_id
    and s.signed_at is null;

  if outstanding = 0 then
    update public.contracts
       set status = 'signed',
           signed_at = coalesce(signed_at, now())
     where id = new.contract_id
       and status in ('sent', 'viewed');
  end if;

  return new;
end;
$$;

create trigger contract_signatures_sync_state
  after update of signed_at on public.contract_signatures
  for each row when (new.signed_at is not null)
  execute function public.sync_contract_signed_state();

revoke all on function public.sync_contract_signed_state() from public;

-- ---------------------------------------------------------------------------
-- RLS
-- ---------------------------------------------------------------------------

alter table public.contract_templates   enable row level security;
alter table public.contracts            enable row level security;
alter table public.contract_signatures  enable row level security;

create policy contract_templates_admin_all on public.contract_templates
  for all to authenticated
  using ((select public.is_admin())) with check ((select public.is_admin()));

create policy contracts_admin_all on public.contracts
  for all to authenticated
  using ((select public.is_admin())) with check ((select public.is_admin()));

create policy contract_signatures_admin_all on public.contract_signatures
  for all to authenticated
  using ((select public.is_admin())) with check ((select public.is_admin()));

-- This project may opt out of automatic Data API exposure for new tables.
-- Grant only the authenticated admin operations protected by the policies.
grant select, insert, update, delete on public.contract_templates to authenticated;
grant select, insert, update, delete on public.contracts to authenticated;
grant select, insert, update, delete on public.contract_signatures to authenticated;

-- Clients reach their contract through a signing token, not a session, so the
-- read and sign paths go through security definer RPCs rather than a policy.
-- Hash the token with sha256 in the route handler before lookup.

create or replace function public.get_contract_for_signing(p_token_hash text)
returns table (
  contract_id    uuid,
  rendered_body  text,
  signer_name    text,
  signer_email   text,
  already_signed boolean
)
language plpgsql
security definer
set search_path = public
as $$
begin
  return query
  select c.id, c.rendered_body, s.signer_name, s.signer_email, s.signed_at is not null
  from public.contract_signatures s
  join public.contracts c on c.id = s.contract_id
  where s.token_hash = p_token_hash
    and s.token_expires_at > now()
    and c.status in ('sent', 'viewed', 'signed');

  update public.contracts c
     set status = 'viewed', viewed_at = coalesce(c.viewed_at, now())
    from public.contract_signatures s
   where s.token_hash = p_token_hash
     and c.id = s.contract_id
     and c.status = 'sent';
end;
$$;

revoke all on function public.get_contract_for_signing(text) from public;
grant execute on function public.get_contract_for_signing(text) to anon, authenticated;
