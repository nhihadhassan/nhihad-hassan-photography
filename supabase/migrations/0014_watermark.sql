-- Migration 0014: per-gallery watermark toggle
-- watermark_enabled: when true, web-display variants have the photographer
--   name composited as a semi-transparent text overlay.
--   Originals and thumbnails are never watermarked.

alter table public.galleries
  add column if not exists watermark_enabled boolean not null default false;
