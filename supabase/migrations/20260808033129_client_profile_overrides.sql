-- Canonical, admin-editable overrides for a client profile.
--
-- A "client" here is a derived aggregate (src/lib/clients.ts merges
-- inquiries/galleries/bookings/agreements/reviews into one profile per
-- person, keyed by email or a name-based fallback) -- there is no single
-- source-of-truth row for name/email/phone/address today. This table lets
-- the admin correct or fill in those fields without touching the
-- underlying historical records (an old gallery's client_name should not
-- retroactively change just because a typo was fixed on the profile).
--
-- Deny-by-default RLS: read and written only by server code via the
-- service-role client, same as reminder_rules.

create table if not exists public.client_profile_overrides (
  key text primary key,
  name text,
  email text,
  phone text,
  address text,
  notes text,
  updated_at timestamptz not null default now()
);

alter table public.client_profile_overrides enable row level security;

create policy "Deny all non-service-role access"
  on public.client_profile_overrides for all using (false) with check (false);
