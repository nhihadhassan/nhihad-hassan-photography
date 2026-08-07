-- Curated theme tokens on the single site_settings row. Closed sets only so
-- the site stays coherent: a serif font choice (both already loaded) and an
-- accent colour that overrides the --copper CSS variable site-wide.

alter table public.site_settings
  add column if not exists theme_serif_font text not null default 'cormorant',
  add column if not exists theme_accent_hex text;

alter table public.site_settings
  drop constraint if exists site_settings_theme_serif_check;
alter table public.site_settings
  add constraint site_settings_theme_serif_check
  check (theme_serif_font in ('cormorant', 'bodoni'));

alter table public.site_settings
  drop constraint if exists site_settings_theme_accent_check;
alter table public.site_settings
  add constraint site_settings_theme_accent_check
  check (theme_accent_hex is null or theme_accent_hex ~ '^#[0-9a-fA-F]{6}$');
