-- Migration 0013: download PIN and limits
-- Adds optional PIN protection and download limit to galleries.
-- download_pin_hash: scrypt hash of the PIN (same scheme as gallery password).
--   null = no PIN required.
-- download_limit: maximum number of successful full-gallery downloads allowed.
--   null = unlimited.
-- download_count: cumulative successful full-gallery download count.

alter table public.galleries
  add column if not exists download_pin_hash text,
  add column if not exists download_limit    integer,
  add column if not exists download_count    integer not null default 0;

-- Existing public RPC must not return the new sensitive columns.
-- (The RPC already returns a fixed SELECT list so no action needed,
--  but we record this note for clarity.)
