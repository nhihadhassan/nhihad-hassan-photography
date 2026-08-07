-- Editable site copy + brand/contact settings.
--
-- site_content: flat key/value strings (hero headings, about text, intros).
-- site_settings: existing single-row table (brand/contact/SEO). RLS was
-- enabled in 0001 but no policies were added, so it was effectively locked —
-- add public read + admin manage here and seed one row to edit.

create table if not exists public.site_content (
  key text primary key,
  value text,
  updated_at timestamptz not null default now()
);

alter table public.site_content enable row level security;

create policy "Public can read site content"
  on public.site_content for select
  using (true);

create policy "Admins manage site content"
  on public.site_content for all
  using (public.is_admin())
  with check (public.is_admin());

-- site_settings policies (table + RLS already exist from 0001).
drop policy if exists "Public can read site settings" on public.site_settings;
create policy "Public can read site settings"
  on public.site_settings for select
  using (true);

drop policy if exists "Admins manage site settings" on public.site_settings;
create policy "Admins manage site settings"
  on public.site_settings for all
  using (public.is_admin())
  with check (public.is_admin());

-- Ensure exactly one editable settings row exists.
insert into public.site_settings (brand_name)
select 'Nhihad Hassan Photography'
where not exists (select 1 from public.site_settings);
