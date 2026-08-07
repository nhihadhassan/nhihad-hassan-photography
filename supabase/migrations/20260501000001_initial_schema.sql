create extension if not exists "pgcrypto";

create table if not exists public.profiles (
  id uuid primary key references auth.users(id) on delete cascade,
  role text not null check (role in ('admin')),
  created_at timestamptz not null default now()
);

create table if not exists public.site_settings (
  id uuid primary key default gen_random_uuid(),
  brand_name text not null default 'Nhihad Hassan Photography',
  tagline text,
  contact_email text,
  contact_phone text,
  instagram_primary text,
  instagram_secondary text,
  about_text text,
  hero_photo_id uuid,
  seo_title text,
  seo_description text,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);

create table if not exists public.galleries (
  id uuid primary key default gen_random_uuid(),
  title text not null,
  slug text not null unique,
  client_name text,
  client_email text,
  event_date date,
  description text,
  cover_photo_id uuid,
  password_hash text,
  is_public boolean not null default false,
  is_published boolean not null default false,
  is_archived boolean not null default false,
  download_enabled boolean not null default false,
  download_quality text not null default 'web' check (download_quality in ('web', 'full')),
  prints_enabled boolean not null default false,
  print_store_url text,
  expires_at timestamptz,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);

create table if not exists public.gallery_sections (
  id uuid primary key default gen_random_uuid(),
  gallery_id uuid not null references public.galleries(id) on delete cascade,
  name text not null,
  sort_order integer not null default 0,
  created_at timestamptz not null default now()
);

create table if not exists public.photos (
  id uuid primary key default gen_random_uuid(),
  gallery_id uuid not null references public.galleries(id) on delete cascade,
  section_id uuid references public.gallery_sections(id) on delete set null,
  original_key text not null,
  web_key text,
  thumbnail_key text,
  filename text not null,
  width integer,
  height integer,
  size_bytes bigint,
  mime_type text,
  blur_data_url text,
  sort_order integer not null default 0,
  is_hidden boolean not null default false,
  created_at timestamptz not null default now()
);

alter table public.galleries
  add constraint galleries_cover_photo_fk
  foreign key (cover_photo_id) references public.photos(id) on delete set null
  deferrable initially deferred;

alter table public.site_settings
  add constraint site_settings_hero_photo_fk
  foreign key (hero_photo_id) references public.photos(id) on delete set null
  deferrable initially deferred;

create table if not exists public.gallery_access_logs (
  id uuid primary key default gen_random_uuid(),
  gallery_id uuid not null references public.galleries(id) on delete cascade,
  visitor_name text,
  visitor_email text,
  ip_hash text,
  accessed_at timestamptz not null default now()
);

create table if not exists public.favorite_sets (
  id uuid primary key default gen_random_uuid(),
  gallery_id uuid not null references public.galleries(id) on delete cascade,
  visitor_name text,
  visitor_email text,
  notes text,
  submitted_at timestamptz,
  created_at timestamptz not null default now()
);

create table if not exists public.favorite_photos (
  id uuid primary key default gen_random_uuid(),
  favorite_set_id uuid not null references public.favorite_sets(id) on delete cascade,
  photo_id uuid not null references public.photos(id) on delete cascade,
  created_at timestamptz not null default now(),
  unique (favorite_set_id, photo_id)
);

create table if not exists public.inquiries (
  id uuid primary key default gen_random_uuid(),
  name text not null,
  email text not null,
  phone text,
  event_type text,
  event_date date,
  location text,
  budget text,
  referral_source text,
  message text not null,
  created_at timestamptz not null default now()
);

create or replace function public.is_admin()
returns boolean
language sql
stable
security definer
set search_path = public
as $$
  select exists (
    select 1 from public.profiles
    where id = auth.uid()
    and role = 'admin'
  );
$$;

alter table public.profiles enable row level security;
alter table public.site_settings enable row level security;
alter table public.galleries enable row level security;
alter table public.gallery_sections enable row level security;
alter table public.photos enable row level security;
alter table public.gallery_access_logs enable row level security;
alter table public.favorite_sets enable row level security;
alter table public.favorite_photos enable row level security;
alter table public.inquiries enable row level security;

create policy "Admins manage profiles"
  on public.profiles for all
  using (public.is_admin())
  with check (public.is_admin());

create policy "Public can read site settings"
  on public.site_settings for select
  using (true);

create policy "Admins manage site settings"
  on public.site_settings for all
  using (public.is_admin())
  with check (public.is_admin());

create policy "Public can read published public galleries"
  on public.galleries for select
  using (is_published = true and is_archived = false and is_public = true and (expires_at is null or expires_at > now()));

create policy "Admins manage galleries"
  on public.galleries for all
  using (public.is_admin())
  with check (public.is_admin());

create policy "Public can read sections for public galleries"
  on public.gallery_sections for select
  using (
    exists (
      select 1 from public.galleries
      where galleries.id = gallery_sections.gallery_id
      and galleries.is_published = true
      and galleries.is_archived = false
      and galleries.is_public = true
      and (galleries.expires_at is null or galleries.expires_at > now())
    )
  );

create policy "Admins manage gallery sections"
  on public.gallery_sections for all
  using (public.is_admin())
  with check (public.is_admin());

create policy "Public can read visible photos for public galleries"
  on public.photos for select
  using (
    is_hidden = false
    and exists (
      select 1 from public.galleries
      where galleries.id = photos.gallery_id
      and galleries.is_published = true
      and galleries.is_archived = false
      and galleries.is_public = true
      and (galleries.expires_at is null or galleries.expires_at > now())
    )
  );

create policy "Admins manage photos"
  on public.photos for all
  using (public.is_admin())
  with check (public.is_admin());

create policy "Admins read access logs"
  on public.gallery_access_logs for select
  using (public.is_admin());

create policy "Public can create gallery access logs"
  on public.gallery_access_logs for insert
  with check (true);

create policy "Admins manage favorite sets"
  on public.favorite_sets for all
  using (public.is_admin())
  with check (public.is_admin());

create policy "Public can create favorite sets"
  on public.favorite_sets for insert
  with check (true);

create policy "Admins manage favorite photos"
  on public.favorite_photos for all
  using (public.is_admin())
  with check (public.is_admin());

create policy "Public can create favorite photos"
  on public.favorite_photos for insert
  with check (true);

create policy "Public can create inquiries"
  on public.inquiries for insert
  with check (true);

create policy "Admins read inquiries"
  on public.inquiries for select
  using (public.is_admin());

create index if not exists galleries_slug_idx on public.galleries(slug);
create index if not exists galleries_public_idx on public.galleries(is_public, is_published, is_archived);
create index if not exists gallery_sections_gallery_id_idx on public.gallery_sections(gallery_id);
create index if not exists photos_gallery_id_idx on public.photos(gallery_id);
create index if not exists favorite_sets_gallery_id_idx on public.favorite_sets(gallery_id);
create index if not exists favorite_photos_set_id_idx on public.favorite_photos(favorite_set_id);
create index if not exists inquiries_created_at_idx on public.inquiries(created_at desc);

