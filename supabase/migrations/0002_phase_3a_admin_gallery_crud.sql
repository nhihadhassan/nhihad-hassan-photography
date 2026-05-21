alter table public.galleries
  add column if not exists cover_image_url text,
  add column if not exists cover_image_alt text,
  add column if not exists location text;

do $$
begin
  if not exists (
    select 1
    from pg_policies
    where schemaname = 'public'
      and tablename = 'profiles'
      and policyname = 'Users can read own profile'
  ) then
    create policy "Users can read own profile"
      on public.profiles for select
      using (auth.uid() = id);
  end if;
end
$$;

create or replace function public.get_public_gallery_by_slug(requested_slug text)
returns table (
  id uuid,
  title text,
  slug text,
  client_name text,
  event_date date,
  description text,
  location text,
  cover_image_url text,
  cover_image_alt text,
  is_public boolean,
  download_enabled boolean,
  download_quality text,
  expires_at timestamptz,
  created_at timestamptz,
  updated_at timestamptz
)
language sql
stable
security definer
set search_path = public
as $$
  select
    galleries.id,
    galleries.title,
    galleries.slug,
    galleries.client_name,
    galleries.event_date,
    galleries.description,
    galleries.location,
    galleries.cover_image_url,
    galleries.cover_image_alt,
    galleries.is_public,
    galleries.download_enabled,
    galleries.download_quality,
    galleries.expires_at,
    galleries.created_at,
    galleries.updated_at
  from public.galleries
  where galleries.slug = requested_slug
    and galleries.is_published = true
    and galleries.is_archived = false
    and (galleries.expires_at is null or galleries.expires_at > now())
  limit 1;
$$;

grant execute on function public.get_public_gallery_by_slug(text) to anon, authenticated;

create index if not exists galleries_expires_at_idx on public.galleries(expires_at);
