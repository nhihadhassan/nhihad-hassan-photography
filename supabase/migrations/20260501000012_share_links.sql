-- Migration 0012: gallery share links for vendor/partner photo sharing
-- Creates gallery_share_links and gallery_share_link_photos tables.
-- Both tables use service-role-only RLS so they are never accessible via
-- the public anon key. Only server-side admin code (service role) can read
-- or write them.

-- Share link records
create table if not exists public.gallery_share_links (
  id            uuid        primary key default gen_random_uuid(),
  gallery_id    uuid        not null references public.galleries(id) on delete cascade,
  token         text        not null,
  title         text        not null default '',
  recipient_label text,
  expires_at    timestamptz,
  revoked_at    timestamptz,
  created_at    timestamptz not null default now()
);

create unique index if not exists gallery_share_links_token_idx
  on public.gallery_share_links(token);

create index if not exists gallery_share_links_gallery_id_idx
  on public.gallery_share_links(gallery_id);

-- Photos pinned to a share link (ordered)
create table if not exists public.gallery_share_link_photos (
  id            uuid        primary key default gen_random_uuid(),
  share_link_id uuid        not null references public.gallery_share_links(id) on delete cascade,
  photo_id      uuid        not null references public.photos(id) on delete cascade,
  sort_order    integer     not null default 0,
  constraint gallery_share_link_photos_unique unique(share_link_id, photo_id)
);

create index if not exists gallery_share_link_photos_link_id_idx
  on public.gallery_share_link_photos(share_link_id);

-- RLS: deny all access to anon/authenticated roles.
-- Service-role bypasses RLS so admin server code still works.
alter table public.gallery_share_links enable row level security;
alter table public.gallery_share_link_photos enable row level security;

create policy "Deny all non-service-role access"
  on public.gallery_share_links
  for all using (false) with check (false);

create policy "Deny all non-service-role access"
  on public.gallery_share_link_photos
  for all using (false) with check (false);
