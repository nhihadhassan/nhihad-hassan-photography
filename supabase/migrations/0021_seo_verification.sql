-- Store the Google Search Console verification token so the site owner can
-- verify ownership from the admin Settings form without a code change.
alter table public.site_settings
  add column if not exists seo_google_verification text;
