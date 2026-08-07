-- Booking pipeline stage. Tracks where each job is, from inquiry through review.
-- Defaults to 'booked'; existing bookings whose gallery is already published are
-- backfilled to 'delivered'.

alter table public.bookings
  add column if not exists stage text not null default 'booked'
  check (stage in ('inquiry', 'booked', 'shot', 'delivered', 'reviewed'));

update public.bookings b
  set stage = 'delivered'
  from public.galleries g
  where b.gallery_id = g.id
    and g.is_published = true
    and b.stage = 'booked';
