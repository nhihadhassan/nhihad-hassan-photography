-- Automated reminder emails. A daily job sends conservative, deduplicated
-- nudges. reminder_log records each (entity, kind) once so a reminder never
-- repeats. Reminders are off by default and only run when the owner enables them.

alter table public.site_settings
  add column if not exists reminders_enabled boolean not null default false;

create table if not exists public.reminder_log (
  id uuid primary key default gen_random_uuid(),
  kind text not null,
  entity_id uuid not null,
  sent_to text,
  sent_at timestamptz not null default now()
);

create unique index if not exists reminder_log_kind_entity_idx
  on public.reminder_log(kind, entity_id);

alter table public.reminder_log enable row level security;

create policy "Deny all non-service-role access"
  on public.reminder_log for all using (false) with check (false);
