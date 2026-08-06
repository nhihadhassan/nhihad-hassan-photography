alter table public.inquiries
  add column if not exists package_name text,
  add column if not exists event_time text;
