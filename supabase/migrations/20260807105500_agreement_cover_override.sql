-- Per-contract cover photo override for the tokenized signing page.
-- Without this, the hero can only come from a linked gallery cover, so a
-- contract sent before a gallery exists always falls back to the stock image.
alter table public.agreement_requests
  add column if not exists cover_image_url text,
  add column if not exists cover_image_alt text,
  add column if not exists cover_focal_x integer,
  add column if not exists cover_focal_y integer;
